import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/referral/referral-service';
import { RewardService } from '@/lib/referral/reward-service';
import { RefereeData, ReferralErrorCode } from '@/lib/referral/types';
import { AutoProvisionService } from '@/lib/referral/auto-provision-service';

/**
 * POST /api/referral/track-signup
 * Track a new sign-up with referral code
 * Link referee to referrer and award sign-up points
 * Requirements: 8.1, 8.3, 8.4, 8.5, 7.1, 9.1, 9.2, 9.4
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralCode, refereeData } = body;

    // Validate input
    if (!referralCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Referral code is required',
          },
        },
        { status: 400 }
      );
    }

    if (!refereeData || !refereeData.userId || !refereeData.email || !refereeData.name) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Referee data (userId, email, name) is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate the referral code exists
    const referrer = await ReferralService.getReferrerByCode(referralCode.trim().toUpperCase());

    if (!referrer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_CODE,
            message: 'Invalid referral code',
          },
        },
        { status: 400 }
      );
    }

    // Check if referrer is active
    if (!referrer.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_CODE,
            message: 'Referral code is inactive',
          },
        },
        { status: 400 }
      );
    }

    // Requirement 9.4: Verify referee has a referral user document
    const refereeHasReferralUser = await AutoProvisionService.hasReferralUser(refereeData.userId);
    
    if (!refereeHasReferralUser) {
      console.warn(`Referee ${refereeData.userId} does not have a referral user document. This should have been created during registration.`);
      // Note: We don't fail the tracking - the referral user should have been created during shop registration
      // but we log this as a warning for monitoring
    }

    // Prepare referee data
    const referee: RefereeData = {
      userId: refereeData.userId,
      email: refereeData.email.trim().toLowerCase(),
      name: refereeData.name.trim(),
    };

    // Requirement 9.1: Create the referral relationship in referrals collection
    const referral = await ReferralService.createReferral(referrer.userId, referee);

    // Requirement 9.2: Award sign-up points to the referrer (100 points)
    await RewardService.awardSignUpPoints(referrer.userId, referral.id);

    console.log(`Referral tracked successfully: Referrer ${referrer.userId} referred ${referee.userId}`);

    return NextResponse.json(
      {
        success: true,
        referral: {
          id: referral.id,
          referrerId: referral.referrerId,
          refereeId: referral.refereeId,
          status: referral.status,
        },
        message: 'Sign-up tracked successfully and points awarded',
      },
      { status: 201 }
    );
  } catch (error: any) {
    // Requirement 7.4, 7.5: Log errors with full details
    console.error('Error in track-signup endpoint:', {
      error: error.message || error,
      stack: error.stack,
      code: error.code,
      referralCode: body.referralCode,
      refereeId: body.refereeData?.userId,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error codes
    if (error.code === ReferralErrorCode.REFERRAL_EXISTS) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'This user has already been referred',
          },
        },
        { status: 400 }
      );
    }

    if (error.code === ReferralErrorCode.USER_NOT_FOUND) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'Referrer not found',
          },
        },
        { status: 404 }
      );
    }

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

    // Requirement 7.4: Return descriptive error message to user
    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while tracking the sign-up. Please try again or contact support.',
        },
      },
      { status: 500 }
    );
  }
}
