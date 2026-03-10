import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/referral/referral-service';
import { RewardService } from '@/lib/referral/reward-service';
import { ReferralErrorCode } from '@/lib/referral/types';

/**
 * POST /api/referral/track-purchase
 * Track a purchase made by a referred user
 * Award commission points to the referrer for first purchase only
 * Requirements: 9.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refereeId, orderId, amount } = body;

    // Validate input
    if (!refereeId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Referee ID is required',
          },
        },
        { status: 400 }
      );
    }

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Order ID is required',
          },
        },
        { status: 400 }
      );
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ReferralErrorCode.INVALID_INPUT,
            message: 'Valid purchase amount is required',
          },
        },
        { status: 400 }
      );
    }

    // Check if the referee was referred by someone
    const referral = await ReferralService.getReferralByRefereeId(refereeId);

    if (!referral) {
      // User was not referred, no commission to award
      console.log(`User ${refereeId} was not referred. No commission to award.`);
      return NextResponse.json(
        {
          success: true,
          message: 'Purchase tracked (user was not referred)',
          awarded: false,
        },
        { status: 200 }
      );
    }

    // Award purchase commission (only for first purchase)
    await RewardService.awardPurchasePoints(referral.referrerId, {
      referralId: referral.id,
      refereeId,
      orderId,
      amount,
    });

    console.log(`Purchase commission tracked: Referee ${refereeId} made purchase of $${amount}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Purchase tracked and commission awarded',
        awarded: true,
        referral: {
          id: referral.id,
          referrerId: referral.referrerId,
          refereeId: referral.refereeId,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    // Requirement 7.4, 7.5: Log errors with full details
    console.error('Error in track-purchase endpoint:', {
      error: error.message || error,
      stack: error.stack,
      code: error.code,
      refereeId: body.refereeId,
      orderId: body.orderId,
      amount: body.amount,
      timestamp: new Date().toISOString(),
    });

    // Handle specific error codes
    if (error.code === ReferralErrorCode.PURCHASE_NOT_FOUND) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: 'Purchase not found',
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
          message: 'An error occurred while tracking the purchase. Please try again or contact support.',
        },
      },
      { status: 500 }
    );
  }
}
