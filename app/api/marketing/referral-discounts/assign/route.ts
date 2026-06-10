import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';

const AUTHORIZED_ROLES = ['super_admin', 'team_lead', 'bdm'] as const;

export async function POST(request: NextRequest) {
  // 1. Parse request body
  let body: { userId?: string; referralCode?: string; percentage?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { userId, referralCode, percentage } = body;

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 }
    );
  }

  if (!referralCode || typeof referralCode !== 'string') {
    return NextResponse.json(
      { success: false, error: 'referralCode is required' },
      { status: 400 }
    );
  }

  // 2. Validate percentage: must be an integer between 1 and 100
  if (
    typeof percentage !== 'number' ||
    !Number.isInteger(percentage) ||
    percentage < 1 ||
    percentage > 100
  ) {
    return NextResponse.json(
      { success: false, error: 'percentage must be an integer between 1 and 100' },
      { status: 400 }
    );
  }

  // 3. Authenticate marketing user
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;

  // 4. Role check
  if (!AUTHORIZED_ROLES.includes(user.role as typeof AUTHORIZED_ROLES[number])) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  // 5. Write to referralDiscounts using userId as doc ID (merge: true for upsert)
  //    createdBy and createdAt are only set on first write via merge
  try {
    const docRef = adminDb.collection('referralDiscounts').doc(userId);
    const existing = await docRef.get();

    if (existing.exists) {
      // Update existing — preserve createdBy/createdAt, refresh updatedAt
      await docRef.set(
        {
          userId,
          referralCode: referralCode.trim().toUpperCase(),
          percentage,
          isActive: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // First-time creation — set all fields including createdBy and createdAt
      await docRef.set({
        userId,
        referralCode: referralCode.trim().toUpperCase(),
        percentage,
        isActive: true,
        createdBy: user.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('[referral-discounts/assign] Firestore write error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save discount' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
