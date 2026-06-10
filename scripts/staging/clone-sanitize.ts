import { FieldValue } from 'firebase-admin/firestore';

export const CLONE_EMAIL_DOMAIN = 'staging.stitchesafrica.test';

/** Staging Auth email — never the real prod address. One email per uid. */
export function cloneAuthEmail(uid: string): string {
  return `clone+${uid.slice(0, 12)}@${CLONE_EMAIL_DOMAIN}`;
}

/** Firestore-facing sandbox email (can match Auth email). */
export function cloneDocEmail(uid: string): string {
  return cloneAuthEmail(uid);
}

const BANK_AND_PAYOUT_PROVIDER_KEYS = [
  'stripe_account_id',
  'stripeAccountId',
  'stripe_connect_account_id',
  'paystack_subaccount_code',
  'paystackSubaccount',
  'paystackSplitCode',
  'paystackSplitAdded',
  'paystack_split_code',
  'flutterwave_subaccount_id',
  'flutterwaveSubaccount',
  'bank_account_number',
  'bank_code',
  'bank_name',
  'account_number',
  'account_name',
  'bvn',
  'bank_details',
  'payout_bank',
  'subaccount_code',
  'subaccount_id',
] as const;

function stripKeys(obj: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const out = { ...obj };
  for (const key of keys) {
    if (key in out) {
      delete out[key];
    }
  }
  return out;
}

export interface CloneMeta {
  prodProjectId: string;
  prodUid: string;
  clonedAt: string;
  clonedFromEmail?: string | null;
}

export function withCloneMeta(
  data: Record<string, unknown>,
  meta: CloneMeta,
): Record<string, unknown> {
  return {
    ...data,
    _clonedFrom: {
      projectId: meta.prodProjectId,
      uid: meta.prodUid,
      email: meta.clonedFromEmail ?? null,
      clonedAt: meta.clonedAt,
    },
    _stagingClone: true,
  };
}

/** Remove bank / live payout provider links; keep wallet balances and transaction history. */
export function sanitizeTailorForStaging(
  data: Record<string, unknown>,
  meta: CloneMeta,
  stagingEmail: string,
): Record<string, unknown> {
  let doc = stripKeys(data, BANK_AND_PAYOUT_PROVIDER_KEYS);

  doc = {
    ...doc,
    email: stagingEmail,
    phone_number: doc.phone_number ?? '+0000000000',
  };

  const info = doc.tailor_registered_info as Record<string, unknown> | undefined;
  if (info && typeof info === 'object') {
    doc.tailor_registered_info = {
      ...info,
      email: stagingEmail,
      id: meta.prodUid,
    };
  }

  return withCloneMeta(doc, meta);
}

export function sanitizeUserForStaging(
  data: Record<string, unknown>,
  meta: CloneMeta,
  stagingEmail: string,
): Record<string, unknown> {
  return withCloneMeta(
    {
      ...data,
      email: stagingEmail,
      phone_number: data.phone_number ?? data.phoneNumber ?? '+0000000000',
      uid: meta.prodUid,
    },
    meta,
  );
}

export function sanitizeOrderLineForStaging(
  data: Record<string, unknown>,
  meta: CloneMeta,
  stagingEmail: string,
): Record<string, unknown> {
  const addr = (data.user_address as Record<string, unknown> | undefined) ?? {};
  return withCloneMeta(
    {
      ...data,
      user_id: meta.prodUid,
      user_address: {
        ...addr,
        user_email: stagingEmail,
        phone_number: '+0000000000',
      },
    },
    meta,
  );
}

/** Order line copied for a vendor — lives under the customer's users_orders path. */
export function sanitizeVendorInboundOrderForStaging(
  data: Record<string, unknown>,
  meta: CloneMeta,
  customerUid: string,
  customerStagingEmail: string,
): Record<string, unknown> {
  const addr = (data.user_address as Record<string, unknown> | undefined) ?? {};
  return withCloneMeta(
    {
      ...data,
      user_id: customerUid,
      tailor_id: meta.prodUid,
      user_address: {
        ...addr,
        user_email: customerStagingEmail,
        phone_number: '+0000000000',
      },
    },
    meta,
  );
}

export function sanitizeAddressForStaging(
  data: Record<string, unknown>,
  stagingEmail: string,
): Record<string, unknown> {
  return {
    ...data,
    user_email: stagingEmail,
    email: stagingEmail,
    phone_number: '+0000000000',
  };
}

/** Fields explicitly removed after copy (Firestore delete on merge). */
export function tailorBankFieldDeletes(): Record<string, unknown> {
  const deletes: Record<string, unknown> = {};
  for (const key of BANK_AND_PAYOUT_PROVIDER_KEYS) {
    deletes[key] = FieldValue.delete();
  }
  return deletes;
}
