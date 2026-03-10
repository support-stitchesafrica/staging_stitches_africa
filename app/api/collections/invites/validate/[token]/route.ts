/**
 * Collections Dashboard - Validate Invitation API
 * GET /api/collections/invites/validate/[token]
 * Uses Firebase Admin SDK for server-side validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { validateInvitationToken } from '@/lib/utils/token-validator';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  ALREADY_USED: 'ALREADY_USED',
  INVALID_TOKEN: 'INVALID_TOKEN'
} as const;

/**
 * Safely decode URL-encoded token, handling both encoded and non-encoded tokens
 */
function safeDecodeToken(token: string): string {
  try {
    // Next.js may already decode URL parameters, but we'll handle both cases
    // Try to decode - if it fails or doesn't change, return as-is
    const decoded = decodeURIComponent(token);
    return decoded !== token ? decoded : token;
  } catch (error) {
    // If decodeURIComponent fails, token wasn't URL-encoded, return as-is
    return token;
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token: rawToken } = await params;

    // Safely decode URL-encoded token
    const token = rawToken ? safeDecodeToken(rawToken) : rawToken;

    console.log('[Collections Invite Validate] Request received', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      wasEncoded: rawToken !== token,
      timestamp: new Date().toISOString()
    });

    // Validate token parameter
    if (!token) {
      console.error('[Collections Invite Validate] Token parameter is missing');
      return NextResponse.json(
        { 
          valid: false,
          error: 'Token is required',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    // Validate JWT token using centralized validator
    const validation = validateInvitationToken(token, 'collections');

    if (!validation.success) {
      console.error('[Collections Invite Validate] Token validation failed', {
        error: validation.error,
        errorType: validation.errorType
      });

      // Map error types to appropriate HTTP status codes and error messages
      let code: typeof ErrorCodes[keyof typeof ErrorCodes] = ErrorCodes.INVALID_TOKEN;
      let statusCode = 400;
      let errorMessage = validation.error || 'Invalid or malformed token';

      if (validation.errorType === 'EXPIRED') {
        code = ErrorCodes.EXPIRED;
        statusCode = 410;
        errorMessage = 'This invitation has expired. Please request a new invitation.';
      } else if (validation.errorType === 'INVALID_SIGNATURE') {
        code = ErrorCodes.INVALID_TOKEN;
        statusCode = 400;
        errorMessage = 'Invalid token signature. Please contact your administrator.';
      } else if (validation.errorType === 'MISSING_FIELDS') {
        code = ErrorCodes.INVALID_TOKEN;
        statusCode = 400;
        errorMessage = 'Invalid invitation link. Please contact your administrator.';
      } else if (validation.errorType === 'MALFORMED') {
        code = ErrorCodes.INVALID_TOKEN;
        statusCode = 400;
        errorMessage = 'Invalid or malformed token. Please contact your administrator.';
      }

      return NextResponse.json(
        {
          valid: false,
          error: errorMessage,
          code
        },
        { status: statusCode }
      );
    }

    const decoded = validation.payload!;

    // Get invitation from Firestore using Admin SDK
    console.log('[Collections Invite Validate] Fetching invitation from Firestore', {
      inviteId: decoded.inviteId
    });

    const inviteDoc = await adminDb
      .collection("staging_collectionsInvitations")
      .doc(decoded.inviteId)
      .get();

    if (!inviteDoc.exists) {
      console.error('[Collections Invite Validate] Invitation not found in Firestore', {
        inviteId: decoded.inviteId
      });
      return NextResponse.json(
        {
          valid: false,
          error: 'Invitation not found. Please contact your administrator.',
          code: ErrorCodes.NOT_FOUND
        },
        { status: 404 }
      );
    }

    const invitation = inviteDoc.data()!;

    console.log('[Collections Invite Validate] Invitation retrieved', {
      inviteId: decoded.inviteId,
      email: invitation.email,
      status: invitation.status,
      role: invitation.role
    });

    // Check if invitation is already used
    if (invitation.status === 'accepted') {
      console.error('[Collections Invite Validate] Invitation already accepted', {
        inviteId: decoded.inviteId,
        email: invitation.email
      });
      return NextResponse.json(
        {
          valid: false,
          error: 'This invitation has already been used. Please log in to access the system.',
          code: ErrorCodes.ALREADY_USED
        },
        { status: 409 }
      );
    }

    // Check if invitation is revoked
    if (invitation.status === 'revoked') {
      console.error('[Collections Invite Validate] Invitation has been revoked', {
        inviteId: decoded.inviteId,
        email: invitation.email
      });
      return NextResponse.json(
        {
          valid: false,
          error: 'This invitation has been revoked. Please contact your administrator.',
          code: ErrorCodes.ALREADY_USED
        },
        { status: 409 }
      );
    }

    // Check if invitation is expired
    const expiresAtMillis = invitation.expiresAt.toMillis();
    if (expiresAtMillis < Date.now()) {
      console.error('[Collections Invite Validate] Invitation has expired', {
        inviteId: decoded.inviteId,
        email: invitation.email,
        expiresAt: new Date(expiresAtMillis).toISOString(),
        currentTime: new Date().toISOString()
      });

      // Update status to expired
      await adminDb
        .collection("staging_collectionsInvitations")
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
      console.error('[Collections Invite Validate] Token data mismatch', {
        inviteId: decoded.inviteId,
        tokenEmail: decoded.email,
        invitationEmail: invitation.email,
        tokenRole: decoded.role,
        invitationRole: invitation.role
      });
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid token data. Please contact your administrator.',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    console.log('[Collections Invite Validate] Validation successful', {
      inviteId: decoded.inviteId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status
    });

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
    console.error('[Collections Invite Validate] Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        valid: false,
        error: 'Failed to validate invitation. Please try again or contact support.',
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
