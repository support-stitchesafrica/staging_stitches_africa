import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * POST /api/hierarchical-referral/codes/generate-sub-direct
 * Generate a sub-referral code directly from Firestore (bypasses broken service layer)
 * Works for both mother and mini influencers
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyIdToken(authHeader.split('Bearer ')[1]);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const uid = decoded.uid;

    // Get influencer from Firestore
    const influencerSnap = await adminDb.collection('influencers').doc(uid).get();
    if (!influencerSnap.exists) {
      return NextResponse.json({ success: false, error: 'Influencer not found' }, { status: 404 });
    }

    const influencer = influencerSnap.data()!;

    if (influencer.status !== 'active') {
      return NextResponse.json({ success: false, error: 'Account must be active to generate codes' }, { status: 403 });
    }

    // Build code prefix based on type
    const prefix = influencer.type === 'mother'
      ? `SUB_${(influencer.masterReferralCode || uid).substring(0, 6)}`
      : `MINI_${uid.substring(0, 6)}`;

    // Generate unique code
    let code = '';
    let attempts = 0;
    while (attempts < 10) {
      const candidate = `${prefix}_${generateRandomString(6)}`;
      const existing = await adminDb.collection('referralCodes').doc(candidate).get();
      if (!existing.exists) { code = candidate; break; }
      attempts++;
    }

    if (!code) {
      return NextResponse.json({ success: false, error: 'Failed to generate unique code' }, { status: 500 });
    }

    // Save code to Firestore
    await adminDb.collection('referralCodes').doc(code).set({
      id: code,
      code,
      type: 'sub',
      createdBy: uid,
      creatorType: influencer.type,
      status: 'active',
      usageCount: 0,
      createdAt: Timestamp.now(),
      metadata: {}
    });

    return NextResponse.json({ success: true, data: { subReferralCode: code } });
  } catch (error: any) {
    console.error('Generate sub code error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate code' }, { status: 500 });
  }
}
