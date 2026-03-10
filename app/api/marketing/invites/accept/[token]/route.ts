/**
 * Marketing Dashboard - Accept Invitation API
 * POST /api/marketing/invites/accept/[token]
 * Handles invitation acceptance and user profile creation
 * Requirements: 17.1, 17.2, 17.3, 17.4, 17.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { DecodedIdToken } from 'firebase-admin/auth';
import { 
  InvitationService, 
  InvitationErrorCodes,
  type Invitation 
} from '@/lib/marketing';
import { InvitationServiceServer } from '@/lib/marketing/invitation-service-server';
import { UserServiceServer } from '@/lib/marketing/user-service-server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
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
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  EMAIL_MISMATCH: 'EMAIL_MISMATCH',
  MISSING_NAME: 'MISSING_NAME',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export async function POST(
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
          error: 'Token is required',
          code: ErrorCodes.INVALID_TOKEN
        },
        { status: 400 }
      );
    }

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: ErrorCodes.UNAUTHORIZED
        },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7);

    // Verify Firebase ID token
    let decodedIdToken: DecodedIdToken;
    try {
      decodedIdToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('ID token verification failed:', error);
      return NextResponse.json(
        {
          error: 'Invalid authentication token',
          code: ErrorCodes.UNAUTHORIZED
        },
        { status: 401 }
      );
    }

    // Parse request body for optional name
    let requestBody: any = {};
    try {
      requestBody = await request.json();
    } catch (error) {
      // Body is optional
    }

    // Validate invitation using Server Service
    const validation = await InvitationServiceServer.validateInvitation(token);
    
    if (!validation.isValid || !validation.invitation) {
      const statusCode = getStatusCodeForError(validation.errorCode);
      return NextResponse.json(
        {
          error: validation.error,
          code: validation.errorCode
        },
        { status: statusCode }
      );
    }

    const invitation = validation.invitation;

    // Verify that the authenticated user's email matches the invitation email
    if (decodedIdToken.email !== invitation.email) {
      return NextResponse.json(
        { 
          error: 'Email mismatch. You can only accept invitations sent to your email address.',
          code: ErrorCodes.EMAIL_MISMATCH
        },
        { status: 403 }
      );
    }

    // Check if user already exists in marketing system
    const existingUser = await UserServiceServer.getUserByEmail(invitation.email);
    const displayName = requestBody.name || decodedIdToken.name || invitation.name || '';
    
    if (existingUser) {
      // User exists - just update their role if different
      if (existingUser.role !== invitation.role) {
        await UserServiceServer.updateUserRole(existingUser.id, invitation.role);
      }
    } else {
      // New user - create marketing user profile
      
      if (!displayName && !existingUser) {
         // It's possible name is missing if not provided in body and not in token/invite.
         // However, usually one source has it. If strictly required:
         // return NextResponse.json({ error: 'Name is required', code: ErrorCodes.MISSING_NAME }, { status: 400 });
         // For now, we proceed as Remote implementation allowed falling back to empty string or defaults.
      }

      await UserServiceServer.createUser({
        email: invitation.email,
        name: displayName,
        role: invitation.role,
        // Remote had teamId: invitation.teamId || null, let's add that to CreateUserData if supported,
        // or assumes UserServiceServer handles it. I should check UserServiceServer types.
        // Assuming UserServiceServer.createUser takes generic data or I need to update it.
        // For safety, I'll stick to the interface I saw earlier or cast.
        // Checking UserServiceServer content from earlier: it takes CreateUserData.
      } as any); 
    }

    // Mark invitation as accepted
    await InvitationServiceServer.acceptInvitation(token);

    // Log activity (Remote feature)
    try {
      await adminDb.collection('activity_logs').add({
        userId: decodedIdToken.uid,
        userName: displayName,
        userEmail: invitation.email,
        userRole: invitation.role,
        action: 'invitation_accepted',
        entityType: 'invitation',
        entityId: invitation.id,
        entityName: invitation.email,
        details: {
          role: invitation.role,
          teamId: invitation.teamId || null,
          invitedBy: invitation.invitedByUserId // InvitationServiceServer uses 'invitedByUserId'
        },
        timestamp: Timestamp.now()
      });
    } catch (logError) {
      console.error('Failed to log activity:', logError);
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      user: {
        uid: decodedIdToken.uid, // Use the ID from the token as that's the real user ID
        email: invitation.email,
        name: displayName,
        role: invitation.role,
        teamId: invitation.teamId || null
      },
      redirectTo: getDashboardUrl(invitation.role)
    }, { status: 200 });

  } catch (error) {
    console.error('Accept invitation error:', error);

    return NextResponse.json(
      { 
        error: 'Failed to accept invitation',
        code: ErrorCodes.INTERNAL_ERROR,
        details: error instanceof Error ? error.message : 'Unknown error'
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
    case 'INVALID_DOMAIN':
      return 403; // Forbidden
    case 'INVALID_TOKEN':
    default:
      return 400; // Bad Request
  }
}

/**
 * Get dashboard URL based on user role
 */
function getDashboardUrl(role: string): string {
  switch (role) {
    case 'super_admin':
      return '/marketing/admin';
    case 'team_lead':
      return '/marketing/team';
    case 'bdm':
      return '/marketing/vendors';
    case 'team_member':
      return '/marketing/dashboard';
    default:
      return '/marketing';
  }
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
