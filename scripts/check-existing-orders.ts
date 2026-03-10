/**
 * Check Existing Orders Script
 * 
 * This script checks for existing orders in the database and their structure
 */

import { adminDb } from '@/lib/firebase-admin';

async function checkExistingOrders() {
  try {
    console.log('🔍 Checking existing orders in the database...\n');

    // Check all orders
    console.log('1. Checking all orders...');
    const allOrdersSnapshot = await adminDb.collection('orders').limit(10).get();
    console.log(`📊 Total orders found: ${allOrdersSnapshot.size}`);

    if (allOrdersSnapshot.size > 0) {
      console.log('\n📋 Recent orders:');
      allOrdersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Order ID: ${doc.id}`);
        console.log(`      User ID: ${data.userId || 'N/A'}`);
        console.log(`      isVvip: ${data.isVvip || false}`);
        console.log(`      Payment Status: ${data.payment_status || 'N/A'}`);
        console.log(`      Payment Method: ${data.payment_method || 'N/A'}`);
        console.log(`      Total: ${data.total || data.amount_paid || 'N/A'}`);
        console.log(`      Created: ${data.created_at ? data.created_at.toDate().toISOString() : 'N/A'}`);
        console.log('      Fields:', Object.keys(data).join(', '));
        console.log('');
      });
    }

    // Check specifically for VVIP orders
    console.log('2. Checking for VVIP orders...');
    const vvipOrdersSnapshot = await adminDb.collection('orders').where('isVvip', '==', true).get();
    console.log(`🎯 VVIP orders found: ${vvipOrdersSnapshot.size}`);

    if (vvipOrdersSnapshot.size > 0) {
      console.log('\n👑 VVIP orders:');
      vvipOrdersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Order ID: ${doc.id}`);
        console.log(`      User ID: ${data.userId}`);
        console.log(`      Payment Status: ${data.payment_status}`);
        console.log(`      Payment Method: ${data.payment_method}`);
        console.log(`      Amount: ${data.amount_paid || data.total}`);
        console.log(`      Payment Proof: ${data.payment_proof_url || 'N/A'}`);
        console.log(`      Reference: ${data.payment_reference || 'N/A'}`);
        console.log(`      Created: ${data.created_at ? data.created_at.toDate().toISOString() : 'N/A'}`);
        console.log('');
      });
    }

    // Check for orders with manual payment method
    console.log('3. Checking for manual payment orders...');
    const manualOrdersSnapshot = await adminDb.collection('orders').where('payment_method', '==', 'manual_transfer').get();
    console.log(`💳 Manual payment orders found: ${manualOrdersSnapshot.size}`);

    if (manualOrdersSnapshot.size > 0) {
      console.log('\n💰 Manual payment orders:');
      manualOrdersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Order ID: ${doc.id}`);
        console.log(`      User ID: ${data.userId}`);
        console.log(`      isVvip: ${data.isVvip || false}`);
        console.log(`      Payment Status: ${data.payment_status}`);
        console.log(`      Amount: ${data.amount_paid || data.total}`);
        console.log(`      Created: ${data.created_at ? data.created_at.toDate().toISOString() : 'N/A'}`);
        console.log('');
      });
    }

    // Check for orders from today
    console.log('4. Checking for recent orders (last 24 hours)...');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentOrdersSnapshot = await adminDb.collection('orders')
      .where('created_at', '>=', yesterday)
      .orderBy('created_at', 'desc')
      .get();
    
    console.log(`📅 Recent orders (last 24h): ${recentOrdersSnapshot.size}`);

    if (recentOrdersSnapshot.size > 0) {
      console.log('\n🕐 Recent orders:');
      recentOrdersSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`   ${index + 1}. Order ID: ${doc.id}`);
        console.log(`      User ID: ${data.userId}`);
        console.log(`      isVvip: ${data.isVvip || false}`);
        console.log(`      Payment Method: ${data.payment_method || 'N/A'}`);
        console.log(`      Payment Status: ${data.payment_status || 'N/A'}`);
        console.log(`      Amount: ${data.amount_paid || data.total || 'N/A'}`);
        console.log(`      Created: ${data.created_at ? data.created_at.toDate().toISOString() : 'N/A'}`);
        console.log('');
      });
    }

    console.log('✅ Order check completed!');

  } catch (error) {
    console.error('❌ Error checking orders:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the check
checkExistingOrders().catch(console.error);