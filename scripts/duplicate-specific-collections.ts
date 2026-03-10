#!/usr/bin/env node

/**
 * Script to duplicate specific collections with staging_ prefix
 */

import { adminDb } from '../lib/firebase-admin';

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

interface DuplicationResult {
  success: boolean;
  count: number;
  error?: string;
}

async function duplicateCollection(collectionName: string): Promise<DuplicationResult> {
  const sourceCollection = adminDb.collection(collectionName);
  const targetCollection = adminDb.collection(`staging_${collectionName}`);
  
  console.log(`\n📋 Processing collection: ${collectionName}`);
  
  try {
    // Get all documents from source collection
    const snapshot = await sourceCollection.get();
    
    if (snapshot.empty) {
      console.log(`   ⚠️  Collection ${collectionName} is empty`);
      return { success: true, count: 0 };
    }
    
    console.log(`   📄 Found ${snapshot.size} documents`);
    
    // Process in batches for better performance
    const batchSize = 500;
    const batches = [];
    
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batch = adminDb.batch();
      const batchDocs = snapshot.docs.slice(i, i + batchSize);
      
      batchDocs.forEach(doc => {
        const targetDocRef = targetCollection.doc(doc.id);
        batch.set(targetDocRef, doc.data());
      });
      
      batches.push(batch);
    }
    
    // Execute all batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit();
      console.log(`   ✅ Committed batch ${i + 1}/${batches.length}`);
    }
    
    console.log(`   🎉 Successfully duplicated ${snapshot.size} documents to staging_${collectionName}`);
    return { success: true, count: snapshot.size };
    
  } catch (error: any) {
    console.error(`   ❌ Error duplicating ${collectionName}:`, error.message);
    return { success: false, error: error.message, count: 0 };
  }
}

async function duplicateSubcollections(collectionName: string): Promise<void> {
  console.log(`\n🔍 Checking for subcollections in ${collectionName}...`);
  
  try {
    const sourceCollection = adminDb.collection(collectionName);
    const snapshot = await sourceCollection.limit(10).get();
    
    for (const doc of snapshot.docs) {
      const subcollections = await doc.ref.listCollections();
      
      if (subcollections.length > 0) {
        console.log(`   📁 Found subcollections in ${collectionName}/${doc.id}:`);
        
        for (const subcollection of subcollections) {
          console.log(`      - ${subcollection.id}`);
          
          const subSnapshot = await subcollection.get();
          if (!subSnapshot.empty) {
            const targetDocRef = adminDb.collection(`staging_${collectionName}`).doc(doc.id);
            const targetSubcollection = targetDocRef.collection(subcollection.id);
            
            const batch = adminDb.batch();
            subSnapshot.docs.forEach(subDoc => {
              batch.set(targetSubcollection.doc(subDoc.id), subDoc.data());
            });
            
            await batch.commit();
            console.log(`      ✅ Duplicated ${subSnapshot.size} documents in subcollection ${subcollection.id}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error(`   ❌ Error checking subcollections for ${collectionName}:`, error.message);
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting specific collection duplication...');
  console.log(`📊 Collections to process: ${COLLECTIONS_TO_DUPLICATE.length}`);
  console.log('📋 Collections:', COLLECTIONS_TO_DUPLICATE.join(', '));
  
  const results = {
    successful: 0,
    failed: 0,
    totalDocuments: 0,
    errors: [] as Array<{ collection: string; error: string }>
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
      if (result.error) {
        results.errors.push({ collection, error: result.error });
      }
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

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { duplicateCollection, duplicateSubcollections, main };