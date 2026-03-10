#!/usr/bin/env node

/**
 * Script to delete all documents from specific staging collections (TypeScript)
 */

import { adminDb } from '../lib/firebase-admin';
import * as readline from 'readline';

// Collections to clear
const COLLECTIONS_TO_CLEAR = [
  'staging_tailor_works',
  'staging_tailor_works_local',
  'staging_tailors',
  'staging_tailors_local',
  'staging_users',
  'staging_users_local'
];

interface ClearResult {
  success: boolean;
  count: number;
  error?: string;
}

async function clearCollection(collectionName: string): Promise<ClearResult> {
  console.log(`\n🗑️  Clearing collection: ${collectionName}`);
  
  try {
    const collectionRef = adminDb.collection(collectionName);
    
    // Get all documents
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`   ℹ️  Collection ${collectionName} is already empty`);
      return { success: true, count: 0 };
    }
    
    console.log(`   📄 Found ${snapshot.size} documents to delete`);
    
    // Delete in batches
    const batchSize = 500;
    let deletedCount = 0;
    
    while (true) {
      // Get a batch of documents
      const batchSnapshot = await collectionRef.limit(batchSize).get();
      
      if (batchSnapshot.empty) {
        break;
      }
      
      // Create batch delete
      const batch = adminDb.batch();
      batchSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Commit the batch
      await batch.commit();
      deletedCount += batchSnapshot.size;
      
      console.log(`   ✅ Deleted ${batchSnapshot.size} documents (${deletedCount} total)`);
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`   🎉 Successfully cleared ${deletedCount} documents from ${collectionName}`);
    return { success: true, count: deletedCount };
    
  } catch (error: any) {
    console.error(`   ❌ Error clearing ${collectionName}:`, error.message);
    return { success: false, error: error.message, count: 0 };
  }
}

async function clearSubcollections(collectionName: string): Promise<void> {
  console.log(`\n🔍 Checking for subcollections in ${collectionName}...`);
  
  try {
    const collectionRef = adminDb.collection(collectionName);
    const snapshot = await collectionRef.limit(10).get();
    
    for (const doc of snapshot.docs) {
      const subcollections = await doc.ref.listCollections();
      
      if (subcollections.length > 0) {
        console.log(`   📁 Found subcollections in ${collectionName}/${doc.id}:`);
        
        for (const subcollection of subcollections) {
          console.log(`      🗑️  Clearing subcollection: ${subcollection.id}`);
          
          const subSnapshot = await subcollection.get();
          if (!subSnapshot.empty) {
            const batch = adminDb.batch();
            subSnapshot.docs.forEach(subDoc => {
              batch.delete(subDoc.ref);
            });
            
            await batch.commit();
            console.log(`      ✅ Cleared ${subSnapshot.size} documents from subcollection ${subcollection.id}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error(`   ❌ Error checking subcollections for ${collectionName}:`, error.message);
  }
}

async function askConfirmation(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question('\n⚠️  This will permanently delete ALL documents from the specified staging collections. Continue? (y/N): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main(): Promise<void> {
  console.log('🚀 Starting staging collection cleanup...');
  console.log(`📊 Collections to clear: ${COLLECTIONS_TO_CLEAR.length}`);
  console.log('📋 Collections:', COLLECTIONS_TO_CLEAR.join(', '));
  
  // Confirmation prompt
  const confirmed = await askConfirmation();
  
  if (!confirmed) {
    console.log('\n❌ Operation cancelled.');
    return;
  }
  
  console.log('\n✅ Starting deletion process...\n');
  
  const results = {
    successful: 0,
    failed: 0,
    totalDocuments: 0,
    errors: [] as Array<{ collection: string; error: string }>
  };
  
  // Process collections sequentially
  for (const collection of COLLECTIONS_TO_CLEAR) {
    const result = await clearCollection(collection);
    
    if (result.success) {
      results.successful++;
      results.totalDocuments += result.count;
      
      // Also clear subcollections if any exist
      await clearSubcollections(collection);
    } else {
      results.failed++;
      if (result.error) {
        results.errors.push({ collection, error: result.error });
      }
    }
    
    // Small delay between collections
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 CLEANUP SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully cleared: ${results.successful} collections`);
  console.log(`❌ Failed to clear: ${results.failed} collections`);
  console.log(`🗑️  Total documents deleted: ${results.totalDocuments}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ collection, error }) => {
      console.log(`   - ${collection}: ${error}`);
    });
  }
  
  console.log('\n🎉 Staging collection cleanup completed!');
  
  if (results.successful > 0) {
    console.log('\n📋 Cleared collections:');
    COLLECTIONS_TO_CLEAR.forEach(collection => {
      console.log(`   - ${collection} (now empty)`);
    });
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

export { clearCollection, clearSubcollections, main };