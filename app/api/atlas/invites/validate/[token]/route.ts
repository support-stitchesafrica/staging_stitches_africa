/**
 * Atlas Dashboard - Validate Invitation API
 * GET /api/atlas/invites/validate/[token]
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

const AUTHORIZED_DOMAINS = ['@stitchesafrica.com', '@stitchesafrica.pro'];

const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  EXPIRED: 'EXPIRED',
  ALREADY_USED: 'ALREADY_USED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  INVALID_DOMAIN: 'INVALID_DOMAIN'
} as const;

/**
 * Maps token validator error types to API error codes
 */
function mapErrorTypeToCode(errorType?: string): typeof ErrorCodes[keyof typeof ErrorCodes] {
  switch (errorType) {
    case 'EXPIRED':
      return ErrorCodes.EXPIRED;
    case 'INVALID_SIGNATURE':
    case 'MALFORMED':
    case 'MISSING_FIELDS':
      return ErrorCodes.INVALID_TOKEN;
    case 'WRONG_SYSTEM':
      return ErrorCodes.INVALID_TOKEN;
    default:
      return ErrorCodes.INVALID_TOKEN;
  }
}

/**
 * Maps error types to appropriate HTTP status codes
 */
function getStatusCodeForError(errorType?: string): number {
  switch (errorType) {
    case 'EXPIRED':
      return 410; // Gone
    case 'INVALID_SIGNATURE':
    case 'MALFORMED':
    case 'MISSING_FIELDS':
    case 'WRONG_SYSTEM':
      return 400; // Bad Request
    default:
      return 400;
  }
}

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
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token: rawToken } = await params;

    // Safely decode URL-encoded token
    const token = rawToken ? safeDecodeToken(rawToken) : rawToken;

    // Log request receipt with token metadata
    console.log('[Atlas Invite Validate] Request received', {
      hasToken: !!token,
      tokenLength: token?.length || 0,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'undefined',
      wasEncoded: rawToken !== token,
      timestamp: new Date().toISOString(),
      userAgent: _request.headers.get('user-agent')?.substring(0, 100)
    });

    // Validate token parameter
    if (!token) {
      console.error('[Atlas Invite Validate] Token parameter missing');
      return NextResponse.json(
        { 
          valid: false,
          error: 'Token is required',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    // Step 1: Validate JWT token using centralized validator
    console.log('[Atlas Invite Validate] Step 1: Starting JWT token validation');
    const validation = validateInvitationToken(token, 'atlas');

    if (!validation.success) {
      console.error('[Atlas Invite Validate] Step 1: JWT validation failed', {
        error: validation.error,
        errorType: validation.errorType,
        timestamp: new Date().toISOString()
      });

      // Map error types to appropriate codes and status codes
      const code = mapErrorTypeToCode(validation.errorType);
      const statusCode = getStatusCodeForError(validation.errorType);

      return NextResponse.json(
        {
          valid: false,
          error: validation.error,
          code
        },
        { status: statusCode }
      );
    }

    console.log('[Atlas Invite Validate] Step 1: JWT validation successful', {
      inviteId: validation.payload!.inviteId,
      email: validation.payload!.email,
      system: validation.payload!.system,
      role: validation.payload!.role
    });

    const decoded = validation.payload!;

    // Step 2: Validate email domain before other checks
    console.log('[Atlas Invite Validate] Step 2: Validating email domain', {
      email: decoded.email,
      authorizedDomains: AUTHORIZED_DOMAINS
    });

    const isValidDomain = AUTHORIZED_DOMAINS.some(domain =>
      decoded.email.toLowerCase().endsWith(domain)
    );

    if (!isValidDomain) {
      console.error('[Atlas Invite Validate] Step 2: Domain validation failed - unauthorized email domain', {
        email: decoded.email,
        authorizedDomains: AUTHORIZED_DOMAINS,
        timestamp: new Date().toISOString(),
        securityNote: 'Potential unauthorized access attempt'
      });
      return NextResponse.json(
        {
          valid: false,
          error: 'Only @stitchesafrica.com and @stitchesafrica.pro email addresses are allowed for Atlas access',
          code: ErrorCodes.INVALID_DOMAIN
        },
        { status: 400 }
      );
    }

    console.log('[Atlas Invite Validate] Step 2: Domain validation successful', {
      email: decoded.email
    });

    // Step 3: Get invitation from Firestore using Admin SDK
    console.log('[Atlas Invite Validate] Step 3: Fetching invitation from Firestore', {
      inviteId: decoded.inviteId,
      collection: 'atlasInvitations'
    });

    const inviteDoc = await adminDb
      .collection("staging_atlasInvitations")
      .doc(decoded.inviteId)
      .get();

    if (!inviteDoc.exists) {
      console.error('[Atlas Invite Validate] Step 3: Invitation not found in Firestore', {
        inviteId: decoded.inviteId,
        timestamp: new Date().toISOString()
      });
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

    console.log('[Atlas Invite Validate] Step 3: Invitation retrieved from Firestore', {
      inviteId: decoded.inviteId,
      email: invitation.email,
      status: invitation.status,
      role: invitation.role,
      createdAt: invitation.createdAt?.toDate?.()?.toISOString() || 'unknown',
      expiresAt: invitation.expiresAt?.toDate?.()?.toISOString() || 'unknown'
    });

    // Step 4: Check invitation status
    console.log('[Atlas Invite Validate] Step 4: Checking invitation status', {
      status: invitation.status
    });

    // Check if invitation is already used
    if (invitation.status === 'accepted') {
      console.error('[Atlas Invite Validate] Step 4: Invitation already accepted', {
        inviteId: decoded.inviteId,
        email: invitation.email,
        acceptedAt: invitation.acceptedAt?.toDate?.()?.toISOString() || 'unknown',
        acceptedByUid: invitation.acceptedByUid || 'unknown'
      });
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
      console.error('[Atlas Invite Validate] Step 4: Invitation revoked', {
        inviteId: decoded.inviteId,
        email: invitation.email,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        {
          valid: false,
          error: 'This invitation has been revoked',
          code: ErrorCodes.ALREADY_USED
        },
        { status: 409 }
      );
    }

    // Step 5: Check if invitation is expired
    console.log('[Atlas Invite Validate] Step 5: Checking invitation expiration');
    
    const expiresAtMillis = invitation.expiresAt.toMillis();
    const currentTimeMillis = Date.now();
    const isExpired = expiresAtMillis < currentTimeMillis;

    console.log('[Atlas Invite Validate] Step 5: Expiration check details', {
      expiresAt: new Date(expiresAtMillis).toISOString(),
      currentTime: new Date(currentTimeMillis).toISOString(),
      isExpired,
      timeRemaining: isExpired ? 'expired' : `${Math.floor((expiresAtMillis - currentTimeMillis) / 1000 / 60 / 60)} hours`
    });

    if (isExpired) {
      console.error('[Atlas Invite Validate] Step 5: Invitation expired', {
        inviteId: decoded.inviteId,
        email: invitation.email,
        expiresAt: new Date(expiresAtMillis).toISOString(),
        currentTime: new Date(currentTimeMillis).toISOString(),
        expiredBy: `${Math.floor((currentTimeMillis - expiresAtMillis) / 1000 / 60 / 60)} hours`
      });

      // Update status to expired
      console.log('[Atlas Invite Validate] Updating invitation status to expired');
      await adminDb
        .collection("staging_atlasInvitations")
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

    // Step 6: Verify token data matches invitation
    console.log('[Atlas Invite Validate] Step 6: Verifying token data matches invitation', {
      tokenEmail: decoded.email,
      invitationEmail: invitation.email,
      tokenRole: decoded.role,
      invitationRole: invitation.role
    });

    if (decoded.email !== invitation.email || decoded.role !== invitation.role) {
      console.error('[Atlas Invite Validate] Step 6: Token data mismatch', {
        inviteId: decoded.inviteId,
        tokenEmail: decoded.email,
        invitationEmail: invitation.email,
        tokenRole: decoded.role,
        invitationRole: invitation.role,
        timestamp: new Date().toISOString(),
        securityNote: 'Potential token tampering detected'
      });
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid token data',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    console.log('[Atlas Invite Validate] Step 6: Token data verification successful');

    // All validation steps passed
    console.log('[Atlas Invite Validate] ✓ All validation steps passed successfully', {
      inviteId: decoded.inviteId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      validationSteps: ['JWT', 'Domain', 'Firestore', 'Status', 'Expiration', 'Data Match'],
      timestamp: new Date().toISOString()
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
    console.error('[Atlas Invite Validate] ✗ Unexpected error during validation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

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
