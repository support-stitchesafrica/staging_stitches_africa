/**
 * Marketing Dashboard - Validate Invitation API
 * GET /api/marketing/invites/validate/[token]
 * Uses Firebase Admin SDK for server-side validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verify } from 'jsonwebtoken';
import { Timestamp } from 'firebase-admin/firestore';

interface RouteParams {
  params: {
    token: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'marketing-dashboard-secret';

const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  ALREADY_USED: 'ALREADY_USED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_DOMAIN: 'INVALID_DOMAIN'
} as const;

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ token: string }> }
) {
  try {
    const params = await props.params;
    const { token } = params;

    // Validate token parameter
    if (!token) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Token is required',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (error) {
      console.error('JWT verification failed:', error);
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid or malformed token',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    // Verify system is marketing
    if (decoded.system !== 'marketing') {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid token system',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    // Get invitation from Firestore using Admin SDK
    const inviteDoc = await adminDb
      .collection("staging_marketing_invitations")
      .doc(decoded.inviteId)
      .get();

    if (!inviteDoc.exists) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invitation not found',
          code: ErrorCodes.NOT_FOUND
        },
        { status: 404 }
      );
    }

    const invitation = inviteDoc.data()!;

    // Check if invitation is already used
    if (invitation.status === 'accepted') {
      return NextResponse.json(
        {
          valid: false,
          error: 'This invitation has already been used',
          code: ErrorCodes.ALREADY_USED
        },
        { status: 409 }
      );
    }

    // Check if invitation is revoked
    if (invitation.status === 'revoked') {
      return NextResponse.json(
        {
          valid: false,
          error: 'This invitation has been revoked',
          code: ErrorCodes.ALREADY_USED
        },
        { status: 409 }
      );
    }

    // Check if invitation is expired
    const expiresAtMillis = invitation.expiresAt.toMillis();
    if (expiresAtMillis < Date.now()) {
      // Update status to expired
      await adminDb
        .collection("staging_marketing_invitations")
        .doc(decoded.inviteId)
        .update({
          status: 'expired'
        });

      return NextResponse.json(
        {
          valid: false,
          error: 'This invitation has expired. Please request a new invitation.',
          code: ErrorCodes.EXPIRED
        },
        { status: 410 }
      );
    }

    // Verify token data matches invitation
    if (decoded.email !== invitation.email || decoded.role !== invitation.role) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid token data',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    // Return valid invitation data (without sensitive information)
    return NextResponse.json({
      valid: true,
      invitation: {
        id: inviteDoc.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Validate invitation error:', error);

    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to validate invitation',
        code: ErrorCodes.INVALID_TOKEN
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}