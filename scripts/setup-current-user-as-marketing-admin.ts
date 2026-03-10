/**
 * Setup Current User as Marketing Super Admin
 * 
 * This script creates a marketing user record for the current Firebase user
 * and grants them super admin permissions.
 */

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

async function setupCurrentUserAsMarketingAdmin() {
  try {
    console.log('🔧 Setting up current user as marketing super admin...\n');

    // Get the user email from environment or prompt
    const userEmail = 'uchinedu@stitchesafrica.com'; // Replace with your email
    
    console.log(`👤 Setting up user: ${userEmail}`);

    // Get the Firebase user by email
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(userEmail);
      console.log('✅ Firebase user found:', firebaseUser.uid);
    } catch (error) {
      console.error('❌ Firebase user not found. Please ensure the user exists in Firebase Auth.');
      return;
    }

    // Check if marketing user already exists
    const marketingUserDoc = await adminDb.collection('marketing_users').doc(firebaseUser.uid).get();
    
    if (marketingUserDoc.exists) {
      console.log('📋 Marketing user already exists. Updating...');
    } else {
      console.log('📝 Creating new marketing user record...');
    }

    // Create/update marketing user record
    const marketingUserData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin User',
      role: 'super_admin',
      isActive: true,
      createdAt: marketingUserDoc.exists ? marketingUserDoc.data()?.createdAt : Timestamp.now(),
      updatedAt: Timestamp.now(),
      lastLoginAt: Timestamp.now(),
    };

    await adminDb.collection('marketing_users').doc(firebaseUser.uid).set(marketingUserData, { merge: true });
    console.log('✅ Marketing user record created/updated');

    // Also create a VVIP user record for testing
    console.log('\n🎯 Creating VVIP user record for testing...');
    
    const vvipUserData = {
      email: firebaseUser.email,
      first_name: 'Admin',
      last_name: 'User',
      registration_country: 'Nigeria',
      isVvip: true,
      vvip_created_by: firebaseUser.uid,
      vvip_created_at: Timestamp.now(),
    };

    await adminDb.collection('users').doc(firebaseUser.uid).set(vvipUserData, { merge: true });
    console.log('✅ VVIP user record created');

    // Create VVIP shopper record
    const vvipShopperData = {
      userId: firebaseUser.uid,
      createdBy: firebaseUser.uid,
      createdAt: Timestamp.now(),
      status: 'active',
    };

    await adminDb.collection('vvip_shoppers').doc(firebaseUser.uid).set(vvipShopperData, { merge: true });
    console.log('✅ VVIP shopper record created');

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nUser details:');
    console.log(`   Email: ${firebaseUser.email}`);
    console.log(`   UID: ${firebaseUser.uid}`);
    console.log(`   Role: super_admin`);
    console.log(`   VVIP Status: true`);
    console.log('\nYou can now access the marketing dashboard and VVIP features.');

  } catch (error) {
    console.error('❌ Error setting up user:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the setup
setupCurrentUserAsMarketingAdmin().catch(console.error);