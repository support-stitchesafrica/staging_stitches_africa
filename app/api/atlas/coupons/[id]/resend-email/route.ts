/**
 * Atlas Coupons API - Resend Email Route
 * POST: Resend coupon email
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { CouponEmailService } from '@/lib/atlas/coupon-email-service';

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
 * POST /api/atlas/coupons/[id]/resend-email
 * Resend coupon email
 */
export async function POST(
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

    // Resend email
    await CouponEmailService.resendCouponEmail(couponId);

    return NextResponse.json({
      success: true,
      message: 'Coupon email sent successfully'
    });
  } catch (error: any) {
    console.error('Error resending coupon email:', error);

    // Handle specific error cases
    if (error.message === 'Coupon not found') {
      return NextResponse.json(
        { success: false, error: 'Coupon not found' },
        { status: 404 }
      );
    }

    if (error.message === 'Cannot send email for inactive coupon') {
      return NextResponse.json(
        { success: false, error: 'Cannot send email for inactive coupon' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send coupon email'
      },
      { status: 500 }
    );
  }
}
