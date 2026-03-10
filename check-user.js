const admin = require('firebase-admin');
const fs = require('fs');

// Load service account credentials
let serviceAccount;
try {
  serviceAccount = JSON.parse(fs.readFileSync('./stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json', 'utf8'));
} catch (error) {
  console.error('Error reading firebase admin SDK file:', error);
  process.exit(1);
}

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://stitchesafrica.firebaseio.com'
  });
}

const db = admin.firestore();

// Get specific user document
async function getUser() {
  try {
    const userId = 'jl4SjJhgpNW6WhxVlmLgxJgJssV2';
    const userDoc = await db.collection('marketing_users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('User data:', userData);
      console.log('User role:', userData.role);
      console.log('User isActive:', userData.isActive);
    } else {
      console.log('User document not found');
    }
  } catch (error) {
    console.error('Error getting user:', error);
  } finally {
    process.exit(0);
  }
}

getUser();