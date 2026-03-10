import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/referral/auth-service';

/**
 * GET /api/referral/validate-session
 * Validate if current JWT session is valid
 * Requirements: 11.5, 12.5
 * 
 * Returns:
 * - success: Boolean
 * - valid: Boolean - whether the session is valid
 * 
 * Checks JWT cookie without requiring Firebase token
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('referral_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          message: 'No session token found',
        },
        { status: 200 }
      );
    }

    // Validate token
    const payload = await validateToken(token);

    if (!payload) {
      return NextResponse.json(
        {
          success: true,
          valid: false,
          message: 'Invalid or expired session token',
        },
        { status: 200 }
      );
    }

    // Token is valid
    return NextResponse.json(
      {
        success: true,
        valid: true,
        userId: payload.userId,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error validating session:', error);

    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while validating session',
        },
      },
      { status: 500 }
    );
  }
}
