import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { adminDb } from '@/lib/firebase-admin';
import { RewardService } from '@/lib/referral/reward-service';
import { PurchaseData } from '@/lib/referral/types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Here you would typically:
        // 1. Update order status in your database
        // 2. Send confirmation email
        // 3. Trigger fulfillment process
        
        await handlePaymentSuccess(paymentIntent);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        
        await handlePaymentFailure(failedPayment);
        break;

      case 'payment_intent.canceled':
        const canceledPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment canceled:', canceledPayment.id);
        
        await handlePaymentCancellation(canceledPayment);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const customerEmail = paymentIntent.metadata.customerEmail;
    const customerName = paymentIntent.metadata.customerName;
    const userId = paymentIntent.metadata.userId; // User ID should be passed in metadata
    const amount = paymentIntent.amount / 100; // Convert from cents
    const currency = paymentIntent.currency.toUpperCase();

    console.log(`Processing successful payment for order: ${orderId}`, {
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      customerEmail,
      userId,
    });

    // Update order with payment confirmation and payment provider info
    try {
      await adminDb.collection("staging_users_orders").doc(orderId).update({
        payment_status: 'paid',
        payment_provider: 'stripe',
        stripe_payment_intent_id: paymentIntent.id,
        stripe_charge_id: paymentIntent.charges?.data?.[0]?.id || 'charge_id_not_available',
        payment_date: new Date().toISOString(),
        payment_currency: currency,
        payment_amount: amount,
      });
      console.log(`✅ Updated order ${orderId} with payment_provider: stripe`);
    } catch (orderUpdateError) {
      console.error(`⚠️ Failed to update order ${orderId} payment status:`, orderUpdateError);
      // Don't fail webhook if order update fails - continue with referral tracking
    }

    // Log successful payment details
    const paymentRecord = {
      orderId,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      customerEmail,
      customerName,
      userId,
      status: 'succeeded',
      paymentProvider: 'stripe',
      processedAt: new Date().toISOString(),
      stripeChargeId: paymentIntent.charges?.data?.[0]?.id || 'charge_id_not_available',
      paymentMethod: 'card', // Default to card
    };

    console.log('Payment record:', paymentRecord);
    
    // Track referral purchase commission (Requirement 9.3)
    if (userId) {
      try {
        await trackReferralPurchase(userId, orderId, amount);
      } catch (referralError) {
        // Log error but don't fail the payment processing
        console.error('Error tracking referral purchase:', referralError);
      }
    } else {
      console.warn('No userId in payment metadata - cannot track referral purchase');
    }
    
    // TODO: Implement order fulfillment logic
    // - Update order status in Firestore to 'paid'
    // - Send confirmation email to customer
    // - Trigger inventory updates
    // - Create shipping label if applicable
    // - Send notification to fulfillment team
    
  } catch (error) {
    console.error('Error handling payment success:', error);
    // TODO: Implement error notification system
    // - Alert admin of failed payment processing
    // - Queue for retry if appropriate
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

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const customerEmail = paymentIntent.metadata.customerEmail;
    const failureReason = paymentIntent.last_payment_error?.message || 'Unknown error';
    
    console.log(`Processing failed payment for order: ${orderId}`, {
      paymentIntentId: paymentIntent.id,
      failureReason,
      customerEmail,
    });
    
    // Log failed payment details
    const failureRecord = {
      orderId,
      paymentIntentId: paymentIntent.id,
      customerEmail,
      status: 'failed',
      failureReason,
      processedAt: new Date().toISOString(),
      errorCode: paymentIntent.last_payment_error?.code,
      errorType: paymentIntent.last_payment_error?.type,
    };
    
    console.log('Payment failure record:', failureRecord);
    
    // TODO: Implement failure handling logic
    // - Update order status to 'payment_failed'
    // - Send failure notification to customer with retry option
    // - Log failure reason for analytics
    // - Release reserved inventory if applicable
    // - Trigger abandoned cart recovery flow
    
  } catch (error) {
    console.error('Error handling payment failure:', error);
  }
}

async function handlePaymentCancellation(paymentIntent: Stripe.PaymentIntent) {
  try {
    const orderId = paymentIntent.metadata.orderId;
    const customerEmail = paymentIntent.metadata.customerEmail;
    
    console.log(`Processing canceled payment for order: ${orderId}`, {
      paymentIntentId: paymentIntent.id,
      customerEmail,
    });
    
    // Log canceled payment details
    const cancellationRecord = {
      orderId,
      paymentIntentId: paymentIntent.id,
      customerEmail,
      status: 'canceled',
      processedAt: new Date().toISOString(),
      cancellationReason: paymentIntent.cancellation_reason,
    };
    
    console.log('Payment cancellation record:', cancellationRecord);
    
    // TODO: Implement cancellation handling logic
    // - Update order status to 'canceled'
    // - Release reserved inventory
    // - Log cancellation for analytics
    // - Send cancellation confirmation to customer
    // - Trigger abandoned cart recovery flow
    
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
  }
}