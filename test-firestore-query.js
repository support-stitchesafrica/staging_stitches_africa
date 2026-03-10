// Test Firestore queries to check if indexes are working
const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Add your project ID here
  });
}

const db = admin.firestore();

async function testQueries() {
  console.log('Testing Firestore queries...\n');

  try {
    // Test 1: Get all products for a vendor
    console.log('Test 1: Basic vendor products query');
    const basicQuery = await db
      .collection('products')
      .where('vendorId', '==', 'test-vendor')
      .limit(5)
      .get();
    console.log(`✅ Basic query: ${basicQuery.size} products found\n`);

    // Test 2: Get products with status filter
    console.log('Test 2: Products with status filter');
    const statusQuery = await db
      .collection('products')
      .where('vendorId', '==', 'test-vendor')
      .where('status', '==', 'active')
      .limit(5)
      .get();
    console.log(`✅ Status query: ${statusQuery.size} products found\n`);

    // Test 3: Get products ordered by creation date
    console.log('Test 3: Products ordered by creation date');
    const orderedQuery = await db
      .collection('products')
      .where('vendorId', '==', 'test-vendor')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    console.log(`✅ Ordered query: ${orderedQuery.size} products found\n`);

    // Test 4: Get products with status and ordered by creation date
    console.log('Test 4: Products with status and ordered by creation date');
    const complexQuery = await db
      .collection('products')
      .where('vendorId', '==', 'test-vendor')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    console.log(`✅ Complex query: ${complexQuery.size} products found\n`);

  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.log('\nThis might indicate missing Firestore indexes.');
    console.log('Run: firebase deploy --only firestore:indexes');
  }
}

testQueries().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(console.error);