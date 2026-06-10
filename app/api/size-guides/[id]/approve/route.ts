import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { GuideStatus } from '@/types/size-guide';
import { getLatestApprovalDocForGuide } from '@/lib/size-guide/approval-records';

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

const TERMINAL_STATUSES: GuideStatus[] = ['approved', 'rejected', 'needs_changes'];

// ─── POST /api/size-guides/[id]/approve ──────────────────────────────────────
// Admin-only. Transitions guide status to approved | rejected | needs_changes.
// Requires a comment for rejected and needs_changes.
// Atomically updates the guide document and the size_guide_approvals record.
// Requirements: 7.3, 7.4, 7.5, 7.6, 13.2, 13.3

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

  // Admin-only endpoint — requirement 13.2, 13.3
  const adminUser = await isAdmin(uid);
  if (!adminUser) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: admin access required', code: 'FORBIDDEN' },
      { status: 403 }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { status, comment } = body as { status?: GuideStatus; comment?: string };

  // Validate target status
  if (!status || !TERMINAL_STATUSES.includes(status)) {
    return NextResponse.json(
      {
        success: false,
        error: `status must be one of: ${TERMINAL_STATUSES.join(', ')}`,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  // Comment is required for rejected and needs_changes — requirement 7.5
  if ((status === 'rejected' || status === 'needs_changes') && (!comment || comment.trim() === '')) {
    return NextResponse.json(
      {
        success: false,
        error: 'A comment is required when rejecting or requesting changes',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
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

    // Guide must be in a reviewable state
    if (!['submitted', 'under_review'].includes(guide.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Guide cannot be reviewed from status '${guide.status}'`,
          code: 'CONFLICT',
        },
        { status: 409 }
      );
    }

    const latestApprovalDoc = await getLatestApprovalDocForGuide(adminDb, id);

    const now = FieldValue.serverTimestamp();

    // Build guide update payload
    const guideUpdate: Record<string, any> = {
      status,
      updated_at: now,
    };
    if (status === 'approved') {
      guideUpdate.approved_at = now;
    }

    // Build approval record update payload
    const approvalUpdate: Record<string, any> = {
      status,
      admin_id: uid,
      reviewed_at: now,
    };
    if (comment?.trim()) {
      approvalUpdate.comment = comment.trim();
    }

    const batch = adminDb.batch();

    batch.update(guideRef, guideUpdate);

    if (latestApprovalDoc) {
      // Update the existing approval record — requirement 7.6
      batch.update(latestApprovalDoc.ref, approvalUpdate);
    } else {
      // No prior approval record found — create one (defensive fallback)
      const newApprovalRef = adminDb.collection('size_guide_approvals').doc();
      batch.set(newApprovalRef, {
        guide_id: id,
        vendor_id: guide.vendor_id,
        ...approvalUpdate,
        submitted_at: guide.submitted_at ?? now,
      });
    }

    await batch.commit();

    return NextResponse.json({ success: true, status });
  } catch (error: any) {
    console.error('[size-guides/[id]/approve POST] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update guide status', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
