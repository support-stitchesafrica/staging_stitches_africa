/**
 * Script to set up a super admin user in the marketing system
 * Run this with: npm run setup:marketing-admin your-email@stitchesafrica.com
 */

import { adminDb, adminAuth } from '../lib/firebase-admin';

async function setupSuperAdmin() {
  try {
    // Get user email from command line or use default
    const email = process.argv[2] || 'uchineidu@stitchesafrica.com';
    
    console.log(`Setting up super admin for: ${email}`);
    
    // Find user by email in Firebase Auth
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('Please make sure:');
      console.log('1. The user exists in Firebase Authentication');
      console.log('2. You provided the correct email address');
      console.log('\nUsage: npm run setup:marketing-admin your-email@stitchesafrica.com');
      process.exit(1);
    }
    
    console.log(`✓ Found user: ${user.uid}`);
    
    // Create or update marketing user document
    const marketingUserRef = adminDb.collection('marketing_users').doc(user.uid);
    
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || email.split('@')[0],
      role: 'super_admin',
      isActive: true,
      permissions: {
        canManageUsers: true,
        canManageTeams: true,
        canAssignVendors: true,
        canViewAllAnalytics: true,
        canManageSettings: true,
        canExportData: true,
        canViewAuditLogs: true,
        canManageNotifications: true,
      },
      updatedAt: new Date(),
      createdBy: 'system',
      lastLoginAt: null,
      teamId: null,
      teamName: null,
      assignedVendors: [],
      metadata: {
        setupMethod: 'script',
        setupDate: new Date().toISOString(),
      }
    };
    
    // Check if user already exists
    const existingUser = await marketingUserRef.get();
    if (existingUser.exists) {
      console.log('✓ User already exists in marketing system, updating...');
      await marketingUserRef.update(userData);
    } else {
      console.log('✓ Creating new marketing user...');
      await marketingUserRef.set({
        ...userData,
        createdAt: new Date(),
      });
    }
    
    
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error setting up super admin:', error);
    
    process.exit(1);
  }
}

setupSuperAdmin();
