/**
 * VVIP Order Creation API Route
 * 
 * POST /api/checkout/vvip/create-order
 * 
 * Creates a VVIP order with manual payment details.
 * Validates all required fields and creates order with pending_verification status.
 * 
 * Requirements: 4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.18, 4.19, 4.20
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createVvipOrder,
  isVvipUser,
  normalizeVvipOrderLineItems,
} from '@/lib/marketing/vvip-checkout-service';
import { buildVvipUserOrderMirrorWrites } from '@/lib/marketing/vvip-user-order-mirror';
import { adminDb } from '@/lib/firebase-admin';
import { VvipError, VvipErrorCode, VvipOrderData } from '@/types/vvip';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract order data
    const {
      userId,
      items,
      total,
      currency,
      payment_proof_url,
      amount_paid,
      payment_reference,
      payment_date,
      shipping_address,
      shipping_fee,
      subtotal_after_coupon,
      coupon_code,
      coupon_value,
      coupon_currency,
      measurements,
    } = body as VvipOrderData;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'User ID is required',
          field: 'userId',
        },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'Order must contain at least one item',
          field: 'items',
        },
        { status: 400 }
      );
    }

    if (!payment_proof_url) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'Payment proof URL is required',
          field: 'payment_proof_url',
        },
        { status: 400 }
      );
    }

    if (!amount_paid || amount_paid <= 0) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'Valid payment amount is required',
          field: 'amount_paid',
        },
        { status: 400 }
      );
    }

    if (!payment_date) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'Payment date is required',
          field: 'payment_date',
        },
        { status: 400 }
      );
    }

    if (!currency || typeof currency !== 'string') {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'Order currency is required',
          field: 'currency',
        },
        { status: 400 }
      );
    }

    if (!shipping_address) {
      return NextResponse.json(
        {
          error: VvipErrorCode.VALIDATION_ERROR,
          message: 'Shipping address is required',
          field: 'shipping_address',
        },
        { status: 400 }
      );
    }

    // Verify user is VVIP
    const isVvip = await isVvipUser(userId);
    if (!isVvip) {
      return NextResponse.json(
        {
          error: VvipErrorCode.NOT_VVIP,
          message: 'User is not authorized to create VVIP orders',
        },
        { status: 403 }
      );
    }

    // Create VVIP order
    const orderId = await createVvipOrder({
      userId,
      items,
      total,
      currency,
      payment_proof_url,
      amount_paid,
      payment_reference,
      payment_date: new Date(payment_date),
      shipping_address,
      shipping_fee:
        typeof shipping_fee === 'number' && Number.isFinite(shipping_fee)
          ? shipping_fee
          : undefined,
      subtotal_after_coupon:
        typeof subtotal_after_coupon === 'number' &&
        Number.isFinite(subtotal_after_coupon)
          ? subtotal_after_coupon
          : undefined,
      coupon_code: coupon_code ?? null,
      coupon_value:
        typeof coupon_value === 'number' && Number.isFinite(coupon_value)
          ? coupon_value
          : null,
      coupon_currency:
        typeof coupon_currency === 'string' ? coupon_currency : null,
      measurements,
    });

    const shippingFeeNum = Number(shipping_fee);
    const shippingFeeNormalized = Number.isFinite(shippingFeeNum)
      ? Math.max(0, shippingFeeNum)
      : 0;

    try {
      const userSnap = await adminDb.collection('users').doc(userId).get();
      const userDataPrecheck = userSnap.data();
      const userNameFb = `${userDataPrecheck?.first_name || ''} ${userDataPrecheck?.last_name || ''}`.trim();

      const mirrorWrites = buildVvipUserOrderMirrorWrites({
        userId,
        masterOrderId: orderId,
        items: normalizeVvipOrderLineItems(items),
        shippingFee: shippingFeeNormalized,
        shippingAddress: shipping_address,
        userNameFallback: userNameFb,
        orderStatus: 'pending',
      });

      await Promise.all(
        mirrorWrites.map(({ docId, data }) =>
          adminDb
            .collection('users_orders')
            .doc(userId)
            .collection('user_orders')
            .doc(docId)
            .set(data as any),
        ),
      );
    } catch (mirrorErr) {
      console.warn(
        '[VVIP create-order] Failed to mirror to user_orders (non-blocking):',
        mirrorErr,
      );
    }

    // Send order confirmation email (Requirement 6.2)
    // TODO: Implement proper email notification with user and order details
    try {
      // await VvipNotificationService.sendOrderPlacedEmail({
      //   userId,
      //   userEmail: 'user@example.com', // Need to fetch from user data
      //   userName: 'User Name', // Need to fetch from user data
      //   orderId,
      //   orderDate: new Date().toISOString(),
      //   items,
      //   total,
      //   currency: currency || 'USD',
      //   amountPaid: amount_paid,
      //   paymentReference: payment_reference,
      //   paymentDate: new Date(payment_date).toISOString(),
      // });
      console.log('Order confirmation email would be sent for order:', orderId);
    } catch (emailError) {
      console.error('[API] Error sending order confirmation email:', emailError);
      // Don't fail the order creation if email fails
    }

    return NextResponse.json({
      success: true,
      orderId,
      message: 'VVIP order created successfully',
    });

  } catch (error) {
    console.error('[API] Error creating VVIP order:', error);

    if (error instanceof VvipError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          field: error.field,
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: VvipErrorCode.DATABASE_ERROR,
        message: 'Failed to create VVIP order',
      },
      { status: 500 }
    );
  }
}
