import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { RewardService } from '@/lib/referral/reward-service';
import { PurchaseData, ReferralErrorCode } from '@/lib/referral/types';

/**
 * POST /api/webhooks/purchase
 * Webhook handler for purchase events
 * Tracks purchases and awards referral commissions
 * Requirements: 9.1, 9.4
 * 
 * This endpoint ensures idempotency by checking if a purchase has already been tracked
 * before processing it again.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature (if you have one configured)
    // const signature = request.headers.get('x-webhook-signature');
    // if (!verifySignature(signature, body)) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

    const body = await request.json();
    const { refereeId, orderId, amount, event } = body;

    // Validate event type
    if (event && event !== 'purchase.completed') {
      return NextResponse.json(
        {
          success: false,
          message: 'Event type not supported',
        },
        { status: 200 }
      );
    }

    // Validate required fields
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

    // Check for idempotency - has this purchase already been tracked?
    const existingPurchaseSnapshot = await adminDb
      .collection("staging_referralPurchases")
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (!existingPurchaseSnapshot.empty) {
      console.log(`[Webhook] Purchase ${orderId} already tracked, skipping`);
      return NextResponse.json(
        {
          success: true,
          message: 'Purchase already tracked',
          alreadyProcessed: true,
        },
        { status: 200 }
      );
    }

    // Check if the referee was referred by someone
    const referralSnapshot = await adminDb
      .collection("staging_referrals")
      .where('refereeId', '==', refereeId)
      .limit(1)
      .get();

    if (referralSnapshot.empty) {
      console.log(`[Webhook] No referral found for user ${refereeId}`);
      return NextResponse.json(
        {
          success: true,
          message: 'User was not referred, no commission to award',
          noReferral: true,
        },
        { status: 200 }
      );
    }

    const referralDoc = referralSnapshot.docs[0];
    const referral = referralDoc.data();

    // Prepare purchase data
    const purchaseData: PurchaseData = {
      referralId: referralDoc.id,
      refereeId,
      orderId,
      amount,
    };

    // Award purchase points to the referrer
    await RewardService.awardPurchasePoints(referral.referrerId, purchaseData);

    // Calculate commission for response
    const commission = RewardService.calculateCommission(amount);
    const points = RewardService.calculatePurchasePoints(amount);

    console.log(`[Webhook] Purchase tracked successfully for order ${orderId}`);

    return NextResponse.json(
      {
        success: true,
        purchase: {
          orderId,
          amount,
          commission,
          points,
          referrerId: referral.referrerId,
        },
        message: 'Purchase tracked successfully and commission awarded',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[Webhook] Error processing purchase webhook:', error);

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

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing the webhook. Please try again.',
        },
      },
      { status: 500 }
    );
  }
}
