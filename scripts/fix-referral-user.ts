/**
 * Fix Referral User Script
 * Helps diagnose and fix common referral user issues
 * 
 * Usage:
 * npx ts-node scripts/fix-referral-user.ts <email>
 * 
 * Example:
 * npx ts-node scripts/fix-referral-user.ts user@example.com
 */

import { adminAuth, adminDb } from '../lib/firebase-admin';
import { ReferralService } from '../lib/referral/referral-service';
import { AutoProvisionService } from '../lib/referral/auto-provision-service';

async function fixReferralUser(email: string) {
  console.log(`\n🔧 Fixing referral user for: ${email}\n`);

  try {
    // Step 1: Find Firebase Auth user
    console.log('Step 1: Looking up Firebase Auth user...');
    let authUser;
    try {
      authUser = await adminAuth.getUserByEmail(email);
      console.log(`✅ Found auth user: ${authUser.uid}`);
      console.log(`   - Display Name: ${authUser.displayName || 'Not set'}`);
      console.log(`   - Email Verified: ${authUser.emailVerified}`);
      console.log(`   - Disabled: ${authUser.disabled}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('❌ No Firebase Auth user found with this email');
        console.log('   → User needs to register first');
        return;
      }
      throw error;
    }

    // Step 2: Check for referral user document
    console.log('\nStep 2: Checking for referral user document...');
    const referralUser = await ReferralService.getReferrerById(authUser.uid);
    
    if (referralUser) {
      console.log('✅ Referral user document exists');
      console.log(`   - Referral Code: ${referralUser.referralCode}`);
      console.log(`   - Full Name: ${referralUser.fullName}`);
      console.log(`   - Is Active: ${referralUser.isActive}`);
      console.log(`   - Is Admin: ${referralUser.isAdmin}`);
      console.log(`   - Total Referrals: ${referralUser.totalReferrals}`);
      console.log(`   - Total Points: ${referralUser.totalPoints}`);
      
      // Check if account is inactive
      if (!referralUser.isActive) {
        console.log('\n⚠️  Account is INACTIVE');
        console.log('   → To reactivate, run:');
        console.log(`   → npx ts-node scripts/activate-referral-user.ts ${email}`);
      } else {
        console.log('\n✅ Account is active and ready to use');
      }
      
      return;
    }

    // Step 3: Auto-provision referral user
    console.log('⚠️  No referral user document found');
    console.log('\nStep 3: Auto-provisioning referral user...');
    
    try {
      const newReferralUser = await AutoProvisionService.autoProvisionReferralUser(
        authUser.uid,
        authUser.email!,
        authUser.displayName,
        'login'
      );
      
      console.log('✅ Successfully auto-provisioned referral user');
      console.log(`   - Referral Code: ${newReferralUser.referralCode}`);
      console.log(`   - Full Name: ${newReferralUser.fullName}`);
      console.log(`   - Is Active: ${newReferralUser.isActive}`);
      console.log(`   - Is Admin: ${newReferralUser.isAdmin}`);
      console.log('\n✅ User can now login to the referral dashboard');
      
    } catch (provisionError: any) {
      console.error('❌ Failed to auto-provision referral user:', provisionError.message);
      console.log('\n🔧 Manual fix required:');
      console.log('   1. Check Firestore permissions');
      console.log('   2. Verify Firebase Admin SDK is configured');
      console.log('   3. Check server logs for detailed errors');
    }

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
  console.log('  npx ts-node scripts/fix-referral-user.ts <email>');
  console.log('\nExample:');
  console.log('  npx ts-node scripts/fix-referral-user.ts user@example.com');
  process.exit(1);
}

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.error('❌ Error: Invalid email format');
  process.exit(1);
}

fixReferralUser(email);
