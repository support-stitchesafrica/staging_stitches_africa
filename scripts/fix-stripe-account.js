// Manual script to fix the orphaned Stripe account
// Run this with: node scripts/fix-stripe-account.js

const admin = require('firebase-admin');

// Initialize Firebase Admin (you'll need to set up service account)
const serviceAccount = require('../stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'stitches-africa'
});

const db = admin.firestore();

async function fixStripeAccount() {
  const accountId = 'acct_1SY12fF678YYsNWy';
  const tailorUID = 'YOUR_TAILOR_UID_HERE'; // Replace with your actual tailor UID
  
  try {
    // Update the tailor document with the Stripe account ID
    await db.collection('tailors').doc(tailorUID).update({
      stripeConnectAccountId: accountId,
      stripeAccountCreatedAt: new Date().toISOString(),
      stripeAccountCountry: 'US',
      stripeAccountType: 'express',
      lastStripeUpdate: new Date().toISOString(),
    });
    
    console.log('✅ Successfully linked Stripe account to tailor profile');
    console.log(`Account ID: ${accountId}`);
    console.log(`Tailor UID: ${tailorUID}`);
  } catch (error) {
    console.error('❌ Error fixing Stripe account:', error);
  }
  
  process.exit(0);
}

fixStripeAccount();