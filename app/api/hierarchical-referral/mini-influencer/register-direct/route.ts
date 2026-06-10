import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  subReferralCode: z.string().min(1),
});

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
}

/**
 * POST /api/hierarchical-referral/mini-influencer/register-direct
 * Register a Mini Influencer using a sub-code OR a mother's master code.
 * Master codes are reusable; sub-codes are single-use.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { message: 'Invalid input' } }, { status: 400 });
    }

    const { email, password, name, subReferralCode } = parsed.data;
    const code = subReferralCode.trim().toUpperCase();

    // Validate the referral code exists and is active
    const codeSnap = await adminDb.collection('referralCodes').doc(code).get();
    if (!codeSnap.exists) {
      return NextResponse.json({ success: false, error: { message: 'Referral code not found' } }, { status: 400 });
    }

    const codeData = codeSnap.data()!;
    if (codeData.status !== 'active') {
      return NextResponse.json({ success: false, error: { message: 'This referral code is no longer active' } }, { status: 400 });
    }

    const isMasterCode = codeData.type === 'master';

    // Sub-codes are single-use; master codes can be reused by multiple minis
    if (!isMasterCode && codeData.assignedTo) {
      return NextResponse.json({ success: false, error: { message: 'This referral code has already been used' } }, { status: 400 });
    }

    // Create Firebase Auth user
    const auth = getAuth();
    let uid: string;
    try {
      const userRecord = await auth.createUser({ email, password, displayName: name });
      uid = userRecord.uid;
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-exists'
        ? 'An account with this email already exists.'
        : 'Failed to create account. Please try again.';
      return NextResponse.json({ success: false, error: { message: msg } }, { status: 400 });
    }

    // Generate a personal referral code for this mini influencer
    let personalCode = '';
    for (let i = 0; i < 10; i++) {
      const candidate = `REF_${name.toUpperCase().replace(/\s+/g, '').substring(0, 5)}_${generateRandomString(5)}`;
      const existing = await adminDb.collection('referralCodes').doc(candidate).get();
      if (!existing.exists) { personalCode = candidate; break; }
    }

    const influencerData = {
      id: uid,
      type: 'mini',
      email,
      name,
      parentInfluencerId: codeData.createdBy,
      status: 'active',
      referralCode: personalCode || null,
      totalEarnings: 0,
      payoutInfo: { minimumThreshold: 50, currency: 'NGN', isVerified: false },
      preferences: { email: true, push: true },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const batch = adminDb.batch();

    batch.set(adminDb.collection('influencers').doc(uid), influencerData);

    if (isMasterCode) {
      // Master codes stay active — just increment usage count
      batch.update(adminDb.collection('referralCodes').doc(code), {
        usageCount: (codeData.usageCount || 0) + 1,
      });
    } else {
      // Sub-codes are single-use — mark as used
      batch.update(adminDb.collection('referralCodes').doc(code), {
        assignedTo: uid,
        status: 'inactive',
        usageCount: (codeData.usageCount || 0) + 1,
      });
    }

    if (personalCode) {
      batch.set(adminDb.collection('referralCodes').doc(personalCode), {
        id: personalCode,
        code: personalCode,
        type: 'personal',
        createdBy: uid,
        status: 'active',
        usageCount: 0,
        createdAt: Timestamp.now(),
        metadata: {}
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, data: { uid, name, email, referralCode: personalCode } });
  } catch (error: any) {
    console.error('Mini influencer register-direct error:', error);
    return NextResponse.json({ success: false, error: { message: 'Registration failed. Please try again.' } }, { status: 500 });
  }
}
