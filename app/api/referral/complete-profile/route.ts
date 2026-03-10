import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralErrorCode } from '@/lib/referral/types';
import { generateToken } from '@/lib/referral/auth-service';

/**
 * POST /api/referral/complete-profile
 * Complete profile for existing Firebase Auth user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idToken, fullName } = body;

    // Validate input
    if (!idToken || !fullName) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'ID token and full name are required',
          },
        },
        { status: 400 }
      );
    }

    // Verify ID token to authenticate user
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Invalid authentication token',
          },
        },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const email = decodedToken.email || '';

    if (!email) {
       return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'User email not found in token',
          },
        },
        { status: 400 }
      );
    }

    // Create profile
    const user = await ReferralService.createProfileForExistingUser(
      userId,
      email,
      fullName
    );

    // Generate JWT token
    const jwtToken = await generateToken(user);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          userId: user.userId,
          referralCode: user.referralCode,
          email: user.email,
          fullName: user.fullName,
          isAdmin: user.isAdmin,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    
    response.cookies.set('referral_token', jwtToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error in complete-profile endpoint:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to complete profile',
        },
      },
      { status: 500 }
    );
  }
}
