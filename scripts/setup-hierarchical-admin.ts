#!/usr/bin/env tsx

/**
 * Script to set up a hierarchical referral admin user
 * This creates an admin document in the hierarchical_admins collection
 */

import { adminDb, adminAuth } from '../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'moderator';
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

async function setupHierarchicalAdmin() {
  try {
    console.log('🔧 Setting up hierarchical referral admin user...');

    // Get the user email - replace with your email
    const userEmail = 'uchinedu@stitchesafrica.com'; // Replace with your email
    
    console.log(`👤 Setting up user: ${userEmail}`);

    // Get the Firebase user by email
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUserByEmail(userEmail);
      console.log('✅ Firebase user found:', firebaseUser.uid);
    } catch (error) {
      console.error('❌ Firebase user not found. Please ensure the user exists in Firebase Auth.');
      return;
    }

    // Check if admin user already exists
    const adminDoc = await adminDb.collection('hierarchical_admins').doc(firebaseUser.uid).get();
    
    if (adminDoc.exists) {
      console.log('📋 Hierarchical admin already exists. Updating...');
    } else {
      console.log('📝 Creating new hierarchical admin record...');
    }

    const adminData: AdminUser = {
      uid: firebaseUser.uid,
      email: firebaseUser.email!,
      name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'System Administrator',
      role: 'super_admin',
      isActive: true,
      createdAt: adminDoc.exists ? adminDoc.data()?.createdAt : Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    // Create or update the admin document
    await adminDb
      .collection('hierarchical_admins')
      .doc(firebaseUser.uid)
      .set(adminData, { merge: true });

    console.log('✅ Hierarchical referral admin user created successfully!');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`👤 Name: ${adminData.name}`);
    console.log(`🔑 Role: ${adminData.role}`);
    console.log(`🆔 UID: ${firebaseUser.uid}`);

    // Verify the document was created
    const doc = await adminDb
      .collection('hierarchical_admins')
      .doc(firebaseUser.uid)
      .get();

    if (doc.exists) {
      console.log('✅ Admin document verified in Firestore');
      console.log('🎉 Setup complete! You can now access the hierarchical referral admin dashboard.');
    } else {
      console.error('❌ Failed to verify admin document creation');
    }

  } catch (error) {
    console.error('❌ Error setting up hierarchical admin:', error);
    process.exit(1);
  }
}

// Run the setup
setupHierarchicalAdmin()
  .then(() => {
    console.log('🏁 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });