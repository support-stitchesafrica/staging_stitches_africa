/**
 * Generate Test Storefront Analytics Data
 * Creates sample shop_activities data for testing analytics
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

interface TestActivity {
  id: string;
  type: 'view' | 'add_to_cart' | 'purchase' | 'product_view';
  userId: string;
  sessionId: string;
  vendorId: string;
  productId?: string;
  timestamp: Timestamp;
  metadata: {
    price?: number;
    currency?: string;
    quantity?: number;
    productName?: string;
    deviceType: 'mobile' | 'tablet' | 'desktop';
    userAgent: string;
    source: 'direct' | 'search' | 'social' | 'referral';
  };
}

async function generateStorefrontAnalyticsData() {
  try {
    console.log('🚀 Generating test storefront analytics data...');

    // Sample vendor IDs (replace with actual vendor IDs from your system)
    const testVendors = [
      'vendor-001',
      'vendor-002', 
      'vendor-003',
      'vendor-004',
      'vendor-005'
    ];

    // Sample product IDs
    const testProducts = [
      'product-001',
      'product-002',
      'product-003',
      'product-004',
      'product-005',
      'product-006',
      'product-007',
      'product-008',
      'product-009',
      'product-010'
    ];

    // Sample user IDs
    const testUsers = [
      'user-001',
      'user-002',
      'user-003',
      'user-004',
      'user-005',
      'anon-001',
      'anon-002',
      'anon-003',
      'anon-004',
      'anon-005'
    ];

    const activities: TestActivity[] = [];
    const now = new Date();

    // Generate activities for the last 30 days
    for (let day = 0; day < 30; day++) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      // Generate 10-50 activities per day
      const activitiesPerDay = Math.floor(Math.random() * 40) + 10;

      for (let i = 0; i < activitiesPerDay; i++) {
        const vendor = testVendors[Math.floor(Math.random() * testVendors.length)];
        const product = testProducts[Math.floor(Math.random() * testProducts.length)];
        const user = testUsers[Math.floor(Math.random() * testUsers.length)];
        
        // Random time during the day
        const activityTime = new Date(date);
        activityTime.setHours(Math.floor(Math.random() * 24));
        activityTime.setMinutes(Math.floor(Math.random() * 60));

        // Determine activity type (weighted towards views)
        const rand = Math.random();
        let activityType: TestActivity['type'];
        if (rand < 0.6) {
          activityType = 'view';
        } else if (rand < 0.8) {
          activityType = 'product_view';
        } else if (rand < 0.95) {
          activityType = 'add_to_cart';
        } else {
          activityType = 'purchase';
        }

        const activity: TestActivity = {
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: activityType,
          userId: user,
          sessionId: `session-${user}-${date.toDateString()}`,
          vendorId: vendor,
          productId: activityType !== 'view' ? product : undefined,
          timestamp: Timestamp.fromDate(activityTime),
          metadata: {
            deviceType: ['mobile', 'tablet', 'desktop'][Math.floor(Math.random() * 3)] as any,
            userAgent: 'Mozilla/5.0 (Test Browser)',
            source: ['direct', 'search', 'social', 'referral'][Math.floor(Math.random() * 4)] as any,
            ...(activityType === 'add_to_cart' || activityType === 'purchase' ? {
              price: Math.floor(Math.random() * 200) + 20,
              currency: 'USD',
              quantity: Math.floor(Math.random() * 3) + 1,
              productName: `Test Product ${product}`
            } : {}),
            ...(activityType === 'product_view' ? {
              productName: `Test Product ${product}`
            } : {})
          }
        };

        activities.push(activity);
      }
    }

    console.log(`📊 Generated ${activities.length} test activities`);

    // Batch write to Firestore
    const batchSize = 500;
    for (let i = 0; i < activities.length; i += batchSize) {
      const batch = adminDb.batch();
      const batchActivities = activities.slice(i, i + batchSize);

      batchActivities.forEach(activity => {
        const docRef = adminDb.collection('shop_activities').doc(activity.id);
        batch.set(docRef, activity);
      });

      await batch.commit();
      console.log(`✅ Wrote batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(activities.length / batchSize)}`);
    }

    // Generate summary
    const summary = {
      totalActivities: activities.length,
      byType: activities.reduce((acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byVendor: activities.reduce((acc, activity) => {
        acc[activity.vendorId] = (acc[activity.vendorId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      dateRange: {
        from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        to: now.toISOString()
      }
    };

    console.log('📈 Analytics Data Summary:');
    console.log(`   Total Activities: ${summary.totalActivities}`);
    console.log(`   By Type:`, summary.byType);
    console.log(`   By Vendor:`, summary.byVendor);
    console.log(`   Date Range: ${summary.dateRange.from} to ${summary.dateRange.to}`);

    console.log('🎉 Test storefront analytics data generated successfully!');
    console.log('💡 You can now test the analytics API at /api/storefront/analytics');

  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateStorefrontAnalyticsData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

export { generateStorefrontAnalyticsData };