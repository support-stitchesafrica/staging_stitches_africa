import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import type { ReferralDiscountRow } from '@/types/referral-discount';

const AUTHORIZED_ROLES = ['super_admin', 'team_lead', 'bdm'] as const;

export async function GET(request: NextRequest) {
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

  // 3. Fetch all referralDiscounts documents
  let discountsSnap;
  try {
    discountsSnap = await adminDb.collection('referralDiscounts').get();
  } catch (error) {
    console.error('[referral-discounts] Firestore discounts query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }

  if (discountsSnap.empty) {
    return NextResponse.json({ discounts: [] });
  }

  // 4. Fetch all referralPurchases to compute totalUsage and totalSales per code
  let purchasesSnap;
  try {
    purchasesSnap = await adminDb.collection('referralPurchases').get();
  } catch (error) {
    console.error('[referral-discounts] Firestore purchases query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }

  // Build a map: referralCode -> { totalUsage, totalSales }
  const statsMap = new Map<string, { totalUsage: number; totalSales: number }>();
  for (const doc of purchasesSnap.docs) {
    const p = doc.data();
    const code: string = p.referralCode ?? '';
    if (!code) continue;
    const existing = statsMap.get(code) ?? { totalUsage: 0, totalSales: 0 };
    statsMap.set(code, {
      totalUsage: existing.totalUsage + 1,
      totalSales: existing.totalSales + (p.finalAmount ?? 0),
    });
  }

  // 5. Collect unique userIds to batch-fetch user profiles
  const userIds = discountsSnap.docs.map((d) => d.id);

  // Firestore 'in' queries support up to 30 items; chunk if needed
  const userMap = new Map<string, { fullname: string; email: string }>();
  const chunkSize = 30;

  // First pass: referralUsers collection (source of truth for name/email)
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    try {
      const referralUsersSnap = await adminDb
        .collection('referralUsers')
        .where('__name__', 'in', chunk)
        .get();
      for (const doc of referralUsersSnap.docs) {
        const u = doc.data();
        userMap.set(doc.id, {
          fullname: u.fullName ?? u.fullname ?? u.displayName ?? '',
          email: u.email ?? '',
        });
      }
    } catch (error) {
      console.error('[referral-discounts] Firestore referralUsers batch query error:', error);
    }
  }

  // Second pass: users collection — fill in any gaps or enrich with better display name
  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    try {
      const usersSnap = await adminDb
        .collection('users')
        .where('__name__', 'in', chunk)
        .get();
      for (const doc of usersSnap.docs) {
        const u = doc.data();
        const existing = userMap.get(doc.id);
        const name = u.fullname ?? u.fullName ?? u.displayName ?? '';
        const email = u.email ?? '';
        userMap.set(doc.id, {
          fullname: name || existing?.fullname || '',
          email: email || existing?.email || '',
        });
      }
    } catch (error) {
      console.error('[referral-discounts] Firestore users batch query error:', error);
    }
  }

  // 6. Assemble enriched ReferralDiscountRow[]
  const discounts: ReferralDiscountRow[] = discountsSnap.docs.map((doc) => {
    const d = doc.data();
    const code: string = d.referralCode ?? '';
    const stats = statsMap.get(code) ?? { totalUsage: 0, totalSales: 0 };
    const userInfo = userMap.get(doc.id) ?? { fullname: '', email: '' };

    return {
      id: doc.id,
      userId: d.userId ?? doc.id,
      referralCode: code,
      percentage: d.percentage ?? 0,
      isActive: d.isActive ?? false,
      createdBy: d.createdBy ?? '',
      createdAt: d.createdAt ?? null,
      updatedAt: d.updatedAt ?? null,
      fullname: userInfo.fullname,
      email: userInfo.email,
      totalUsage: stats.totalUsage,
      totalSales: stats.totalSales,
    };
  });

  return NextResponse.json({ discounts });
}
