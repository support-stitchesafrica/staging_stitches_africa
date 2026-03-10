/**
 * Script to create a test VVIP user for testing the checkout functionality
 * Run this with: npx tsx scripts/create-test-vvip-user.ts user-email@domain.com
 */

import { adminDb, adminAuth } from '../lib/firebase-admin';

async function createTestVvipUser() {
  try {
    // Get user email from command line
    const email = process.argv[2];
    
    if (!email) {
      console.log('Usage: npx tsx scripts/create-test-vvip-user.ts user-email@domain.com');
      process.exit(1);
    }
    
    console.log(`Creating test VVIP user for: ${email}`);
    
    // Find user by email in Firebase Auth
    let user;
    try {
      user = await adminAuth.getUserByEmail(email);
    } catch (error: any) {
      console.error(`❌ User not found with email: ${email}`);
      console.log('Please make sure the user exists in Firebase Authentication');
      process.exit(1);
    }
    
    console.log(`✓ Found user: ${user.uid}`);
    
    // Check if user is already VVIP
    const existingVvipQuery = await adminDb
      .collection('vvip_shoppers')
      .where('userId', '==', user.uid)
      .get();
    
    if (!existingVvipQuery.empty) {
      console.log('✓ User is already a VVIP shopper');
      process.exit(0);
    }
    
    // Create VVIP shopper record
    const vvipData = {
      userId: user.uid,
      email: user.email,
      name: user.displayName || email.split('@')[0],
      status: 'active',
      createdAt: new Date(),
      createdBy: 'system',
      createdByEmail: 'system@stitchesafrica.com',
      updatedAt: new Date(),
      metadata: {
        source: 'test_script',
        createdByRole: 'system',
      }
    };
    
    const vvipDocRef = await adminDb.collection('vvip_shoppers').add(vvipData);
    console.log(`✅ VVIP shopper created with ID: ${vvipDocRef.id}`);
    
    // Log the action for audit purposes
    await adminDb.collection('vvip_audit_log').add({
      action: 'create_vvip',
      userId: user.uid,
      vvipId: vvipDocRef.id,
      performedBy: 'system',
      performedByEmail: 'system@stitchesafrica.com',
      performedByRole: 'system',
      timestamp: new Date(),
      details: {
        userEmail: user.email,
        userName: user.displayName || email.split('@')[0],
        source: 'test_script',
      }
    });
    
    console.log('✅ Audit log created');
    console.log(`\n🎉 User ${email} is now a VVIP shopper!`);
    console.log('They will see manual payment options during checkout.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error creating test VVIP user:', error);
    process.exit(1);
  }
}

createTestVvipUser();