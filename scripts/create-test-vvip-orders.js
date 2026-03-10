/**
 * Script to create test VVIP orders for demonstration
 */

const { adminDb } = require('../lib/firebase-admin.js');

async function createTestVvipOrders() {
  console.log('🛍️ Creating test VVIP orders...\n');

  const testOrders = [
    {
      orderId: 'vvip_test_001',
      userId: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      user_email: 'uchinedu@stitchesafrica.com',
      user_name: 'Uchinedu Test',
      customerName: 'Uchinedu Test',
      customerEmail: 'uchinedu@stitchesafrica.com',
      payment_method: 'manual_transfer',
      isVvip: true,
      payment_status: 'pending_verification',
      payment_proof_url: 'https://via.placeholder.com/400x300/4CAF50/FFFFFF?text=Payment+Proof+1',
      amount_paid: 150.00,
      payment_reference: 'TXN123456789',
      payment_date: new Date(),
      order_status: 'pending',
      created_at: new Date(),
      items: [
        { name: 'Custom Tailored Suit', quantity: 1, price: 120.00 },
        { name: 'Premium Alterations', quantity: 1, price: 30.00 }
      ],
      total: 150.00,
      shipping_address: {
        street: '123 Fashion Street',
        city: 'Lagos',
        state: 'Lagos',
        country: 'Nigeria',
        postal_code: '100001'
      }
    },
    {
      orderId: 'vvip_test_002',
      userId: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      user_email: 'uchinedu@stitchesafrica.com',
      user_name: 'Uchinedu Test',
      customerName: 'Uchinedu Test',
      customerEmail: 'uchinedu@stitchesafrica.com',
      payment_method: 'manual_transfer',
      isVvip: true,
      payment_status: 'approved',
      payment_proof_url: 'https://via.placeholder.com/400x300/2196F3/FFFFFF?text=Payment+Proof+2',
      amount_paid: 250.00,
      payment_reference: 'TXN987654321',
      payment_date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      order_status: 'processing',
      payment_verified_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      payment_verified_at: new Date(),
      admin_note: 'Payment verified and approved',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      items: [
        { name: 'Designer Wedding Dress', quantity: 1, price: 200.00 },
        { name: 'Veil and Accessories', quantity: 1, price: 50.00 }
      ],
      total: 250.00,
      shipping_address: {
        street: '456 Bridal Avenue',
        city: 'Abuja',
        state: 'FCT',
        country: 'Nigeria',
        postal_code: '900001'
      }
    },
    {
      orderId: 'vvip_test_003',
      userId: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      user_email: 'uchinedu@stitchesafrica.com',
      user_name: 'Uchinedu Test',
      customerName: 'Uchinedu Test',
      customerEmail: 'uchinedu@stitchesafrica.com',
      payment_method: 'manual_transfer',
      isVvip: true,
      payment_status: 'rejected',
      payment_proof_url: 'https://via.placeholder.com/400x300/F44336/FFFFFF?text=Payment+Proof+3',
      amount_paid: 80.00,
      payment_reference: 'TXN555666777',
      payment_date: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      order_status: 'payment_failed',
      payment_verified_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      payment_verified_at: new Date(Date.now() - 24 * 60 * 60 * 1000),
      admin_note: 'Payment proof unclear, please resubmit with clearer image',
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000),
      items: [
        { name: 'Casual Shirt Alterations', quantity: 2, price: 40.00 }
      ],
      total: 80.00,
      shipping_address: {
        street: '789 Style Boulevard',
        city: 'Port Harcourt',
        state: 'Rivers',
        country: 'Nigeria',
        postal_code: '500001'
      }
    }
  ];

  try {
    for (const order of testOrders) {
      console.log(`Creating order: ${order.orderId}`);
      await adminDb.collection('orders').doc(order.orderId).set(order);
      console.log(`✅ Created order ${order.orderId} - Status: ${order.payment_status}`);
    }

    console.log('\n✅ All test VVIP orders created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Total orders: ${testOrders.length}`);
    console.log(`- Pending verification: ${testOrders.filter(o => o.payment_status === 'pending_verification').length}`);
    console.log(`- Approved: ${testOrders.filter(o => o.payment_status === 'approved').length}`);
    console.log(`- Rejected: ${testOrders.filter(o => o.payment_status === 'rejected').length}`);
    console.log('\n🌐 You can now view these orders at: http://localhost:3000/marketing/vvip?tab=orders');

  } catch (error) {
    console.error('❌ Error creating test orders:', error);
  }
}

createTestVvipOrders().catch(console.error);