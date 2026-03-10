/**
 * Simple script to check Firebase collections
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, limit, query } = require('firebase/firestore');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCollections() {
  console.log('🔍 Checking Firebase collections...\n');

  const collections = [
    'referralUsers',
    'referrals', 
    'referralTransactions',
    'referralEvents'
  ];

  for (const collectionName of collections) {
    try {
      console.log(`📊 Checking ${collectionName}...`);
      const q = query(collection(db, collectionName), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log(`   ❌ ${collectionName}: Empty`);
      } else {
        console.log(`   ✅ ${collectionName}: Has data (${snapshot.size} sample)`);
        const sampleDoc = snapshot.docs[0];
        console.log(`   📄 Sample document ID: ${sampleDoc.id}`);
        console.log(`   📄 Sample data keys: ${Object.keys(sampleDoc.data()).join(', ')}`);
      }
    } catch (error) {
      console.log(`   ❌ ${collectionName}: Error - ${error.message}`);
    }
    console.log('');
  }
}

checkCollections().then(() => {
  console.log('✅ Collection check complete');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Check failed:', error);
  process.exit(1);
});