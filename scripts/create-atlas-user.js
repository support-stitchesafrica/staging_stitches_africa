// Script to create an Atlas user for testing analytics permissions
const admin = require('firebase-admin');

// Initialize Firebase Admin (make sure you have the service account key)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json')),
    projectId: 'stitches-africa'
  });
}

const auth = admin.auth();
const db = admin.firestore();

async function createAtlasUser() {
  try {
    const email = 'test-analytics@stitchesafrica.com';
    const password = 'TestAnalytics123!';
    const fullName = 'Analytics Test User';

    console.log('Creating Atlas user for analytics testing...');

    // Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: fullName,
    });

    console.log('✅ Firebase Auth user created:', userRecord.uid);

    // Create Atlas user document in Firestore
    const atlasUserData = {
      uid: userRecord.uid,
      email: email,
      fullName: fullName,
      role: 'superadmin', // Give superadmin role for full analytics access
      isAtlasUser: true,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('atlasUsers').doc(userRecord.uid).set(atlasUserData);

    console.log('✅ Atlas user document created in Firestore');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Role: superadmin');
    console.log('');
    console.log('You can now login to the Atlas dashboard at /atlas/auth with these credentials');
    console.log('The user has superadmin role and should have access to all analytics collections');

  } catch (error) {
    console.error('❌ Error creating Atlas user:', error);
  }
}

// Run the script
createAtlasUser();