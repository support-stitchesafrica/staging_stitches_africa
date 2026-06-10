import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Look up the Firebase Auth user by email
    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;

    const userData = {
      uid,
      email: userRecord.email,
      fullName: userRecord.displayName || email.split('@')[0],
      role: 'superadmin',
      isCollectionsUser: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('collectionsUsers').doc(uid).set(userData, { merge: true });

    return NextResponse.json({ success: true, uid, email, role: 'superadmin' });
  } catch (error: any) {
    console.error('Setup collections user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
