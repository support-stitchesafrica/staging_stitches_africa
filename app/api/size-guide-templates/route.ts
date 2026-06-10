import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// ─── Auth helper ─────────────────────────────────────────────────────────────

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

// ─── GET /api/size-guide-templates ───────────────────────────────────────────
// Returns all predefined size guide templates from the `size_guide_templates`
// collection. Any authenticated user (vendor, admin) may read templates.
//
// Requirements: 11.1, 11.4, 13.4

export async function GET(request: NextRequest) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const snapshot = await adminDb
      .collection('size_guide_templates')
      .orderBy('created_at', 'desc')
      .get();

    const templates = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() ?? null,
        updated_at: data.updated_at?.toDate?.()?.toISOString() ?? null,
      };
    });

    return NextResponse.json({ success: true, templates });
  } catch (error: any) {
    console.error('[size-guide-templates GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch size guide templates', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
