import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

const AUTHORIZED_ROLES = ['super_admin', 'team_lead', 'bdm'] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  // 1. Authenticate marketing user
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // 2. Role check
  if (!AUTHORIZED_ROLES.includes(user.role as typeof AUTHORIZED_ROLES[number])) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // 3. Get userId from route params
  const { userId } = params;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  // 4. Look up the referralDiscounts doc for this userId to get the referralCode
  let referralCode: string;
  try {
    const discountDoc = await adminDb.collection('referralDiscounts').doc(userId).get();

    if (!discountDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'No referral discount found for this user' },
        { status: 404 }
      );
    }

    const discountData = discountDoc.data();
    referralCode = discountData?.referralCode ?? '';

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: 'Referral code not found for this user' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('[referral-discounts/[userId]/purchases] Firestore discount lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }

  // 5. Query referralPurchases where referralCode == code, ordered by createdAt desc
  let purchasesSnap;
  try {
    purchasesSnap = await adminDb
      .collection('referralPurchases')
      .where('referralCode', '==', referralCode)
      .orderBy('createdAt', 'desc')
      .get();
  } catch (error) {
    console.error('[referral-discounts/[userId]/purchases] Firestore purchases query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }

  // 6. Return purchase list
  const purchases = purchasesSnap.docs.map((doc) => {
    const p = doc.data();
    return {
      id: doc.id,
      orderId: p.orderId ?? '',
      buyerId: p.buyerId ?? '',
      referralCode: p.referralCode ?? '',
      originalAmount: p.originalAmount ?? 0,
      discountPercentage: p.discountPercentage ?? 0,
      discountAmount: p.discountAmount ?? 0,
      finalAmount: p.finalAmount ?? 0,
      paymentStatus: p.paymentStatus ?? 'paid',
      createdAt: p.createdAt ?? null,
    };
  });

  return NextResponse.json({ purchases });
}
