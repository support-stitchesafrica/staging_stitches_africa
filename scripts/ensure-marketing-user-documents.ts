/**
 * Script to ensure marketing user documents exist in Firestore
 * This should be run once to fix any existing users who don't have marketing_users documents
 */

import { adminAuth, adminDb } from '../lib/firebase-admin';

async function ensureMarketingUserDocuments() {
  try {
    console.log('Starting marketing user document creation...');

    // Get all Firebase Auth users with company email domains
    const validDomains = ['@stitchesafrica.com', '@stitchesafrica.pro'];
    const listUsersResult = await adminAuth.listUsers();
    
    const companyUsers = listUsersResult.users.filter(user => 
      user.email && validDomains.some(domain => user.email!.endsWith(domain))
    );

    console.log(`Found ${companyUsers.length} company users`);

    // Check if super admin exists
    const superAdminsSnapshot = await adminDb
      .collection('marketing_users')
      .where('role', '==', 'super_admin')
      .limit(1)
      .get();
    
    const hasSuperAdmin = !superAdminsSnapshot.empty;
    console.log(`Super admin exists: ${hasSuperAdmin}`);

    let createdCount = 0;
    let updatedCount = 0;

    for (const user of companyUsers) {
      if (!user.email) continue;

      const userDoc = await adminDb.collection('marketing_users').doc(user.uid).get();
      
      if (!userDoc.exists) {
        // Create marketing user document
        const role = !hasSuperAdmin && createdCount === 0 ? 'super_admin' : 'super_admin';
        
        const userProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          role,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await adminDb.collection('marketing_users').doc(user.uid).set(userProfile);
        console.log(`Created marketing user document for: ${user.email} (${role})`);
        createdCount++;
      } else {
        // Update existing document to ensure it has all required fields
        const userData = userDoc.data();
        const updates: any = {};
        
        if (!userData?.uid) updates.uid = user.uid;
        if (!userData?.name) updates.name = user.displayName || user.email.split('@')[0];
        if (!userData?.isActive) updates.isActive = true;
        if (!userData?.updatedAt) updates.updatedAt = new Date();
        
        if (Object.keys(updates).length > 0) {
          await adminDb.collection('marketing_users').doc(user.uid).update(updates);
          console.log(`Updated marketing user document for: ${user.email}`);
          updatedCount++;
        }
      }
    }

    console.log(`\nCompleted marketing user document creation:`);
    console.log(`- Created: ${createdCount} documents`);
    console.log(`- Updated: ${updatedCount} documents`);
    console.log(`- Total company users: ${companyUsers.length}`);

  } catch (error) {
    console.error('Error ensuring marketing user documents:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  ensureMarketingUserDocuments()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { ensureMarketingUserDocuments };