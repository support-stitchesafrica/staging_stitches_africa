import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SizeGuideCategory, MeasurementUnit, SizeRegion } from '@/types/size-guide';

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

/** Returns true if the uid belongs to a marketing admin (super_admin, team_lead, bdm) */
async function isAdmin(uid: string): Promise<boolean> {
  const doc = await adminDb.collection('marketing_users').doc(uid).get();
  if (!doc.exists) return false;
  const role = doc.data()?.role;
  return ['super_admin', 'team_lead', 'bdm'].includes(role);
}

/** Returns true if the uid belongs to a registered vendor (exists in tailors collection) */
async function isVendor(uid: string): Promise<boolean> {
  const doc = await adminDb.collection('tailors').doc(uid).get();
  return doc.exists;
}

// ─── GET /api/size-guides ─────────────────────────────────────────────────────
// Lists all size guides for the authenticated vendor.
// Requirements: 1.1, 13.1

export async function GET(request: NextRequest) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    const hasAuthHeader = !!request.headers.get('authorization');
    console.warn('[size-guides GET] 401 Unauthorized', {
      hasAuthHeader,
      bearerFormat: request.headers.get('authorization')?.startsWith('Bearer ') ?? false,
    });
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const snapshot = await adminDb
      .collection('size_guides')
      .where('vendor_id', '==', uid)
      .orderBy('created_at', 'desc')
      .get();

    const guides = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() ?? null,
      updated_at: doc.data().updated_at?.toDate?.()?.toISOString() ?? null,
      submitted_at: doc.data().submitted_at?.toDate?.()?.toISOString() ?? null,
      approved_at: doc.data().approved_at?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ success: true, guides });
  } catch (error: any) {
    console.error('[size-guides GET] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch size guides', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}

// ─── POST /api/size-guides ────────────────────────────────────────────────────
// Creates a new size guide with status='submitted' (pending review) and version=1.
// Requirements: 1.5, 5.1, 1.6, 6.1, 6.2, 13.1

export async function POST(request: NextRequest) {
  const uid = await getAuthenticatedUid(request);
  if (!uid) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  // Only vendors or admins may create size guides — requirements 13.1, 13.6
  const [adminUser, vendorUser] = await Promise.all([isAdmin(uid), isVendor(uid)]);
  if (!adminUser && !vendorUser) {
    return NextResponse.json(
      { success: false, error: 'Forbidden: only vendors or admins may create size guides', code: 'FORBIDDEN' },
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

  const {
    title,
    category,
    unit = 'CM',
    enabled_regions = [],
    rows = [],
    template_id,
    parent_guide_id,
    uploaded_file_url,
    uploaded_file_type,
    display_preference,
  } = body;

  // Validate required fields
  if (!title || typeof title !== 'string' || title.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'title is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const validCategories: SizeGuideCategory[] = [
    'Shoes', 'Shirts', 'Dresses', 'Trousers', 'Jackets',
    'Native_Wear', 'Bags', 'Kids_Wear', 'Unisex',
  ];
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json(
      { success: false, error: 'A valid category is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  // Reject empty rows — requirement 1.6
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { success: false, error: 'At least one measurement row is required', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  try {
    const now = FieldValue.serverTimestamp();
    const guideRef = adminDb.collection('size_guides').doc();

    const guideData: Record<string, any> = {
      vendor_id: uid,
      title: title.trim(),
      category,
      unit: unit as MeasurementUnit,
      enabled_regions: enabled_regions as SizeRegion[],
      status: 'submitted',
      version: 1,
      submitted_at: now,
      created_at: now,
      updated_at: now,
    };

    // Persist extra fields from multi-category payload
    if (body.category_sections) guideData.category_sections = body.category_sections;

    if (template_id) guideData.template_id = template_id;
    if (parent_guide_id) guideData.parent_guide_id = parent_guide_id;
    if (uploaded_file_url) guideData.uploaded_file_url = uploaded_file_url;
    if (uploaded_file_type) guideData.uploaded_file_type = uploaded_file_type;
    if (display_preference) guideData.display_preference = display_preference;

    // Write guide doc, rows, and approval audit record in a batch
    const batch = adminDb.batch();
    batch.set(guideRef, guideData);

    const approvalRef = adminDb.collection('size_guide_approvals').doc();
    batch.set(approvalRef, {
      guide_id: guideRef.id,
      vendor_id: uid,
      status: 'submitted',
      submitted_at: now,
    });

    for (const row of rows) {
      const rowRef = guideRef.collection('size_guide_rows').doc();
      batch.set(rowRef, {
        size_label: row.size_label ?? '',
        order: row.order ?? 0,
        measurements: row.measurements ?? {},
        regional_sizes: row.regional_sizes ?? {},
      });
    }

    await batch.commit();

    const created = (await guideRef.get()).data()!;
    return NextResponse.json(
      {
        success: true,
        guide: {
          id: guideRef.id,
          ...created,
          created_at: created.created_at?.toDate?.()?.toISOString() ?? null,
          updated_at: created.updated_at?.toDate?.()?.toISOString() ?? null,
          submitted_at: created.submitted_at?.toDate?.()?.toISOString() ?? null,
          approved_at: created.approved_at?.toDate?.()?.toISOString() ?? null,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[size-guides POST] error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create size guide', code: 'INTERNAL' },
      { status: 500 }
    );
  }
}
