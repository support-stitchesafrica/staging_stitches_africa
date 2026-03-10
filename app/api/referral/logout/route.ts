import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/referral/logout
 * Clear JWT cookie to log out user
 * Requirements: 11.1, 12.1
 * 
 * Returns:
 * - success: Boolean
 */
export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    // Clear the JWT cookie
    response.cookies.set('referral_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in logout endpoint:', error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during logout',
        },
      },
      { status: 500 }
    );
  }
}
