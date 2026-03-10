/**
 * Collections Dashboard - Accept Invitation API
 * POST /api/collections/invites/accept/[token]
 * Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 15.1, 15.2, 15.3, 15.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CollectionsRole } from '@/lib/collections/types';
import { validateInvitationToken } from '@/lib/utils/token-validator';

interface RouteParams {
  params: Promise<{
    token: string;
  }>;
}

interface AcceptInvitationRequest {
  name?: string; // Optional for existing users
}

/**
 * Safely decode URL-encoded token, handling both encoded and non-encoded tokens
 */
function safeDecodeToken(token: string): string {
  try {
    // Next.js may already decode URL parameters, but we'll handle both cases
    const decoded = decodeURIComponent(token);
    return decoded !== token ? decoded : token;
  } catch (error) {
    return token;
  }
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token: rawToken } = await params;

    // Safely decode URL-encoded token
    const token = rawToken ? safeDecodeToken(rawToken) : rawToken;

    // Validate token parameter
    if (!token) {
      return NextResponse.json(
        { 
          error: 'Token is required',
          code: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    // Extract and validate Firebase ID token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          code: 'MISSING_AUTH_TOKEN'
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);
    let decodedToken;
    
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid authentication token',
          code: 'INVALID_AUTH_TOKEN'
        },
        { status: 401 }
      );
    }

    // Parse request body
    let requestBody: AcceptInvitationRequest = {};
    try {
      requestBody = await request.json();
    } catch (error) {
      // Body is optional for existing users
    }

    // Validate invitation token using centralized validator (server-side)
    console.log('[Accept Invitation] Validating invitation token');
    
    // Step 1: Validate JWT token
    const tokenValidation = validateInvitationToken(token, 'collections');
    
    if (!tokenValidation.success || !tokenValidation.payload) {
      console.error('[Accept Invitation] Token validation failed', {
        error: tokenValidation.error,
        errorType: tokenValidation.errorType
      });
      const statusCode = getStatusCodeForError(
        tokenValidation.errorType === 'EXPIRED' ? 'EXPIRED' : 'INVALID_TOKEN'
      );
      return NextResponse.json(
        {
          error: tokenValidation.error || 'Invalid or malformed token',
          code: tokenValidation.errorType === 'EXPIRED' ? 'EXPIRED' : 'INVALID_TOKEN'
        },
        { status: statusCode }
      );
    }

    const decoded = tokenValidation.payload;

    // Step 2: Get invitation from Firestore using Admin SDK
    console.log('[Accept Invitation] Fetching invitation from Firestore', {
      inviteId: decoded.inviteId
    });

    const inviteDoc = await adminDb
      .collection("staging_collectionsInvitations")
      .doc(decoded.inviteId)
      .get();

    if (!inviteDoc.exists) {
      console.error('[Accept Invitation] Invitation not found', {
        inviteId: decoded.inviteId
      });
      return NextResponse.json(
        {
          error: 'Invitation not found',
          code: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const invitation = inviteDoc.data()!;

    // Step 3: Check invitation status
    if (invitation.status === 'accepted') {
      console.error('[Accept Invitation] Invitation already accepted');
      return NextResponse.json(
        {
          error: 'This invitation has already been used',
          code: 'ALREADY_USED'
        },
        { status: 409 }
      );
    }

    if (invitation.status === 'revoked') {
      console.error('[Accept Invitation] Invitation revoked');
      return NextResponse.json(
        {
          error: 'This invitation has been revoked',
          code: 'ALREADY_USED'
        },
        { status: 409 }
      );
    }

    // Step 4: Check expiration
    const expiresAtMillis = invitation.expiresAt.toMillis();
    if (expiresAtMillis < Date.now()) {
      console.error('[Accept Invitation] Invitation expired');
      await adminDb
        .collection("staging_collectionsInvitations")
        .doc(decoded.inviteId)
        .update({ status: 'expired' });
      return NextResponse.json(
        {
          error: 'This invitation has expired',
          code: 'EXPIRED'
        },
        { status: 410 }
      );
    }

    // Step 5: Verify token data matches invitation
    if (decoded.email !== invitation.email || decoded.role !== invitation.role) {
      console.error('[Accept Invitation] Token data mismatch');
      return NextResponse.json(
        {
          error: 'Invalid token data',
          code: 'INVALID_TOKEN'
        },
        { status: 400 }
      );
    }

    console.log('[Accept Invitation] Invitation validated successfully', {
      invitationEmail: invitation.email,
      role: invitation.role
    });

    // Verify that the authenticated user's email matches the invitation email
    if (decodedToken.email !== invitation.email) {
      return NextResponse.json(
        { 
          error: 'Email mismatch. You can only accept invitations sent to your email address.',
          code: 'EMAIL_MISMATCH'
        },
        { status: 403 }
      );
    }

    // Check if user already exists in collections system
    const userDocRef = adminDb.collection("staging_collectionsUsers").doc(decodedToken.uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // User exists - update their role if different
      const existingUser = userDoc.data();
      
      if (existingUser?.role !== invitation.role) {
        await userDocRef.update({
          role: invitation.role,
          updatedAt: FieldValue.serverTimestamp()
        });
      }
      
      // Mark invitation as accepted using Admin SDK
      await adminDb
        .collection("staging_collectionsInvitations")
        .doc(decoded.inviteId)
        .update({
          status: 'accepted',
          acceptedAt: FieldValue.serverTimestamp(),
          acceptedByUid: decodedToken.uid
        });
      
      return NextResponse.json({
        success: true,
        message: 'Invitation accepted successfully',
        user: {
          uid: existingUser?.uid,
          email: existingUser?.email,
          fullName: existingUser?.fullName,
          role: invitation.role
        },
        redirectTo: getDashboardUrl(invitation.role)
      }, { status: 200 });
    }

    // New user - create collections user profile
    const userName = requestBody.name || decodedToken.name || invitation.name;
    
    if (!userName) {
      return NextResponse.json(
        { 
          error: 'Name is required for new users',
          code: 'MISSING_NAME'
        },
        { status: 400 }
      );
    }

    // Create collections user profile
    const newUserData = {
      uid: decodedToken.uid,
      email: invitation.email,
      fullName: userName,
      role: invitation.role as CollectionsRole,
      isCollectionsUser: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      invitedBy: invitation.invitedByUserId
    };

    await userDocRef.set(newUserData);

    // Mark invitation as accepted using Admin SDK
    await adminDb
      .collection("staging_collectionsInvitations")
      .doc(decoded.inviteId)
      .update({
        status: 'accepted',
        acceptedAt: FieldValue.serverTimestamp(),
        acceptedByUid: decodedToken.uid
      });

    return NextResponse.json({
      success: true,
      message: 'Account created and invitation accepted successfully',
      user: {
        uid: decodedToken.uid,
        email: invitation.email,
        fullName: userName,
        role: invitation.role
      },
      redirectTo: getDashboardUrl(invitation.role)
    }, { status: 201 });

  } catch (error) {
    console.error('Accept invitation error:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('email-already-in-use')) {
        return NextResponse.json(
          { 
            error: 'An account with this email already exists',
            code: 'EMAIL_EXISTS'
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('user-not-found')) {
        return NextResponse.json(
          { 
            error: 'Firebase user not found. Please ensure you are signed in.',
            code: 'USER_NOT_FOUND'
          },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to accept invitation',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

/**
 * Get appropriate HTTP status code for validation error
 */
function getStatusCodeForError(errorCode?: string): number {
  switch (errorCode) {
    case 'NOT_FOUND':
      return 404;
    case 'EXPIRED':
      return 410; // Gone
    case 'ALREADY_USED':
      return 409; // Conflict
    case 'INVALID_TOKEN':
    default:
      return 400; // Bad Request
  }
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl(role: string): string {
  // All Collections users go to the same dashboard
  return '/collections';
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
