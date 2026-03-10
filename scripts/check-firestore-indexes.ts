/**
 * Check Firestore Indexes Status
 * 
 * This script helps check if the required Firestore indexes are ready
 * for the vendor analytics system.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Firebase config (you may need to adjust this)
const firebaseConfig = {
  // Add your Firebase config here
  // This should match your project configuration
};

async function checkIndexes() {
  try {
    console.log('🔍 Checking Firestore indexes...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Test queries that require indexes
    const testQueries = [
      {
        name: 'shop_activities - vendorId + timestamp',
        test: async () => {
          const q = query(
            collection(db, 'shop_activities'),
            where('vendorId', '==', 'test-vendor'),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          await getDocs(q);
        }
      },
      {
        name: 'shop_activities - vendorId + timestamp + __name__',
        test: async () => {
          const q = query(
            collection(db, 'shop_activities'),
            where('vendorId', '==', 'test-vendor'),
            orderBy('timestamp', 'desc'),
            orderBy('__name__', 'desc'),
            limit(1)
          );
          await getDocs(q);
        }
      },
      {
        name: 'shop_activities - vendorId + activityType + timestamp',
        test: async () => {
          const q = query(
            collection(db, 'shop_activities'),
            where('vendorId', '==', 'test-vendor'),
            where('activityType', '==', 'view'),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          await getDocs(q);
        }
      },
      {
        name: 'shop_activities - productId + timestamp',
        test: async () => {
          const q = query(
            collection(db, 'shop_activities'),
            where('productId', '==', 'test-product'),
            orderBy('timestamp', 'desc'),
            limit(1)
          );
          await getDocs(q);
        }
      }
    ];
    
    const results = [];
    
    for (const testQuery of testQueries) {
      try {
        console.log(`Testing: ${testQuery.name}...`);
        await testQuery.test();
        console.log(`✅ ${testQuery.name} - Index ready`);
        results.push({ name: testQuery.name, status: 'ready' });
      } catch (error: any) {
        if (error.message?.includes('index') || error.code === 'failed-precondition') {
          console.log(`⏳ ${testQuery.name} - Index building`);
          results.push({ name: testQuery.name, status: 'building' });
        } else {
          console.log(`❌ ${testQuery.name} - Error: ${error.message}`);
          results.push({ name: testQuery.name, status: 'error', error: error.message });
        }
      }
    }
    
    // Summary
    console.log('\n📊 Index Status Summary:');
    console.log('========================');
    
    const ready = results.filter(r => r.status === 'ready').length;
    const building = results.filter(r => r.status === 'building').length;
    const errors = results.filter(r => r.status === 'error').length;
    
    console.log(`✅ Ready: ${ready}/${results.length}`);
    console.log(`⏳ Building: ${building}/${results.length}`);
    console.log(`❌ Errors: ${errors}/${results.length}`);
    
    if (building > 0) {
      console.log('\n💡 Some indexes are still building. This is normal for new projects.');
      console.log('   Indexes typically take 2-10 minutes to build depending on data size.');
      console.log('   You can check status at: https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes');
    }
    
    if (ready === results.length) {
      console.log('\n🎉 All indexes are ready! Your analytics should work perfectly.');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error checking indexes:', error);
    console.log('\n💡 Make sure to:');
    console.log('   1. Update the Firebase config in this script');
    console.log('   2. Ensure you have proper authentication');
    console.log('   3. Check that your Firestore rules allow read access');
  }
}

// Run the check
if (require.main === module) {
  checkIndexes().then(() => {
    console.log('\n✨ Index check complete!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { checkIndexes };