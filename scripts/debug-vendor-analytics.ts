#!/usr/bin/env tsx

import { db } from '@/firebase';
import { collection, query, getDocs, limit, where } from 'firebase/firestore';

async function debugVendorAnalytics() {
  console.log('🔍 Debugging Vendor Analytics Data...\n');
  
  try {
    // Test shop_activities collection
    console.log('📊 Testing shop_activities collection...');
    const activitiesQuery = query(collection(db, 'shop_activities'), limit(10));
    const activitiesSnapshot = await getDocs(activitiesQuery);
    console.log(`Found ${activitiesSnapshot.size} activities`);
    
    activitiesSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Activity ${index + 1}:`, {
        id: doc.id,
        type: data.type,
        vendorId: data.vendorId,
        userId: data.userId,
        timestamp: data.timestamp,
        hasMetadata: !!data.metadata
      });
    });

    // Test vendor_visits collection
    console.log('\n👥 Testing vendor_visits collection...');
    const visitsQuery = query(collection(db, 'vendor_visits'), limit(10));
    const visitsSnapshot = await getDocs(visitsQuery);
    console.log(`Found ${visitsSnapshot.size} vendor visit records`);
    
    visitsSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Vendor Visit ${index + 1}:`, {
        id: doc.id,
        vendor_id: data.vendor_id,
        vendor_name: data.vendor_name,
        total_visits: data.total_visits,
        first_visit: data.first_visit,
        last_visit: data.last_visit
      });
    });

    // Test users collection for vendors
    console.log('\n👤 Testing users collection for vendors...');
    const usersQuery = query(collection(db, 'staging_users'), where('role', '==', 'tailor'), limit(10));
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`Found ${usersSnapshot.size} users with role=tailor`);
    
    usersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Vendor ${index + 1}:`, {
        id: doc.id,
        role: data.role,
        fullName: data.fullName,
        businessName: data.businessName,
        displayName: data.displayName,
        email: data.email
      });
    });

    // Test all users to see role distribution
    console.log('\n📈 Testing all users for role distribution...');
    const allUsersQuery = query(collection(db, 'staging_users'), limit(50));
    const allUsersSnapshot = await getDocs(allUsersQuery);
    
    const roleDistribution: Record<string, number> = {};
    allUsersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const role = data.role || 'no_role';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });
    
    console.log('Role distribution:', roleDistribution);

    console.log('\n📊 Summary:');
    console.log(`- Activities: ${activitiesSnapshot.size}`);
    console.log(`- Vendor Visits: ${visitsSnapshot.size}`);
    console.log(`- Vendors (tailors): ${usersSnapshot.size}`);
    console.log(`- Total Users: ${allUsersSnapshot.size}`);
    console.log('- Role Distribution:', roleDistribution);

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug function
debugVendorAnalytics().then(() => {
  console.log('\n✅ Debug completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug script failed:', error);
  process.exit(1);
});