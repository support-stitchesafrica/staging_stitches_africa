// Test script to verify category filtering is working
const { productRepository } = require('./lib/firestore');

async function testCategoryFiltering() {
  console.log('🔍 Testing enhanced category filtering...\n');
  
  try {
    // Test each category
    const categories = ['bags', 'shoes', 'clothing', 'accessories', 'jewelry'];
    
    for (const category of categories) {
      console.log(`📂 Testing ${category.toUpperCase()} category:`);
      
      const products = await productRepository.getProductsByCategory(category);
      console.log(`   Found ${products.length} products`);
      
      if (products.length > 0) {
        console.log(`   Sample products:`);
        products.slice(0, 3).forEach((product, index) => {
          console.log(`   ${index + 1}. ${product.title} (${product.tailor || 'Unknown'})`);
        });
      } else {
        console.log(`   ⚠️  No products found for ${category}`);
      }
      console.log('');
    }
    
    // Test fallback - get all products and see what we have
    console.log('📊 Overall product analysis:');
    const allProducts = await productRepository.getAllWithTailorInfo();
    console.log(`   Total products with images: ${allProducts.length}`);
    
    // Analyze titles for category keywords
    const titleAnalysis = {
      bags: 0,
      shoes: 0,
      clothing: 0,
      accessories: 0,
      jewelry: 0,
      other: 0
    };
    
    allProducts.forEach(product => {
      const title = (product.title || '').toLowerCase();
      
      if (title.includes('bag') || title.includes('purse') || title.includes('handbag')) {
        titleAnalysis.bags++;
      } else if (title.includes('shoe') || title.includes('boot') || title.includes('sneaker')) {
        titleAnalysis.shoes++;
      } else if (title.includes('dress') || title.includes('shirt') || title.includes('top') || title.includes('kaftan')) {
        titleAnalysis.clothing++;
      } else if (title.includes('belt') || title.includes('scarf') || title.includes('hat') || title.includes('headwrap')) {
        titleAnalysis.accessories++;
      } else if (title.includes('necklace') || title.includes('earring') || title.includes('bracelet') || title.includes('bead')) {
        titleAnalysis.jewelry++;
      } else {
        titleAnalysis.other++;
      }
    });
    
    console.log('   Title-based analysis:');
    Object.entries(titleAnalysis).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} products`);
    });
    
  } catch (error) {
    console.error('❌ Error testing category filtering:', error);
  }
}

// Run the test
testCategoryFiltering().then(() => {
  console.log('✅ Category filtering test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});