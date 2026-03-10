import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralEmailService } from '@/lib/referral/email-service';
import { generateToken } from '@/lib/referral/auth-service';
import { RegisterData, ReferralErrorCode } from '@/lib/referral/types';

/**
 * POST /api/referral/register
 * Register a new referrer
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fullName, email, password } = body;

    // Validate input
    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Full name, email, and password are required',
          },
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Invalid email format',
          },
        },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Password must be at least 6 characters long',
          },
        },
        { status: 400 }
      );
    }

    // Register the referrer
    const registerData: RegisterData = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
    };

    const user = await ReferralService.registerReferrer(registerData);

    // Send welcome email
    try {
      await ReferralEmailService.sendWelcomeEmail(
        user.email,
        user.fullName,
        user.referralCode
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // We don't fail the registration if the email fails to send
    }

    // Generate JWT token for automatic login
    const jwtToken = await generateToken(user);

    // Create response with user data
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
        autoLogin: true, // Flag to indicate user is automatically logged in
      },
      { status: 201 }
    );

    // Set HTTP-only cookie with JWT token for automatic login
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
    console.error('Error in register endpoint:', error);

    // Handle specific error codes
    if (error.code === ReferralErrorCode.INVALID_INPUT) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message || 'Invalid input provided',
          },
        },
        { status: 400 }
      );
    }

    if (error.code === ReferralErrorCode.CODE_ALREADY_EXISTS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'Failed to generate unique referral code. Please try again.',
          },
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred during registration. Please try again.',
        },
      },
      { status: 500 }
      );
  }
}