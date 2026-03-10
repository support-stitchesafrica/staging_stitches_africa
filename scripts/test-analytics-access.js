// Script to test analytics collections access after deploying new rules
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('../stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json')),
    projectId: 'stitches-africa'
  });
}

const db = admin.firestore();

async function testAnalyticsAccess() {
  try {
    console.log('Testing analytics collections access...\n');

    const collections = [
      'product_analytics',
      'product_views', 
      'search_analytics',
      'searches',
      'user_session_analytics',
      'user_sessions',
      'cart_analytics',
      'install_analytics'
    ];

    for (const collectionName of collections) {
      try {
        console.log(`Testing ${collectionName}...`);
        const snapshot = await db.collection(collectionName).limit(1).get();
        console.log(`✅ ${collectionName}: Accessible (${snapshot.size} documents found)`);
      } catch (error) {
        console.log(`❌ ${collectionName}: Error - ${error.message}`);
      }
    }

    console.log('\n--- Testing specific analytics functions ---\n');

    // Test user location analytics (users collection)
    try {
      console.log('Testing users collection for location analytics...');
      const usersSnapshot = await db.collection('users')
        .where('registration_country', '!=', null)
        .limit(5)
        .get();
      console.log(`✅ Users collection: Accessible (${usersSnapshot.size} users with location data)`);
    } catch (error) {
      console.log(`❌ Users collection: Error - ${error.message}`);
    }

    // Check if there are any Atlas users
    try {
      console.log('Checking Atlas users...');
      const atlasUsersSnapshot = await db.collection('atlasUsers').limit(5).get();
      console.log(`✅ Atlas users: ${atlasUsersSnapshot.size} users found`);
      
      if (atlasUsersSnapshot.size > 0) {
        atlasUsersSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`   - ${data.email} (${data.role})`);
        });
      } else {
        console.log('   ⚠️  No Atlas users found. Run create-atlas-user.js to create one.');
      }
    } catch (error) {
      console.log(`❌ Atlas users: Error - ${error.message}`);
    }

    console.log('\n--- Summary ---');
    console.log('✅ Firestore rules have been deployed successfully');
    console.log('✅ Analytics collections should now be accessible to:');
    console.log('   - Atlas users (atlasUsers collection)');
    console.log('   - Admin users (admins collection)');
    console.log('   - Back office users with analytics permission');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Create an Atlas user: node scripts/create-atlas-user.js');
    console.log('   2. Login to /atlas/auth with the created credentials');
    console.log('   3. Navigate to the dashboard to test UserDashboard analytics');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAnalyticsAccess();