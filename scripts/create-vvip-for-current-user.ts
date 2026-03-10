/**
 * Script to create VVIP status for the current user (uchinedu@stitchesafrica.com)
 * Run this with: npx tsx scripts/create-vvip-for-current-user.ts
 */

import { adminDb, adminAuth } from '../lib/firebase-admin';

async function createVvipForCurrentUser() {
  try {
    const email = 'uchinedu@stitchesafrica.com';
    
    console.log(`Creating VVIP status for: ${email}`);
    
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
      
      // Update status to active if it's not
      const vvipDoc = existingVvipQuery.docs[0];
      const vvipData = vvipDoc.data();
      
      if (vvipData.status !== 'active') {
        await vvipDoc.ref.update({
          status: 'active',
          updatedAt: new Date(),
        });
        console.log('✅ Updated VVIP status to active');
      }
      
      process.exit(0);
    }
    
    // Get user details from users collection
    const userDoc = await adminDb.collection('users').doc(user.uid).get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    // Create VVIP shopper record
    const vvipData = {
      userId: user.uid,
      email: user.email,
      name: userData?.firstName && userData?.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : user.displayName || email.split('@')[0],
      status: 'active',
      createdAt: new Date(),
      createdBy: 'system',
      createdByEmail: 'system@stitchesafrica.com',
      updatedAt: new Date(),
      metadata: {
        source: 'admin_script',
        createdByRole: 'system',
        userFirstName: userData?.firstName || '',
        userLastName: userData?.lastName || '',
        userCountry: userData?.country || '',
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
        userName: vvipData.name,
        source: 'admin_script',
      }
    });
    
    console.log('✅ Audit log created');
    console.log(`\n🎉 User ${email} is now a VVIP shopper!`);
    console.log('They will see manual payment options during checkout.');
    console.log('The VVIP shoppers list should now show this user.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error creating VVIP status:', error);
    process.exit(1);
  }
}

createVvipForCurrentUser();