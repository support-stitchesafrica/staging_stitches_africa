/**
 * Script to manually add a Firebase Auth user to the marketing system
 * Run with: npx ts-node scripts/add-marketing-user.ts
 */

import { adminAuth, adminDb } from '../lib/firebase-admin';

async function addMarketingUser(email: string, name: string, role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member') {
  try {
    // Get the Firebase Auth user by email
    const userRecord = await adminAuth.getUserByEmail(email);
    
    console.log(`Found Firebase user: ${userRecord.uid} - ${userRecord.email}`);
    
    // Check if user already exists in marketing system
    const existingDoc = await adminDb.collection('marketing_users').doc(userRecord.uid).get();
    
    if (existingDoc.exists) {
      console.log('User already exists in marketing system');
      return;
    }
    
    // Create marketing user profile
    const userProfile = {
      email: userRecord.email,
      name: name,
      phoneNumber: userRecord.phoneNumber || '',
      role: role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await adminDb.collection('marketing_users').doc(userRecord.uid).set(userProfile);
    
    console.log(`✅ Successfully added ${email} to marketing system with role: ${role}`);
    console.log(`Document ID: ${userRecord.uid}`);
    
  } catch (error) {
    console.error('Error adding user:', error);
  }
}

// Usage: Update these values
const EMAIL = 'uchinedu@stitchesafrica.com';
const NAME = 'Uchinedu';
const ROLE = 'super_admin';

addMarketingUser(EMAIL, NAME, ROLE);
