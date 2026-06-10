import { NextRequest, NextResponse } from 'next/server';
import { ReferralService } from '@/lib/referral/referral-service';
import { RewardService } from '@/lib/referral/reward-service';
import { ReferralErrorCode } from '@/lib/referral/types';
import { calculateCommission, calculatePurchasePoints } from '@/lib/referral/utils';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/referral/track-purchase
 * Track a purchase made by a referred user.
 * Supports two modes:
 *  1. refereeId-based: user signed up via referral link (existing flow)
 *  2. referralCode-based: user entered a code at checkout
 * Requirements: 9.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refereeId, orderId, amount, referralCode } = body;

    // Validate input
    if (!refereeId) {
      return NextResponse.json(
        { success: false, error: { code: ReferralErrorCode.INVALID_INPUT, message: 'Referee ID is required' } },
        { status: 400 }
      );
    }
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: { code: ReferralErrorCode.INVALID_INPUT, message: 'Order ID is required' } },
        { status: 400 }
      );
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: { code: ReferralErrorCode.INVALID_INPUT, message: 'Valid purchase amount is required' } },
        { status: 400 }
      );
    }

    // --- Mode 1: existing referral relationship (user signed up via referral link) ---
    const referral = await ReferralService.getReferralByRefereeId(refereeId);

    if (referral) {
      await RewardService.awardPurchasePoints(referral.referrerId, {
        referralId: referral.id,
        refereeId,
        orderId,
        amount,
      });

      return NextResponse.json({
        success: true,
        message: 'Purchase tracked and commission awarded',
        awarded: true,
        referral: { id: referral.id, referrerId: referral.referrerId, refereeId: referral.refereeId },
      });
    }

    // --- Mode 2: checkout-time referral code ---
    if (referralCode) {
      const trimmedCode = referralCode.trim().toUpperCase();
      const referrer = await ReferralService.getReferrerByCode(trimmedCode);

      if (!referrer) {
        return NextResponse.json({
          success: true,
          message: 'Purchase tracked (referral code not found)',
          awarded: false,
        });
      }

      // Idempotency: check if this order was already tracked
      const existingPurchase = await adminDb
        .collection('referralPurchases')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

      if (!existingPurchase.empty) {
        console.log('Purchase already tracked for order:', orderId);
        return NextResponse.json({ success: true, message: 'Purchase already tracked', awarded: false });
      }

      // Calculate commission and points
      // amount is in NGN: 1 point per ₦120 (so ₦12,000 = 100 points), 5% commission
      const commission = calculateCommission(amount);
      const points = Math.floor(amount / 120);

      const batch = adminDb.batch();

      // Create purchase record
      const purchaseRef = adminDb.collection('referralPurchases').doc();
      batch.set(purchaseRef, {
        id: purchaseRef.id,
        referrerId: referrer.userId,
        referralId: null, // no formal referral doc for checkout-time codes
        refereeId,
        orderId,
        amount,
        commission,
        points,
        referralCode: trimmedCode,
        source: 'checkout',
        status: 'completed',
        createdAt: Timestamp.now(),
      });

      // Update referrer totals
      const referrerRef = adminDb.collection('referralUsers').doc(referrer.userId);
      batch.update(referrerRef, {
        totalRevenue: FieldValue.increment(amount),
        totalPoints: FieldValue.increment(points),
        updatedAt: Timestamp.now(),
      });

      await batch.commit();

      console.log(`Checkout referral tracked: code=${trimmedCode}, referrer=${referrer.userId}, amount=${amount}`);

      return NextResponse.json({
        success: true,
        message: 'Purchase tracked via checkout referral code',
        awarded: true,
        referrerId: referrer.userId,
      });
    }

    // No referral found and no code provided
    console.log(`User ${refereeId} was not referred. No commission to award.`);
    return NextResponse.json({
      success: true,
      message: 'Purchase tracked (user was not referred)',
      awarded: false,
    });

  } catch (error: any) {
    console.error('Error in track-purchase endpoint:', {
      error: error.message || error,
      stack: error.stack,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    if (error.code === ReferralErrorCode.PURCHASE_NOT_FOUND) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: 'Purchase not found' } },
        { status: 404 }
      );
    }

    if (error.code === ReferralErrorCode.INVALID_INPUT) {
      return NextResponse.json(
        { success: false, error: { code: error.code, message: error.message || 'Invalid input provided' } },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred while tracking the purchase.' } },
      { status: 500 }
    );
  }
}
