/**
 * Back Office Logout API Endpoint
 * 
 * Logs out back office users by clearing session tokens and cookies.
 * Revokes Firebase tokens and clears session data.
 * 
 * Requirements: 1.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * POST /api/backoffice/auth/logout
 * Log out back office user and clear session
 * 
 * Body:
 * - uid: User ID (optional, for token revocation)
 * 
 * Returns:
 * - success: Boolean
 * - message: Success message
 * 
 * Clears HTTP-only session cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { uid } = body;

    console.log('[BackOffice Logout] Processing logout request:', { uid: uid || 'none' });

    // If uid is provided, revoke all refresh tokens for the user
    if (uid) {
      try {
        await adminAuth.revokeRefreshTokens(uid);
        console.log('[BackOffice Logout] Revoked refresh tokens for user:', uid);
      } catch (error) {
        console.error('[BackOffice Logout] Error revoking tokens:', error);
        // Non-critical error, continue with logout
      }
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    // Clear session cookie
    response.cookies.set('backoffice_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/backoffice',
    });

    console.log('[BackOffice Logout] Logout successful');

    return response;

  } catch (error: any) {
    console.error('[BackOffice Logout] Unexpected error:', error);

    // Still clear the cookie even if there's an error
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    response.cookies.set('backoffice_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/backoffice',
    });

    return response;
  }
}

/**
 * GET /api/backoffice/auth/logout
 * Alternative logout endpoint for GET requests
 * Useful for simple logout links
 */
export async function GET(request: NextRequest) {
  console.log('[BackOffice Logout] Processing GET logout request');

  // Create response
  const response = NextResponse.json(
    {
      success: true,
      message: 'Logged out successfully',
    },
    { status: 200 }
  );

  // Clear session cookie
  response.cookies.set('backoffice_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/backoffice',
  });

  console.log('[BackOffice Logout] GET logout successful');

  return response;
}
