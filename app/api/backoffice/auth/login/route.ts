/**
 * Back Office Login API Endpoint
 * 
 * Authenticates back office users and creates session tokens.
 * Validates user credentials, checks account status, and updates last login time.
 * 
 * Requirements: 1.2, 1.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { BackOfficeUser } from '@/types/backoffice';

/**
 * POST /api/backoffice/auth/login
 * Authenticate back office user with Firebase ID token
 * 
 * Body:
 * - idToken: Firebase ID token from client-side authentication
 * 
 * Returns:
 * - success: Boolean
 * - user: BackOfficeUser object
 * - sessionToken: JWT session token
 * 
 * Sets HTTP-only cookie with session token
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
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('[BackOffice Login] Token verification failed:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired ID token',
          },
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email || '';

    console.log('[BackOffice Login] Authenticating user:', { userId, email });

    // Fetch back office user document
    let userDoc;
    try {
      userDoc = await adminDb
        .collection("staging_backoffice_users")
        .doc(userId)
        .get();
    } catch (error) {
      console.error('[BackOffice Login] Error fetching user document:', error);
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

    // Check if user exists in back office system
    if (!userDoc.exists) {
      console.warn('[BackOffice Login] User not found in back office system:', userId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Back office account not found. Please contact your administrator.',
          },
        },
        { status: 404 }
      );
    }

    const userData = userDoc.data() as BackOfficeUser;

    // Requirement 1.3: Check if account is active
    if (!userData.isActive) {
      console.warn('[BackOffice Login] Inactive account login attempt:', userId);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'USER_INACTIVE',
            message: 'Your account has been deactivated. Please contact your administrator.',
          },
        },
        { status: 403 }
      );
    }

    // Update last login timestamp
    try {
      await adminDb
        .collection("staging_backoffice_users")
        .doc(userId)
        .update({
          lastLogin: new Date(),
        });
    } catch (error) {
      console.error('[BackOffice Login] Error updating last login:', error);
      // Non-critical error, continue with login
    }

    // Generate custom token for session management
    let sessionToken;
    try {
      sessionToken = await adminAuth.createCustomToken(userId, {
        role: userData.role,
        departments: userData.departments,
        backoffice: true,
      });
    } catch (error) {
      console.error('[BackOffice Login] Error creating session token:', error);
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

    console.log('[BackOffice Login] Login successful:', {
      userId,
      email,
      role: userData.role,
    });

    // Create response with user data
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
        },
        sessionToken,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with session token
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
    console.error('[BackOffice Login] Unexpected error:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred during login',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
