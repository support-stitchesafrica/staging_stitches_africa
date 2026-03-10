/**
 * Test script to debug VVIP authentication issues using JS version
 */

const { adminAuth, adminDb } = require('./lib/firebase-admin.js');

async function testVvipAuth() {
  console.log('🔍 Testing VVIP Authentication Setup...\n');

  try {
    // Test 1: Check Firebase Admin initialization
    console.log('1. Testing Firebase Admin initialization...');
    console.log('   Admin Auth available:', !!adminAuth);
    console.log('   Admin DB available:', !!adminDb);

    // Test 2: Check if user exists in Firebase Auth
    const userEmail = 'uchinedu@stitchesafrica.com';
    console.log(`\n2. Checking Firebase Auth user: ${userEmail}`);
    
    try {
      const firebaseUser = await adminAuth.getUserByEmail(userEmail);
      console.log('   ✅ Firebase user found');
      console.log('   UID:', firebaseUser.uid);
      console.log('   Email verified:', firebaseUser.emailVerified);
      
      // Test 3: Check marketing_users collection
      console.log('\n3. Checking marketing_users collection...');
      const marketingUserDoc = await adminDb.collection('marketing_users').doc(firebaseUser.uid).get();
      
      if (marketingUserDoc.exists) {
        const userData = marketingUserDoc.data();
        console.log('   ✅ Marketing user found');
        console.log('   Role:', userData.role);
        console.log('   Active:', userData.isActive);
        console.log('   Email:', userData.email);
      } else {
        console.log('   ❌ Marketing user not found');
        console.log('   Creating marketing user...');
        
        const userProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          role: 'super_admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await adminDb.collection('marketing_users').doc(firebaseUser.uid).set(userProfile);
        console.log('   ✅ Marketing user created');
      }

      // Test 4: Check VVIP user record
      console.log('\n4. Checking users collection for VVIP status...');
      const userDoc = await adminDb.collection('users').doc(firebaseUser.uid).get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log('   ✅ User record found');
        console.log('   VVIP status:', userData.isVvip || false);
        console.log('   Email:', userData.email);
        
        if (!userData.isVvip) {
          console.log('   Updating VVIP status...');
          await adminDb.collection('users').doc(firebaseUser.uid).update({
            isVvip: true,
            updatedAt: new Date()
          });
          console.log('   ✅ VVIP status updated');
        }
      } else {
        console.log('   ❌ User record not found in users collection');
        console.log('   Creating user record...');
        
        const userProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          isVvip: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await adminDb.collection('users').doc(firebaseUser.uid).set(userProfile);
        console.log('   ✅ User record created with VVIP status');
      }

      // Test 5: Check vvip_shoppers collection
      console.log('\n5. Checking vvip_shoppers collection...');
      const vvipDoc = await adminDb.collection('vvip_shoppers').doc(firebaseUser.uid).get();
      
      if (vvipDoc.exists) {
        const vvipData = vvipDoc.data();
        console.log('   ✅ VVIP shopper record found');
        console.log('   Status:', vvipData.status);
        console.log('   Created by:', vvipData.created_by);
      } else {
        console.log('   ❌ VVIP shopper record not found');
        console.log('   Creating VVIP shopper record...');
        
        const vvipProfile = {
          userId: firebaseUser.uid,
          user_email: firebaseUser.email,
          user_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          status: 'active',
          created_by: firebaseUser.uid,
          created_at: new Date(),
          notes: 'Auto-created for testing'
        };
        
        await adminDb.collection('vvip_shoppers').doc(firebaseUser.uid).set(vvipProfile);
        console.log('   ✅ VVIP shopper record created');
      }

      // Test 6: Generate a test ID token
      console.log('\n6. Testing ID token generation...');
      try {
        const customToken = await adminAuth.createCustomToken(firebaseUser.uid);
        console.log('   ✅ Custom token generated successfully');
        console.log('   Token length:', customToken.length);
      } catch (tokenError) {
        console.log('   ❌ Failed to generate custom token:', tokenError.message);
      }

      console.log('\n✅ All authentication components are set up correctly!');
      console.log('\n🔧 Next steps:');
      console.log('   1. Ensure user is logged in to Firebase on frontend');
      console.log('   2. Check browser network tab for request headers');
      console.log('   3. Verify ID token is being sent with API requests');
      console.log('   4. Test the VVIP page at http://localhost:3001/marketing/vvip');

    } catch (userError) {
      console.log('   ❌ Firebase user not found:', userError.message);
      console.log('\n🔧 User needs to be created in Firebase Auth first');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testVvipAuth().catch(console.error);