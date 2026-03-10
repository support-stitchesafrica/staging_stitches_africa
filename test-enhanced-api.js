// Test script for enhanced products API
async function testEnhancedProductsAPI() {
  const baseUrl = 'http://localhost:3000';
  
  // Test vendor ID - replace with actual vendor ID
  const vendorId = 'test-vendor-id';
  
  console.log('Testing Enhanced Products API...\n');
  
  // Test different sections
  const sections = ['new-arrivals', 'best-selling', 'promotions', 'all'];
  
  for (const section of sections) {
    try {
      console.log(`Testing ${section} section...`);
      const response = await fetch(`${baseUrl}/api/storefront/enhanced-products?vendorId=${vendorId}&section=${section}&limit=6`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${section}: ${data.success ? 'Success' : 'Failed'}`);
        if (data.success) {
          console.log(`   Products found: ${data.products.length}`);
          if (data.pagination) {
            console.log(`   Pagination: Page ${data.pagination.currentPage} of ${data.pagination.totalPages}`);
          }
        } else {
          console.log(`   Error: ${data.error}`);
        }
      } else {
        console.log(`❌ ${section}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${section}: ${error.message}`);
    }
    console.log('');
  }
}

// Run the test
testEnhancedProductsAPI().catch(console.error);