/**
 * Customer Coupon Validation API
 * POST: Validate coupon code for customer
 */

import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { CouponService } from '@/lib/atlas/coupon-service';
import { ValidateCouponInput } from '@/types/coupon';

/**
 * Rate limiting map (in-memory, simple implementation)
 * In production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

/**
 * Check rate limit for user
 */
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Verify customer authentication (optional but recommended)
 */
async function verifyCustomerAuth(request: Request): Promise<{ uid: string; email: string; error?: NextResponse }> {
  // Get authorization token from header
  const authHeader = request.headers.get('authorization');
  
  // If no auth header, try to get userId from body (fallback for backward compatibility)
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
 * POST /api/shops/coupons/validate
 * Validate coupon code for customer
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { uid: userId, email: userEmail, error: authError } = await verifyCustomerAuth(request);
    if (authError) return authError;

    // Check rate limit
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          errorCode: 'RATE_LIMIT_EXCEEDED'
        },
        { status: 429 }
      );
    }

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

    if (!body.orderAmount || typeof body.orderAmount !== 'number' || body.orderAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid orderAmount. Must be a positive number'
        },
        { status: 400 }
      );
    }

    // Use authenticated user's email, or fall back to body email
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

    // Create validation input
    const input: ValidateCouponInput = {
      couponCode: body.couponCode.trim().toUpperCase(),
      userEmail: email,
      orderAmount: body.orderAmount,
      currency: body.currency || 'USD'
    };

    // Validate coupon
    const result = await CouponService.validateCoupon(input);

    // Return validation result
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error: any) {
    console.error('Error validating coupon:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to validate coupon'
      },
      { status: 500 }
    );
  }
}
