import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/referral/admin/fix-stats
 * Manually correct a referrer's totalPoints and totalRevenue in Firestore.
 * Body: { referrerCode: string, totalPoints: number, totalRevenue: number }
 * 
 * Also recalculates from actual referralPurchases records if recalculate=true.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrerCode, totalPoints, totalRevenue, recalculate } = body;

    if (!referrerCode) {
      return NextResponse.json({ success: false, error: 'referrerCode is required' }, { status: 400 });
    }

    // Find the referrer by code
    const snapshot = await adminDb
      .collection('referralUsers')
      .where('referralCode', '==', referrerCode.trim().toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ success: false, error: 'Referrer not found' }, { status: 404 });
    }

    const referrerDoc = snapshot.docs[0];
    const referrerId = referrerDoc.id;

    if (recalculate) {
      // Recalculate from actual purchase records
      const purchasesSnap = await adminDb
        .collection('referralPurchases')
        .where('referrerId', '==', referrerId)
        .get();

      let calcPoints = 0;
      let calcRevenue = 0;

      purchasesSnap.forEach((doc) => {
        const data = doc.data();
        calcRevenue += data.amount || 0;
        calcPoints += data.points || 0;
      });

      await referrerDoc.ref.update({
        totalPoints: calcPoints,
        totalRevenue: calcRevenue,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: 'Stats recalculated from purchase records',
        referrerId,
        totalPoints: calcPoints,
        totalRevenue: calcRevenue,
        purchaseCount: purchasesSnap.size,
      });
    }

    // Manual override
    if (totalPoints === undefined || totalRevenue === undefined) {
      return NextResponse.json(
        { success: false, error: 'totalPoints and totalRevenue are required (or pass recalculate=true)' },
        { status: 400 }
      );
    }

    await referrerDoc.ref.update({
      totalPoints: Number(totalPoints),
      totalRevenue: Number(totalRevenue),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      message: 'Stats updated successfully',
      referrerId,
      totalPoints: Number(totalPoints),
      totalRevenue: Number(totalRevenue),
    });

  } catch (error: any) {
    console.error('Error fixing referral stats:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
