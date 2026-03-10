/**
 * Back Office Refresh Token API Endpoint
 * 
 * Refreshes user session and validates current authentication state.
 * Checks if user is still active and has valid permissions.
 * 
 * Requirements: 1.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { BackOfficeUser } from '@/types/backoffice';

/**
 * POST /api/backoffice/auth/refresh
 * Refresh user session and validate authentication
 * 
 * Body:
 * - idToken: Current Firebase ID token
 * 
 * Returns:
 * - success: Boolean
 * - user: Updated BackOfficeUser object
 * - sessionToken: New JWT session token
 * 
 * Updates HTTP-only cookie with new session token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'ID token is required',
          },
        },
        { status: 400 }
      );
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked = true
    } catch (error: any) {
      console.error('[BackOffice Refresh] Token verification failed:', error);
      
      // Handle specific token errors
      if (error.code === 'auth/id-token-revoked') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TOKEN_REVOKED',
              message: 'Session has been revoked. Please log in again.',
            },
          },
          { status: 401 }
        );
      }
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;

    console.log('[BackOffice Refresh] Refreshing session for user:', userId);

    // Fetch current user data
    let userDoc;
    try {
      userDoc = await adminDb
        .collection("staging_backoffice_users")
        .doc(userId)
        .get();
    } catch (error) {
      console.error('[BackOffice Refresh] Error fetching user document:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch user data',
          },
        },
        { status: 500 }
      );
    }

    // Check if user still exists
    if (!userDoc.exists) {
      console.warn('[BackOffice Refresh] User not found:', userId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account not found',
          },
        },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as BackOfficeUser;

    // Requirement 1.4: Check if account is still active
    if (!userData.isActive) {
      console.warn('[BackOffice Refresh] Account is inactive:', userId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'Your account has been deactivated',
          },
        },
        { status: 403 }
      );
    }

    // Generate new custom token
    let sessionToken;
    try {
      sessionToken = await adminAuth.createCustomToken(userId, {
        role: userData.role,
        departments: userData.departments,
        backoffice: true,
      });
    } catch (error) {
      console.error('[BackOffice Refresh] Error creating session token:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to create session token',
          },
        },
        { status: 500 }
      );
    }

    console.log('[BackOffice Refresh] Session refreshed successfully:', {
      userId,
      role: userData.role,
    });

    // Create response with updated user data
    const response = NextResponse.json(
      {
        success: true,
        user: {
          uid: userData.uid,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          departments: userData.departments,
          permissions: userData.permissions,
          isActive: userData.isActive,
          lastLogin: userData.lastLogin,
        },
        sessionToken,
      },
      { status: 200 }
    );

    // Update session cookie with new token
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('backoffice_session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/backoffice',
    });

    return response;

  } catch (error: any) {
    console.error('[BackOffice Refresh] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/backoffice/auth/refresh
 * Check session validity without refreshing
 * 
 * Returns current session status
 */
export async function GET(request: NextRequest) {
  try {
    // Get session cookie
    const sessionCookie = request.cookies.get('backoffice_session');

    if (!sessionCookie) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'No active session found',
          },
        },
        { status: 401 }
      );
    }

    console.log('[BackOffice Refresh] Checking session validity');

    return NextResponse.json(
      {
        success: true,
        message: 'Session is valid',
        hasSession: true,
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('[BackOffice Refresh] Error checking session:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to check session',
        },
      },
      { status: 500 }
    );
  }
}
