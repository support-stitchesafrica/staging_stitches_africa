/**
 * Copy a single prod user (vendor and/or customer) into staging Firestore + Auth.
 *
 * Preserves prod UID in staging so orders, wallet, and subcollections stay aligned.
 * Staging Auth uses a sandbox email — never the real prod address.
 * Strips bank / payout provider links; keeps wallet balances and transaction docs.
 *
 *   npm run staging:clone-user -- --confirm --uid=PROD_UID
 *   PowerShell: npm run staging:clone-user -- --confirm --uid=PROD_UID
 */
import './load-env';
import { type DocumentData, type DocumentReference, type Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import { getAppEnv } from '@/lib/env';
import { getStagingPassword } from './seed-constants';
import { assertProdReadOnlyProject, initDualFirebase } from './dual-firebase';
import {
  cloneAuthEmail,
  cloneDocEmail,
  sanitizeAddressForStaging,
  sanitizeOrderLineForStaging,
  sanitizeTailorForStaging,
  sanitizeUserForStaging,
  sanitizeVendorInboundOrderForStaging,
  tailorBankFieldDeletes,
  type CloneMeta,
} from './clone-sanitize';

const BATCH_SIZE = 400;

type UserRole = 'vendor' | 'customer' | 'both';
type IncludeKey = 'products' | 'orders' | 'wallet' | 'addresses' | 'all-orders' | 'vvip';

interface CloneArgs {
  uid?: string;
  email?: string;
  role: UserRole | 'auto';
  syncAuth: boolean;
  confirm: boolean;
  include: Set<IncludeKey>;
}

function parseArgs(): CloneArgs {
  const argv = process.argv.slice(2);
  let uid: string | undefined;
  let email: string | undefined;
  let role: CloneArgs['role'] = 'auto';
  let syncAuth = true;
  let confirm = process.env.CONFIRM_PROD_TO_STAGING_COPY === 'yes';
  const include = new Set<IncludeKey>(['orders', 'wallet', 'addresses', 'all-orders', 'vvip']);

  for (const arg of argv) {
    if (arg.startsWith('--uid=')) uid = arg.slice(6).trim();
    else if (arg.startsWith('--email=')) email = arg.slice(8).trim();
    else if (arg.startsWith('--role=')) role = arg.slice(7).trim() as CloneArgs['role'];
    else if (arg === '--no-auth') syncAuth = false;
    else if (arg === '--confirm') confirm = true;
    else if (arg.startsWith('--include=')) {
      include.clear();
      for (const part of arg.slice(10).split(',')) {
        const key = part.trim() as IncludeKey;
        if (key) include.add(key);
      }
    } else if (arg.startsWith('--exclude=')) {
      for (const part of arg.slice(10).split(',')) {
        include.delete(part.trim() as IncludeKey);
      }
    }
  }

  if (!uid && !email) {
    console.error(
      'Usage: npm run staging:clone-user -- --uid=PROD_UID\n' +
        '       npm run staging:clone-user -- --email=prod@example.com\n' +
        'Options: --confirm  --role=auto|vendor|customer|both  --no-auth  --include=products,orders,wallet,addresses,all-orders,vvip',
    );
    process.exit(1);
  }

  return { uid, email, role, syncAuth, confirm, include };
}

async function resolveUid(prodAuth: Auth, uid?: string, email?: string): Promise<string> {
  if (uid) return uid;
  const record = await prodAuth.getUserByEmail(email!);
  return record.uid;
}

async function detectRole(prodDb: Firestore, uid: string): Promise<UserRole> {
  const [tailorSnap, userSnap] = await Promise.all([
    prodDb.collection('tailors').doc(uid).get(),
    prodDb.collection('users').doc(uid).get(),
  ]);

  const isVendor =
    tailorSnap.exists ||
    (userSnap.exists && (userSnap.data()?.isTailor === true || userSnap.data()?.is_tailor === true));

  const hasCustomerData =
    userSnap.exists ||
    (await prodDb.collection('users_orders').doc(uid).collection('user_orders').limit(1).get()).size > 0;

  if (isVendor && hasCustomerData) return 'both';
  if (isVendor) return 'vendor';
  if (hasCustomerData) return 'customer';

  throw new Error(
    `[clone] No tailor or customer data found for uid "${uid}" in prod. Pass --role=vendor or --customer explicitly.`,
  );
}

async function commitBatches(
  stagingDb: Firestore,
  writes: Array<{ ref: DocumentReference; data: DocumentData }>,
) {
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const batch = stagingDb.batch();
    for (const { ref, data } of writes.slice(i, i + BATCH_SIZE)) {
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
    console.log(`  wrote ${Math.min(i + BATCH_SIZE, writes.length)} / ${writes.length} docs`);
  }
}

async function copySubcollection(
  prodDb: Firestore,
  stagingDb: Firestore,
  collectionPath: string,
  transform?: (data: DocumentData, docId: string) => DocumentData,
): Promise<number> {
  const snap = await prodDb.collection(collectionPath).get();
  if (snap.empty) return 0;

  const writes = snap.docs.map((doc) => ({
    ref: stagingDb.collection(collectionPath).doc(doc.id),
    data: transform ? transform(doc.data(), doc.id) : doc.data(),
  }));

  await commitBatches(stagingDb, writes);
  return snap.size;
}

async function ensureStagingAuthUser(opts: {
  stagingAuth: Auth;
  prodAuth: Auth;
  uid: string;
  password: string;
}): Promise<{ stagingEmail: string; prodEmail: string | null }> {
  const stagingEmail = cloneAuthEmail(opts.uid);

  let prodEmail: string | null = null;
  let displayName = 'Cloned User';

  try {
    const prodUser = await opts.prodAuth.getUser(opts.uid);
    prodEmail = prodUser.email ?? null;
    if (prodUser.displayName) displayName = prodUser.displayName;
  } catch {
    // prod Auth user may not exist for very old accounts
  }

  try {
    await opts.stagingAuth.getUser(opts.uid);
    await opts.stagingAuth.updateUser(opts.uid, {
      email: stagingEmail,
      password: opts.password,
      emailVerified: true,
      displayName,
    });
    console.log(`  auth: updated ${stagingEmail} (uid preserved)`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/user-not-found') {
      await opts.stagingAuth.createUser({
        uid: opts.uid,
        email: stagingEmail,
        password: opts.password,
        emailVerified: true,
        displayName,
      });
      console.log(`  auth: created ${stagingEmail} (uid preserved)`);
    } else {
      throw err;
    }
  }

  return { stagingEmail, prodEmail };
}

async function cloneVendorProfile(
  prodDb: Firestore,
  stagingDb: Firestore,
  uid: string,
  meta: CloneMeta,
  stagingEmail: string,
): Promise<boolean> {
  const snap = await prodDb.collection('tailors').doc(uid).get();
  if (!snap.exists) return false;

  const sanitized = sanitizeTailorForStaging(snap.data()!, meta, cloneDocEmail(uid));
  await stagingDb
    .collection('tailors')
    .doc(uid)
    .set({ ...sanitized, ...tailorBankFieldDeletes() }, { merge: true });

  const localSnap = await prodDb.collection('tailors_local').doc(uid).get();
  if (localSnap.exists) {
    await stagingDb
      .collection('tailors_local')
      .doc(uid)
      .set(
        {
          ...sanitizeTailorForStaging(localSnap.data()!, meta, cloneDocEmail(uid)),
          ...tailorBankFieldDeletes(),
        },
        { merge: true },
      );
  }

  console.log(`  tailors/${uid}`);
  return true;
}

async function cloneUserProfile(
  prodDb: Firestore,
  stagingDb: Firestore,
  uid: string,
  meta: CloneMeta,
  stagingEmail: string,
): Promise<boolean> {
  const snap = await prodDb.collection('users').doc(uid).get();
  if (!snap.exists) return false;

  await stagingDb
    .collection('users')
    .doc(uid)
    .set(sanitizeUserForStaging(snap.data()!, meta, stagingEmail), { merge: true });

  console.log(`  users/${uid}`);
  return true;
}

async function cloneProducts(
  prodDb: Firestore,
  stagingDb: Firestore,
  uid: string,
): Promise<number> {
  const snap = await prodDb.collection('tailor_works').where('tailor_id', '==', uid).get();
  if (snap.empty) {
    console.log('  tailor_works: none');
    return 0;
  }

  let sizeCount = 0;
  for (const doc of snap.docs) {
    await stagingDb.collection('tailor_works').doc(doc.id).set(doc.data(), { merge: true });

    const sizesSnap = await prodDb.collection('tailor_works').doc(doc.id).collection('sizes').get();
    if (!sizesSnap.empty) {
      const writes = sizesSnap.docs.map((s) => ({
        ref: stagingDb.collection('tailor_works').doc(doc.id).collection('sizes').doc(s.id),
        data: s.data(),
      }));
      await commitBatches(stagingDb, writes);
      sizeCount += sizesSnap.size;
    }
  }

  console.log(`  tailor_works: ${snap.size} products (${sizeCount} size docs)`);
  return snap.size;
}

async function cloneVendorOrdersAndWallet(
  prodDb: Firestore,
  stagingDb: Firestore,
  uid: string,
  include: Set<IncludeKey>,
): Promise<void> {
  if (include.has('wallet')) {
    const txCount = await copySubcollection(prodDb, stagingDb, `tailors/${uid}/transactions`);
    console.log(`  tailors/${uid}/transactions: ${txCount} (kept as-is)`);
  }

  if (include.has('orders')) {
    const orderCount = await copySubcollection(prodDb, stagingDb, `tailors/${uid}/orders`);
    console.log(`  tailors/${uid}/orders: ${orderCount}`);
  }
}

/**
 * Vendor dashboard metrics and order list read collectionGroup user_orders where tailor_id == vendor.
 * Those docs live under each customer's users_orders/{customerUid}/user_orders path.
 */
async function cloneVendorInboundOrders(
  prodDb: Firestore,
  stagingDb: Firestore,
  tailorId: string,
  meta: CloneMeta,
): Promise<string[]> {
  const productOrderRefs: string[] = [];
  const snap = await prodDb
    .collectionGroup('user_orders')
    .where('tailor_id', '==', tailorId)
    .get();

  if (snap.empty) {
    console.log(`  vendor inbound user_orders (tailor_id=${tailorId}): none`);
    return productOrderRefs;
  }

  const writes: Array<{ ref: DocumentReference; data: DocumentData }> = [];

  for (const orderDoc of snap.docs) {
    const customerUid = orderDoc.ref.parent.parent?.id;
    if (!customerUid) continue;

    const data = orderDoc.data();
    if (typeof data.product_order_ref === 'string' && data.product_order_ref.trim()) {
      productOrderRefs.push(data.product_order_ref.trim());
    }

    writes.push({
      ref: stagingDb
        .collection('users_orders')
        .doc(customerUid)
        .collection('user_orders')
        .doc(orderDoc.id),
      data: sanitizeVendorInboundOrderForStaging(
        data,
        meta,
        customerUid,
        cloneDocEmail(customerUid),
      ),
    });
  }

  await commitBatches(stagingDb, writes);
  console.log(`  vendor inbound user_orders: ${writes.length}`);
  return productOrderRefs;
}

function orderItemBelongsToTailor(item: Record<string, unknown>, tailorId: string): boolean {
  const vendor = item.vendor as { id?: string } | undefined;
  const tailor = item.tailor as { id?: string } | undefined;
  return (
    item.tailor_id === tailorId ||
    vendor?.id === tailorId ||
    tailor?.id === tailorId
  );
}

/** Approved VVIP orders that include line items for this vendor. */
async function cloneVendorVvipOrders(
  prodDb: Firestore,
  stagingDb: Firestore,
  tailorId: string,
  meta: CloneMeta,
): Promise<void> {
  const snap = await prodDb.collection('orders').where('isVvip', '==', true).get();
  const matching = snap.docs.filter((doc) => {
    const items = (doc.data().items as Record<string, unknown>[] | undefined) ?? [];
    return items.some((item) => orderItemBelongsToTailor(item, tailorId));
  });

  if (matching.length === 0) {
    console.log(`  orders (VVIP for vendor ${tailorId}): none`);
    return;
  }

  const writes = matching.map((doc) => {
    const data = doc.data();
    const customerUid = typeof data.userId === 'string' ? data.userId : '';
    const customerEmail = customerUid ? cloneDocEmail(customerUid) : cloneDocEmail(meta.prodUid);
    return {
      ref: stagingDb.collection('orders').doc(doc.id),
      data: {
        ...data,
        user_email: customerEmail,
        ...(customerUid ? { userId: customerUid } : {}),
        _clonedFrom: meta,
        _stagingClone: true,
      },
    };
  });

  await commitBatches(stagingDb, writes);
  console.log(`  orders (VVIP for vendor): ${writes.length}`);
}

async function cloneCustomerOrders(
  prodDb: Firestore,
  stagingDb: Firestore,
  uid: string,
  meta: CloneMeta,
  stagingEmail: string,
  include: Set<IncludeKey>,
): Promise<string[]> {
  if (!include.has('orders')) return [];

  const productOrderRefs: string[] = [];
  const snap = await prodDb.collection('users_orders').doc(uid).collection('user_orders').get();

  if (snap.empty) {
    console.log(`  users_orders/${uid}/user_orders: none`);
    return productOrderRefs;
  }

  const writes = snap.docs.map((doc) => {
    const data = doc.data();
    if (typeof data.product_order_ref === 'string') {
      productOrderRefs.push(data.product_order_ref);
    }
    return {
      ref: stagingDb.collection('users_orders').doc(uid).collection('user_orders').doc(doc.id),
      data: sanitizeOrderLineForStaging(data, meta, stagingEmail),
    };
  });

  await commitBatches(stagingDb, writes);
  console.log(`  users_orders/${uid}/user_orders: ${snap.size}`);
  return productOrderRefs;
}

async function cloneAllOrderMirrors(
  prodDb: Firestore,
  stagingDb: Firestore,
  productOrderRefs: string[],
): Promise<void> {
  const unique = [...new Set(productOrderRefs.filter(Boolean))];
  if (unique.length === 0) return;

  let copied = 0;
  for (const refId of unique) {
    const snap = await prodDb.collection('all_orders').doc(refId).get();
    if (!snap.exists) continue;
    await stagingDb.collection('all_orders').doc(refId).set(snap.data()!, { merge: true });
    copied++;
  }
  console.log(`  all_orders: ${copied} mirror docs`);
}

async function cloneVvipOrders(
  prodDb: Firestore,
  stagingDb: Firestore,
  uid: string,
  meta: CloneMeta,
  stagingEmail: string,
): Promise<void> {
  const snap = await prodDb.collection('orders').where('userId', '==', uid).get();
  if (snap.empty) {
    console.log('  orders (VVIP): none');
    return;
  }

  const writes = snap.docs.map((doc) => {
    const data = doc.data();
    return {
      ref: stagingDb.collection('orders').doc(doc.id),
      data: {
        ...data,
        user_email: stagingEmail,
        userId: uid,
        _clonedFrom: meta,
        _stagingClone: true,
      },
    };
  });

  await commitBatches(stagingDb, writes);
  console.log(`  orders (VVIP): ${snap.size}`);
}

async function cloneAddresses(
  prodDb: Firestore,
  stagingDb: Firestore,
  uid: string,
  stagingEmail: string,
): Promise<void> {
  const count = await copySubcollection(
    prodDb,
    stagingDb,
    `users_addresses/${uid}/user_addresses`,
    (data) => sanitizeAddressForStaging(data, stagingEmail),
  );
  console.log(`  users_addresses/${uid}/user_addresses: ${count}`);
}

async function main() {
  const args = parseArgs();

  if (!args.confirm) {
    console.error(
      '\nRefusing to run without confirmation.\n' +
        '  PowerShell: npm run staging:clone-user -- --confirm --uid=YOUR_PROD_UID\n' +
        '  Bash:       CONFIRM_PROD_TO_STAGING_COPY=yes npm run staging:clone-user -- --uid=YOUR_PROD_UID\n',
    );
    process.exit(1);
  }

  const password =
    process.env.STAGING_CLONE_PASSWORD?.trim() ||
    process.env.STAGING_SEED_PASSWORD?.trim() ||
    getStagingPassword();

  const { prodProjectId, stagingProjectId, prodDb, prodAuth, stagingDb, stagingAuth } =
    initDualFirebase();

  assertProdReadOnlyProject(prodProjectId);

  const uid = await resolveUid(prodAuth, args.uid, args.email);
  const role = args.role === 'auto' ? await detectRole(prodDb, uid) : args.role;

  if (role === 'vendor' || role === 'both') {
    args.include.add('products');
  }

  console.log(`\nClone prod → staging (APP_ENV=${getAppEnv()})`);
  console.log(`  prod:    ${prodProjectId}`);
  console.log(`  staging: ${stagingProjectId}`);
  console.log(`  uid:     ${uid}`);
  console.log(`  role:    ${role}`);
  console.log(`  include: ${[...args.include].join(', ') || '(none)'}`);

  const meta: CloneMeta = {
    prodProjectId,
    prodUid: uid,
    clonedAt: new Date().toISOString(),
  };

  let stagingEmail = cloneDocEmail(uid);
  let prodEmailFromAuth: string | null = null;

  if (args.syncAuth) {
    console.log('\n--- Staging Auth (uid preserved, sandbox email) ---');
    const authResult = await ensureStagingAuthUser({
      stagingAuth,
      prodAuth,
      uid,
      password,
    });
    stagingEmail = authResult.stagingEmail;
    prodEmailFromAuth = authResult.prodEmail;
    meta.clonedFromEmail = authResult.prodEmail;
  }

  let productOrderRefs: string[] = [];

  if (role === 'vendor' || role === 'both') {
    console.log('\n--- Vendor Firestore ---');
    await cloneVendorProfile(prodDb, stagingDb, uid, meta, stagingEmail);
    await cloneUserProfile(prodDb, stagingDb, uid, meta, stagingEmail);

    if (args.include.has('products')) {
      await cloneProducts(prodDb, stagingDb, uid);
    }
    await cloneVendorOrdersAndWallet(prodDb, stagingDb, uid, args.include);

    if (args.include.has('orders')) {
      const inboundRefs = await cloneVendorInboundOrders(prodDb, stagingDb, uid, meta);
      productOrderRefs.push(...inboundRefs);
    }

    if (args.include.has('vvip')) {
      console.log('\n--- VVIP (vendor lines) ---');
      await cloneVendorVvipOrders(prodDb, stagingDb, uid, meta);
    }
  }
  if (role === 'customer' || role === 'both') {
    console.log('\n--- Customer Firestore ---');
    await cloneUserProfile(prodDb, stagingDb, uid, meta, stagingEmail);

    if (args.include.has('addresses')) {
      await cloneAddresses(prodDb, stagingDb, uid, stagingEmail);
    }

    productOrderRefs = await cloneCustomerOrders(
      prodDb,
      stagingDb,
      uid,
      meta,
      stagingEmail,
      args.include,
    );

    const measurements = await prodDb.collection('user_measurements').doc(uid).get();
    if (measurements.exists) {
      await stagingDb.collection('user_measurements').doc(uid).set(measurements.data()!, { merge: true });
      console.log(`  user_measurements/${uid}`);
    }

    const referral = await prodDb.collection('referralUsers').doc(uid).get();
    if (referral.exists) {
      const refData = referral.data()!;
      await stagingDb
        .collection('referralUsers')
        .doc(uid)
        .set(
          {
            ...refData,
            email: stagingEmail,
            fullName: refData.fullName ?? 'Cloned User',
            _clonedFrom: meta,
            _stagingClone: true,
          },
          { merge: true },
        );
      console.log(`  referralUsers/${uid}`);
    }
  }

  if (args.include.has('all-orders') && productOrderRefs.length > 0) {
    console.log('\n--- Order mirrors ---');
    await cloneAllOrderMirrors(prodDb, stagingDb, productOrderRefs);
  }

  if (args.include.has('vvip') && (role === 'customer' || role === 'both')) {
    console.log('\n--- VVIP (customer) ---');
    await cloneVvipOrders(prodDb, stagingDb, uid, meta, stagingEmail);
  }

  console.log('\n========================================');
  console.log('Clone complete');
  console.log('========================================');
  console.log(`UID (same as prod): ${uid}`);

  if (args.syncAuth) {
    console.log(`Password: ${password}`);
    console.log(`Login email: ${stagingEmail}`);
    if (prodEmailFromAuth) {
      console.log(`  (prod email was: ${prodEmailFromAuth} — not registered in staging Auth)`);
    }
    if (role === 'vendor' || role === 'both') console.log('  Vendor portal → /vendor');
    if (role === 'customer' || role === 'both') console.log('  Shop login    → /shops/auth');
  } else {
    console.log('Auth: skipped (--no-auth). Firestore data copied only.');
  }

  console.log('\nBank / payout provider fields stripped. Wallet balances + transactions kept.');
  console.log('========================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
