import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the Firebase ID token
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;

    // Check if user is VVIP
    const vvipQuery = await adminDb
      .collection("staging_vvip_shoppers")
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .limit(1)
      .get();

    const isVvip = !vvipQuery.empty;
    let vvipDetails = null;

    if (isVvip) {
      const vvipDoc = vvipQuery.docs[0];
      const data = vvipDoc.data();
      vvipDetails = {
        userId: data.userId,
        email: data.email,
        name: data.name,
        status: data.status,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
        createdBy: data.createdBy,
        createdByEmail: data.createdByEmail,
      };
    }

    return NextResponse.json({
      isVvip,
      vvipDetails,
      userId,
    });

  } catch (error) {
    console.error('VVIP Status API Error:', error);
    return NextResponse.json(
      { error: 'Failed to check VVIP status' },
      { status: 500 }
    );
  }
}