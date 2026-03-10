/**
 * Simple Firebase Admin test
 */

const admin = require('firebase-admin');
const serviceAccount = require('./stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');

console.log('🔍 Testing Firebase Admin with service account...\n');

try {
  // Initialize Firebase Admin
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'stitches-africa'
    });
    console.log('✅ Firebase Admin initialized');
  }

  const auth = admin.auth();
  const db = admin.firestore();

  console.log('Auth available:', !!auth);
  console.log('Firestore available:', !!db);

  // Test user lookup
  const userEmail = 'uchinedu@stitchesafrica.com';
  console.log(`\nTesting user lookup: ${userEmail}`);

  auth.getUserByEmail(userEmail)
    .then(user => {
      console.log('✅ User found:', user.uid);
      console.log('Email verified:', user.emailVerified);
      
      // Test Firestore access
      return db.collection('marketing_users').doc(user.uid).get();
    })
    .then(doc => {
      if (doc.exists) {
        console.log('✅ Marketing user exists');
        console.log('Role:', doc.data().role);
      } else {
        console.log('❌ Marketing user not found');
      }
    })
    .catch(error => {
      console.error('❌ Error:', error.message);
    });

} catch (error) {
  console.error('❌ Initialization error:', error.message);
}