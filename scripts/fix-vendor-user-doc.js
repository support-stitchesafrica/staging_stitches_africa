/**
 * Fixes a vendor user doc that has isTailor instead of is_tailor
 * and writes to both users + tailors so loginTailor() works.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });

const admin = require('firebase-admin');

if (!admin.apps.length) {
  const sa = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8')
  );
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

// The UID from the debug log
const TARGET_UID = 'nBWsfFJcXnTUrXikQn8UmQJJtPX2';

async function main() {
  // Check current state
  const [usersSnap, tailorsSnap] = await Promise.all([
    db.collection('users').doc(TARGET_UID).get(),
    db.collection('tailors').doc(TARGET_UID).get(),
  ]);

  console.log('users doc exists:', usersSnap.exists);
  if (usersSnap.exists) {
    const d = usersSnap.data();
    console.log('  is_tailor:', d.is_tailor);
    console.log('  isTailor:', d.isTailor);
    console.log('  role:', d.role);
    console.log('  email:', d.email);
  }

  console.log('tailors doc exists:', tailorsSnap.exists);
  if (tailorsSnap.exists) {
    const d = tailorsSnap.data();
    console.log('  email:', d.email);
    console.log('  status:', d.status);
  }

  // Patch users doc: add is_tailor: true (snake_case) which loginTailor() checks
  if (usersSnap.exists) {
    await db.collection('users').doc(TARGET_UID).set(
      { is_tailor: true, isTailor: true, is_sub_tailor: false },
      { merge: true }
    );
    console.log('\n✅ Patched users/' + TARGET_UID + ' — added is_tailor: true');
  } else {
    // User doc doesn't exist — create minimal one from tailors doc
    const tailorData = tailorsSnap.exists ? tailorsSnap.data() : {};
    await db.collection('users').doc(TARGET_UID).set({
      uid: TARGET_UID,
      email: tailorData.email || '',
      is_tailor: true,
      isTailor: true,
      is_sub_tailor: false,
      is_general_admin: false,
      role: 'verifier',
      brand_name: tailorData.brand_name || tailorData.brandName || '',
      _autoCreated: true,
    });
    console.log('\n✅ Created users/' + TARGET_UID + ' with is_tailor: true');
  }

  console.log('\nDone. Try logging in to the vendor portal again.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
