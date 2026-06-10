import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

// ─── POST /api/size-guides/[id]/assign ───────────────────────────────────────
// Vendor or admin assigns an approved guide to one or more products.
// Handles the is_default_for_category flag by clearing the previous default
// for the same vendor + category before setting the new one.
//
// Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 13.4

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { product_ids, set_as_default } = body as {
    product_ids?: string[];
    set_as_default?: boolean;
  };

  // product_ids must be an array (may be empty when only setting default)
  if (!Array.isArray(product_ids)) {
    return NextResponse.json(
      { success: false, error: 'product_ids must be an array', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  try {
    // ── Fetch the guide ──────────────────────────────────────────────────────
    const guideRef = adminDb.collection('size_guides').doc(id);
    const guideDoc = await guideRef.get();

    if (!guideDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const guide = guideDoc.data()!;

    // ── Authorization: caller must be the guide's vendor or an admin ─────────
    // Requirement 13.4
    const adminUser = await isAdmin(uid);
    const isOwner = guide.vendor_id === uid;

    if (!isOwner && !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: you do not own this guide', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // ── Guide must be approved before it can be assigned ─────────────────────
    // Requirement 8.7
    if (guide.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: 'Only approved size guides can be assigned to products',
          code: 'VALIDATION_ERROR',
        },
        { status: 422 }
      );
    }

    const batch = adminDb.batch();
    const now = FieldValue.serverTimestamp();

    // ── Assign size_guide_id to each product ─────────────────────────────────
    // Requirement 8.4, 8.5 — overwrites any existing size_guide_id
    for (const productId of product_ids) {
      const productRef = adminDb.collection('tailors_works').doc(productId);
      batch.update(productRef, {
        size_guide_id: id,
        updated_at: now,
      });
    }

    // ── Handle default-guide flag ─────────────────────────────────────────────
    // Requirement 8.3 — clear previous default for same vendor + category, then set new one
    if (set_as_default === true) {
      // Find any existing default guide for this vendor + category
      const existingDefaultSnap = await adminDb
        .collection('size_guides')
        .where('vendor_id', '==', guide.vendor_id)
        .where('category', '==', guide.category)
        .where('is_default_for_category', '==', true)
        .get();

      // Clear the previous default (skip if it's the same guide)
      for (const doc of existingDefaultSnap.docs) {
        if (doc.id !== id) {
          batch.update(doc.ref, { is_default_for_category: false, updated_at: now });
        }
      }

      // Mark this guide as the new default
      batch.update(guideRef, { is_default_for_category: true, updated_at: now });
    }

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[size-guides/[id]/assign POST] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to assign size guide', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
