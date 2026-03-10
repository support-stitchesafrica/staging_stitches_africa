/**
 * API Route: Validate Referral User
 * Checks if a user ID belongs to a referral program user
 * Requirements: 2.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/referral/referral-service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'User ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Check if user exists in referral program
    const referralUser = await ReferralService.getReferrerById(userId);

    if (!referralUser) {
      return NextResponse.json({
        success: true,
        isReferralUser: false,
      });
    }

    return NextResponse.json({
      success: true,
      isReferralUser: true,
      user: {
        userId: referralUser.userId,
        email: referralUser.email,
        fullName: referralUser.fullName,
        referralCode: referralUser.referralCode,
        isActive: referralUser.isActive,
      },
    });
  } catch (error: any) {
    console.error('Error validating referral user:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to validate user',
          details: error.message,
        },
      },
      { status: 500 }
    );
  }
}
