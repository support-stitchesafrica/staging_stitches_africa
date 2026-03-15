import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
// Remove client-side Firebase imports
import { adminDb } from '@/lib/firebase-admin';
import { sendPayoutNotificationEmail, sendPayoutFailureNotificationEmail } from '@/lib/email/payout-notification-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

const ACCEPTED_KYC_STATUSES = ['verified', 'approved', 'completed', 'true'];
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://staging-stitches-africa.vercel.app';

/**
 * Log comprehensive error information for failed payout attempts
 */
function logPayoutError(context: string, error: any, metadata: Record<string, any> = {}) {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    context,
    error: {
      message: error?.message || 'Unknown error',
      type: error?.type || 'unknown',
      code: error?.code || null,
      stack: error?.stack || null
    },
    metadata,
    severity: 'error'
  };
  
  console.error(`[Stripe Payout Webhook] ${context}:`, errorInfo);
  
  // In production, this could also send to external logging service
  // await sendToLoggingService(errorInfo);
}

/**
 * Flutterwave Payout Handler
 *
 * Processes payouts for orders paid via Flutterwave
 * The split is configured at the payment level via Flutterwave subaccounts
 * This function records the payout completion and sends notifications
 */
async function handleFlutterwavePayout(
  orderId: string,
  tailorId: string,
  totalAmount: number,
  vendorAmount: number,
  platformAmount: number,
  orderData: any,
  tailorData: any,
  webhookBody: any
): Promise<NextResponse> {
  try {
    console.log('[Flutterwave Payout Handler] Processing payout for order:', {
      orderId,
      tailorId,
      totalAmount,
      vendorAmount,
      platformAmount,
    });

    // Check for duplicate payout
    const payoutDoc = await adminDb.collection("staging_payouts").doc(`payout_${orderId}`).get();

    if (payoutDoc.exists && payoutDoc.data()?.status === 'success') {
      console.log(`[Flutterwave Payout Handler] Payout already processed for order: ${orderId}`);
      return NextResponse.json({ message: 'Payout already processed' }, { status: 200 });
    }

    // Get vendor's Flutterwave subaccount details
    const flutterwaveSubaccountId = tailorData.flutterwaveSubaccount?.subaccount_id;
    if (!flutterwaveSubaccountId) {
      console.error(`[Flutterwave Payout Handler] No Flutterwave subaccount for tailor: ${tailorId}`);
      return NextResponse.json({
        message: 'Vendor has no Flutterwave subaccount configured'
      }, { status: 400 });
    }

    // Verify KYC completion (same as Stripe)
    const companyAddressStatus = tailorData['company-address-verification']?.status ??
                                 tailorData['company-address-verification'];
    const companyVerificationStatus = tailorData['company-verification']?.status ??
                                      tailorData['company-verification'];
    const identityVerificationStatus = tailorData['identity-verification']?.status ??
                                       tailorData['identity-verification'];

    const ACCEPTED_KYC_STATUSES = ['verified', 'approved', 'completed', 'true'];
    const kycProblems = [];
    if (!ACCEPTED_KYC_STATUSES.includes(String(companyAddressStatus).toLowerCase())) {
      kycProblems.push({ field: 'company-address-verification', value: companyAddressStatus });
    }
    if (!ACCEPTED_KYC_STATUSES.includes(String(companyVerificationStatus).toLowerCase())) {
      kycProblems.push({ field: 'company-verification', value: companyVerificationStatus });
    }
    if (!ACCEPTED_KYC_STATUSES.includes(String(identityVerificationStatus).toLowerCase())) {
      kycProblems.push({ field: 'identity-verification', value: identityVerificationStatus });
    }

    if (kycProblems.length > 0) {
      console.warn(`[Flutterwave Payout Handler] KYC incomplete for tailor ${tailorId}:`, kycProblems);
      return NextResponse.json({
        message: 'Vendor KYC incomplete — payout not processed',
        details: kycProblems,
      }, { status: 400 });
    }

    // Save comprehensive Flutterwave payout record
    const payoutRecord = {
      tailorId,
      orderId,
      totalAmount,
      vendorAmount,
      platformAmount,
      paymentProvider: 'flutterwave',
      flutterwaveSubaccountId,
      flutterwaveTransactionId: orderData.flutterwave_transaction_id,
      status: 'success' as const,
      createdAt: new Date().toISOString(),
      deliveryConfirmedAt: new Date().toISOString(),
      // Note: Split was processed at payment time via Flutterwave subaccount routing
      // This record documents the payout was delivered and accounted for
      webhookPayload: {
        event: webhookBody.event || webhookBody.type,
        status: webhookBody.status || webhookBody.description,
        originalOrderId: webhookBody.order_id || webhookBody.reference || webhookBody.tx_ref,
        receivedAt: new Date().toISOString()
      },
      orderDetails: {
        paymentStatus: orderData.payment_status,
        currency: orderData.payment_currency || 'USD',
        originalPrice: orderData.price,
        flutterwaveReference: orderData.flutterwave_reference
      },
      vendorDetails: {
        email: tailorData.email,
        name: tailorData.full_name || tailorData.brand_name || tailorData.businessName,
        kycStatus: {
          companyVerification: companyVerificationStatus,
          identityVerification: identityVerificationStatus,
          addressVerification: companyAddressStatus
        }
      },
      flutterwaveDetails: {
        subaccountId: flutterwaveSubaccountId,
        vendorAmount,
        currency: orderData.payment_currency || 'USD',
        description: `Payout for order ${orderId}`,
        splitProcessedAt: new Date().toISOString()
      },
      processingMetadata: {
        platformVersion: '1.0.0',
        processedBy: 'dhl-webhook-handler',
        paymentProvider: 'flutterwave',
        calculationMethod: '80-20-split'
      }
    };

    await adminDb.collection("staging_payouts").doc(`payout_${orderId}`).set(payoutRecord, { merge: true });

    // Update vendor profile with payout information
    await adminDb.collection("staging_tailors").doc(tailorId).update({
      lastPayout: new Date().toISOString(),
      lastPayoutAmount: vendorAmount,
      lastPayoutOrderId: orderId,
      lastPayoutProvider: 'flutterwave',
      totalPayoutsReceived: (tailorData.totalPayoutsReceived || 0) + 1,
      totalPayoutAmount: (tailorData.totalPayoutAmount || 0) + vendorAmount,
      payoutHistory: {
        lastUpdated: new Date().toISOString(),
        recentPayouts: 1
      }
    });

    // Update order with payout completion information
    await adminDb.collection("staging_users_orders").doc(orderId).update({
      payoutProcessed: true,
      payoutId: `payout_${orderId}`,
      payoutDate: new Date().toISOString(),
      payoutProvider: 'flutterwave',
      payoutDetails: {
        flutterwaveSubaccountId,
        vendorAmount: vendorAmount,
        platformAmount: platformAmount,
        payoutStatus: 'completed',
        splitMethod: 'flutterwave_subaccount',
        processedAt: new Date().toISOString(),
        deliveryConfirmedAt: new Date().toISOString()
      },
      payoutAudit: {
        webhookReceived: new Date().toISOString(),
        kycValidated: true,
        duplicateCheck: 'passed',
        calculationVerified: true
      }
    });

    // Send payout notification email
    const vendorEmail = tailorData.email;
    if (vendorEmail) {
      sendPayoutNotificationEmail({
        to: vendorEmail,
        vendorName: tailorData.full_name || tailorData.brand_name || tailorData.businessName || 'Vendor',
        amount: vendorAmount,
        orderId,
        transferId: flutterwaveSubaccountId,
        currency: orderData.payment_currency || 'USD'
      }).then((result) => {
        if (result.success) {
          console.log('[Flutterwave Payout Handler] Payout notification email sent:', {
            orderId,
            vendorEmail
          });
        } else {
          console.error('[Flutterwave Payout Handler] Email failed:', {
            orderId,
            vendorEmail,
            error: result.error
          });
        }
      }).catch((err) => {
        console.error('[Flutterwave Payout Handler] Email error:', {
          orderId,
          error: err.message
        });
      });
    }

    console.log('[Flutterwave Payout Handler] ✅ Payout processed successfully:', {
      orderId,
      vendorAmount,
      flutterwaveSubaccountId
    });

    return NextResponse.json({
      message: 'Flutterwave payout processed successfully',
      data: {
        orderId,
        vendorAmount,
        flutterwaveSubaccountId,
      },
    }, { status: 200 });

  } catch (error: any) {
    logPayoutError('Flutterwave payout failed', error, {
      orderId,
      tailorId,
      vendorAmount,
    });

    // Save failed payout record
    try {
      const failedPayoutRecord = {
        tailorId,
        orderId,
        totalAmount,
        vendorAmount,
        platformAmount,
        paymentProvider: 'flutterwave',
        status: 'failed' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
        createdAt: new Date().toISOString(),
        deliveryConfirmedAt: new Date().toISOString(),
        webhookPayload: {
          event: webhookBody.event || webhookBody.type,
          status: webhookBody.status || webhookBody.description,
          receivedAt: new Date().toISOString()
        },
        failureDetails: {
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          failedAt: new Date().toISOString(),
          retryable: true
        }
      };

      await adminDb.collection("staging_payouts").doc(`payout_${orderId}`).set(failedPayoutRecord, { merge: true });
    } catch (saveError) {
      console.error('[Flutterwave Payout Handler] Failed to save error record:', saveError);
    }

    return NextResponse.json({
      message: 'Flutterwave payout failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * DHL Delivery Webhook Handler for Payouts
 *
 * This endpoint handles DHL delivery notifications and triggers automatic payouts
 * to vendors via Stripe Connect or Flutterwave based on the payment provider used.
 */
export async function POST(request: NextRequest) {
  let body: any = null;
  
  try {
    body = await request.json();
    
    console.log('[Stripe Payout Webhook] Received webhook:', {
      event: body.event || body.type,
      orderId: body.order_id || body.reference || body.tx_ref,
      status: body.status || body.description,
    });

    // Extract event details with enhanced validation
    const status = body.status || body.description || null;
    const orderId = body.order_id || body.reference || body.tx_ref || null;

    // Validate payload structure
    if (!body || typeof body !== 'object') {
      console.error('[Stripe Payout Webhook] Invalid payload structure');
      return NextResponse.json({ message: 'Invalid payload structure' }, { status: 400 });
    }

    // Only process delivered shipments
    if (!status || String(status).toLowerCase() !== 'delivered') {
      console.log('[Stripe Payout Webhook] Ignoring non-delivery event');
      return NextResponse.json({ message: 'Ignored non-delivery event' }, { status: 200 });
    }

    if (!orderId) {
      console.error('[Stripe Payout Webhook] Missing order ID in payload');
      return NextResponse.json({ message: 'Missing order ID' }, { status: 400 });
    }

    // Get order details using admin SDK
    const orderDoc = await adminDb.collection("staging_users_orders").doc(orderId).get();

    if (!orderDoc.exists) {
      console.warn(`[Stripe Payout Webhook] Order not found: ${orderId}`);
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();
    if (!orderData) {
      console.error(`[Stripe Payout Webhook] Order data is undefined for order: ${orderId}`);
      return NextResponse.json({ message: 'Order data is invalid' }, { status: 500 });
    }

    // Verify order is paid
    const orderPaymentStatus = orderData.payment_status;
    if (orderPaymentStatus !== 'successful' && orderPaymentStatus !== 'paid') {
      console.warn(`[Stripe Payout Webhook] Order ${orderId} not paid`);
      return NextResponse.json({ message: 'Order not paid' }, { status: 400 });
    }

    // Get vendor details
    const tailorId = orderData.tailor_id;
    if (!tailorId) {
      console.error('[Stripe Payout Webhook] Missing tailor_id in order');
      return NextResponse.json({ message: 'Missing tailor_id' }, { status: 400 });
    }

    const tailorDoc = await adminDb.collection("staging_tailors").doc(tailorId).get();

    if (!tailorDoc.exists) {
      console.error(`[Stripe Payout Webhook] Tailor not found: ${tailorId}`);
      return NextResponse.json({ message: 'Tailor not found' }, { status: 404 });
    }

    const tailorData = tailorDoc.data();
    if (!tailorData) {
      console.error(`[Stripe Payout Webhook] Tailor data is undefined for tailor: ${tailorId}`);
      return NextResponse.json({ message: 'Tailor data is invalid' }, { status: 500 });
    }

    // Check if vendor has Stripe Connect account
    const stripeConnectAccountId = tailorData.stripeConnectAccountId;
    if (!stripeConnectAccountId) {
      console.error(`[Stripe Payout Webhook] No Stripe account for tailor: ${tailorId}`);
      return NextResponse.json({ 
        message: 'Vendor has no Stripe Connect account configured' 
      }, { status: 400 });
    }

    // Verify Stripe account is active
    let stripeAccount;
    try {
      stripeAccount = await stripe.accounts.retrieve(stripeConnectAccountId);
      
      if (!stripeAccount.payouts_enabled) {
        console.error(`[Stripe Payout Webhook] Payouts not enabled for account: ${stripeConnectAccountId}`);
        return NextResponse.json({ 
          message: 'Vendor Stripe account does not have payouts enabled' 
        }, { status: 400 });
      }
    } catch (stripeError) {
      logPayoutError('Stripe account verification failed', stripeError, {
        orderId,
        tailorId,
        stripeAccountId: stripeConnectAccountId
      });
      return NextResponse.json({ 
        message: 'Failed to verify vendor Stripe account' 
      }, { status: 500 });
    }

    // Verify KYC completion
    const companyAddressStatus = tailorData['company-address-verification']?.status ?? 
                                 tailorData['company-address-verification'];
    const companyVerificationStatus = tailorData['company-verification']?.status ?? 
                                      tailorData['company-verification'];
    const identityVerificationStatus = tailorData['identity-verification']?.status ?? 
                                       tailorData['identity-verification'];

    const kycProblems = [];
    if (!ACCEPTED_KYC_STATUSES.includes(String(companyAddressStatus).toLowerCase())) {
      kycProblems.push({ field: 'company-address-verification', value: companyAddressStatus });
    }
    if (!ACCEPTED_KYC_STATUSES.includes(String(companyVerificationStatus).toLowerCase())) {
      kycProblems.push({ field: 'company-verification', value: companyVerificationStatus });
    }
    if (!ACCEPTED_KYC_STATUSES.includes(String(identityVerificationStatus).toLowerCase())) {
      kycProblems.push({ field: 'identity-verification', value: identityVerificationStatus });
    }

    if (kycProblems.length > 0) {
      console.warn(`[Stripe Payout Webhook] KYC incomplete for tailor ${tailorId}:`, {
        orderId,
        tailorId,
        kycProblems,
        currentStatuses: {
          companyAddress: companyAddressStatus,
          companyVerification: companyVerificationStatus,
          identityVerification: identityVerificationStatus
        }
      });
      return NextResponse.json({
        message: 'Vendor KYC incomplete — payout not processed',
        details: kycProblems,
      }, { status: 400 });
    }

    console.log(`[Stripe Payout Webhook] KYC validation passed for tailor ${tailorId}`);

    // Check for duplicate payout
    const payoutDoc = await adminDb.collection("staging_payouts").doc(`payout_${orderId}`).get();
    
    if (payoutDoc.exists && payoutDoc.data()?.status === 'success') {
      console.log(`[Stripe Payout Webhook] Payout already processed for order: ${orderId}`);
      return NextResponse.json({ message: 'Payout already processed' }, { status: 200 });
    }

    // Calculate payout amounts with enhanced validation
    const amount = Number(orderData.price || 0);
    if (!amount || amount <= 0 || isNaN(amount)) {
      console.error('[Stripe Payout Webhook] Invalid order amount:', {
        orderId,
        rawPrice: orderData.price,
        parsedAmount: amount
      });
      return NextResponse.json({ message: 'Invalid order amount' }, { status: 400 });
    }

    // Platform takes 20%, vendor gets 80% - ensure accurate calculation
    const vendorAmount = Math.round(amount * 0.8);
    const platformAmount = amount - vendorAmount;

    // Validate calculation accuracy
    if (vendorAmount + platformAmount !== amount) {
      console.warn('[Stripe Payout Webhook] Payout calculation mismatch:', {
        orderId,
        totalAmount: amount,
        vendorAmount,
        platformAmount,
        sum: vendorAmount + platformAmount
      });
    }

    // Determine payment provider to route payout correctly
    const orderPaymentProvider = orderData.payment_provider || 'stripe';

    console.log('[Stripe Payout Webhook] Processing payout:', {
      orderId,
      totalAmount: amount,
      vendorAmount,
      platformAmount,
      paymentProvider: orderPaymentProvider,
      vendorAccount: stripeConnectAccountId,
    });

    // Route to appropriate payout handler based on payment provider
    if (orderPaymentProvider === 'flutterwave') {
      return await handleFlutterwavePayout(
        orderId,
        tailorId,
        amount,
        vendorAmount,
        platformAmount,
        orderData,
        tailorData,
        body
      );
    }

    // Create Stripe transfer to connected account (default for Stripe payments)
    try {
      const transfer = await stripe.transfers.create({
        amount: vendorAmount * 100, // Convert to cents
        currency: 'usd', // or orderData.currency if available
        destination: stripeConnectAccountId,
        description: `Payout for order ${orderId}`,
        metadata: {
          orderId: orderId,
          tailorId: tailorId,
          orderAmount: amount.toString(),
          vendorAmount: vendorAmount.toString(),
          platformAmount: platformAmount.toString(),
        },
      });

      console.log('[Stripe Payout Webhook] Transfer created:', transfer.id);

      // Save comprehensive payout record with audit information
      const payoutRecord = {
        tailorId,
        orderId,
        totalAmount: amount,
        vendorAmount,
        platformAmount,
        stripeTransferId: transfer.id,
        stripeAccountId: stripeConnectAccountId,
        status: 'success' as const,
        createdAt: new Date().toISOString(),
        deliveryConfirmedAt: new Date().toISOString(),
        // Enhanced audit information
        webhookPayload: {
          event: body.event || body.type,
          status: body.status || body.description,
          originalOrderId: body.order_id || body.reference || body.tx_ref,
          receivedAt: new Date().toISOString()
        },
        orderDetails: {
          paymentStatus: orderPaymentStatus,
          currency: orderData.currency || 'usd',
          originalPrice: orderData.price
        },
        vendorDetails: {
          email: tailorData.email,
          name: tailorData.full_name || tailorData.brand_name || tailorData.businessName,
          kycStatus: {
            companyVerification: companyVerificationStatus,
            identityVerification: identityVerificationStatus,
            addressVerification: companyAddressStatus
          }
        },
        stripeDetails: {
          transferAmount: vendorAmount * 100, // Amount in cents
          currency: 'usd',
          description: `Payout for order ${orderId}`,
          transferCreatedAt: new Date().toISOString()
        },
        processingMetadata: {
          platformVersion: '1.0.0',
          apiVersion: '2025-10-29.clover',
          processedBy: 'dhl-webhook-handler',
          calculationMethod: '80-20-split'
        }
      };

      await adminDb.collection("staging_payouts").doc(`payout_${orderId}`).set(payoutRecord, { merge: true });

      // Update vendor profile with comprehensive payout information
      await adminDb.collection("staging_tailors").doc(tailorId).update({
        lastPayout: new Date().toISOString(),
        lastPayoutAmount: vendorAmount,
        lastPayoutOrderId: orderId,
        lastPayoutTransferId: transfer.id,
        totalPayoutsReceived: (tailorData.totalPayoutsReceived || 0) + 1,
        totalPayoutAmount: (tailorData.totalPayoutAmount || 0) + vendorAmount,
        payoutHistory: {
          lastUpdated: new Date().toISOString(),
          recentPayouts: 1 // This could be enhanced to track recent payout count
        }
      });

      // Update order with comprehensive payout completion information
      await adminDb.collection("staging_users_orders").doc(orderId).update({
        payoutProcessed: true,
        payoutId: `payout_${orderId}`,
        payoutDate: new Date().toISOString(),
        payoutDetails: {
          stripeTransferId: transfer.id,
          vendorAmount: vendorAmount,
          platformAmount: platformAmount,
          payoutStatus: 'completed',
          processedAt: new Date().toISOString(),
          deliveryConfirmedAt: new Date().toISOString()
        },
        payoutAudit: {
          webhookReceived: new Date().toISOString(),
          kycValidated: true,
          duplicateCheck: 'passed',
          calculationVerified: true
        }
      });

      // Send enhanced payout notification email
      const vendorEmail = tailorData.email;
      if (vendorEmail) {
        sendPayoutNotificationEmail({
          to: vendorEmail,
          vendorName: tailorData.full_name || tailorData.brand_name || tailorData.businessName || 'Vendor',
          amount: vendorAmount,
          orderId,
          transferId: transfer.id,
          currency: orderData.currency || 'USD'
        }).then((result) => {
          if (result.success) {
            console.log('[Stripe Payout Webhook] Payout notification email sent successfully:', {
              orderId,
              vendorEmail,
              messageId: result.messageId
            });
          } else {
            console.error('[Stripe Payout Webhook] Payout notification email failed:', {
              orderId,
              vendorEmail,
              error: result.error
            });
          }
        }).catch((err) => {
          console.error('[Stripe Payout Webhook] Unexpected email error:', {
            orderId,
            vendorEmail,
            error: err.message || err
          });
        });
      } else {
        console.warn('[Stripe Payout Webhook] No email address for vendor:', tailorId);
      }

      return NextResponse.json({
        message: 'Payout successful',
        data: {
          transferId: transfer.id,
          amount: vendorAmount,
          orderId,
        },
      }, { status: 200 });

    } catch (stripeError) {
      logPayoutError('Stripe transfer creation failed', stripeError, {
        orderId,
        tailorId,
        vendorAmount,
        platformAmount,
        stripeAccountId: stripeConnectAccountId,
        attemptedTransferAmount: vendorAmount * 100
      });

      // Save comprehensive failed payout record with audit information
      const failedPayoutRecord = {
        tailorId,
        orderId,
        totalAmount: amount,
        vendorAmount,
        platformAmount,
        stripeAccountId: stripeConnectAccountId,
        status: 'failed' as const,
        error: stripeError instanceof Error ? stripeError.message : 'Unknown error',
        createdAt: new Date().toISOString(),
        deliveryConfirmedAt: new Date().toISOString(),
        // Enhanced audit information for failed payouts
        webhookPayload: {
          event: body.event || body.type,
          status: body.status || body.description,
          originalOrderId: body.order_id || body.reference || body.tx_ref,
          receivedAt: new Date().toISOString()
        },
        orderDetails: {
          paymentStatus: orderPaymentStatus,
          currency: orderData.currency || 'usd',
          originalPrice: orderData.price
        },
        vendorDetails: {
          email: tailorData.email,
          name: tailorData.full_name || tailorData.brand_name || tailorData.businessName,
          kycStatus: {
            companyVerification: companyVerificationStatus,
            identityVerification: identityVerificationStatus,
            addressVerification: companyAddressStatus
          }
        },
        failureDetails: {
          errorType: stripeError instanceof Stripe.errors.StripeError ? stripeError.type : 'unknown',
          errorCode: stripeError instanceof Stripe.errors.StripeError ? stripeError.code : null,
          errorMessage: stripeError instanceof Error ? stripeError.message : 'Unknown error',
          failedAt: new Date().toISOString(),
          attemptedAmount: vendorAmount * 100, // Amount in cents that was attempted
          retryable: stripeError instanceof Stripe.errors.StripeCardError ? false : true
        },
        processingMetadata: {
          platformVersion: '1.0.0',
          apiVersion: '2025-10-29.clover',
          processedBy: 'dhl-webhook-handler',
          calculationMethod: '80-20-split'
        }
      };

      await adminDb.collection("staging_payouts").doc(`payout_${orderId}`).set(failedPayoutRecord, { merge: true });

      // Send failure notification email to vendor
      const vendorEmail = tailorData.email;
      if (vendorEmail) {
        sendPayoutFailureNotificationEmail({
          to: vendorEmail,
          vendorName: tailorData.full_name || tailorData.brand_name || tailorData.businessName || 'Vendor',
          orderId,
          errorMessage: stripeError instanceof Error ? stripeError.message : 'Unknown error',
          amount: vendorAmount
        }).then((result) => {
          if (result.success) {
            console.log('[Stripe Payout Webhook] Failure notification email sent:', {
              orderId,
              vendorEmail
            });
          } else {
            console.error('[Stripe Payout Webhook] Failure notification email failed:', {
              orderId,
              vendorEmail,
              error: result.error
            });
          }
        }).catch((err) => {
          console.error('[Stripe Payout Webhook] Unexpected failure email error:', {
            orderId,
            vendorEmail,
            error: err.message || err
          });
        });
      }

      if (stripeError instanceof Stripe.errors.StripeError) {
        return NextResponse.json({
          message: 'Payout failed',
          error: stripeError.message,
        }, { status: 500 });
      }

      return NextResponse.json({
        message: 'Payout failed',
        error: 'Unknown error occurred',
      }, { status: 500 });
    }

  } catch (error: any) {
    logPayoutError('Unexpected server error', error, {
      webhookPayload: body,
      requestHeaders: Object.fromEntries(request.headers.entries())
    });
    return NextResponse.json({
      message: 'Server error',
      error: error.message || 'Unknown error',
    }, { status: 500 });
  }
}