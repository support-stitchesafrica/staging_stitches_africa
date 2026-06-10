import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';

// ─── Auth helper ──────────────────────────────────────────────────────────────

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

// ─── POST /api/size-guides/[id]/submit ───────────────────────────────────────
// Atomically sets status='submitted', records submitted_at, and writes a new
// size_guide_approvals document.
// Returns 409 if a prior version of this guide is still under_review.
// Requirements: 6.1, 6.2, 13.1

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

  try {
    const guideRef = adminDb.collection('size_guides').doc(id);
    const guideDoc = await guideRef.get();

    if (!guideDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const guide = guideDoc.data()!;

    // Only the owning vendor may submit
    if (guide.vendor_id !== uid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    // Draft, needs_changes, rejected, or approved (new version) guides may be submitted
    if (!['draft', 'approved', 'needs_changes', 'rejected'].includes(guide.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Guide cannot be submitted from status '${guide.status}'`,
          code: 'CONFLICT',
        },
        { status: 409 }
      );
    }

    // Check if a prior version of this guide (same parent lineage) is still under_review.
    // A "prior version" shares the same parent_guide_id, or this guide's parent is still under_review.
    const parentId = guide.parent_guide_id ?? null;

    if (parentId) {
      const underReviewSnap = await adminDb
        .collection('size_guides')
        .where('vendor_id', '==', uid)
        .where('parent_guide_id', '==', parentId)
        .where('status', '==', 'under_review')
        .limit(1)
        .get();

      if (!underReviewSnap.empty) {
        return NextResponse.json(
          {
            success: false,
            error: 'A prior version of this guide is still under review. Wait for it to be reviewed before submitting a new version.',
            code: 'CONFLICT',
          },
          { status: 409 }
        );
      }

      // Also check if the parent itself is under_review
      const parentDoc = await adminDb.collection('size_guides').doc(parentId).get();
      if (parentDoc.exists && parentDoc.data()?.status === 'under_review') {
        return NextResponse.json(
          {
            success: false,
            error: 'A prior version of this guide is still under review. Wait for it to be reviewed before submitting a new version.',
            code: 'CONFLICT',
          },
          { status: 409 }
        );
      }
    }

    // Ensure the guide has at least one row before submission
    const rowsSnap = await adminDb
      .collection('size_guides')
      .doc(id)
      .collection('size_guide_rows')
      .limit(1)
      .get();

    if (rowsSnap.empty) {
      return NextResponse.json(
        {
          success: false,
          error: 'Guide must have at least one measurement row before submission',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const now = FieldValue.serverTimestamp();

    const batch = adminDb.batch();
    batch.update(guideRef, {
      status: 'submitted',
      submitted_at: now,
      updated_at: now,
    });

    const approvalRef = adminDb.collection('size_guide_approvals').doc();
    batch.set(approvalRef, {
      guide_id: id,
      vendor_id: uid,
      status: 'submitted',
      submitted_at: now,
    });

    await batch.commit();

    const updatedDoc = await guideRef.get();
    const data = updatedDoc.data()!;

    return NextResponse.json({
      success: true,
      guide: {
        id: guideRef.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() ?? null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() ?? null,
        submitted_at: data.submitted_at?.toDate?.()?.toISOString() ?? null,
        approved_at: data.approved_at?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error: any) {
    console.error('[size-guides/[id]/submit POST] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit size guide', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
