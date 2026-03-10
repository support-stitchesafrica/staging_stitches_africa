/**
 * Script to set up a super admin user in the marketing system
 * Run this with: node scripts/setup-marketing-super-admin.js your-email@stitchesafrica.com
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Initialize Firebase Admin
let serviceAccount = {};

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    console.log('Using Firebase service account from BASE64 env var');
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('Using Firebase service account from JSON env var');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    console.error('❌ No Firebase service account key found!');
    console.error('Please set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 in your .env file');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error parsing Firebase service account:', error.message);
  process.exit(1);
}

// Initialize app
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function setupSuperAdmin() {
  try {
    // Get user email from command line or use default
    const email = process.argv[2] || 'uchinaidu@stitchesafrica.com';
    
    console.log(`\nSetting up super admin for: ${email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Find or create user in Firebase Auth
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`✓ Found existing user in Firebase Auth`);
      console.log(`  User ID: ${user.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.log(`✓ User not found, creating new user...`);
        // Create new user
        const password = Math.random().toString(36).slice(-12) + 'A1!'; // Random password
        user = await auth.createUser({
          email: email,
          emailVerified: true,
          password: password,
          displayName: email.split('@')[0],
        });
        console.log(`✓ Created new user in Firebase Auth`);
        console.log(`  User ID: ${user.uid}`);
        console.log(`  Temporary Password: ${password}`);
        console.log(`  ⚠️  Please change this password after first login!`);
      } else {
        console.error(`❌ Error checking user: ${error.message}`);
        process.exit(1);
      }
    }
    
    // Create or update marketing user document
    const marketingUserRef = db.collection('marketing_users').doc(user.uid);
    
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
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    
    console.log('\n✅ Super admin user set up successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`User ID: ${user.uid}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: super_admin`);
    console.log(`Status: Active`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📱 Next Steps:');
    console.log('1. Go to: http://localhost:3002/marketing/auth/login');
    console.log('2. Log in with your email');
    console.log('3. You now have full super admin access!');
    console.log('\n📚 Features you can access:');
    console.log('  • /marketing/vendors - Manage all vendors');
    console.log('  • /marketing/admin - Super admin dashboard');
    console.log('  • /marketing/admin/teams - Manage teams');
    console.log('  • /marketing/users - Manage users');
    console.log('  • /marketing/analytics - View all analytics\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error setting up super admin:', error.message);
    console.error('\nPlease check:');
    console.error('1. Firebase Admin SDK is properly configured');
    console.error('2. FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is set in .env');
    console.error('3. You have internet connection\n');
    process.exit(1);
  }
}

setupSuperAdmin();
