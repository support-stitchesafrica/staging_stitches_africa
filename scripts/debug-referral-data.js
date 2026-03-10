/**
 * Debug script to check referral data in Firestore
 * Run this to see what data exists in your referral collections
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, limit } = require('firebase/firestore');

// Firebase config - you'll need to update this with your config
const firebaseConfig = {
  // Add your Firebase config here
  // You can get this from your Firebase console
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugReferralData() {
  console.log('🔍 Debugging Referral Data...\n');

  try {
    // Check referralUsers collection
    console.log('📊 Checking referralUsers collection...');
    const referralUsersSnapshot = await getDocs(query(collection(db, 'referralUsers'), limit(10)));
    console.log(`Found ${referralUsersSnapshot.size} referral users`);
    
    if (referralUsersSnapshot.size > 0) {
      console.log('\nSample referral users:');
      referralUsersSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Doc ID: ${doc.id}`);
        console.log(`   User ID: ${data.userId}`);
        console.log(`   Full Name: ${data.fullName}`);
        console.log(`   Email: ${data.email}`);
        console.log(`   Referral Code: ${data.referralCode}`);
        console.log(`   Total Referrals: ${data.totalReferrals}`);
        console.log(`   Total Revenue: ${data.totalRevenue}`);
        console.log(`   Total Points: ${data.totalPoints}`);
        console.log('');
      });
    }

    // Check referralEvents collection
    console.log('📊 Checking referralEvents collection...');
    const eventsSnapshot = await getDocs(query(collection(db, 'referralEvents'), limit(10)));
    console.log(`Found ${eventsSnapshot.size} referral events`);
    
    if (eventsSnapshot.size > 0) {
      console.log('\nSample referral events:');
      eventsSnapshot.docs.slice(0, 5).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Doc ID: ${doc.id}`);
        console.log(`   Event Type: ${data.eventType}`);
        console.log(`   Referral Code: ${data.referralCode}`);
        console.log(`   Referrer ID: ${data.referrerId}`);
        console.log(`   Device Type: ${data.deviceType}`);
        console.log(`   Created At: ${data.createdAt?.toDate?.()?.toISOString() || 'No date'}`);
        console.log('');
      });

      // Count events by type
      const clickEvents = eventsSnapshot.docs.filter(doc => doc.data().eventType === 'click').length;
      const downloadEvents = eventsSnapshot.docs.filter(doc => doc.data().eventType === 'download').length;
      console.log(`Event breakdown: ${clickEvents} clicks, ${downloadEvents} downloads`);
    }

    // Check referralTransactions collection
    console.log('\n📊 Checking referralTransactions collection...');
    const transactionsSnapshot = await getDocs(query(collection(db, 'referralTransactions'), limit(10)));
    console.log(`Found ${transactionsSnapshot.size} referral transactions`);
    
    if (transactionsSnapshot.size > 0) {
      console.log('\nSample referral transactions:');
      transactionsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Doc ID: ${doc.id}`);
        console.log(`   Type: ${data.type}`);
        console.log(`   Referrer ID: ${data.referrerId}`);
        console.log(`   Points: ${data.points}`);
        console.log(`   Amount: ${data.amount || 'N/A'}`);
        console.log(`   Description: ${data.description}`);
        console.log(`   Created At: ${data.createdAt?.toDate?.()?.toISOString() || 'No date'}`);
        console.log('');
      });
    }

    // Check referrals collection
    console.log('📊 Checking referrals collection...');
    const referralsSnapshot = await getDocs(query(collection(db, 'referrals'), limit(10)));
    console.log(`Found ${referralsSnapshot.size} referrals`);
    
    if (referralsSnapshot.size > 0) {
      console.log('\nSample referrals:');
      referralsSnapshot.docs.slice(0, 3).forEach((doc, index) => {
        const data = doc.data();
        console.log(`${index + 1}. Doc ID: ${doc.id}`);
        console.log(`   Referrer ID: ${data.referrerId}`);
        console.log(`   Referee ID: ${data.refereeId}`);
        console.log(`   Referee Email: ${data.refereeEmail}`);
        console.log(`   Referee Name: ${data.refereeName}`);
        console.log(`   Referral Code: ${data.referralCode}`);
        console.log(`   Status: ${data.status}`);
        console.log(`   Total Purchases: ${data.totalPurchases}`);
        console.log(`   Total Spent: ${data.totalSpent}`);
        console.log('');
      });
    }

    // Cross-reference data
    console.log('🔗 Cross-referencing data...');
    if (referralUsersSnapshot.size > 0 && eventsSnapshot.size > 0) {
      const referralCodes = new Set();
      referralUsersSnapshot.docs.forEach(doc => {
        const code = doc.data().referralCode;
        if (code) referralCodes.add(code);
      });

      const eventCodes = new Set();
      eventsSnapshot.docs.forEach(doc => {
        const code = doc.data().referralCode;
        if (code) eventCodes.add(code);
      });

      console.log(`Referral codes in users: ${Array.from(referralCodes).join(', ')}`);
      console.log(`Referral codes in events: ${Array.from(eventCodes).join(', ')}`);
      
      const matchingCodes = Array.from(referralCodes).filter(code => eventCodes.has(code));
      console.log(`Matching codes: ${matchingCodes.join(', ') || 'None'}`);
    }

  } catch (error) {
    console.error('❌ Error debugging referral data:', error);
  }
}

// Run the debug function
debugReferralData().then(() => {
  console.log('✅ Debug complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
});