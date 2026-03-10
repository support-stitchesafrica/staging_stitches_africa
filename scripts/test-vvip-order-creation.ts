/**
 * Test VVIP Order Creation Script
 * 
 * This script tests the VVIP order creation and retrieval process
 */

import { adminDb } from '@/lib/firebase-admin';
import { vvipCheckoutService } from '@/lib/marketing/vvip-checkout-service';
import { vvipOrderService } from '@/lib/marketing/vvip-order-service';
import { Timestamp } from 'firebase-admin/firestore';

async function testVvipOrderCreation() {
  try {
    console.log('🧪 Testing VVIP Order Creation and Retrieval...\n');

    // Test user ID (replace with actual VVIP user ID)
    const testUserId = 'test-vvip-user-123';
    
    // First, create a test VVIP user
    console.log('1. Creating test VVIP user...');
    
    const testUserData = {
      email: 'test-vvip@example.com',
      first_name: 'Test',
      last_name: 'VVIP User',
      registration_country: 'Nigeria',
      isVvip: true,
      vvip_created_by: 'system-test',
      vvip_created_at: Timestamp.now(),
    };

    await adminDb.collection('users').doc(testUserId).set(testUserData);
    console.log('✅ Test VVIP user created');
    
    // Create a test VVIP order
    console.log('\n2. Creating test VVIP order...');
    
    const testOrderData = {
      userId: testUserId,
      items: [
        {
          id: 'test-product-1',
          name: 'Test VVIP Product',
          price: 150.00,
          quantity: 1,
          vendor: 'Test Vendor',
          category: 'clothing',
        }
      ],
      total: 150.00,
      currency: 'USD',
      shipping_address: {
        firstName: 'Test',
        lastName: 'User',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Nigeria',
        postalCode: '12345',
        phone: '+234123456789',
      },
      measurements: {},
      payment_proof_url: '/uploads/payment_proof/test_proof.jpg',
      payment_reference: `VVIP-${testUserId.slice(-8).toUpperCase()}`,
      payment_date: new Date(),
      amount_paid: 150.00,
      payment_notes: 'Test VVIP order creation',
    };

    const createResult = await vvipCheckoutService.createManualPaymentOrder(testOrderData);
    console.log('✅ Order created successfully:', createResult.orderId);

    // Wait a moment for the order to be saved
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test retrieving VVIP orders
    console.log('\n2. Retrieving VVIP orders...');
    
    const orders = await vvipOrderService.getVvipOrders();
    console.log(`📊 Found ${orders.length} VVIP orders`);

    if (orders.length > 0) {
      console.log('\n📋 Recent VVIP orders:');
      orders.slice(0, 5).forEach((order, index) => {
        console.log(`   ${index + 1}. Order ID: ${order.orderId}`);
        console.log(`      User ID: ${order.userId}`);
        console.log(`      Payment Status: ${order.payment_status}`);
        console.log(`      Amount: ${order.amount_paid}`);
        console.log(`      Created: ${order.created_at.toDate().toISOString()}`);
        console.log('');
      });
    }

    // Test filtering by payment status
    console.log('3. Testing order filtering...');
    
    const pendingOrders = await vvipOrderService.getVvipOrders({
      payment_status: 'pending_verification'
    });
    console.log(`🔍 Found ${pendingOrders.length} pending verification orders`);

    // Test order statistics
    console.log('\n4. Getting order statistics...');
    
    const stats = await vvipOrderService.getVvipOrderStatistics();
    console.log('📈 VVIP Order Statistics:');
    console.log(`   Total Orders: ${stats.totalOrders}`);
    console.log(`   Pending Verification: ${stats.pendingVerification}`);
    console.log(`   Approved: ${stats.approved}`);
    console.log(`   Rejected: ${stats.rejected}`);
    console.log(`   Total Revenue: $${stats.totalRevenue.toFixed(2)}`);
    console.log(`   Average Order Value: $${stats.averageOrderValue.toFixed(2)}`);

    console.log('\n✅ VVIP Order system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing VVIP orders:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testVvipOrderCreation().catch(console.error);