#!/usr/bin/env tsx

/**
 * Test script to verify collections analytics service is working correctly
 * with the updated collection name (product_collections)
 */

import { collectionsAnalyticsService } from '@/lib/collections/analytics-service';

async function testCollectionsAnalytics() {
  console.log('🧪 Testing Collections Analytics Service...\n');

  try {
    // Test 1: Get dashboard data
    console.log('📊 Testing dashboard data...');
    const dashboardData = await collectionsAnalyticsService.getDashboardData();
    
    console.log('Dashboard Results:');
    console.log(`- Total Collections: ${dashboardData.totalCollections}`);
    console.log(`- Total Views: ${dashboardData.totalViews}`);
    console.log(`- Total Add to Carts: ${dashboardData.totalAddToCarts}`);
    console.log(`- Total Purchases: ${dashboardData.totalPurchases}`);
    console.log(`- Total Revenue: $${dashboardData.totalRevenue.toFixed(2)}`);
    console.log(`- Top Collections: ${dashboardData.topCollections.length}`);
    console.log(`- Recent Activity Days: ${dashboardData.recentActivity.length}`);
    console.log(`- Top Products: ${dashboardData.topProducts.length}`);
    console.log(`- Top Customers: ${dashboardData.topCustomers.length}\n`);

    // Show top collections if any
    if (dashboardData.topCollections.length > 0) {
      console.log('🏆 Top Collections by Revenue:');
      dashboardData.topCollections.slice(0, 5).forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.collectionName} (${collection.collectionId})`);
        console.log(`   Views: ${collection.views}, Purchases: ${collection.purchases}, Revenue: $${collection.revenue.toFixed(2)}`);
      });
      console.log('');
    }

    // Test 2: Track a sample event
    console.log('📝 Testing event tracking...');
    await collectionsAnalyticsService.trackCollectionView(
      'test-collection-id',
      'Test Collection',
      'test-user-123',
      {
        testEvent: true,
        timestamp: new Date().toISOString()
      }
    );
    console.log('✅ Successfully tracked collection view event\n');

    // Test 3: Get analytics for a specific collection (if any exist)
    if (dashboardData.topCollections.length > 0) {
      const testCollectionId = dashboardData.topCollections[0].collectionId;
      console.log(`📈 Testing collection-specific analytics for: ${testCollectionId}`);
      
      const collectionAnalytics = await collectionsAnalyticsService.getCollectionAnalytics(testCollectionId);
      
      console.log('Collection Analytics Results:');
      console.log(`- Collection Name: ${collectionAnalytics.collectionName}`);
      console.log(`- Total Views: ${collectionAnalytics.totalViews}`);
      console.log(`- Unique Viewers: ${collectionAnalytics.uniqueViewers}`);
      console.log(`- Conversion Rate: ${collectionAnalytics.conversionRate.toFixed(2)}%`);
      console.log(`- Average Order Value: $${collectionAnalytics.averageOrderValue.toFixed(2)}`);
      console.log(`- Top Products: ${collectionAnalytics.topProducts.length}`);
      console.log(`- Top Viewers: ${collectionAnalytics.topViewers.length}`);
      console.log(`- Location Data: ${collectionAnalytics.locationData.length}\n`);
    }

    console.log('✅ All tests completed successfully!');
    console.log('🎉 Collections analytics service is working correctly with product_collections collection.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Run the test
testCollectionsAnalytics().catch(console.error);