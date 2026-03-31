#!/usr/bin/env node
/**
 * Copies all documents from `vendor_pre_registrations` into
 * `staging_vendor_pre_registrations`, preserving document IDs.
 *
 * Safe to re-run — existing staging docs are overwritten (merge: false).
 *
 * Run with:
 *   npx ts-node --project scripts/tsconfig.json scripts/seed-vendor-pre-registrations.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { adminDb } from '../lib/firebase-admin';

const SOURCE = 'vendor_pre_registrations';
const TARGET = 'staging_vendor_pre_registrations';

async function main() {
  console.log(`📋 Copying ${SOURCE} → ${TARGET}…`);

  const snapshot = await adminDb.collection(SOURCE).get();

  if (snapshot.empty) {
    console.log('⚠️  Source collection is empty — nothing to copy.');
    return;
  }

  console.log(`   Found ${snapshot.size} document(s).`);

  const BATCH_SIZE = 400; // Firestore batch limit is 500
  let batch = adminDb.batch();
  let count = 0;
  let total = 0;

  for (const docSnap of snapshot.docs) {
    const targetRef = adminDb.collection(TARGET).doc(docSnap.id);
    batch.set(targetRef, docSnap.data());
    count++;
    total++;

    if (count === BATCH_SIZE) {
      await batch.commit();
      console.log(`   ✅ Committed batch of ${count}`);
      batch = adminDb.batch();
      count = 0;
    }
  }

  if (count > 0) {
    await batch.commit();
    console.log(`   ✅ Committed final batch of ${count}`);
  }

  console.log(`\n🎉 Done — ${total} document(s) copied to ${TARGET}.`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
