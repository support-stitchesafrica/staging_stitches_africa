#!/usr/bin/env tsx

/**
 * Generate test analytics data for collections
 * This script creates sample analytics events to test the dashboard
 */

import { collectionsAnalyticsService } from '@/lib/collections/analytics-service';

async function generateTestData() {
  console.log('🧪 Generating test analytics data...\n');

  try {
    // Test collection IDs (you can replace these with actual collection IDs from your database)
    const testCollections = [
      { id: 'test-collection-1', name: 'Summer Fashion 2024' },
      { id: 'test-collection-2', name: 'African Prints Collection' },
      { id: 'test-collection-3', name: 'Wedding Essentials' }
    ];

    const testProducts = [
      { id: 'test-product-1', name: 'Elegant Summer Dress', price: 89.99 },
      { id: 'test-product-2', name: 'African Print Shirt', price: 65.99 },
      { id: 'test-product-3', name: 'Wedding Accessories Set', price: 129.99 }
    ];

    const testUsers = [
      'test-user-1',
      'test-user-2', 
      'test-user-3',
      'test-user-4',
      'test-user-5'
    ];

    console.log('📊 Creating collection view events...');
    
    // Generate collection views
    for (let i = 0; i < 50; i++) {
      const collection = testCollections[Math.floor(Math.random() * testCollections.length)];
      const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
      
      await collectionsAnalyticsService.trackCollectionView(
        collection.id,
        collection.name,
        userId,
        {
          testData: true,
          timestamp: new Date().toISOString(),
          sessionId: `session-${Math.random().toString(36).substr(2, 9)}`
        }
      );
      
      if (i % 10 === 0) {
        console.log(`  Generated ${i + 1}/50 collection views`);
      }
    }

    console.log('\n🛍️ Creating product view events...');
    
    // Generate product views
    for (let i = 0; i < 100; i++) {
      const collection = testCollections[Math.floor(Math.random() * testCollections.length)];
      const product = testProducts[Math.floor(Math.random() * testProducts.length)];
      const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
      
      await collectionsAnalyticsService.trackProductView(
        collection.id,
        collection.name,
        product.id,
        product.name,
        userId,
        {
          testData: true,
          price: product.price,
          category: 'fashion',
          vendor: 'Test Vendor'
        }
      );
      
      if (i % 20 === 0) {
        console.log(`  Generated ${i + 1}/100 product views`);
      }
    }

    console.log('\n🛒 Creating add to cart events...');
    
    // Generate add to cart events
    for (let i = 0; i < 75; i++) {
      const collection = testCollections[Math.floor(Math.random() * testCollections.length)];
      const product = testProducts[Math.floor(Math.random() * testProducts.length)];
      const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      
      await collectionsAnalyticsService.trackAddToCart(
        collection.id,
        collection.name,
        product.id,
        product.name,
        product.price,
        quantity,
        userId,
        {
          testData: true,
          category: 'fashion',
          vendor: 'Test Vendor'
        }
      );
      
      if (i % 15 === 0) {
        console.log(`  Generated ${i + 1}/75 add to cart events`);
      }
    }

    console.log('\n💰 Creating purchase events...');
    
    // Generate purchase events
    for (let i = 0; i < 30; i++) {
      const collection = testCollections[Math.floor(Math.random() * testCollections.length)];
      const product = testProducts[Math.floor(Math.random() * testProducts.length)];
      const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
      const quantity = Math.floor(Math.random() * 2) + 1;
      
      await collectionsAnalyticsService.trackPurchase(
        collection.id,
        collection.name,
        product.id,
        product.name,
        product.price,
        quantity,
        userId,
        {
          testData: true,
          category: 'fashion',
          vendor: 'Test Vendor',
          paymentMethod: 'credit_card'
        }
      );
      
      if (i % 5 === 0) {
        console.log(`  Generated ${i + 1}/30 purchase events`);
      }
    }

    console.log('\n✅ Test data generation completed!');
    console.log('\n📈 Summary:');
    console.log('- 50 collection view events');
    console.log('- 100 product view events');
    console.log('- 75 add to cart events');
    console.log('- 30 purchase events');
    console.log('\n🎯 You can now check the analytics dashboard to see real data!');
    console.log('Visit: /atlas/collections-analytics or /demo/collections-analytics');

  } catch (error) {
    console.error('❌ Failed to generate test data:', error);
    process.exit(1);
  }
}

// Run the script
generateTestData().catch(console.error);