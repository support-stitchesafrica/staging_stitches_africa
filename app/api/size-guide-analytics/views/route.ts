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

// ─── PII field blocklist ──────────────────────────────────────────────────────
// Any payload containing these keys is rejected — requirement 12.4

const PII_FIELDS = new Set([
  'user_id',
  'email',
  'phone',
  'name',
  'userId',
  'userEmail',
  'userName',
  'ip',
  'ipAddress',
]);

// ─── POST /api/size-guide-analytics/views ────────────────────────────────────
// Requires authentication — unauthenticated write requests are rejected with 401.
// Records a view event in `size_guide_views`.
// Stores: guide_id, product_id, viewed_at, session_id.
// Rejects any payload containing PII fields.
//
// Requirements: 12.1, 12.4, 13.7

export async function POST(request: NextRequest) {
  // Require authentication — requirement 13.7
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Reject payloads containing PII fields — requirement 12.4
  const piiFound = Object.keys(body).filter((key) => PII_FIELDS.has(key));
  if (piiFound.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Payload must not contain PII fields: ${piiFound.join(', ')}`,
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  }

  const { guide_id, product_id, session_id } = body as {
    guide_id?: string;
    product_id?: string;
    session_id?: string;
  };

  // Validate required fields — requirement 12.1
  if (!guide_id || typeof guide_id !== 'string' || guide_id.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'guide_id is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  if (!product_id || typeof product_id !== 'string' || product_id.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'product_id is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // session_id is optional but recommended; default to empty string if absent
  const resolvedSessionId =
    typeof session_id === 'string' && session_id.trim() !== '' ? session_id.trim() : '';

  try {
    // Write only the allowed fields — no PII — requirement 12.1, 12.4
    await adminDb.collection('size_guide_views').add({
      guide_id: guide_id.trim(),
      product_id: product_id.trim(),
      session_id: resolvedSessionId,
      viewed_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('[size-guide-analytics/views POST] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record view event', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
