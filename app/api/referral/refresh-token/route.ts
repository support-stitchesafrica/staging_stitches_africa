import { NextRequest, NextResponse } from 'next/server';
import { refreshToken } from '@/lib/referral/auth-service';
import { ReferralErrorCode } from '@/lib/referral/types';

/**
 * POST /api/referral/refresh-token
 * Refresh JWT token before expiration
 * Requirements: 11.5, 12.5
 * 
 * Returns:
 * - success: Boolean
 * 
 * Reads current JWT from cookie and sets new JWT cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Get current token from cookie
    const currentToken = request.cookies.get('referral_token')?.value;

    if (!currentToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'No token to refresh',
          },
        },
        { status: 401 }
      );
    }

    // Refresh the token
    const newToken = await refreshToken(currentToken);

    if (!newToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.UNAUTHORIZED,
            message: 'Invalid or expired token',
          },
        },
        { status: 401 }
      );
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
      },
      { status: 200 }
    );

    // Set new HTTP-only cookie with refreshed JWT token
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('referral_token', newToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in refresh token endpoint:', error);

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while refreshing token',
        },
      },
      { status: 500 }
    );
  }
}
