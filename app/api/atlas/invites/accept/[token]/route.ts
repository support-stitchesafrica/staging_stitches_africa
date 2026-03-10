/**
 * Atlas Dashboard - Accept Invitation API
 * POST /api/atlas/invites/accept/[token]
 * Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 15.1, 15.2, 15.3, 15.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { AtlasRole } from '@/lib/atlas/types';
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

    // Log request receipt
    console.log('[Accept Invitation] Request received', {
      hasToken: !!token,
      tokenLength: token?.length,
      wasEncoded: rawToken !== token,
      timestamp: new Date().toISOString()
    });

    // Validate token parameter
    if (!token) {
      console.error('[Accept Invitation] Missing token parameter');
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
      console.error('[Accept Invitation] Missing or invalid Authorization header', {
        hasHeader: !!authHeader,
        startsWithBearer: authHeader?.startsWith('Bearer ')
      });
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
    
    // Verify Firebase ID token
    try {
      console.log('[Accept Invitation] Verifying Firebase ID token');
      decodedToken = await adminAuth.verifyIdToken(idToken);
      console.log('[Accept Invitation] ID token verified successfully', {
        uid: decodedToken.uid,
        email: decodedToken.email
      });
    } catch (error) {
      console.error('[Accept Invitation] ID token verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
      console.log('[Accept Invitation] Request body parsed', {
        hasName: !!requestBody.name
      });
    } catch (error) {
      // Body is optional for existing users
      console.log('[Accept Invitation] No request body provided (optional for existing users)');
    }

    // Validate invitation token using centralized validator (server-side)
    console.log('[Accept Invitation] Validating invitation token');
    
    // Step 1: Validate JWT token
    const tokenValidation = validateInvitationToken(token, 'atlas');
    
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
      .collection("staging_atlasInvitations")
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
        .collection("staging_atlasInvitations")
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
      role: invitation.role,
      invitedBy: invitation.invitedByUserId
    });

    // Verify that the authenticated user's email matches the invitation email
    console.log('[Accept Invitation] Verifying email match', {
      authenticatedEmail: decodedToken.email,
      invitationEmail: invitation.email
    });
    
    if (decodedToken.email !== invitation.email) {
      console.error('[Accept Invitation] Email mismatch detected', {
        authenticatedEmail: decodedToken.email,
        invitationEmail: invitation.email,
        uid: decodedToken.uid
      });
      return NextResponse.json(
        { 
          error: 'Email mismatch. You can only accept invitations sent to your email address.',
          code: 'EMAIL_MISMATCH'
        },
        { status: 403 }
      );
    }

    console.log('[Accept Invitation] Email match verified');

    // Check if user already exists in Atlas system
    console.log('[Accept Invitation] Checking if user exists in Atlas system', {
      uid: decodedToken.uid
    });
    
    const userDocRef = adminDb.collection("staging_atlasUsers").doc(decodedToken.uid);
    const userDoc = await userDocRef.get();
    
    if (userDoc.exists) {
      // User exists - update their role if different
      const existingUser = userDoc.data();
      console.log('[Accept Invitation] Existing user found', {
        uid: existingUser?.uid,
        currentRole: existingUser?.role,
        newRole: invitation.role
      });
      
      if (existingUser?.role !== invitation.role) {
        console.log('[Accept Invitation] Updating user role', {
          from: existingUser?.role,
          to: invitation.role
        });
        await userDocRef.update({
          role: invitation.role,
          updatedAt: FieldValue.serverTimestamp()
        });
        console.log('[Accept Invitation] User role updated successfully');
      } else {
        console.log('[Accept Invitation] User role unchanged');
      }
      
      // Mark invitation as accepted using Admin SDK
      console.log('[Accept Invitation] Marking invitation as accepted');
      await adminDb
        .collection("staging_atlasInvitations")
        .doc(decoded.inviteId)
        .update({
          status: 'accepted',
          acceptedAt: FieldValue.serverTimestamp(),
          acceptedByUid: decodedToken.uid
        });
      console.log('[Accept Invitation] Invitation marked as accepted');
      
      console.log('[Accept Invitation] Existing user flow completed successfully', {
        uid: existingUser?.uid,
        email: existingUser?.email,
        role: invitation.role
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

    // New user - create Atlas user profile
    console.log('[Accept Invitation] New user - creating Atlas profile');
    
    const userName = requestBody.name || decodedToken.name || invitation.name;
    
    if (!userName) {
      console.error('[Accept Invitation] Missing name for new user', {
        hasRequestName: !!requestBody.name,
        hasTokenName: !!decodedToken.name,
        hasInvitationName: !!invitation.name
      });
      return NextResponse.json(
        { 
          error: 'Name is required for new users',
          code: 'MISSING_NAME'
        },
        { status: 400 }
      );
    }

    console.log('[Accept Invitation] Creating user profile with name', {
      name: userName,
      source: requestBody.name ? 'request' : decodedToken.name ? 'token' : 'invitation'
    });

    // Create Atlas user profile
    const newUserData = {
      uid: decodedToken.uid,
      email: invitation.email,
      fullName: userName,
      role: invitation.role as AtlasRole,
      isAtlasUser: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      invitedBy: invitation.invitedByUserId
    };

    console.log('[Accept Invitation] Writing user profile to Firestore', {
      uid: newUserData.uid,
      email: newUserData.email,
      role: newUserData.role
    });
    
    await userDocRef.set(newUserData);
    console.log('[Accept Invitation] User profile created successfully');

    // Mark invitation as accepted using Admin SDK
    console.log('[Accept Invitation] Marking invitation as accepted');
    await adminDb
      .collection("staging_atlasInvitations")
      .doc(decoded.inviteId)
      .update({
        status: 'accepted',
        acceptedAt: FieldValue.serverTimestamp(),
        acceptedByUid: decodedToken.uid
      });
    console.log('[Accept Invitation] Invitation marked as accepted');

    console.log('[Accept Invitation] New user flow completed successfully', {
      uid: decodedToken.uid,
      email: invitation.email,
      role: invitation.role
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
    console.error('[Accept Invitation] Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('email-already-in-use')) {
        console.error('[Accept Invitation] Email already in use');
        return NextResponse.json(
          { 
            error: 'An account with this email already exists',
            code: 'EMAIL_EXISTS'
          },
          { status: 409 }
        );
      }
      
      if (error.message.includes('user-not-found')) {
        console.error('[Accept Invitation] Firebase user not found');
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
    case 'INVALID_DOMAIN':
    default:
      return 400; // Bad Request
  }
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl(role: string): string {
  // All Atlas users go to the main Atlas dashboard
  return '/atlas';
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
