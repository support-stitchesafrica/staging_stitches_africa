/**
 * Customer Coupon Application API
 * POST: Apply coupon to order and mark as used
 */

import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { CouponService } from '@/lib/atlas/coupon-service';

/**
 * Verify customer authentication
 */
async function verifyCustomerAuth(request: Request): Promise<{ uid: string; email: string; error?: NextResponse }> {
  // Get authorization token from header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      uid: '',
      email: '',
      error: NextResponse.json(
        { success: false, error: 'Unauthorized: No token provided' },
        { status: 401 }
      )
    };
  }

  const token = authHeader.split('Bearer ')[1];

  // Verify the Firebase ID token
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      uid: decodedToken.uid,
      email: decodedToken.email || ''
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      uid: '',
      email: '',
      error: NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    };
  }
}

/**
 * POST /api/shops/coupons/apply
 * Apply coupon to order and mark as used
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { uid: userId, email: userEmail, error: authError } = await verifyCustomerAuth(request);
    if (authError) return authError;

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.couponCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: couponCode'
        },
        { status: 400 }
      );
    }

    if (!body.orderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required field: orderId'
        },
        { status: 400 }
      );
    }

    if (!body.orderAmount || typeof body.orderAmount !== 'number' || body.orderAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid orderAmount. Must be a positive number'
        },
        { status: 400 }
      );
    }

    // Use authenticated user's email
    const email = userEmail || body.userEmail;
    
    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: 'User email is required'
        },
        { status: 400 }
      );
    }

    // Validate discount amount if provided
    if (body.discountAmount !== undefined) {
      if (typeof body.discountAmount !== 'number' || body.discountAmount < 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid discountAmount. Must be a non-negative number'
          },
          { status: 400 }
        );
      }
    }

    // First validate the coupon
    const validationResult = await CouponService.validateCoupon({
      couponCode: body.couponCode.trim().toUpperCase(),
      userEmail: email,
      orderAmount: body.orderAmount,
      currency: body.currency || 'USD'
    });

    if (!validationResult.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || 'Coupon validation failed',
          errorCode: validationResult.errorCode
        },
        { status: 400 }
      );
    }

    // Apply coupon (mark as used with atomic transaction)
    const result = await CouponService.applyCoupon(
      body.couponCode.trim().toUpperCase(),
      body.orderId,
      body.orderAmount,
      email,
      body.currency || 'USD'
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to apply coupon'
        },
        { status: 400 }
      );
    }

    // Return success with discount details
    return NextResponse.json({
      success: true,
      coupon: result.coupon,
      originalAmount: result.originalAmount,
      discountAmount: result.discountAmount,
      finalAmount: result.finalAmount,
      message: 'Coupon applied successfully'
    });
  } catch (error: any) {
    console.error('Error applying coupon:', error);

    // Handle specific error cases
    if (error.message?.includes('not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coupon not found',
          errorCode: 'NOT_FOUND'
        },
        { status: 404 }
      );
    }

    if (error.message?.includes('already used')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coupon has already been used',
          errorCode: 'ALREADY_USED'
        },
        { status: 400 }
      );
    }

    if (error.message?.includes('expired')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Coupon has expired',
          errorCode: 'EXPIRED'
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to apply coupon'
      },
      { status: 500 }
    );
  }
}
