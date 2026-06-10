import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

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

/** Returns true if the uid belongs to a marketing admin (super_admin, team_lead, bdm) */
async function isAdmin(uid: string): Promise<boolean> {
  const doc = await adminDb.collection('marketing_users').doc(uid).get();
  if (!doc.exists) return false;
  const role = doc.data()?.role;
  return ['super_admin', 'team_lead', 'bdm'].includes(role);
}

// ─── GET /api/size-guide-analytics ───────────────────────────────────────────
// Admin-only. Returns per-guide metrics: total view count, number of products
// assigned, and vendor name. Also returns the top 10 most-viewed guides in the
// current calendar month.
//
// Requirements: 12.2, 12.3

export async function GET(request: NextRequest) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
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
    // Fetch all approved guides
    const guidesSnap = await adminDb
      .collection('size_guides')
      .where('status', '==', 'approved')
      .get();

    // Fetch all view events (for total view counts)
    const viewsSnap = await adminDb.collection('size_guide_views').get();

    // Fetch view events for the current calendar month (for top-10)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStartTs = Timestamp.fromDate(monthStart);

    const monthViewsSnap = await adminDb
      .collection('size_guide_views')
      .where('viewed_at', '>=', monthStartTs)
      .get();

    // Fetch all products to count assignments per guide
    const worksSnap = await adminDb.collection('tailor_works').get();

    // Fetch all tailors for vendor name lookup
    const tailorsSnap = await adminDb.collection('tailors').get();

    // Build tailor name lookup map
    const tailorMap = new Map<string, string>();
    tailorsSnap.docs.forEach((d) => {
      const data = d.data();
      const name =
        (data.brandName as string | undefined)?.trim() ||
        `${(data.first_name as string | undefined) ?? ''} ${(data.last_name as string | undefined) ?? ''}`.trim() ||
        'Unknown Vendor';
      tailorMap.set(d.id, name || 'Unknown Vendor');
    });

    // Count total views per guide
    const totalViewCountMap = new Map<string, number>();
    viewsSnap.docs.forEach((d) => {
      const gid = d.data().guide_id as string | undefined;
      if (gid) totalViewCountMap.set(gid, (totalViewCountMap.get(gid) ?? 0) + 1);
    });

    // Count current-month views per guide
    const monthViewCountMap = new Map<string, number>();
    monthViewsSnap.docs.forEach((d) => {
      const gid = d.data().guide_id as string | undefined;
      if (gid) monthViewCountMap.set(gid, (monthViewCountMap.get(gid) ?? 0) + 1);
    });

    // Count assigned products per guide
    const assignmentCountMap = new Map<string, number>();
    worksSnap.docs.forEach((d) => {
      const gid = d.data().size_guide_id as string | undefined;
      if (gid) assignmentCountMap.set(gid, (assignmentCountMap.get(gid) ?? 0) + 1);
    });

    // Build per-guide summaries
    const guides = guidesSnap.docs.map((d) => {
      const data = d.data();
      return {
        guide_id: d.id,
        guide_title: (data.title as string) ?? '',
        vendor_name: tailorMap.get(data.vendor_id as string) ?? 'Unknown Vendor',
        total_views: totalViewCountMap.get(d.id) ?? 0,
        assigned_product_count: assignmentCountMap.get(d.id) ?? 0,
      };
    });

    // Top 10 most-viewed guides in the current calendar month
    const topThisMonth = guides
      .map((g) => ({
        ...g,
        total_views: monthViewCountMap.get(g.guide_id) ?? 0,
      }))
      .filter((g) => g.total_views > 0)
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      guides,
      topThisMonth,
    });
  } catch (error: any) {
    console.error('[size-guide-analytics GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
