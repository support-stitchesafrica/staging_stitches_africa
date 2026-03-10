#!/usr/bin/env node

/**
 * Script to duplicate specific collections with staging_ prefix
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

// Specific collections to duplicate
const COLLECTIONS_TO_DUPLICATE = [
  'storefrontConfigurations',
  'storefront_analytics',
  'storefront_themes',
  'storefronts',
  'sub_collect',
  'subscribers',
  'tailor_works',
  'tailor_works_local'
];

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
    let currentBatch = db.batch();
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore batch limit
    
    for (const doc of snapshot.docs) {
      const targetDocRef = targetCollection.doc(doc.id);
      currentBatch.set(targetDocRef, doc.data());
      batchCount++;
      
      // Commit batch if we reach the limit
      if (batchCount >= maxBatchSize) {
        await currentBatch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} documents`);
        
        // Create new batch for remaining documents
        currentBatch = db.batch();
        batchCount = 0;
      }
    }
    
    // Commit remaining documents
    if (batchCount > 0) {
      await currentBatch.commit();
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
  console.log('🚀 Starting specific collection duplication...');
  console.log(`📊 Collections to process: ${COLLECTIONS_TO_DUPLICATE.length}`);
  console.log('📋 Collections:', COLLECTIONS_TO_DUPLICATE.join(', '));
  
  const results = {
    successful: 0,
    failed: 0,
    totalDocuments: 0,
    errors: []
  };
  
  // Process collections sequentially to avoid rate limits
  for (const collection of COLLECTIONS_TO_DUPLICATE) {
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
  
  console.log('\n🎉 Specific collection duplication completed!');
  
  // Show the created collections
  console.log('\n📋 Created staging collections:');
  COLLECTIONS_TO_DUPLICATE.forEach(collection => {
    console.log(`   - staging_${collection}`);
  });
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