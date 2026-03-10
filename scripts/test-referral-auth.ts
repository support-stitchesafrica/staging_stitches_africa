/**
 * Test script to diagnose referral authentication issues
 * Run with: npx ts-node scripts/test-referral-auth.ts
 */

import { adminAuth, adminDb } from '../lib/firebase-admin';

async function testReferralAuth() {
  console.log('🔍 Testing Referral Authentication System...\n');

  try {
    // Test 1: Check if Firebase Admin is initialized
    console.log('✅ Test 1: Firebase Admin initialized');

    // Test 2: List all referral users
    console.log('\n📋 Test 2: Listing referral users...');
    const usersSnapshot = await adminDb.collection('referralUsers').limit(5).get();
    console.log(`Found ${usersSnapshot.size} referral users`);
    
    usersSnapshot.forEach(doc => {
      const user = doc.data();
      console.log(`  - ${user.email} (${user.fullName}) - Code: ${user.referralCode} - Active: ${user.isActive}`);
    });

    // Test 3: Check Firebase Auth users
    console.log('\n👥 Test 3: Checking Firebase Auth users...');
    const listUsersResult = await adminAuth.listUsers(5);
    console.log(`Found ${listUsersResult.users.length} auth users`);
    
    listUsersResult.users.forEach(user => {
      console.log(`  - ${user.email} (${user.displayName || 'No name'}) - UID: ${user.uid}`);
    });

    // Test 4: Check for orphaned auth users (auth users without referral user docs)
    console.log('\n🔍 Test 4: Checking for orphaned auth users...');
    for (const authUser of listUsersResult.users) {
      const referralUserDoc = await adminDb.collection('referralUsers').doc(authUser.uid).get();
      if (!referralUserDoc.exists) {
        console.log(`  ⚠️  Orphaned user: ${authUser.email} (UID: ${authUser.uid})`);
      }
    }

    // Test 5: Try to create a test user
    console.log('\n🧪 Test 5: Testing user creation...');
    const testEmail = `test-${Date.now()}@example.com`;
    console.log(`Creating test user: ${testEmail}`);
    
    try {
      const userRecord = await adminAuth.createUser({
        email: testEmail,
        password: 'test123456',
        displayName: 'Test User',
      });
      console.log(`✅ Auth user created: ${userRecord.uid}`);
      
      // Clean up
      await adminAuth.deleteUser(userRecord.uid);
      console.log('✅ Test user cleaned up');
    } catch (error: any) {
      console.error('❌ Failed to create test user:', error.message);
    }

    console.log('\n✅ All tests completed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testReferralAuth();
