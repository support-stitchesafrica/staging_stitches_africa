/**
 * Simple test script to check referral data in Firestore
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAU8mfUgPZZzLPJXZlibKCkei-DifO_LXQ",
  authDomain: "stitches-africa.firebaseapp.com",
  projectId: "stitches-africa",
  storageBucket: "stitches-africa.firebasestorage.app",
  messagingSenderId: "72103487036",
  appId: "1:72103487036:web:ebed8812bf2b5fe4ddc539",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testReferralData() {
  console.log('Testing referral data...');

  try {
    // Test referralUsers collection
    console.log('\n--- Testing referralUsers collection ---');
    const referralUsersQuery = query(collection(db, 'referralUsers'), limit(5));
    const referralUsersSnapshot = await getDocs(referralUsersQuery);
    console.log('referralUsers count:', referralUsersSnapshot.size);
    
    if (!referralUsersSnapshot.empty) {
      const firstUser = referralUsersSnapshot.docs[0].data();
      console.log('Sample referralUser:', {
        id: referralUsersSnapshot.docs[0].id,
        fullName: firstUser.fullName,
        email: firstUser.email,
        referralCode: firstUser.referralCode,
        totalReferrals: firstUser.totalReferrals
      });
    }

    // Test referrals collection
    console.log('\n--- Testing referrals collection ---');
    const referralsQuery = query(collection(db, 'referrals'), limit(5));
    const referralsSnapshot = await getDocs(referralsQuery);
    console.log('referrals count:', referralsSnapshot.size);
    
    if (!referralsSnapshot.empty) {
      const firstReferral = referralsSnapshot.docs[0].data();
      console.log('Sample referral:', {
        id: referralsSnapshot.docs[0].id,
        referrerId: firstReferral.referrerId,
        refereeEmail: firstReferral.refereeEmail,
        status: firstReferral.status
      });
    }

    // Test referralTransactions collection
    console.log('\n--- Testing referralTransactions collection ---');
    const transactionsQuery = query(collection(db, 'referralTransactions'), limit(5));
    const transactionsSnapshot = await getDocs(transactionsQuery);
    console.log('referralTransactions count:', transactionsSnapshot.size);
    
    if (!transactionsSnapshot.empty) {
      const firstTransaction = transactionsSnapshot.docs[0].data();
      console.log('Sample transaction:', {
        id: transactionsSnapshot.docs[0].id,
        type: firstTransaction.type,
        points: firstTransaction.points,
        amount: firstTransaction.amount
      });
    }

    // Test referralEvents collection
    console.log('\n--- Testing referralEvents collection ---');
    const eventsQuery = query(collection(db, 'referralEvents'), limit(5));
    const eventsSnapshot = await getDocs(eventsQuery);
    console.log('referralEvents count:', eventsSnapshot.size);
    
    if (!eventsSnapshot.empty) {
      const firstEvent = eventsSnapshot.docs[0].data();
      console.log('Sample event:', {
        id: eventsSnapshot.docs[0].id,
        eventType: firstEvent.eventType,
        referralCode: firstEvent.referralCode
      });
    }

  } catch (error) {
    console.error('Error testing referral data:', error);
  }
}

testReferralData();