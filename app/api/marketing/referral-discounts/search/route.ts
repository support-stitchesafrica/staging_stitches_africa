import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

const AUTHORIZED_ROLES = ['super_admin', 'team_lead', 'bdm'] as const;

export async function POST(request: NextRequest) {
  // 1. Parse request body
  let body: { referralCode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { referralCode } = body;
  if (!referralCode || typeof referralCode !== 'string') {
    return NextResponse.json(
      { success: false, error: 'referralCode is required' },
      { status: 400 }
    );
  }

  // 2. Authenticate marketing user
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // 3. Role check
  if (!AUTHORIZED_ROLES.includes(user.role as typeof AUTHORIZED_ROLES[number])) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // 4. Normalise code to uppercase for case-insensitive search
  const normalised = referralCode.trim().toUpperCase();

  // 5. Query referralUsers collection by referralCode (source of truth)
  let referralUserSnap;
  try {
    referralUserSnap = await adminDb
      .collection('referralUsers')
      .where('referralCode', '==', normalised)
      .limit(1)
      .get();
  } catch (error) {
    console.error('[referral-discounts/search] Firestore referralUsers query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }

  if (referralUserSnap.empty) {
    return NextResponse.json({ found: false });
  }

  const referralUserDoc = referralUserSnap.docs[0];
  const referralUserData = referralUserDoc.data();
  const userId = referralUserData.userId ?? referralUserDoc.id;

  // Enrich with users collection for fullname/email if available
  let fullname = referralUserData.fullName ?? referralUserData.fullname ?? '';
  let email = referralUserData.email ?? '';

  try {
    const usersDoc = await adminDb.collection('users').doc(userId).get();
    if (usersDoc.exists) {
      const ud = usersDoc.data()!;
      fullname = ud.fullname ?? ud.displayName ?? fullname;
      email = ud.email ?? email;
    }
  } catch {
    // non-critical — continue with referralUsers data
  }

  const foundUser = {
    userId,
    fullname,
    email,
    referralCode: referralUserData.referralCode ?? normalised,
  };

  // 6. Fetch existing referralDiscounts doc for this user (if any)
  let existingDiscount: {
    percentage: number;
    isActive: boolean;
    updatedAt: string;
  } | null = null;

  try {
    const discountSnap = await adminDb
      .collection('referralDiscounts')
      .doc(userId)
      .get();

    if (discountSnap.exists) {
      const d = discountSnap.data()!;
      existingDiscount = {
        percentage: d.percentage,
        isActive: d.isActive,
        updatedAt: d.updatedAt?.toDate?.()?.toISOString() ?? '',
      };
    }
  } catch (error) {
    console.error('[referral-discounts/search] Firestore discount query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }

  // 7. Return result
  return NextResponse.json({
    found: true,
    user: foundUser,
    existingDiscount,
  });
}
