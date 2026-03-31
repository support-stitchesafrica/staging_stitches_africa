#!/usr/bin/env node
/**
 * Seeds the marketing dashboard super admin account.
 * Run with: npx ts-node --project scripts/tsconfig.json scripts/seed-marketing-super-admin.ts
 */

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { adminAuth, adminDb } from '../lib/firebase-admin';

const SUPER_ADMIN = {
  email: 'uchinedu@stitchesafrica.com',
  password: 'Pat@234chi',
  fullName: 'Uchinedu Stitches',
  phoneNumber: '+2348000000000',
  companyName: 'STITCHES Africa',
};

async function main() {
  console.log('🔐 Seeding marketing super admin…');

  // Check if super admin already exists in Firestore
  const existing = await adminDb
    .collection('staging_marketing_users')
    .where('role', '==', 'super_admin')
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log('⚠️  Super admin already exists — checking Firebase Auth user…');
  }

  // Create or update Firebase Auth user
  let uid: string;
  try {
    const existingAuthUser = await adminAuth.getUserByEmail(SUPER_ADMIN.email);
    uid = existingAuthUser.uid;
    // Update password in case it changed
    await adminAuth.updateUser(uid, {
      password: SUPER_ADMIN.password,
      displayName: SUPER_ADMIN.fullName,
      emailVerified: true,
    });
    console.log(`✅ Firebase Auth user updated: ${uid}`);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      const newUser = await adminAuth.createUser({
        email: SUPER_ADMIN.email,
        password: SUPER_ADMIN.password,
        displayName: SUPER_ADMIN.fullName,
        emailVerified: true,
      });
      uid = newUser.uid;
      console.log(`✅ Firebase Auth user created: ${uid}`);
    } else {
      throw err;
    }
  }

  // Upsert Firestore profile
  await adminDb.collection('staging_marketing_users').doc(uid).set(
    {
      email: SUPER_ADMIN.email,
      name: SUPER_ADMIN.fullName,
      phoneNumber: SUPER_ADMIN.phoneNumber,
      role: 'super_admin',
      isActive: true,
      companyName: SUPER_ADMIN.companyName,
      updatedAt: new Date(),
    },
    { merge: true },
  );

  console.log('✅ Firestore profile upserted in staging_marketing_users');
  console.log('');
  console.log('🎉  Done!');
  console.log(`   Email    : ${SUPER_ADMIN.email}`);
  console.log(`   Password : ${SUPER_ADMIN.password}`);
  console.log(`   Role     : super_admin`);
  console.log(`   UID      : ${uid}`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
