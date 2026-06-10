import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import {
  EMPLOYEE_INTEREST_OPTIONS,
  SALARY_BAND_OPTIONS,
  SALARY_BANK_OPTIONS,
  STAFF_STRENGTH_OPTIONS,
  WAITLIST_FORM_VERSION,
  computeLeadScore,
  getGeoZoneFromState,
  isValidIndustryForPhase,
  type IndustryPhase,
} from '@/lib/waitlist/crl-employee-waitlist';

const COLLECTION = 'bnpl_waitlist_signups';

const OTHER_BANK = 'Other (specify below)';

function normalizePhone(raw: string): string {
  return raw.replace(/\s+/g, '').trim();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * POST /api/waitlist/bnpl-signup
 * Public signup for CRL × Stitches employee lifestyle waitlist (server-side Firestore write).
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const rawFv = body.formVersion;
  const isLegacy =
    rawFv === 1 ||
    rawFv === '1' ||
    (rawFv == null &&
      String(body.bankCode ?? '').trim().length > 0 &&
      !String(body.companyName ?? '').trim());

  // Legacy v1 (optional backward compatibility)
  if (isLegacy) {
    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();
    const bankCode = String(body.bankCode ?? '').trim();
    const bankName = String(body.bankName ?? '').trim();
    const position = String(body.position ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const phone = normalizePhone(String(body.phone ?? ''));

    if (!firstName || firstName.length > 80) {
      return NextResponse.json({ success: false, error: 'First name is required' }, { status: 400 });
    }
    if (!lastName || lastName.length > 80) {
      return NextResponse.json({ success: false, error: 'Last name is required' }, { status: 400 });
    }
    if (!bankCode || !bankName) {
      return NextResponse.json({ success: false, error: 'Please select your bank' }, { status: 400 });
    }
    if (!position || position.length > 160) {
      return NextResponse.json({ success: false, error: 'Position is required' }, { status: 400 });
    }
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
    }
    if (phone.length < 10 || phone.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid phone number' },
        { status: 400 },
      );
    }

    try {
      await adminDb.collection(COLLECTION).add({
        formVersion: 1,
        firstName,
        lastName,
        bankCode,
        bankName,
        position,
        email,
        phone,
        createdAt: FieldValue.serverTimestamp(),
        source: 'waitlist_bnpl',
      });
      return NextResponse.json({ success: true, message: "You're on the list." });
    } catch (err) {
      console.error('[bnpl-signup]', err);
      return NextResponse.json(
        { success: false, error: 'Could not save your details. Please try again.' },
        { status: 500 },
      );
    }
  }

  const industryPhase = String(body.industryPhase ?? '').trim() as IndustryPhase;
  const industry = String(body.industry ?? '').trim();
  const companyName = String(body.companyName ?? '').trim();
  const staffStrength = String(body.staffStrength ?? '').trim();
  const salaryBand = String(body.salaryBand ?? '').trim();
  const hrAdminContact = String(body.hrAdminContact ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = normalizePhone(String(body.phone ?? ''));
  const state = String(body.state ?? '').trim();
  let salaryBank = String(body.salaryBank ?? '').trim();
  const salaryBankOther = String(body.salaryBankOther ?? '').trim();
  const rawInterests = body.employeeInterests;

  if (industryPhase !== 'phase_1' && industryPhase !== 'phase_2') {
    return NextResponse.json(
      { success: false, error: 'Please select industry phase' },
      { status: 400 },
    );
  }
  if (!industry || !isValidIndustryForPhase(industryPhase, industry)) {
    return NextResponse.json(
      { success: false, error: 'Please select a valid industry for the chosen phase' },
      { status: 400 },
    );
  }
  if (!companyName || companyName.length < 2 || companyName.length > 200) {
    return NextResponse.json(
      { success: false, error: 'Company name is required (2–200 characters)' },
      { status: 400 },
    );
  }
  if (!STAFF_STRENGTH_OPTIONS.includes(staffStrength as (typeof STAFF_STRENGTH_OPTIONS)[number])) {
    return NextResponse.json(
      { success: false, error: 'Please select staff strength' },
      { status: 400 },
    );
  }
  if (!SALARY_BAND_OPTIONS.includes(salaryBand as (typeof SALARY_BAND_OPTIONS)[number])) {
    return NextResponse.json(
      { success: false, error: 'Please select average salary band' },
      { status: 400 },
    );
  }
  if (!hrAdminContact || hrAdminContact.length < 2 || hrAdminContact.length > 160) {
    return NextResponse.json(
      { success: false, error: 'HR / Admin contact name is required' },
      { status: 400 },
    );
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ success: false, error: 'Valid email is required' }, { status: 400 });
  }
  if (phone.length < 10 || phone.length > 20) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid phone number' },
      { status: 400 },
    );
  }
  if (!state) {
    return NextResponse.json({ success: false, error: 'Please select location (state)' }, { status: 400 });
  }

  if (!SALARY_BANK_OPTIONS.includes(salaryBank as (typeof SALARY_BANK_OPTIONS)[number])) {
    return NextResponse.json(
      { success: false, error: 'Please select salary bank' },
      { status: 400 },
    );
  }
  if (salaryBank === OTHER_BANK) {
    if (!salaryBankOther || salaryBankOther.length < 2 || salaryBankOther.length > 120) {
      return NextResponse.json(
        { success: false, error: 'Please specify your salary bank' },
        { status: 400 },
      );
    }
    salaryBank = `Other: ${salaryBankOther}`;
  }

  const interestSet = new Set<string>();
  if (Array.isArray(rawInterests)) {
    for (const x of rawInterests) {
      const s = String(x).trim();
      if ((EMPLOYEE_INTEREST_OPTIONS as readonly string[]).includes(s)) {
        interestSet.add(s);
      }
    }
  }
  const employeeInterests = [...interestSet].sort((a, b) => a.localeCompare(b));
  if (employeeInterests.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Select at least one employee interest' },
      { status: 400 },
    );
  }

  const geoZone = getGeoZoneFromState(state);
  const industryTier = industryPhase;
  const leadScore = computeLeadScore(staffStrength, employeeInterests.length);
  const interestFingerprint = employeeInterests.join('|').toLowerCase();

  try {
    await adminDb.collection(COLLECTION).add({
      formVersion: WAITLIST_FORM_VERSION,
      industryPhase,
      industry,
      companyName,
      companyNameLower: companyName.toLowerCase(),
      staffStrength,
      salaryBand,
      hrAdminContact,
      email,
      phone,
      state,
      salaryBank,
      employeeInterests,
      interestCount: employeeInterests.length,
      interestFingerprint,
      geoZone,
      industryTier,
      leadScore,
      createdAt: FieldValue.serverTimestamp(),
      source: 'waitlist_crl_employee_lifestyle',
    });

    return NextResponse.json({ success: true, message: "You're on the list." });
  } catch (err) {
    console.error('[bnpl-signup]', err);
    return NextResponse.json(
      { success: false, error: 'Could not save your details. Please try again.' },
      { status: 500 },
    );
  }
}
