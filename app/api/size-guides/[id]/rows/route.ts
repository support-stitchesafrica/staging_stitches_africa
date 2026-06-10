import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// ─── Auth helpers ─────────────────────────────────────────────────────────────

async function getAuthenticatedUid(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

async function isAdmin(uid: string): Promise<boolean> {
  const doc = await adminDb.collection('marketing_users').doc(uid).get();
  if (!doc.exists) return false;
  const role = doc.data()?.role;
  return ['super_admin', 'team_lead', 'bdm'].includes(role);
}

// ─── GET /api/size-guides/[id]/rows ──────────────────────────────────────────
// Returns the size_guide_rows subcollection for a guide.
// Requirements: 13.5

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await getAuthenticatedUid(request);
  const { id } = await params;

  try {
    const guideDoc = await adminDb.collection('size_guides').doc(id).get();

    if (!guideDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const guideData = guideDoc.data()!;
    const adminUser = uid ? await isAdmin(uid) : false;
    const isOwner = uid ? guideData.vendor_id === uid : false;
    const isApproved = guideData.status === 'approved';

    // Public storefront may read approved guides without auth
    if (!isOwner && !adminUser && !isApproved) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const rowsSnap = await adminDb
      .collection('size_guides')
      .doc(id)
      .collection('size_guide_rows')
      .orderBy('order', 'asc')
      .get();

    const rows = rowsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, rows });
  } catch (error: any) {
    console.error('[size-guides/[id]/rows GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rows', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
