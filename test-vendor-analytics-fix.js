/**
 * Test script to verify vendor analytics are working after index fix
 */

const { VendorAnalyticsService } = require('./lib/vendor/analytics-service');

async function testVendorAnalytics() {
  console.log('🧪 Testing Vendor Analytics after Firestore index fix...');
  
  try {
    const analyticsService = new VendorAnalyticsService();
    
    // Test with a sample vendor ID (replace with actual vendor ID)
    const testVendorId = 'test-vendor-id';
    
    // Test date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const dateRange = {
      start: startDate,
      end: endDate
    };
    
    console.log('📊 Fetching analytics for vendor:', testVendorId);
    console.log('📅 Date range:', dateRange);
    
    const result = await analyticsService.getVendorAnalytics(testVendorId, dateRange);
    
    if (result.success) {
      console.log('✅ Analytics fetched successfully!');
      console.log('📈 Analytics summary:', {
        vendorId: result.data.vendorId,
        totalRevenue: result.data.sales.totalRevenue,
        totalOrders: result.data.orders.totalOrders,
        totalProducts: result.data.products.totalProducts,
        totalCustomers: result.data.customers.totalCustomers,
        updatedAt: result.data.updatedAt
      });
    } else {
      console.log('❌ Analytics fetch failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
    
    // Check if it's still an index error
    if (error.message?.includes('index') || error.code === 'failed-precondition') {
      console.log('⚠️  Index might still be building. Please wait a few more minutes.');
    } else {
      console.log('🔧 This appears to be a different error that needs investigation.');
    }
  }
}

// Run the test
testVendorAnalytics().then(() => {
  console.log('🏁 Test completed');
}).catch(error => {
  console.error('💥 Test script error:', error);
});