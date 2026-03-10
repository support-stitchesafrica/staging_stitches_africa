/**
 * Script to add test storefront data for analytics testing
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

async function addTestStorefrontData() {
  try {
    console.log('🚀 Adding test storefront data...');

    // Add test vendors/users
    const testVendors = [
      {
        id: 'test-vendor-1',
        name: 'Test Fashion Store',
        businessName: 'Test Fashion Store',
        email: 'vendor1@test.com',
        isActive: true
      },
      {
        id: 'test-vendor-2', 
        name: 'Sample Boutique',
        businessName: 'Sample Boutique',
        email: 'vendor2@test.com',
        isActive: true
      }
    ];

    // Add vendors to users collection
    for (const vendor of testVendors) {
      await adminDb.collection('users').doc(vendor.id).set(vendor);
      console.log(`✅ Added vendor: ${vendor.name}`);
    }

    // Add test products (tailor_works)
    const testProducts = [
      {
        id: 'product-1',
        tailor_id: 'test-vendor-1',
        title: 'Test Dress',
        price: 150,
        isActive: true,
        tailor: {
          name: 'Test Fashion Store'
        }
      },
      {
        id: 'product-2',
        tailor_id: 'test-vendor-1',
        title: 'Test Shirt',
        price: 75,
        isActive: true,
        tailor: {
          name: 'Test Fashion Store'
        }
      },
      {
        id: 'product-3',
        tailor_id: 'test-vendor-2',
        title: 'Sample Jacket',
        price: 200,
        isActive: true,
        tailor: {
          name: 'Sample Boutique'
        }
      }
    ];

    // Add products to tailor_works collection
    for (const product of testProducts) {
      await adminDb.collection('tailor_works').doc(product.id).set(product);
      console.log(`✅ Added product: ${product.title}`);
    }

    // Add test shop activities
    const now = new Date();
    const testActivities = [
      // Views
      {
        id: 'activity-1',
        type: 'view',
        userId: 'user-1',
        sessionId: 'session-1',
        vendorId: 'test-vendor-1',
        productId: 'product-1',
        timestamp: Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 2)), // 2 hours ago
        metadata: {
          deviceType: 'desktop',
          userAgent: 'test-agent'
        }
      },
      {
        id: 'activity-2',
        type: 'view',
        userId: 'user-2',
        sessionId: 'session-2',
        vendorId: 'test-vendor-1',
        productId: 'product-2',
        timestamp: Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 1)), // 1 hour ago
        metadata: {
          deviceType: 'mobile',
          userAgent: 'test-agent'
        }
      },
      {
        id: 'activity-3',
        type: 'view',
        userId: 'user-3',
        sessionId: 'session-3',
        vendorId: 'test-vendor-2',
        productId: 'product-3',
        timestamp: Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 30)), // 30 minutes ago
        metadata: {
          deviceType: 'desktop',
          userAgent: 'test-agent'
        }
      },
      // Add to cart
      {
        id: 'activity-4',
        type: 'add_to_cart',
        userId: 'user-1',
        sessionId: 'session-1',
        vendorId: 'test-vendor-1',
        productId: 'product-1',
        timestamp: Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 1.5)), // 1.5 hours ago
        metadata: {
          price: 150,
          quantity: 1,
          currency: 'USD',
          deviceType: 'desktop',
          userAgent: 'test-agent'
        }
      },
      // Purchase
      {
        id: 'activity-5',
        type: 'purchase',
        userId: 'user-1',
        sessionId: 'session-1',
        vendorId: 'test-vendor-1',
        productId: 'product-1',
        timestamp: Timestamp.fromDate(new Date(now.getTime() - 1000 * 60 * 60 * 1)), // 1 hour ago
        metadata: {
          price: 150,
          quantity: 1,
          currency: 'USD',
          deviceType: 'desktop',
          userAgent: 'test-agent'
        }
      }
    ];

    // Add activities to shop_activities collection
    for (const activity of testActivities) {
      await adminDb.collection('shop_activities').doc(activity.id).set(activity);
      console.log(`✅ Added activity: ${activity.type} by ${activity.userId}`);
    }

    console.log('🎉 Test data added successfully!');
    console.log(`Added ${testVendors.length} vendors, ${testProducts.length} products, ${testActivities.length} activities`);

  } catch (error) {
    console.error('❌ Error adding test data:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addTestStorefrontData()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { addTestStorefrontData };