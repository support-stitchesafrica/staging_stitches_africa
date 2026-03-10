/**
 * Script to create test VVIP shoppers for demonstration
 */

const { adminDb } = require('../lib/firebase-admin.js');

async function createTestVvipShoppers() {
  console.log('👥 Creating test VVIP shoppers...\n');

  const testShoppers = [
    {
      userId: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      user_email: 'uchinedu@stitchesafrica.com',
      user_name: 'Uchinedu Okoro',
      status: 'active',
      created_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      created_at: new Date(),
      notes: 'Super admin user with VVIP access',
      country: 'Nigeria'
    },
    {
      userId: 'vvip_test_user_001',
      user_email: 'sarah.johnson@example.com',
      user_name: 'Sarah Johnson',
      status: 'active',
      created_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      notes: 'Premium customer - frequent high-value orders',
      country: 'United States'
    },
    {
      userId: 'vvip_test_user_002',
      user_email: 'james.wilson@example.com',
      user_name: 'James Wilson',
      status: 'active',
      created_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      notes: 'Corporate client - bulk orders for events',
      country: 'United Kingdom'
    },
    {
      userId: 'vvip_test_user_003',
      user_email: 'maria.garcia@example.com',
      user_name: 'Maria Garcia',
      status: 'active',
      created_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 3 weeks ago
      notes: 'Fashion influencer - special pricing agreement',
      country: 'Spain'
    },
    {
      userId: 'vvip_test_user_004',
      user_email: 'david.chen@example.com',
      user_name: 'David Chen',
      status: 'active',
      created_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
      notes: 'Wedding planner - regular custom orders',
      country: 'Canada'
    },
    {
      userId: 'vvip_test_user_005',
      user_email: 'amara.okafor@example.com',
      user_name: 'Amara Okafor',
      status: 'active',
      created_by: 'jl4SjJhgpNW6WhxVlmLgxJgJssV2',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 1.5 months ago
      notes: 'Celebrity stylist - exclusive designs',
      country: 'Nigeria'
    }
  ];

  try {
    for (const shopper of testShoppers) {
      console.log(`Creating VVIP shopper: ${shopper.user_name} (${shopper.user_email})`);
      await adminDb.collection('vvip_shoppers').doc(shopper.userId).set(shopper);
      console.log(`✅ Created VVIP shopper: ${shopper.user_name} from ${shopper.country}`);
    }

    console.log('\n✅ All test VVIP shoppers created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Total shoppers: ${testShoppers.length}`);
    console.log(`- Countries: ${[...new Set(testShoppers.map(s => s.country))].join(', ')}`);
    console.log(`- All active status`);
    console.log('\n🌐 You can now view these shoppers at: http://localhost:3000/marketing/vvip?tab=shoppers');

  } catch (error) {
    console.error('❌ Error creating test shoppers:', error);
  }
}

createTestVvipShoppers().catch(console.error);