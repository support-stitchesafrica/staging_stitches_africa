// Test script to check hierarchical referral API
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert('./stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json'),
    databaseURL: 'https://stitches-africa.firebaseio.com'
  });
}

const db = admin.firestore();

async function testHierarchicalAPI() {
  try {
    console.log('Testing hierarchical referral data...');
    
    // Test 1: Check if collection exists
    const collectionRef = db.collection('hierarchical_influencers');
    const allDocs = await collectionRef.get();
    console.log(`Total documents in hierarchical_influencers: ${allDocs.size}`);
    
    // Test 2: Check for pending mother influencers
    const pendingQuery = await collectionRef
      .where('type', '==', 'mother')
      .where('status', '==', 'pending')
      .get();
    
    console.log(`Pending mother influencers found: ${pendingQuery.size}`);
    
    // Test 3: Show all documents
    console.log('\nAll documents in collection:');
    allDocs.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`Name: ${data.name || 'N/A'}`);
      console.log(`Email: ${data.email || 'N/A'}`);
      console.log(`Type: ${data.type || 'N/A'}`);
      console.log(`Status: ${data.status || 'N/A'}`);
      console.log('---');
    });
    
    // Test 4: Check admin collection
    const adminDocs = await db.collection('hierarchical_admins').get();
    console.log(`\nAdmin documents: ${adminDocs.size}`);
    
    adminDocs.forEach(doc => {
      const data = doc.data();
      console.log(`Admin ID: ${doc.id}`);
      console.log(`Email: ${data.email}`);
      console.log(`Role: ${data.role}`);
      console.log(`Active: ${data.isActive}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testHierarchicalAPI();