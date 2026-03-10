/**
 * VVIP Status Check API Route
 * 
 * GET /api/checkout/vvip/check-status?userId=xxx
 * 
 * Checks if a user has VVIP status for checkout routing.
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { isVvipUser, getCheckoutType } from '@/lib/marketing/vvip-checkout-service';
import { VvipError, VvipErrorCode } from '@/types/vvip';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'User ID is required',
        },
        { status: 400 }
      );
    }

    const isVvip = await isVvipUser(userId);
    const checkoutType = await getCheckoutType(userId);

    return NextResponse.json({
      success: true,
      isVvip,
      checkoutType,
    });

  } catch (error) {
    console.error('[API] Error checking VVIP status:', error);

    if (error instanceof VvipError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: VvipErrorCode.DATABASE_ERROR,
        message: 'Failed to check VVIP status',
      },
      { status: 500 }
    );
  }
}