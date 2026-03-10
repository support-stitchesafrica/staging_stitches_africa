#!/usr/bin/env node

/**
 * Firebase Collection Duplication Script
 * Duplicates specified collections with "staging_" prefix
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
let serviceAccount;
try {
  const keyPath = path.join(process.cwd(), 'stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json');
  if (fs.existsSync(keyPath)) {
    serviceAccount = require(keyPath);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    throw new Error('No Firebase service account found');
  }
} catch (error) {
  console.error('Error loading Firebase credentials:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id || 'stitches-africa'
});

const db = admin.firestore();

// Collections to duplicate
const collections = [
  'tailors',
  'tailors_local',
  'template_library',
  'templates',
  'user_credentials',
  'user_profiles',
  'user_session_analytics',
  'user_sessions',
  'users',
  'users',
  'WishlistItems',
  'users_addresses',
  'users_cart_items',
  'users_local',
  'users_measurements',
  'users_orders',
  'users_viewed_items',
  'users_wishlist_items',
  'vendor_analytics',
  'vendor_pre_registrations',
  'vendor_stats',
  'vendor_visits',
  'vvip_audit_log',
  'vvip_audit_logs',
  'vvip_shoppers',
  'waiting_list',
  'web_hits',
  'web_signUp',
  'wishlists'
];

// Remove duplicates from the array
const uniqueCollections = [...new Set(collections)];

async function duplicateCollection(collectionName) {
  const sourceCollection = db.collection(collectionName);
  const targetCollection = db.collection(`staging_${collectionName}`);
  
  console.log(`\n📋 Processing collection: ${collectionName}`);
  
  try {
    // Get all documents from source collection
    const snapshot = await sourceCollection.get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Collection ${collectionName} is empty`);
      return { success: true, count: 0 };
    }
    
    console.log(`   📄 Found ${snapshot.size} documents`);
    
    // Batch write for better performance
    const batch = db.batch();
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore batch limit
    
    for (const doc of snapshot.docs) {
      const targetDocRef = targetCollection.doc(doc.id);
      batch.set(targetDocRef, doc.data());
      batchCount++;
      
      // Commit batch if we reach the limit
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} documents`);
        batchCount = 0;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} documents`);
    }
    
    console.log(`   🎉 Successfully duplicated ${snapshot.size} documents to staging_${collectionName}`);
    return { success: true, count: snapshot.size };
    
  } catch (error) {
    console.error(`   ❌ Error duplicating ${collectionName}:`, error.message);
    return { success: false, error: error.message, count: 0 };
  }
}

async function duplicateSubcollections(collectionName) {
  console.log(`\n🔍 Checking for subcollections in ${collectionName}...`);
  
  try {
    const sourceCollection = db.collection(collectionName);
    const snapshot = await sourceCollection.limit(10).get(); // Sample a few documents
    
    for (const doc of snapshot.docs) {
      const subcollections = await doc.ref.listCollections();
      
      if (subcollections.length > 0) {
        console.log(`   📁 Found subcollections in ${collectionName}/${doc.id}:`);
        
        for (const subcollection of subcollections) {
          console.log(`      - ${subcollection.id}`);
          
          // Duplicate subcollection
          const subSnapshot = await subcollection.get();
          if (!subSnapshot.empty) {
            const targetDocRef = db.collection(`staging_${collectionName}`).doc(doc.id);
            const targetSubcollection = targetDocRef.collection(subcollection.id);
            
            const batch = db.batch();
            subSnapshot.docs.forEach(subDoc => {
              batch.set(targetSubcollection.doc(subDoc.id), subDoc.data());
            });
            
            await batch.commit();
            console.log(`      ✅ Duplicated ${subSnapshot.size} documents in subcollection ${subcollection.id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error(`   ❌ Error checking subcollections for ${collectionName}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting Firebase collection duplication...');
  console.log(`📊 Collections to process: ${uniqueCollections.length}`);
  console.log('📋 Collections:', uniqueCollections.join(', '));
  
  const results = {
    successful: 0,
    failed: 0,
    totalDocuments: 0,
    errors: []
  };
  
  // Process collections sequentially to avoid rate limits
  for (const collection of uniqueCollections) {
    const result = await duplicateCollection(collection);
    
    if (result.success) {
      results.successful++;
      results.totalDocuments += result.count;
      
      // Also check and duplicate subcollections
      await duplicateSubcollections(collection);
    } else {
      results.failed++;
      results.errors.push({ collection, error: result.error });
    }
    
    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 DUPLICATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successful: ${results.successful} collections`);
  console.log(`❌ Failed: ${results.failed} collections`);
  console.log(`📄 Total documents duplicated: ${results.totalDocuments}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ collection, error }) => {
      console.log(`   - ${collection}: ${error}`);
    });
  }
  
  console.log('\n🎉 Duplication process completed!');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});