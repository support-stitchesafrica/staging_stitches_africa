import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/size-guides/vendor/[vendorId]
 *
 * Public endpoint — no auth required.
 * Returns all approved size guides for a vendor, ordered by created_at asc
 * so the first element is the oldest (default) guide.
 *
 * Used by the product detail page to show a default size guide when the
 * product has no explicit size_guide_id set.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> },
) {
  const { vendorId } = await params;

  if (!vendorId) {
    return NextResponse.json(
      { success: false, error: 'vendorId is required' },
      { status: 400 },
    );
  }

  try {
    const snapshot = await adminDb
      .collection('size_guides')
      .where('vendor_id', '==', vendorId)
      .where('status', '==', 'approved')
      .get();

    const guides = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() ?? null,
        updated_at: doc.data().updated_at?.toDate?.()?.toISOString() ?? null,
        submitted_at: doc.data().submitted_at?.toDate?.()?.toISOString() ?? null,
        approved_at: doc.data().approved_at?.toDate?.()?.toISOString() ?? null,
      }))
      .sort((a, b) => {
        const aMs = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bMs = b.created_at ? new Date(b.created_at).getTime() : 0;
        return aMs - bMs;
      });

    return NextResponse.json({ success: true, guides });
  } catch (error: any) {
    console.error('[size-guides/vendor GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor size guides', code: 'INTERNAL' },
      { status: 500 },
    );
  }
}
