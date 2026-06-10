import { NextRequest, NextResponse } from 'next/server';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { authenticateRequest, hasRole } from '@/lib/marketing/auth-middleware';
import type { BnplSignupSerialized } from '@/lib/waitlist/bnpl-signup-types';

const COLLECTION = 'bnpl_waitlist_signups';
const MAX_LIMIT = 500;

const ALLOWED_ROLES = ['super_admin', 'team_lead', 'bdm'] as const;

function tsToIso(c: unknown): string | null {
  if (c && typeof (c as { toDate?: () => Date }).toDate === 'function') {
    return (c as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

function serializeDoc(doc: QueryDocumentSnapshot): BnplSignupSerialized {
  const d = doc.data();
  const fv = typeof d.formVersion === 'number' ? d.formVersion : 1;
  const createdAt = tsToIso(d.createdAt);

  if (fv >= 2) {
    const interests = Array.isArray(d.employeeInterests)
      ? d.employeeInterests.map((x: unknown) => String(x))
      : [];
    return {
      id: doc.id,
      formVersion: fv,
      createdAt,
      source: String(d.source ?? ''),
      firstName: '',
      lastName: '',
      bankCode: '',
      bankName: '',
      position: '',
      email: String(d.email ?? ''),
      phone: String(d.phone ?? ''),
      industryPhase: String(d.industryPhase ?? ''),
      industry: String(d.industry ?? ''),
      companyName: String(d.companyName ?? ''),
      staffStrength: String(d.staffStrength ?? ''),
      salaryBand: String(d.salaryBand ?? ''),
      hrAdminContact: String(d.hrAdminContact ?? ''),
      state: String(d.state ?? ''),
      salaryBank: String(d.salaryBank ?? ''),
      employeeInterests: interests,
      geoZone: String(d.geoZone ?? ''),
      industryTier: String(d.industryTier ?? ''),
      leadScore: typeof d.leadScore === 'number' ? d.leadScore : 0,
      interestCount: typeof d.interestCount === 'number' ? d.interestCount : interests.length,
    };
  }

  return {
    id: doc.id,
    formVersion: 1,
    createdAt,
    source: String(d.source ?? ''),
    firstName: String(d.firstName ?? ''),
    lastName: String(d.lastName ?? ''),
    bankCode: String(d.bankCode ?? ''),
    bankName: String(d.bankName ?? ''),
    position: String(d.position ?? ''),
    email: String(d.email ?? ''),
    phone: String(d.phone ?? ''),
    industryPhase: '',
    industry: '',
    companyName: '',
    staffStrength: '',
    salaryBand: '',
    hrAdminContact: '',
    state: '',
    salaryBank: '',
    employeeInterests: [],
    geoZone: '',
    industryTier: '',
    leadScore: 0,
    interestCount: 0,
  };
}

function distinctSorted(values: (string | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => typeof v === 'string' && v.trim().length > 0))].sort(
    (a, b) => a.localeCompare(b),
  );
}

/**
 * GET /api/marketing/bnpl-waitlist?bankName=...&state=...&industry=...
 * Lists BNPL / CRL waitlist signups for marketing (auth required).
 */
export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  if (!hasRole(user, ...ALLOWED_ROLES)) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const bankName = searchParams.get('bankName')?.trim() || '';
  const state = searchParams.get('state')?.trim() || '';
  const industry = searchParams.get('industry')?.trim() || '';
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') || '500', 10) || 500, 1),
    MAX_LIMIT,
  );

  try {
    const recentSnap = await adminDb
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const bankOptions = distinctSorted(
      recentSnap.docs.map((doc) => doc.data().bankName as string | undefined),
    );
    const stateOptions = distinctSorted(
      recentSnap.docs.map((doc) => doc.data().state as string | undefined),
    );
    const industryOptions = distinctSorted(
      recentSnap.docs.map((doc) => doc.data().industry as string | undefined),
    );

    let listSnap = recentSnap;

    if (bankName) {
      listSnap = await adminDb
        .collection(COLLECTION)
        .where('bankName', '==', bankName)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    } else if (state) {
      listSnap = await adminDb
        .collection(COLLECTION)
        .where('state', '==', state)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    } else if (industry) {
      listSnap = await adminDb
        .collection(COLLECTION)
        .where('industry', '==', industry)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
    }

    let signups = listSnap.docs.map(serializeDoc);

    // “Innovative” default sort: lead score (org size + engagement), then recency already from query
    signups = [...signups].sort((a, b) => {
      if (b.leadScore !== a.leadScore) return b.leadScore - a.leadScore;
      const ta = a.createdAt ?? '';
      const tb = b.createdAt ?? '';
      return tb.localeCompare(ta);
    });

    return NextResponse.json({
      success: true,
      signups,
      bankOptions,
      stateOptions,
      industryOptions,
      filter: bankName ? { type: 'bank' as const, value: bankName }
        : state
          ? { type: 'state' as const, value: state }
          : industry
            ? { type: 'industry' as const, value: industry }
            : null,
    });
  } catch (err) {
    console.error('[marketing/bnpl-waitlist]', err);
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to load BNPL waitlist signups',
      },
      { status: 500 },
    );
  }
}
