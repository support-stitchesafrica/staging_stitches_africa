/**
 * VVIP Orders API Route
 * 
 * POST /api/vvip/orders - Create a new VVIP order
 * 
 * This endpoint handles the creation of VVIP orders from the manual checkout process.
 */

import { NextRequest, NextResponse } from 'next/server';
import { vvipCheckoutService } from '@/lib/marketing/vvip-checkout-service';
import { VvipError, VvipErrorCode } from '@/types/vvip';
import { adminAuth } from '@/lib/firebase-admin';

/**
 * POST /api/vvip/orders
 * 
 * Create a new VVIP order with manual payment
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body first (read only once)
    const orderData = await request.json();

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Verify Firebase ID token
      const idToken = authHeader.substring(7);
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      userId = decodedToken.uid;
    } else {
      // For now, get userId from request body (less secure but functional)
      userId = orderData.userId;
      
      if (!userId) {
        return NextResponse.json(
          { 
            error: VvipErrorCode.UNAUTHORIZED, 
            message: 'User ID is required' 
          },
          { status: 401 }
        );
      }
    }

    // Validate required fields
    const requiredFields = [
      'userId', 'items', 'totalAmount', 'currency', 
      'shippingAddress', 'payment_proof_url', 'payment_reference', 
      'payment_date', 'amount_paid'
    ];

    for (const field of requiredFields) {
      if (!orderData[field]) {
        return NextResponse.json(
          { 
            error: VvipErrorCode.VALIDATION_ERROR, 
            message: `Missing required field: ${field}`,
            field 
          },
          { status: 400 }
        );
      }
    }

    // Ensure the user making the request matches the order user
    if (orderData.userId !== userId) {
      return NextResponse.json(
        { 
          error: VvipErrorCode.UNAUTHORIZED, 
          message: 'Cannot create order for another user' 
        },
        { status: 403 }
      );
    }

    // Create VVIP order using the checkout service
    const result = await vvipCheckoutService.createManualPaymentOrder({
      userId: orderData.userId,
      items: orderData.items,
      total: orderData.totalAmount,
      currency: orderData.currency,
      shipping_address: orderData.shippingAddress,
      payment_proof_url: orderData.payment_proof_url,
      payment_reference: orderData.payment_reference,
      payment_date: new Date(orderData.payment_date),
      amount_paid: orderData.amount_paid,
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'VVIP order created successfully',
      data: {
        orderId: result.orderId,
        status: 'pending_verification',
        payment_reference: orderData.payment_reference,
        created_at: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('VVIP Orders API Error:', error);

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
        message: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}