/**
 * Debug script to test analytics data fetching
 * Run this in browser console to debug analytics issues
 */

import { db } from '@/firebase';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';

export async function debugVendorAnalytics(vendorId: string) {
  console.log('🔍 Starting analytics debug for vendor:', vendorId);
  
  try {
    // 1. Check vendor profile
    console.log('\n1️⃣ Checking vendor profile...');
    const vendorDoc = await getDoc(doc(db, "staging_tailors", vendorId));
    if (vendorDoc.exists()) {
      console.log('✅ Vendor found:', vendorDoc.data());
    } else {
      console.error('❌ Vendor not found!');
      return;
    }
    
    // 2. Check products
    console.log('\n2️⃣ Checking products...');
    const productsSnap = await getDocs(
      query(collection(db, "staging_tailor_works"), where('tailor_id', '==', vendorId))
    );
    console.log(`✅ Found ${productsSnap.size} products`);
    productsSnap.docs.forEach(doc => {
      console.log('  Product:', doc.id, doc.data().title);
    });
    
    // 3. Check orders
    console.log('\n3️⃣ Checking orders...');
    const usersSnap = await getDocs(collection(db, "staging_users"));
    console.log(`Found ${usersSnap.size} users, checking their orders...`);
    
    let totalOrders = 0;
    const orders: any[] = [];
    
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      try {
        const userOrdersSnap = await getDocs(
          collection(db, 'users_orders', userId, 'user_orders')
        );
        
        userOrdersSnap.docs.forEach(orderDoc => {
          const data = orderDoc.data();
          if (data.tailor_id === vendorId) {
            totalOrders++;
            orders.push({
              id: orderDoc.id,
              userId,
              ...data
            });
            console.log(`  ✅ Order found:`, {
              id: orderDoc.id,
              userId,
              price: data.price,
              status: data.order_status,
              product: data.title
            });
          }
        });
      } catch (error) {
        console.warn(`  ⚠️ Could not fetch orders for user ${userId}:`, error);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`  Total orders found: ${totalOrders}`);
    console.log(`  Total products: ${productsSnap.size}`);
    
    if (totalOrders > 0) {
      const completedOrders = orders.filter(o => 
        o.order_status === 'completed' || o.order_status === 'delivered'
      );
      const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);
      
      console.log(`  Completed orders: ${completedOrders.length}`);
      console.log(`  Total revenue: ${totalRevenue}`);
      console.log(`\n📋 All orders:`, orders);
    } else {
      console.log('  ❌ No orders found for this vendor!');
      console.log('  Check if:');
      console.log('    - The order has tailor_id matching:', vendorId);
      console.log('    - The order is in users_orders/{userId}/user_orders collection');
    }
    
    return {
      vendor: vendorDoc.data(),
      products: productsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      orders,
      totalRevenue: orders.reduce((sum, o) => sum + (o.price || 0), 0)
    };
    
  } catch (error) {
    console.error('❌ Debug error:', error);
    throw error;
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).debugVendorAnalytics = debugVendorAnalytics;
}
