/**
 * Sanitize cloned production data in the staging Firebase project.
 *
 * Run after importing a prod Firestore export into stitches-africa-dev:
 *   npm run staging:sanitize
 *
 * Requires .env.staging with staging FIREBASE_SERVICE_ACCOUNT_KEY_BASE64.
 */
import './load-env';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { assertSeedSafeProject, getAppEnv } from '@/lib/env';

const BATCH_SIZE = 400;

function stagingEmail(docId: string, prefix = 'user'): string {
  return `${prefix}+staging-${docId.slice(0, 12)}@staging.stitchesafrica.test`;
}

async function commitBatches(
  updates: Array<{ ref: DocumentReference; data: Record<string, unknown> }>,
) {
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = adminDb.batch();
    for (const { ref, data } of updates.slice(i, i + BATCH_SIZE)) {
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
    console.log(`  committed ${Math.min(i + BATCH_SIZE, updates.length)} / ${updates.length}`);
  }
}

async function sanitizeUsers() {
  console.log('\n--- users ---');
  const snap = await adminDb.collection('users').get();
  const updates = snap.docs.map((doc) => ({
    ref: doc.ref,
    data: {
      email: stagingEmail(doc.id),
      phone_number: '+0000000000',
      _stagingSanitized: true,
      _stagingSanitizedAt: FieldValue.serverTimestamp(),
    },
  }));
  await commitBatches(updates);
  console.log(`sanitized ${updates.length} users`);
}

async function sanitizeTailors() {
  console.log('\n--- tailors ---');
  const snap = await adminDb.collection('tailors').get();
  const updates = snap.docs.map((doc) => ({
    ref: doc.ref,
    data: {
      email: stagingEmail(doc.id, 'vendor'),
      phone_number: '+0000000000',
      stripe_account_id: FieldValue.delete(),
      paystack_subaccount_code: FieldValue.delete(),
      flutterwave_subaccount_id: FieldValue.delete(),
      bank_account_number: FieldValue.delete(),
      bank_code: FieldValue.delete(),
      wallet_balance: 0,
      wallet_by_provider: FieldValue.delete(),
      _stagingSanitized: true,
      _stagingSanitizedAt: FieldValue.serverTimestamp(),
    },
  }));
  await commitBatches(updates);
  console.log(`sanitized ${updates.length} tailors`);
}

async function sanitizeUserOrders() {
  console.log('\n--- users_orders/*/user_orders ---');
  const snap = await adminDb.collectionGroup('user_orders').get();
  const updates = snap.docs.map((doc) => {
    const data = doc.data();
    const addr = data.user_address || {};
    return {
      ref: doc.ref,
      data: {
        user_address: {
          ...addr,
          user_email: stagingEmail(doc.id, 'order'),
          phone_number: '+0000000000',
        },
        payment_status: data.payment_status === 'paid' ? 'paid' : 'unpaid',
        _stagingSanitized: true,
      },
    };
  });
  await commitBatches(updates);
  console.log(`sanitized ${updates.length} user_orders line items`);
}

async function sanitizeTopLevelOrders() {
  console.log('\n--- orders (VVIP) ---');
  const snap = await adminDb.collection('orders').where('isVvip', '==', true).get();
  const updates = snap.docs.map((doc) => ({
    ref: doc.ref,
    data: {
      user_email: stagingEmail(doc.id, 'vvip'),
      _stagingSanitized: true,
    },
  }));
  await commitBatches(updates);
  console.log(`sanitized ${updates.length} VVIP orders`);
}

async function main() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required');
  }

  assertSeedSafeProject(projectId);
  console.log(`Sanitizing Firestore project: ${projectId} (APP_ENV=${getAppEnv()})`);

  if (process.env.CONFIRM_STAGING_SANITIZE !== 'yes') {
    console.error(
      '\nRefusing to run without CONFIRM_STAGING_SANITIZE=yes\n' +
        'Example: CONFIRM_STAGING_SANITIZE=yes npm run staging:sanitize',
    );
    process.exit(1);
  }

  await sanitizeUsers();
  await sanitizeTailors();
  await sanitizeUserOrders();
  await sanitizeTopLevelOrders();

  console.log('\nDone. Review staging Auth users separately (export/import or test accounts).');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
