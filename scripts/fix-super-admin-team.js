/**
 * Script to fix super admin team assignment
 * Super admins should be able to access everything without being assigned to a team
 */

const admin = require('firebase-admin');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Initialize Firebase Admin
let serviceAccount = {};

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
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

async function fixSuperAdmin() {
  try {
    const email = process.argv[2] || 'uchinedu@stitchesafrica.com';
    
    console.log(`\nFixing super admin access for: ${email}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Get user from marketing_users
    const usersSnapshot = await db.collection('marketing_users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.error('❌ User not found in marketing_users collection');
      console.log('Please run: npm run setup:marketing-admin', email);
      process.exit(1);
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    console.log(`✓ Found user: ${userId}`);
    console.log(`  Current role: ${userData.role}`);
    console.log(`  Current team: ${userData.teamId || 'None'}`);
    
    // Update user to explicitly allow access without team for super_admin
    await db.collection('marketing_users').doc(userId).update({
      role: 'super_admin',
      isActive: true,
      teamId: null, // Super admins don't need a team
      teamName: null,
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
    });
    
    console.log('\n✅ Super admin access fixed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Changes made:');
    console.log('  • Confirmed super_admin role');
    console.log('  • Removed team requirement');
    console.log('  • Verified all permissions');
    console.log('\n📱 Next Steps:');
    console.log('1. Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('2. If you still see Firestore errors:');
    console.log('   - Disable browser extensions (especially ad blockers)');
    console.log('   - Try in incognito/private mode');
    console.log('3. You should now have full access to all pages\n');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

fixSuperAdmin();
