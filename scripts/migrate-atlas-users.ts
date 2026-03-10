/**
 * Migration script for existing Atlas users
 * 
 * This script updates existing atlasUsers documents to include:
 * - role field (defaults to "superadmin" for existing users)
 * - ensures isAtlasUser is set to true
 * - updates the updatedAt timestamp
 * 
 * Usage: npx ts-node scripts/migrate-atlas-users.ts
 */

import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch, Timestamp } from "firebase/firestore";
import type { AtlasRole } from "../lib/atlas/types";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU8mfUgPZZzLPJXZlibKCkei-DifO_LXQ",
  authDomain: "stitches-africa.firebaseapp.com",
  projectId: "stitches-africa",
  storageBucket: "stitches-africa.firebasestorage.app",
  messagingSenderId: "72103487036",
  appId: "1:72103487036:web:ebed8812bf2b5fe4ddc539",
  measurementId: "G-LR7MYF6MJ6",
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

interface MigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Main migration function
 */
async function migrateAtlasUsers(): Promise<void> {
  console.log("🚀 Starting Atlas users migration...\n");

  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Fetch all documents from atlasUsers collection
    console.log("📥 Fetching all documents from atlasUsers collection...");
    const usersSnapshot = await getDocs(collection(db, "atlasUsers"));
    stats.total = usersSnapshot.size;
    console.log(`✅ Found ${stats.total} user(s)\n`);

    if (stats.total === 0) {
      console.log("ℹ️  No users found in atlasUsers collection. Migration complete.");
      return;
    }

    // Process users in batches (Firestore batch limit is 500 operations)
    const BATCH_SIZE = 500;
    let batch = writeBatch(db);
    let batchCount = 0;
    let batchNumber = 1;

    console.log("🔄 Processing users...\n");

    for (const docSnapshot of usersSnapshot.docs) {
      const userData = docSnapshot.data();
      const updates: Record<string, any> = {};
      let needsUpdate = false;

      // Check if role field is missing
      if (!userData.role) {
        updates.role = "superadmin" as AtlasRole;
        needsUpdate = true;
        console.log(`  📝 User ${userData.email || docSnapshot.id}: Adding role "superadmin"`);
      }

      // Ensure isAtlasUser is set to true
      if (userData.isAtlasUser !== true) {
        updates.isAtlasUser = true;
        needsUpdate = true;
        console.log(`  📝 User ${userData.email || docSnapshot.id}: Setting isAtlasUser to true`);
      }

      // Update timestamp if any changes are made
      if (needsUpdate) {
        updates.updatedAt = Timestamp.now();
        batch.update(docSnapshot.ref, updates);
        batchCount++;
        stats.updated++;

        // Commit batch if we reach the limit
        if (batchCount >= BATCH_SIZE) {
          console.log(`\n💾 Committing batch ${batchNumber} (${batchCount} operations)...`);
          await batch.commit();
          console.log(`✅ Batch ${batchNumber} committed successfully\n`);
          
          // Start new batch
          batch = writeBatch(db);
          batchCount = 0;
          batchNumber++;
        }
      } else {
        stats.skipped++;
        console.log(`  ⏭️  User ${userData.email || docSnapshot.id}: Already up to date`);
      }
    }

    // Commit any remaining operations in the final batch
    if (batchCount > 0) {
      console.log(`\n💾 Committing final batch ${batchNumber} (${batchCount} operations)...`);
      await batch.commit();
      console.log(`✅ Final batch committed successfully\n`);
    }

    // Display migration results
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION RESULTS");
    console.log("=".repeat(50));
    console.log(`Total users processed:  ${stats.total}`);
    console.log(`Users updated:          ${stats.updated}`);
    console.log(`Users skipped:          ${stats.skipped}`);
    console.log(`Errors:                 ${stats.errors}`);
    console.log("=".repeat(50));
    console.log("\n✨ Migration completed successfully!");

  } catch (error) {
    console.error("\n❌ Migration failed with error:");
    console.error(error);
    stats.errors++;
    throw error;
  }
}

// Run the migration
migrateAtlasUsers()
  .then(() => {
    console.log("\n👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Fatal error during migration:");
    console.error(error);
    process.exit(1);
  });
