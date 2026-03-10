/**
 * Atlas Coupons API - Generate Code Route
 * POST: Generate unique coupon code
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { CouponService } from '@/lib/atlas/coupon-service';

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
 * POST /api/atlas/coupons/generate-code
 * Generate unique coupon code
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { error } = await verifyAtlasAdmin(request);
    if (error) return error;

    // Generate unique code
    const couponCode = await CouponService.generateCouponCode();

    return NextResponse.json({
      success: true,
      couponCode
    });
  } catch (error: any) {
    console.error('Error generating coupon code:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate coupon code'
      },
      { status: 500 }
    );
  }
}
