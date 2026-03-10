/**
 * Atlas Coupons API - Individual Coupon Route
 * GET: Get coupon details
 * PATCH: Update coupon
 * DELETE: Delete coupon
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { CouponService } from '@/lib/atlas/coupon-service';
import { UpdateCouponInput } from '@/types/coupon';

/**
 * Verify Atlas admin authentication
 */
async function verifyAtlasAdmin(request: Request): Promise<{ uid: string; error?: NextResponse }> {
  // Get authorization token from header
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      uid: '',
      error: NextResponse.json(
        { success: false, error: 'Unauthorized: No token provided' },
        { status: 401 }
      )
    };
  }

  const token = authHeader.split('Bearer ')[1];

  // Verify the Firebase ID token
  let decodedToken;
  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error('Token verification failed:', error);
    return {
      uid: '',
      error: NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    };
  }

  const adminUid = decodedToken.uid;

  // Verify the user is an Atlas admin
  const adminUserDoc = await adminDb.collection("staging_atlasUsers").doc(adminUid).get();
  if (!adminUserDoc.exists) {
    return {
      uid: '',
      error: NextResponse.json(
        { success: false, error: 'Forbidden: User not found' },
        { status: 403 }
      )
    };
  }

  const adminUser = adminUserDoc.data();
  if (!adminUser || !adminUser.isAtlasUser) {
    return {
      uid: '',
      error: NextResponse.json(
        { success: false, error: 'Forbidden: Only Atlas admins can manage coupons' },
        { status: 403 }
      )
    };
  }

  return { uid: adminUid };
}

/**
 * GET /api/atlas/coupons/[id]
 * Get coupon details
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { error } = await verifyAtlasAdmin(request);
    if (error) return error;

    // Await params in Next.js 16
    const params = await context.params;
    const couponId = params.id;

    if (!couponId) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    // Get coupon
    const coupon = await CouponService.getCoupon(couponId);

    if (!coupon) {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Serialize the coupon data to handle Firestore Timestamps
    const serializedCoupon = {
      ...coupon,
      createdAt: coupon.createdAt?.toDate?.() || coupon.createdAt,
      updatedAt: coupon.updatedAt?.toDate?.() || coupon.updatedAt,
      expiryDate: coupon.expiryDate?.toDate?.() || coupon.expiryDate || null,
      emailSentAt: coupon.emailSentAt?.toDate?.() || coupon.emailSentAt || null,
      usageHistory: coupon.usageHistory?.map(record => ({
        ...record,
        usedAt: record.usedAt?.toDate?.() || record.usedAt
      })) || []
    };

    return NextResponse.json({
      success: true,
      coupon: serializedCoupon
    });
  } catch (error: any) {
    console.error('Error fetching coupon:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch coupon'
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/atlas/coupons/[id]
 * Update coupon
 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { error } = await verifyAtlasAdmin(request);
    if (error) return error;

    // Await params in Next.js 16
    const params = await context.params;
    const couponId = params.id;

    // Parse request body
    const body = await request.json();

    // Validate status if provided
    if (body.status && !['ACTIVE', 'USED', 'EXPIRED', 'DISABLED'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status. Must be ACTIVE, USED, EXPIRED, or DISABLED' },
        { status: 400 }
      );
    }

    // Validate usage limit if provided
    if (body.usageLimit !== undefined) {
      if (typeof body.usageLimit !== 'number' || body.usageLimit < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid usageLimit. Must be at least 1' },
          { status: 400 }
        );
      }
    }

    // Create update input
    const input: UpdateCouponInput = {
      status: body.status,
      expiryDate: body.expiryDate,
      usageLimit: body.usageLimit
    };

    // Update coupon
    const coupon = await CouponService.updateCoupon(couponId, input);

    return NextResponse.json({
      success: true,
      coupon
    });
  } catch (error: any) {
    console.error('Error updating coupon:', error);

    // Handle specific error cases
    if (error.message === 'Coupon not found') {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update coupon'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/atlas/coupons/[id]
 * Delete coupon
 */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const { error } = await verifyAtlasAdmin(request);
    if (error) return error;

    // Await params in Next.js 16
    const params = await context.params;
    const couponId = params.id;

    // Delete coupon
    await CouponService.deleteCoupon(couponId);

    return NextResponse.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);

    // Handle specific error cases
    if (error.message === 'Coupon not found') {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete coupon'
      },
      { status: 500 }
    );
  }
}
