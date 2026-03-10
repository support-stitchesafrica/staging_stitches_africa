import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/referral/referral-service';
import { ReferralErrorCode } from '@/lib/referral/types';

/**
 * POST /api/referral/validate-code
 * Validate a referral code
 * Requirements: 8.2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    // Validate input
    if (!code) {
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

    // Validate the referral code
    const isValid = await ReferralService.validateReferralCode(code.trim().toUpperCase());

    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: ReferralErrorCode.INVALID_CODE,
            message: 'Invalid or inactive referral code',
          },
        },
        { status: 200 }
      );
    }

    // Get referrer information
    const referrer = await ReferralService.getReferrerByCode(code.trim().toUpperCase());

    if (!referrer) {
      return NextResponse.json(
        {
          valid: false,
          error: {
            code: ReferralErrorCode.INVALID_CODE,
            message: 'Referral code not found',
          },
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        valid: true,
        referrer: {
          name: referrer.fullName,
          code: referrer.referralCode,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in validate-code endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while validating the code. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
