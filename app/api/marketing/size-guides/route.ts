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

// ─── GET /api/marketing/size-guides ──────────────────────────────────────────
// Admin-only. Returns all guides with status = submitted | under_review,
// sorted by submitted_at ascending (oldest first), enriched with vendor brand name.
// Requirements: 7.1, 7.8

export async function GET(request: NextRequest) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'FORBIDDEN' },
      { status: 401 }
    );
  }

  const adminUser = await isAdmin(uid);
  if (!adminUser) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: admin access required', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  try {
    // Fetch submitted guides
    const submittedSnap = await adminDb
      .collection('size_guides')
      .where('status', 'in', ['submitted', 'under_review'])
      .orderBy('submitted_at', 'asc')
      .get();

    if (submittedSnap.empty) {
      return NextResponse.json({ success: true, guides: [] });
    }

    // Collect unique vendor IDs to batch-fetch brand names
    const vendorIds = [...new Set(submittedSnap.docs.map((d) => d.data().vendor_id as string))];

    // Fetch vendor documents in parallel
    const vendorDocs = await Promise.all(
      vendorIds.map((id) => adminDb.collection('tailors').doc(id).get())
    );

    const vendorNameMap: Record<string, string> = {};
    vendorDocs.forEach((doc) => {
      if (doc.exists) {
        const data = doc.data()!;
        vendorNameMap[doc.id] = data.brand_name || data.brandName || 'Unknown Vendor';
      }
    });

    const guides = submittedSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        vendor_id: data.vendor_id,
        vendor_brand_name: vendorNameMap[data.vendor_id] ?? 'Unknown Vendor',
        title: data.title,
        category: data.category,
        unit: data.unit,
        status: data.status,
        version: data.version,
        enabled_regions: data.enabled_regions ?? [],
        uploaded_file_url: data.uploaded_file_url ?? null,
        uploaded_file_type: data.uploaded_file_type ?? null,
        display_preference: data.display_preference ?? null,
        category_sections: data.category_sections ?? null,
        submitted_at: data.submitted_at?.toDate?.()?.toISOString() ?? null,
        created_at: data.created_at?.toDate?.()?.toISOString() ?? null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ success: true, guides });
  } catch (error: any) {
    console.error('[marketing/size-guides GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval queue', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
