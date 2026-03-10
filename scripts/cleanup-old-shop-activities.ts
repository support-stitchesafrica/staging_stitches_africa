/**
 * Shop Activities Data Retention Cleanup Script
 * 
 * This script archives or deletes shop_activities older than 12 months
 * to comply with the data retention policy.
 * 
 * Requirements: 21.1, 21.7, 22.1
 * 
 * Usage:
 *   npx ts-node scripts/cleanup-old-shop-activities.ts [--dry-run] [--batch-size=500]
 * 
 * Options:
 *   --dry-run: Preview what would be deleted without actually deleting
 *   --batch-size: Number of documents to process per batch (default: 500)
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import * as path from 'path';

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '../stitches-africa-firebase-adminsdk-vl97x-85a4dbb0ed.json'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

// Configuration
const DATA_RETENTION_MONTHS = 12;
const DEFAULT_BATCH_SIZE = 500;

interface CleanupStats {
  totalProcessed: number;
  totalDeleted: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
}

/**
 * Calculate the cutoff date for data retention
 */
function getRetentionCutoffDate(): Date {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - DATA_RETENTION_MONTHS);
  return cutoff;
}

/**
 * Delete old shop activities in batches
 */
async function cleanupOldActivities(
  dryRun: boolean = false,
  batchSize: number = DEFAULT_BATCH_SIZE
): Promise<CleanupStats> {
  const stats: CleanupStats = {
    totalProcessed: 0,
    totalDeleted: 0,
    errors: 0,
    startTime: new Date()
  };

  const cutoffDate = getRetentionCutoffDate();
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Shop Activities Cleanup Script`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no deletions)' : 'LIVE (will delete)'}`);
  console.log(`Cutoff Date: ${cutoffDate.toISOString()}`);
  console.log(`Batch Size: ${batchSize}`);
  console.log(`Data Retention: ${DATA_RETENTION_MONTHS} months`);
  console.log(`${'='.repeat(60)}\n`);

  let hasMore = true;
  let batchCount = 0;

  while (hasMore) {
    batchCount++;
    console.log(`Processing batch ${batchCount}...`);

    try {
      // Query for old activities
      const snapshot = await db
        .collection('shop_activities')
        .where('timestamp', '<', cutoffTimestamp)
        .orderBy('timestamp', 'asc')
        .limit(batchSize)
        .get();

      if (snapshot.empty) {
        hasMore = false;
        console.log('No more old activities found.');
        break;
      }

      stats.totalProcessed += snapshot.size;

      if (!dryRun) {
        // Delete in batch
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        stats.totalDeleted += snapshot.size;
        console.log(`✓ Deleted ${snapshot.size} activities`);
      } else {
        console.log(`✓ Would delete ${snapshot.size} activities (dry run)`);
        stats.totalDeleted += snapshot.size;
      }

      // Log sample of what's being deleted
      if (snapshot.size > 0) {
        const firstDoc = snapshot.docs[0].data();
        const lastDoc = snapshot.docs[snapshot.size - 1].data();
        console.log(`  Date range: ${firstDoc.timestamp.toDate().toISOString()} to ${lastDoc.timestamp.toDate().toISOString()}`);
      }

      // Small delay to avoid overwhelming Firestore
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`✗ Error processing batch ${batchCount}:`, error);
      stats.errors++;
      
      // Continue with next batch even if one fails
      if (stats.errors > 5) {
        console.error('Too many errors, stopping cleanup.');
        hasMore = false;
      }
    }
  }

  stats.endTime = new Date();
  return stats;
}

/**
 * Get statistics about shop activities
 */
async function getActivityStats(): Promise<void> {
  console.log('\nGathering statistics...\n');

  const cutoffDate = getRetentionCutoffDate();
  const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

  try {
    // Count old activities
    const oldActivitiesSnapshot = await db
      .collection('shop_activities')
      .where('timestamp', '<', cutoffTimestamp)
      .count()
      .get();

    const oldCount = oldActivitiesSnapshot.data().count;

    // Get oldest activity
    const oldestSnapshot = await db
      .collection('shop_activities')
      .orderBy('timestamp', 'asc')
      .limit(1)
      .get();

    const oldestDate = oldestSnapshot.empty 
      ? 'N/A' 
      : oldestSnapshot.docs[0].data().timestamp.toDate().toISOString();

    // Get newest activity
    const newestSnapshot = await db
      .collection('shop_activities')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    const newestDate = newestSnapshot.empty 
      ? 'N/A' 
      : newestSnapshot.docs[0].data().timestamp.toDate().toISOString();

    console.log('Activity Statistics:');
    console.log(`  Activities older than ${DATA_RETENTION_MONTHS} months: ${oldCount}`);
    console.log(`  Oldest activity: ${oldestDate}`);
    console.log(`  Newest activity: ${newestDate}`);
    console.log(`  Cutoff date: ${cutoffDate.toISOString()}`);
    console.log('');

  } catch (error) {
    console.error('Error gathering statistics:', error);
  }
}

/**
 * Print cleanup summary
 */
function printSummary(stats: CleanupStats): void {
  const duration = stats.endTime 
    ? (stats.endTime.getTime() - stats.startTime.getTime()) / 1000 
    : 0;

  console.log(`\n${'='.repeat(60)}`);
  console.log('Cleanup Summary');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Processed: ${stats.totalProcessed}`);
  console.log(`Total Deleted: ${stats.totalDeleted}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Duration: ${duration.toFixed(2)} seconds`);
  console.log(`${'='.repeat(60)}\n`);
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
  const batchSize = batchSizeArg 
    ? parseInt(batchSizeArg.split('=')[1], 10) 
    : DEFAULT_BATCH_SIZE;

  try {
    // Show current statistics
    await getActivityStats();

    // Confirm if not dry run
    if (!dryRun) {
      console.log('⚠️  WARNING: This will permanently delete old activities!');
      console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Run cleanup
    const stats = await cleanupOldActivities(dryRun, batchSize);

    // Print summary
    printSummary(stats);

    if (dryRun) {
      console.log('💡 This was a dry run. Run without --dry-run to actually delete activities.\n');
    } else {
      console.log('✓ Cleanup completed successfully!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main();
