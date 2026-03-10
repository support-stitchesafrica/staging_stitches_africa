import { NextResponse } from "next/server";
// Remove client-side Firebase import
import { adminDb } from '@/lib/firebase-admin';
import { RewardService } from '@/lib/referral/reward-service';
import { PurchaseData } from '@/lib/referral/types';

const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH!;

export async function POST(req: Request) {
  try {
    // ✅ Verify Flutterwave signature
    const signature = req.headers.get("verif-hash");
    if (!signature || signature !== FLW_SECRET_HASH) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const body = await req.json();
    const { event, data } = body;

    if (event !== "charge.completed" || data.status !== "successful") {
      return NextResponse.json({ message: "Ignored event" }, { status: 200 });
    }

    const orderId = data.tx_ref;
    if (!orderId) {
      return NextResponse.json({ message: "Missing order ID" }, { status: 400 });
    }

    // ✅ Mark order as paid using admin SDK with payment provider info
    const orderRef = adminDb.collection("staging_users_orders").doc(orderId);
    await orderRef.update({
      payment_status: "paid",
      payment_provider: "flutterwave",
      flutterwave_transaction_id: data.id,
      flutterwave_reference: data.tx_ref,
      payment_date: new Date().toISOString(),
      payment_currency: data.currency || "USD",
      payment_amount: data.amount / 100, // Flutterwave stores in cents
    });

    console.log(`✅ Payment confirmed for order ${orderId} via Flutterwave`);

    // Track referral purchase commission (Requirement 9.3)
    try {
      // Get order details to extract userId and amount
      const orderDoc = await orderRef.get();
      if (orderDoc.exists) {
        const orderData = orderDoc.data();
        const userId = orderData?.userId || orderData?.user_id;
        const amount = data.amount || orderData?.total || 0;

        if (userId && amount > 0) {
          await trackReferralPurchase(userId, orderId, amount);
        } else {
          console.warn('Missing userId or amount for referral tracking', { userId, amount });
        }
      }
    } catch (referralError) {
      // Log error but don't fail the payment processing
      console.error('Error tracking referral purchase:', referralError);
    }

    return NextResponse.json({ message: "Payment confirmed" }, { status: 200 });
  } catch (error: any) {
    console.error("Flutterwave webhook error:", error);
    return NextResponse.json({ message: "Server error", error: error.message }, { status: 500 });
  }
}

/**
 * Track referral purchase and award commission
 * Requirements: 9.3 - Award 5% commission on first purchase
 */
async function trackReferralPurchase(
  refereeId: string,
  orderId: string,
  amount: number
): Promise<void> {
  try {
    console.log(`Checking referral purchase for user ${refereeId}, order ${orderId}`);
    
    // Check if this purchase has already been tracked (idempotency)
    const existingPurchase = await adminDb
      .collection("staging_referralPurchases")
      .where('orderId', '==', orderId)
      .limit(1)
      .get();

    if (!existingPurchase.empty) {
      console.log(`Purchase ${orderId} already tracked for referral commission`);
      return;
    }

    // Check if the user was referred by someone
    const referralSnapshot = await adminDb
      .collection("staging_referrals")
      .where('refereeId', '==', refereeId)
      .limit(1)
      .get();

    if (referralSnapshot.empty) {
      console.log(`User ${refereeId} was not referred - no commission to award`);
      return;
    }

    const referralDoc = referralSnapshot.docs[0];
    const referral = referralDoc.data();

    // Check if this is the first purchase (commission only on first purchase)
    if (referral.firstPurchaseDate) {
      console.log(`User ${refereeId} has already made their first purchase - no commission awarded`);
      return;
    }

    // Prepare purchase data
    const purchaseData: PurchaseData = {
      referralId: referralDoc.id,
      refereeId,
      orderId,
      amount,
    };

    // Award purchase commission to the referrer (5% of purchase amount)
    await RewardService.awardPurchasePoints(referral.referrerId, purchaseData);

    console.log(`Successfully awarded referral commission for order ${orderId}`, {
      referrerId: referral.referrerId,
      refereeId,
      amount,
      commission: amount * 0.05,
    });
  } catch (error) {
    console.error('Error in trackReferralPurchase:', error);
    throw error;
  }
}