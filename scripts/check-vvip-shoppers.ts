/**
 * Script to check existing VVIP shoppers in the database
 * Run this with: npx tsx scripts/check-vvip-shoppers.ts
 */

import { adminDb } from '../lib/firebase-admin';

async function checkVvipShoppers() {
  try {
    console.log('🔍 Checking VVIP shoppers in database...\n');
    
    // Check vvip_shoppers collection
    const vvipShoppersSnapshot = await adminDb.collection('vvip_shoppers').get();
    
    console.log(`📊 Found ${vvipShoppersSnapshot.size} records in vvip_shoppers collection:`);
    
    if (vvipShoppersSnapshot.empty) {
      console.log('   No VVIP shoppers found in vvip_shoppers collection');
    } else {
      vvipShoppersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. ID: ${doc.id}`);
        console.log(`      User ID: ${data.userId}`);
        console.log(`      Email: ${data.email}`);
        console.log(`      Name: ${data.name}`);
        console.log(`      Status: ${data.status}`);
        console.log(`      Created: ${data.createdAt?.toDate?.()?.toISOString() || 'N/A'}`);
        console.log(`      Created By: ${data.createdBy}`);
        console.log('');
      });
    }
    
    // Also check users collection for isVvip field (legacy approach)
    console.log('🔍 Checking users collection for isVvip field...\n');
    
    const usersWithVvipSnapshot = await adminDb.collection('users').where('isVvip', '==', true).get();
    
    console.log(`📊 Found ${usersWithVvipSnapshot.size} users with isVvip=true in users collection:`);
    
    if (usersWithVvipSnapshot.empty) {
      console.log('   No users found with isVvip=true');
    } else {
      usersWithVvipSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. User ID: ${doc.id}`);
        console.log(`      Email: ${data.email}`);
        console.log(`      Name: ${data.firstName} ${data.lastName}`);
        console.log(`      Country: ${data.country}`);
        console.log(`      VVIP Created: ${data.vvip_created_at?.toDate?.()?.toISOString() || 'N/A'}`);
        console.log(`      VVIP Created By: ${data.vvip_created_by}`);
        console.log('');
      });
    }
    
    // Summary
    console.log('📋 Summary:');
    console.log(`   - vvip_shoppers collection: ${vvipShoppersSnapshot.size} records`);
    console.log(`   - users with isVvip=true: ${usersWithVvipSnapshot.size} records`);
    
    if (vvipShoppersSnapshot.size === 0 && usersWithVvipSnapshot.size === 0) {
      console.log('\n💡 No VVIP shoppers found. Run the following to create one:');
      console.log('   npx tsx scripts/create-vvip-for-current-user.ts');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error checking VVIP shoppers:', error);
    process.exit(1);
  }
}

checkVvipShoppers();