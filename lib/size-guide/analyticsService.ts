/**
 * Analytics service for the Vendor Size Guide System.
 * Records customer view events and reads aggregated metrics.
 * No PII is stored — only anonymised session identifiers.
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { getDbInstance } from '@/firebase';
import type { SizeGuideView } from '@/types/size-guide';

const VIEWS_COLLECTION = 'size_guide_views';
const GUIDES_COLLECTION = 'size_guides';
const WORKS_COLLECTION = 'tailor_works';
const TAILORS_COLLECTION = 'tailors';

// ─── View Recording ───────────────────────────────────────────────────────────

/**
 * Records a view event when a customer opens the SizeGuideViewerModal.
 * Stores only guide_id, product_id, viewed_at, and an anonymised session_id.
 * No PII fields are written. Requirements: 12.1, 12.4
 */
export async function recordView(
  guideId: string,
  productId: string,
  sessionId: string,
): Promise<void> {
  const db = getDbInstance();

  // Explicitly construct the payload — no PII fields allowed
  const viewEvent: Omit<SizeGuideView, 'id'> = {
    guide_id: guideId,
    product_id: productId,
    viewed_at: Timestamp.now(),
    session_id: sessionId,
  };

  await addDoc(collection(db, VIEWS_COLLECTION), viewEvent);
}

// ─── Analytics Summary ────────────────────────────────────────────────────────

export interface GuideAnalyticsSummary {
  guide_id: string;
  guide_title: string;
  vendor_name: string;
  total_views: number;
  assigned_product_count: number;
}

export interface AnalyticsSummaryResult {
  /** Per-guide metrics for all approved guides */
  guides: GuideAnalyticsSummary[];
  /** Top 10 most-viewed guides in the current calendar month */
  topThisMonth: GuideAnalyticsSummary[];
}

/**
 * Returns per-guide analytics: total view count, assigned product count, vendor name.
 * Also returns the top 10 most-viewed guides in the current calendar month.
 * Requirements: 12.2, 12.3
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummaryResult> {
  const db = getDbInstance();

  // Fetch all approved guides
  const guidesSnap = await getDocs(
    query(collection(db, GUIDES_COLLECTION), where('status', '==', 'approved')),
  );

  // Fetch all view events
  const viewsSnap = await getDocs(collection(db, VIEWS_COLLECTION));

  // Fetch all products to count assignments
  const worksSnap = await getDocs(collection(db, WORKS_COLLECTION));

  // Fetch all tailors for vendor names
  const tailorsSnap = await getDocs(collection(db, TAILORS_COLLECTION));

  // Build lookup maps
  const tailorMap = new Map<string, string>();
  tailorsSnap.docs.forEach((d) => {
    const data = d.data();
    const name =
      data.brandName?.trim() ||
      `${data.first_name ?? ''} ${data.last_name ?? ''}`.trim() ||
      'Unknown Vendor';
    tailorMap.set(d.id, name);
  });

  // Count views per guide
  const viewCountMap = new Map<string, number>();
  viewsSnap.docs.forEach((d) => {
    const gid = d.data().guide_id as string;
    if (gid) viewCountMap.set(gid, (viewCountMap.get(gid) ?? 0) + 1);
  });

  // Count assigned products per guide
  const assignmentCountMap = new Map<string, number>();
  worksSnap.docs.forEach((d) => {
    const gid = d.data().size_guide_id as string | undefined;
    if (gid) assignmentCountMap.set(gid, (assignmentCountMap.get(gid) ?? 0) + 1);
  });

  // Build per-guide summaries
  const guides: GuideAnalyticsSummary[] = guidesSnap.docs.map((d) => {
    const data = d.data();
    return {
      guide_id: d.id,
      guide_title: (data.title as string) ?? '',
      vendor_name: tailorMap.get(data.vendor_id as string) ?? 'Unknown Vendor',
      total_views: viewCountMap.get(d.id) ?? 0,
      assigned_product_count: assignmentCountMap.get(d.id) ?? 0,
    };
  });

  // Top 10 most-viewed in the current calendar month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartTs = Timestamp.fromDate(monthStart);

  const monthViewsSnap = await getDocs(
    query(
      collection(db, VIEWS_COLLECTION),
      where('viewed_at', '>=', monthStartTs),
    ),
  );

  const monthViewCountMap = new Map<string, number>();
  monthViewsSnap.docs.forEach((d) => {
    const gid = d.data().guide_id as string;
    if (gid) monthViewCountMap.set(gid, (monthViewCountMap.get(gid) ?? 0) + 1);
  });

  const topThisMonth = guides
    .map((g) => ({ ...g, total_views: monthViewCountMap.get(g.guide_id) ?? 0 }))
    .filter((g) => g.total_views > 0)
    .sort((a, b) => b.total_views - a.total_views)
    .slice(0, 10);

  return { guides, topThisMonth };
}
