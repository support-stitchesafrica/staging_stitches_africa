/**
 * Test Script for Collections Analytics
 * 
 * This script generates sample analytics events to test the collections analytics system.
 * Run this to populate the analytics dashboard with test data.
 */

import { collectionsAnalyticsService } from '@/lib/collections/analytics-service';

async function generateTestAnalyticsData() {
  console.log('🚀 Starting Collections Analytics Test Data Generation...');

  // Sample collections
  const testCollections = [
    {
      id: 'summer-fashion-2024',
      name: 'Summer Fashion 2024',
      products: [
        { id: 'dress-001', name: 'Elegant Summer Dress', price: 89.99 },
        { id: 'shirt-001', name: 'Casual Summer Shirt', price: 45.99 },
        { id: 'shorts-001', name: 'Denim Shorts', price: 35.99 }
      ]
    },
    {
      id: 'african-prints-collection',
      name: 'African Prints Collection',
      products: [
        { id: 'kaftan-001', name: 'Traditional Kaftan', price: 129.99 },
        { id: 'headwrap-001', name: 'Ankara Headwrap', price: 25.99 },
        { id: 'bag-001', name: 'African Print Bag', price: 65.99 }
      ]
    },
    {
      id: 'wedding-essentials',
      name: 'Wedding Essentials',
      products: [
        { id: 'gown-001', name: 'Wedding Gown', price: 899.99 },
        { id: 'accessories-001', name: 'Bridal Accessories Set', price: 199.99 },
        { id: 'shoes-001', name: 'Bridal Shoes', price: 149.99 }
      ]
    }
  ];

  // Sample users
  const testUsers = [
    'user-001',
    'user-002', 
    'user-003',
    'user-004',
    'user-005'
  ];

  try {
    let eventCount = 0;

    // Generate events for the last 7 days
    for (let day = 0; day < 7; day++) {
      const date = new Date();
      date.setDate(date.getDate() - day);
      
      console.log(`📅 Generating events for ${date.toDateString()}...`);

      for (const collection of testCollections) {
        // Generate collection views (10-30 per day per collection)
        const viewCount = Math.floor(Math.random() * 20) + 10;
        
        for (let i = 0; i < viewCount; i++) {
          const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
          
          await collectionsAnalyticsService.trackCollectionView(
            collection.id,
            collection.name,
            userId,
            {
              testData: true,
              generatedAt: date.toISOString(),
              dayOffset: day
            }
          );
          eventCount++;
        }

        // Generate product views within collections
        for (const product of collection.products) {
          const productViewCount = Math.floor(Math.random() * 15) + 5;
          
          for (let i = 0; i < productViewCount; i++) {
            const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
            
            await collectionsAnalyticsService.trackProductView(
              collection.id,
              collection.name,
              product.id,
              product.name,
              userId,
              {
                price: product.price,
                testData: true,
                generatedAt: date.toISOString(),
                dayOffset: day
              }
            );
            eventCount++;
          }

          // Generate add to cart events (30% of product views)
          const addToCartCount = Math.floor(productViewCount * 0.3);
          
          for (let i = 0; i < addToCartCount; i++) {
            const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
            
            await collectionsAnalyticsService.trackAddToCart(
              collection.id,
              collection.name,
              product.id,
              product.name,
              product.price,
              1,
              userId,
              {
                testData: true,
                generatedAt: date.toISOString(),
                dayOffset: day
              }
            );
            eventCount++;
          }

          // Generate purchase events (60% of add to cart)
          const purchaseCount = Math.floor(addToCartCount * 0.6);
          
          for (let i = 0; i < purchaseCount; i++) {
            const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
            
            await collectionsAnalyticsService.trackPurchase(
              collection.id,
              collection.name,
              product.id,
              product.name,
              product.price,
              1,
              userId,
              {
                testData: true,
                generatedAt: date.toISOString(),
                dayOffset: day
              }
            );
            eventCount++;
          }
        }
      }
    }

    console.log(`✅ Successfully generated ${eventCount} test analytics events!`);
    console.log('📊 You can now view the analytics data in the Atlas dashboard at /atlas/collections-analytics');
    
    // Test fetching the data
    console.log('🔍 Testing data retrieval...');
    const dashboardData = await collectionsAnalyticsService.getDashboardData();
    console.log('📈 Dashboard data:', {
      totalCollections: dashboardData.totalCollections,
      totalViews: dashboardData.totalViews,
      totalAddToCarts: dashboardData.totalAddToCarts,
      totalPurchases: dashboardData.totalPurchases,
      totalRevenue: dashboardData.totalRevenue,
      topCollectionsCount: dashboardData.topCollections.length
    });

  } catch (error) {
    console.error('❌ Error generating test data:', error);
  }
}

// Run the test data generation
if (require.main === module) {
  generateTestAnalyticsData()
    .then(() => {
      console.log('🎉 Test data generation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test data generation failed:', error);
      process.exit(1);
    });
}

export { generateTestAnalyticsData };