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
import { createVvipOrder, isVvipUser } from '@/lib/marketing/vvip-checkout-service';
import { VvipNotificationService } from '@/lib/marketing/vvip-notification-service';
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
    });

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
