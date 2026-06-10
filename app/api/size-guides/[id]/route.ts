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

// ─── GET /api/size-guides/[id] ────────────────────────────────────────────────

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

    return NextResponse.json({
      success: true,
      guide: {
        id: guideDoc.id,
        ...guideData,
        created_at: guideData.created_at?.toDate?.()?.toISOString() ?? null,
        updated_at: guideData.updated_at?.toDate?.()?.toISOString() ?? null,
        submitted_at: guideData.submitted_at?.toDate?.()?.toISOString() ?? null,
        approved_at: guideData.approved_at?.toDate?.()?.toISOString() ?? null,
        rows,
      },
    });
  } catch (error: any) {
    console.error('[size-guides/[id] GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch size guide', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}

// ─── PATCH /api/size-guides/[id] ─────────────────────────────────────────────

export async function PATCH(
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

  try {
    const guideDoc = await adminDb.collection('size_guides').doc(id).get();

    if (!guideDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const guideData = guideDoc.data()!;
    const adminUser = await isAdmin(uid);
    const isOwner = guideData.vendor_id === uid;

    if (!isOwner && !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (!adminUser && ['submitted', 'under_review'].includes(guideData.status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Guide cannot be edited while it is submitted or under review',
          code: 'CONFLICT',
        },
        { status: 409 }
      );
    }

    const allowedFields = [
      'title', 'unit', 'enabled_regions', 'uploaded_file_url',
      'uploaded_file_type', 'display_preference', 'is_default_for_category',
      'category_sections', 'category',
    ];
    if (adminUser) allowedFields.push('status');

    const updates: Record<string, any> = { updated_at: FieldValue.serverTimestamp() };
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    // Re-queue for marketing review after vendor addresses feedback
    const shouldResubmit =
      !adminUser &&
      isOwner &&
      ['needs_changes', 'rejected'].includes(guideData.status);
    if (shouldResubmit) {
      updates.status = 'submitted';
      updates.submitted_at = FieldValue.serverTimestamp();
    }

    const { rows } = body;

    if (rows !== undefined) {
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'rows must be a non-empty array', code: 'VALIDATION_ERROR' },
          { status: 400 }
        );
      }

      const batch = adminDb.batch();
      const guideRef = adminDb.collection('size_guides').doc(id);
      batch.update(guideRef, updates);

      if (shouldResubmit) {
        const approvalRef = adminDb.collection('size_guide_approvals').doc();
        batch.set(approvalRef, {
          guide_id: id,
          vendor_id: uid,
          status: 'submitted',
          submitted_at: FieldValue.serverTimestamp(),
        });
      }

      const existingRows = await adminDb
        .collection('size_guides')
        .doc(id)
        .collection('size_guide_rows')
        .get();
      existingRows.docs.forEach((doc) => batch.delete(doc.ref));

      for (const row of rows) {
        const rowRef = adminDb
          .collection('size_guides')
          .doc(id)
          .collection('size_guide_rows')
          .doc();
        batch.set(rowRef, {
          size_label: row.size_label ?? '',
          order: row.order ?? 0,
          measurements: row.measurements ?? {},
          regional_sizes: row.regional_sizes ?? {},
        });
      }

      await batch.commit();
    } else if (shouldResubmit) {
      const batch = adminDb.batch();
      const guideRef = adminDb.collection('size_guides').doc(id);
      batch.update(guideRef, updates);
      const approvalRef = adminDb.collection('size_guide_approvals').doc();
      batch.set(approvalRef, {
        guide_id: id,
        vendor_id: uid,
        status: 'submitted',
        submitted_at: FieldValue.serverTimestamp(),
      });
      await batch.commit();
    } else {
      await adminDb.collection('size_guides').doc(id).update(updates);
    }

    const updatedDoc = await adminDb.collection('size_guides').doc(id).get();
    const updated = updatedDoc.data()!;
    return NextResponse.json({
      success: true,
      guide: {
        id,
        ...updated,
        created_at: updated.created_at?.toDate?.()?.toISOString() ?? null,
        updated_at: updated.updated_at?.toDate?.()?.toISOString() ?? null,
        submitted_at: updated.submitted_at?.toDate?.()?.toISOString() ?? null,
        approved_at: updated.approved_at?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error: any) {
    console.error('[size-guides/[id] PATCH] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update size guide', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/size-guides/[id] ────────────────────────────────────────────

export async function DELETE(
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

  let confirmed = false;
  try {
    const body = await request.json();
    confirmed = body?.confirm === true || body?.confirmed === true;
  } catch {
    // body is optional
  }

  try {
    const guideDoc = await adminDb.collection('size_guides').doc(id).get();

    if (!guideDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const guideData = guideDoc.data()!;
    const adminUser = await isAdmin(uid);
    const isOwner = guideData.vendor_id === uid;

    if (!isOwner && !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Check for product assignments
    let assignedSnap: FirebaseFirestore.QuerySnapshot;
    try {
      assignedSnap = await adminDb
        .collection('tailors_works')
        .where('size_guide_id', '==', id)
        .limit(10)
        .get();
    } catch {
      // If the query fails (e.g. missing index), treat as no assignments
      assignedSnap = { empty: true, docs: [] } as any;
    }

    if (!assignedSnap.empty && !confirmed) {
      const affectedProducts = assignedSnap.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name ?? doc.data().title ?? doc.id,
      }));
      return NextResponse.json(
        {
          success: false,
          error: 'This guide is assigned to products. Pass confirmed=true to proceed.',
          code: 'CONFLICT',
          affectedProducts,
        },
        { status: 409 }
      );
    }

    const batch = adminDb.batch();

    const rowsSnap = await adminDb
      .collection('size_guides')
      .doc(id)
      .collection('size_guide_rows')
      .get();
    rowsSnap.docs.forEach((doc) => batch.delete(doc.ref));

    if (!assignedSnap.empty) {
      assignedSnap.docs.forEach((doc) =>
        batch.update(doc.ref, { size_guide_id: FieldValue.delete() })
      );
    }

    batch.delete(adminDb.collection('size_guides').doc(id));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[size-guides/[id] DELETE] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete size guide', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
