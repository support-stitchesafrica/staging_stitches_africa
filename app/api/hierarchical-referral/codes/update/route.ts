import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';

/**
 * PATCH /api/hierarchical-referral/codes/update
 * Update (customise) a referral code for an influencer
 */
export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await verifyIdToken(idToken);
    if (!decoded) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const { oldCode, newCode } = await request.json();

    if (!oldCode || !newCode) {
      return NextResponse.json({ success: false, error: 'oldCode and newCode are required' }, { status: 400 });
    }

    const trimmed = newCode.trim().toUpperCase().replace(/\s+/g, '_');

    if (!/^[A-Z0-9_-]{3,30}$/.test(trimmed)) {
      return NextResponse.json({
        success: false,
        error: 'Code must be 3–30 characters, letters, numbers, hyphens or underscores only'
      }, { status: 400 });
    }

    // Check new code isn't already taken
    const existing = await adminDb.collection('referralCodes').doc(trimmed).get();
    if (existing.exists) {
      return NextResponse.json({ success: false, error: 'That code is already taken' }, { status: 409 });
    }

    // Get old code doc and verify ownership
    const oldDoc = await adminDb.collection('referralCodes').doc(oldCode).get();
    if (!oldDoc.exists) {
      return NextResponse.json({ success: false, error: 'Original code not found' }, { status: 404 });
    }

    const oldData = oldDoc.data()!;
    if (oldData.createdBy !== decoded.uid) {
      return NextResponse.json({ success: false, error: 'You do not own this code' }, { status: 403 });
    }

    // Create new code doc with same data
    const batch = adminDb.batch();
    batch.set(adminDb.collection('referralCodes').doc(trimmed), {
      ...oldData,
      id: trimmed,
      code: trimmed,
    });
    batch.delete(adminDb.collection('referralCodes').doc(oldCode));

    // Update influencer record
    const influencerRef = adminDb.collection('influencers').doc(decoded.uid);
    const influencerSnap = await influencerRef.get();
    const influencerData = influencerSnap.data();

    if (influencerData) {
      if (oldData.type === 'master') {
        batch.update(influencerRef, { masterReferralCode: trimmed });
      } else if (oldData.type === 'sub') {
        // Update the mini influencer who was assigned this code
        if (oldData.assignedTo) {
          batch.update(adminDb.collection('influencers').doc(oldData.assignedTo), {
            referralCode: trimmed
          });
        }
      }
    }

    await batch.commit();

    return NextResponse.json({ success: true, data: { code: trimmed } });
  } catch (error: any) {
    console.error('Update code error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update code' }, { status: 500 });
  }
}
