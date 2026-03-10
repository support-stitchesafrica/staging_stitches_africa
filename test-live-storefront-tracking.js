/**
 * Test Live Storefront Tracking
 * This script helps test if storefront analytics tracking is working
 */

async function testLiveStorefrontTracking() {
  try {
    console.log('🧪 Testing Live Storefront Tracking...');

    // Test 1: Check if we can access a storefront page
    console.log('\n📋 Step 1: Testing storefront page access...');
    
    // You'll need to replace this with an actual storefront handle from your system
    const storefrontHandle = 'test-vendor'; // Replace with actual handle
    const storefrontUrl = `http://localhost:3000/store/${storefrontHandle}`;
    
    console.log(`🌐 Testing storefront URL: ${storefrontUrl}`);
    console.log('💡 To test tracking:');
    console.log('   1. Open your browser to the storefront URL above');
    console.log('   2. Open browser developer tools (F12)');
    console.log('   3. Look for tracking logs in the console:');
    console.log('      - "📊 AnalyticsTracker tracking:" for page views');
    console.log('      - "🔍 ProductCard tracking view:" for product views');
    console.log('      - "🛒 ProductCard tracking add to cart:" for cart actions');
    console.log('      - "✅ Activity tracked successfully" for successful tracking');

    // Test 2: Check analytics API directly
    console.log('\n📋 Step 2: Testing analytics API...');
    
    // Use one of the test vendor IDs from our generated data
    const testVendorIds = ['vendor-001', 'vendor-002', 'vendor-003', 'vendor-004', 'vendor-005'];
    
    for (const vendorId of testVendorIds) {
      try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);

        const queryParams = new URLSearchParams({
          storefrontId: vendorId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        const response = await fetch(`http://localhost:3000/api/storefront/analytics?${queryParams}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${vendorId}: ${data.pageViews} views, ${data.uniqueVisitors} visitors, ${data.conversionRate}% conversion`);
          
          if (data.pageViews > 0) {
            console.log(`   📈 Daily stats: ${data.dailyStats?.length || 0} days`);
            console.log(`   🏆 Top products: ${data.topProducts?.length || 0} products`);
          }
        } else {
          console.log(`❌ ${vendorId}: API error ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${vendorId}: ${error.message}`);
      }
    }

    // Test 3: Instructions for manual testing
    console.log('\n📋 Step 3: Manual Testing Instructions');
    console.log('To verify tracking is working:');
    console.log('1. Visit a storefront page in your browser');
    console.log('2. Check browser console for tracking logs');
    console.log('3. Click on products to trigger product view tracking');
    console.log('4. Click "Add to Cart" to trigger cart tracking');
    console.log('5. Wait a few seconds, then check the vendor analytics page');
    console.log('6. The analytics should show the new activity');

    console.log('\n🎯 Expected Behavior:');
    console.log('- Page views should increment when visiting storefront pages');
    console.log('- Product views should increment when product cards load');
    console.log('- Cart adds should increment when clicking "Add to Cart"');
    console.log('- Analytics page should show real data within a few seconds');

    console.log('\n🔧 Troubleshooting:');
    console.log('- If no tracking logs appear: Check if ProductCard has tailor_id');
    console.log('- If API returns zeros: Check if shop_activities collection has data');
    console.log('- If tracking fails: Check Firebase permissions and network');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testLiveStorefrontTracking();