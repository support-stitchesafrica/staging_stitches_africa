/**
 * Script to clean up admin users from VVIP shoppers collection
 * 
 * This script identifies and optionally removes admin users who were
 * accidentally added to the VVIP shoppers collection.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('../stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://stitches-africa-default-rtdb.firebaseio.com'
  });
}

const db = admin.firestore();

async function cleanupAdminVvipShoppers() {
  try {
    console.log('🔍 Scanning VVIP shoppers collection for admin users...');
    
    const vvipShoppersSnapshot = await db.collection('vvip_shoppers').get();
    console.log(`📊 Total VVIP shoppers found: ${vvipShoppersSnapshot.size}`);
    
    const adminUsers = [];
    const regularUsers = [];
    
    vvipShoppersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const userId = doc.id;
      
      // Check if this is an admin user
      const isAdmin = data.createdByRole && ['super_admin', 'bdm', 'team_lead', 'team_member'].includes(data.createdByRole);
      const isSystemUser = data.email?.includes('@stitchesafrica.com') || data.user_email?.includes('@stitchesafrica.com');
      
      if (isAdmin || isSystemUser) {
        adminUsers.push({
          userId,
          email: data.email || data.user_email,
          name: data.name || data.user_name,
          role: data.createdByRole,
          createdBy: data.createdByEmail
        });
      } else {
        regularUsers.push({
          userId,
          email: data.email || data.user_email,
          name: data.name || data.user_name,
          country: data.country
        });
      }
    });
    
    console.log('\n📋 SCAN RESULTS:');
    console.log(`✅ Regular VVIP shoppers: ${regularUsers.length}`);
    console.log(`⚠️  Admin users in VVIP collection: ${adminUsers.length}`);
    
    if (adminUsers.length > 0) {
      console.log('\n🚨 Admin users found in VVIP collection:');
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
      });
      
      console.log('\n💡 These admin users should not be in the VVIP shoppers collection.');
      console.log('💡 They will be automatically filtered out by the API, but you may want to remove them from the database.');
      
      // Uncomment the following lines to actually remove admin users
      // console.log('\n🗑️  Removing admin users from VVIP collection...');
      // const batch = db.batch();
      // adminUsers.forEach(user => {
      //   const docRef = db.collection('vvip_shoppers').doc(user.userId);
      //   batch.delete(docRef);
      // });
      // await batch.commit();
      // console.log('✅ Admin users removed successfully!');
    }
    
    if (regularUsers.length > 0) {
      console.log('\n✅ Valid VVIP shoppers:');
      regularUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.country}`);
      });
    }
    
    console.log('\n🎉 Cleanup scan completed!');
    console.log(`📊 Summary: ${regularUsers.length} valid shoppers, ${adminUsers.length} admin users filtered out`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Run the cleanup
cleanupAdminVvipShoppers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });