/**
 * Script to reset a user's password in Firebase Auth
 * Run this with: npx tsx scripts/reset-user-password.ts email@domain.com newPassword
 */

import { adminAuth } from '../lib/firebase-admin';

async function resetUserPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];
    
    if (!email || !newPassword) {
      console.log('Usage: npx tsx scripts/reset-user-password.ts email@domain.com newPassword');
      process.exit(1);
    }
    
    console.log(`Resetting password for: ${email}`);
    
    // Find user by email
    const user = await adminAuth.getUserByEmail(email);
    console.log(`✓ Found user: ${user.uid}`);
    
    // Update password
    await adminAuth.updateUser(user.uid, {
      password: newPassword,
      emailVerified: true // Also verify the email
    });
    
    console.log('✅ Password updated successfully!');
    console.log('✅ Email verified!');
    console.log(`\nYou can now login with:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${newPassword}`);
    console.log(`\nGo to: http://localhost:3000/marketing/login`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
}

resetUserPassword();