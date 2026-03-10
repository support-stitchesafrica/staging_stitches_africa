/**
 * Atlas Coupons API - Main Route
 * POST: Create new coupon
 * GET: List coupons with filters and pagination
 */

import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { CouponService } from '@/lib/atlas/coupon-service';
import { CouponEmailService } from '@/lib/atlas/coupon-email-service';
import { CreateCouponInput, CouponFilters, Pagination } from '@/types/coupon';

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
 * POST /api/atlas/coupons
 * Create a new coupon
 */
export async function POST(request: Request) {
  try {
    // Verify authentication
    const { uid: adminUid, error } = await verifyAtlasAdmin(request);
    if (error) return error;

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.discountType || !body.discountValue || !body.assignedEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: discountType, discountValue, assignedEmail'
        },
        { status: 400 }
      );
    }

    // Validate discount type
    if (!['PERCENTAGE', 'FIXED'].includes(body.discountType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid discountType. Must be PERCENTAGE or FIXED' },
        { status: 400 }
      );
    }

    // Validate discount value
    if (typeof body.discountValue !== 'number' || body.discountValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid discountValue. Must be a positive number' },
        { status: 400 }
      );
    }

    // Validate percentage bounds
    if (body.discountType === 'PERCENTAGE' && body.discountValue > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.assignedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate minimum order amount if provided
    if (body.minOrderAmount !== undefined) {
      if (typeof body.minOrderAmount !== 'number' || body.minOrderAmount < 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid minOrderAmount. Must be a non-negative number' },
          { status: 400 }
        );
      }
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

    // Create coupon input
    const input: CreateCouponInput = {
      couponCode: body.couponCode,
      discountType: body.discountType,
      discountValue: body.discountValue,
      assignedEmail: body.assignedEmail,
      minOrderAmount: body.minOrderAmount,
      expiryDate: body.expiryDate,
      usageLimit: body.usageLimit,
      sendEmail: body.sendEmail !== false // Default to true
    };

    // Create coupon
    const coupon = await CouponService.createCoupon(input, adminUid);

    // Send email if requested
    if (input.sendEmail) {
      try {
        await CouponEmailService.sendCouponEmail(coupon);
      } catch (emailError: any) {
        console.error('Failed to send coupon email:', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      coupon
    });
  } catch (error: any) {
    console.error('Error creating coupon:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create coupon'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/atlas/coupons
 * List coupons with filters and pagination
 */
export async function GET(request: Request) {
  try {
    // Verify authentication
    const { error } = await verifyAtlasAdmin(request);
    if (error) return error;

    // Parse query parameters
    const { searchParams } = new URL(request.url);

    // Build filters
    const filters: CouponFilters = {};

    if (searchParams.get('email')) {
      filters.email = searchParams.get('email')!;
    }

    if (searchParams.get('status')) {
      const status = searchParams.get('status')!;
      if (!['ACTIVE', 'USED', 'EXPIRED', 'DISABLED'].includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid status filter' },
          { status: 400 }
        );
      }
      filters.status = status as any;
    }

    if (searchParams.get('startDate')) {
      try {
        filters.startDate = new Date(searchParams.get('startDate')!);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid startDate format' },
          { status: 400 }
        );
      }
    }

    if (searchParams.get('endDate')) {
      try {
        filters.endDate = new Date(searchParams.get('endDate')!);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid endDate format' },
          { status: 400 }
        );
      }
    }

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!;
    }

    // Build pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const pagination: Pagination = { page, limit };

    // Get coupons
    const result = await CouponService.listCoupons(filters, pagination);

    // Serialize the coupon data to handle Firestore Timestamps
    const serializedData = result.data.map(coupon => ({
      ...coupon,
      createdAt: coupon.createdAt?.toDate?.() || coupon.createdAt,
      updatedAt: coupon.updatedAt?.toDate?.() || coupon.updatedAt,
      expiryDate: coupon.expiryDate?.toDate?.() || coupon.expiryDate || null,
      emailSentAt: coupon.emailSentAt?.toDate?.() || coupon.emailSentAt || null,
      usageHistory: coupon.usageHistory?.map(record => ({
        ...record,
        usedAt: record.usedAt?.toDate?.() || record.usedAt
      })) || []
    }));

    return NextResponse.json({
      success: true,
      data: serializedData,
      pagination: result.pagination
    });
  } catch (error: any) {
    console.error('Error listing coupons:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to list coupons'
      },
      { status: 500 }
    );
  }
}
