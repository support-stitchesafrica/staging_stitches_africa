import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { GuideStatus } from '@/types/size-guide';
import { getLatestApprovalDocForGuide } from '@/lib/size-guide/approval-records';

export const dynamic = 'force-dynamic';

const FEEDBACK_STATUSES: GuideStatus[] = ['needs_changes', 'rejected'];

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

// ─── GET /api/size-guides/[id]/review-feedback ───────────────────────────────
// Returns the latest marketing review comment for guides that need vendor action.

export async function GET(
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
    const guideDoc = await adminDb.collection('size_guides').doc(id).get();

    if (!guideDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Size guide not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const guide = guideDoc.data()!;

    if (guide.vendor_id !== uid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    if (!FEEDBACK_STATUSES.includes(guide.status as GuideStatus)) {
      return NextResponse.json(
        { success: false, error: 'No review feedback available for this guide', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const latestApprovalDoc = await getLatestApprovalDocForGuide(adminDb, id);
    const record = latestApprovalDoc?.data();

    const hasFeedback =
      record &&
      FEEDBACK_STATUSES.includes(record.status as GuideStatus) &&
      typeof record.comment === 'string' &&
      record.comment.trim() !== '';

    if (!hasFeedback || !record?.comment) {
      return NextResponse.json(
        { success: false, error: 'No review message found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      feedback: {
        comment: record.comment.trim(),
        status: record.status as GuideStatus,
        reviewed_at: record.reviewed_at?.toDate?.()?.toISOString() ?? null,
      },
    });
  } catch (error: unknown) {
    console.error('[size-guides/[id]/review-feedback GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch review feedback', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
