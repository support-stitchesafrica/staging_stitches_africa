/**
 * Creates a single test vendor account in the staging_ collections
 * of the production Firebase project.
 *
 * Run: npx ts-node -r tsconfig-paths/register --project scripts/tsconfig.json scripts/create-staging-test-vendor.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local so Admin SDK credentials are available
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialise Admin SDK from env vars (same as the app uses)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;

  let credential: admin.credential.Credential;
  if (base64) {
    const sa = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
    credential = admin.credential.cert(sa);
  } else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    privateKey
  ) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    });
  } else {
    throw new Error(
      'Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY in .env.local',
    );
  }

  admin.initializeApp({ credential });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });
const auth = admin.auth();

// ── Credentials ────────────────────────────────────────────────────────────
const VENDOR_EMAIL = 'vendor-test@staging.stitchesafrica.test';
const VENDOR_PASSWORD = 'StagingTest123!';
const VENDOR_BRAND = 'Adire Lagos House (Staging)';
const VENDOR_DISPLAY_NAME = VENDOR_BRAND;

const LOGO = 'https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png';

async function main() {
  console.log('\n🚀 Creating staging test vendor...\n');

  // 1. Create or update Firebase Auth user
  let uid: string;
  try {
    const existing = await auth.getUserByEmail(VENDOR_EMAIL);
    uid = existing.uid;
    await auth.updateUser(uid, {
      password: VENDOR_PASSWORD,
      displayName: VENDOR_DISPLAY_NAME,
      emailVerified: true,
    });
    console.log(`✅ Auth: updated existing user (uid: ${uid})`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const user = await auth.createUser({
        email: VENDOR_EMAIL,
        password: VENDOR_PASSWORD,
        displayName: VENDOR_DISPLAY_NAME,
        emailVerified: true,
      });
      uid = user.uid;
      console.log(`✅ Auth: created new user (uid: ${uid})`);
    } else {
      throw err;
    }
  }

  // 2. Write to staging_tailors
  const tailorDoc = {
    uid,
    email: VENDOR_EMAIL,
    brandName: VENDOR_BRAND,
    brand_name: VENDOR_BRAND,
    brand_logo: LOGO,
    tailor_registered_info: {
      'first-name': 'Adire',
      'last-name': 'Lagos House',
      email: VENDOR_EMAIL,
      id: uid,
    },
    'company-verification': {
      status: 'approved',
      companyName: VENDOR_BRAND,
      registrationNumber: 'RC-STAGING-TEST',
    },
    'identity-verification': { status: 'approved', fullName: VENDOR_BRAND },
    'company-address-verification': {
      status: 'approved',
      city: 'Lagos',
      country: 'Nigeria',
      countryCode: 'NG',
      streetAddress: '12 Fashion District',
      state: 'LA',
      postCode: '100001',
    },
    type: ['ready_to_wear'],
    phone_number: '+2348000000001',
    ratings: 4.6,
    wallet: 0,
    wallet_balance: 0,
    walletDetails: { balance: 0, eligibleBalance: 0, pendingBalance: 0 },
    transactions: [],
    featured_works: [],
    hasSubaccount: false,
    isSLA: true,
    slaAcceptedAt: new Date().toISOString(),
    slaVersion: '1.0',
    status: 'approved',
    featured: false,
    yearsOfExperience: 5,
    role: 'verifier',
    isTailor: true,
    _stagingTest: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('staging_tailors').doc(uid).set(tailorDoc, { merge: true });
  console.log(`✅ Firestore: staging_tailors/${uid}`);

  // Also write to 'tailors' so the vendor dashboard (which queries tailors directly) works
  await db.collection('tailors').doc(uid).set(tailorDoc, { merge: true });
  console.log(`✅ Firestore: tailors/${uid} (for vendor dashboard)`);

  // 3. Write to staging_users AND users (loginTailor checks users collection with is_tailor field)
  const userDoc = {
    uid,
    email: VENDOR_EMAIL,
    isTailor: true,
    is_tailor: true,          // loginTailor() checks this snake_case field
    is_sub_tailor: false,
    is_general_admin: false,
    role: 'verifier',
    brand_name: VENDOR_BRAND,
    brand_logo: LOGO,
    type: ['ready_to_wear'],
    _stagingTest: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await db.collection('staging_users').doc(uid).set(userDoc, { merge: true });
  console.log(`✅ Firestore: staging_users/${uid}`);

  // Also write to the 'users' collection so loginTailor() can find the user
  await db.collection('users').doc(uid).set(userDoc, { merge: true });
  console.log(`✅ Firestore: users/${uid} (for loginTailor() lookup)`);

  // 4. Add a sample product to staging_tailor_works
  const productId = `staging-test-product-${uid.slice(0, 8)}`;
  await db.collection('staging_tailor_works').doc(productId).set(
    {
      product_id: productId,
      title: 'Adire Lagos Print Dress',
      description: 'A vibrant hand-dyed Adire dress — staging test product.',
      wear_category: 'Dresses',
      type: 'ready-to-wear',
      price: { base: 45000, currency: 'NGN' },
      source_original_price: 45000,
      source_currency: 'NGN',
      currency: 'NGN',
      tailor_id: uid,
      tailor: VENDOR_BRAND,
      images: [
        'https://ik.imagekit.io/mztf7lvnc/stitches/pexels-alpha-paul-696966661-20009925.jpg',
        'https://ik.imagekit.io/mztf7lvnc/stitches/pexels-biola-visuals-415017893-20455702.jpg',
      ],
      is_verified: true,
      status: 'active',
      availability: 'in_stock',
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      tags: ['adire', 'dress', 'staging'],
      _stagingTest: true,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`✅ Firestore: staging_tailor_works/${productId}`);

  // ── Print credentials ───────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('  STAGING TEST VENDOR CREDENTIALS');
  console.log('========================================');
  console.log(`  Email    : ${VENDOR_EMAIL}`);
  console.log(`  Password : ${VENDOR_PASSWORD}`);
  console.log(`  UID      : ${uid}`);
  console.log(`  Brand    : ${VENDOR_BRAND}`);
  console.log(`  Login    : /vendor (vendor portal)`);
  console.log('========================================\n');
  console.log('Note: this account lives in the staging_ collections.');
  console.log('It shares Firebase Auth with production but writes to staging_tailors etc.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
