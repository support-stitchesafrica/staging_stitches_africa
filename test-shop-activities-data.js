const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://stitches-africa-default-rtdb.firebaseio.com"
  });
}

const db = admin.firestore();

async function testShopActivitiesData() {
  try {
    console.log('🔍 Testing shop_activities collection...');
    
    // Get first 10 documents from shop_activities
    const snapshot = await db.collection('shop_activities').limit(10).get();
    
    console.log(`Found ${snapshot.size} documents in shop_activities`);
    
    if (snapshot.size > 0) {
      console.log('\n📋 Sample documents:');
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log('   Data:', JSON.stringify(data, null, 2));
      });
    } else {
      console.log('❌ No documents found in shop_activities collection');
      
      // Check if collection exists by trying to create a test document
      console.log('\n🧪 Testing collection write access...');
      const testDoc = {
        type: 'test',
        timestamp: admin.firestore.Timestamp.now(),
        userId: 'test-user',
        metadata: {
          test: true
        }
      };
      
      const docRef = await db.collection('shop_activities').add(testDoc);
      console.log('✅ Test document created with ID:', docRef.id);
      
      // Clean up test document
      await docRef.delete();
      console.log('🧹 Test document cleaned up');
    }
    
    // Also check tailor_works collection
    console.log('\n🔍 Testing tailor_works collection...');
    const tailorWorksSnapshot = await db.collection('tailor_works').limit(5).get();
    console.log(`Found ${tailorWorksSnapshot.size} documents in tailor_works`);
    
    if (tailorWorksSnapshot.size > 0) {
      console.log('\n📋 Sample tailor_works documents:');
      tailorWorksSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n${index + 1}. Document ID: ${doc.id}`);
        console.log('   Tailor ID:', data.tailor_id || data.userId || 'N/A');
        console.log('   Title:', data.title || 'N/A');
        console.log('   Is Active:', data.isActive);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing shop activities:', error);
  }
}

testShopActivitiesData();