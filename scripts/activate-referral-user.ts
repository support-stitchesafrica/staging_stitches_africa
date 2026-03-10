/**
 * Activate Referral User Script
 * Reactivates a deactivated referral user account
 * 
 * Usage:
 * npx ts-node scripts/activate-referral-user.ts <email>
 * 
 * Example:
 * npx ts-node scripts/activate-referral-user.ts user@example.com
 */

import { adminAuth, adminDb } from '../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

async function activateReferralUser(email: string) {
  console.log(`\n🔓 Activating referral user: ${email}\n`);

  try {
    // Step 1: Find Firebase Auth user
    console.log('Step 1: Looking up Firebase Auth user...');
    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(email);
      console.log(`✅ Found auth user: ${authUser.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ No Firebase Auth user found with this email');
        return;
      }
      throw error;
    }

    // Step 2: Check for referral user document
    console.log('\nStep 2: Checking referral user document...');
    const userDoc = await adminDb
      .collection('referralUsers')
      .doc(authUser.uid)
      .get();

    if (!userDoc.exists) {
      console.log('❌ No referral user document found');
      console.log('   → Run fix-referral-user.ts first to create the document');
      return;
    }

    const userData = userDoc.data();
    console.log(`✅ Found referral user document`);
    console.log(`   - Current status: ${userData?.isActive ? 'Active' : 'Inactive'}`);

    if (userData?.isActive) {
      console.log('\n✅ Account is already active');
      return;
    }

    // Step 3: Activate the account
    console.log('\nStep 3: Activating account...');
    await adminDb
      .collection('referralUsers')
      .doc(authUser.uid)
      .update({
        isActive: true,
        updatedAt: Timestamp.now(),
      });

    console.log('✅ Account activated successfully');
    console.log('\n✅ User can now login to the referral dashboard');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email address required');
  console.log('\nUsage:');
  console.log('  npx ts-node scripts/activate-referral-user.ts <email>');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/activate-referral-user.ts user@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

activateReferralUser(email);
