// Test script to verify BOGO system functionality
import { SPECIFIC_BOGO_MAPPINGS } from '../lib/bogo/configure-specific-mappings';

console.log('🧪 Testing BOGO System...\n');

// Test 1: Check if mappings are loaded
console.log('📋 BOGO Mappings:');
console.log(`Total mappings: ${SPECIFIC_BOGO_MAPPINGS.length}`);

SPECIFIC_BOGO_MAPPINGS.forEach((mapping, index) => {
  console.log(`\n${index + 1}. ${mapping.promotionName}`);
  console.log(`   Main Product: ${mapping.mainProductId}`);
  console.log(`   Free Products: ${mapping.freeProductIds.join(', ')}`);
  console.log(`   Start: ${mapping.promotionStartDate}`);
  console.log(`   End: ${mapping.promotionEndDate}`);
  console.log(`   Active: ${mapping.active}`);
  
  // Check if promotion is currently active
  const now = new Date();
  const startDate = new Date(mapping.promotionStartDate);
  const endDate = new Date(mapping.promotionEndDate);
  const isActive = now >= startDate && now <= endDate && mapping.active;
  
  console.log(`   Currently Active: ${isActive ? '✅' : '❌'}`);
  
  if (!isActive) {
    if (now < startDate) {
      console.log(`   Reason: Starts in the future (${startDate})`);
    } else if (now > endDate) {
      console.log(`   Reason: Expired (ended ${endDate})`);
    } else if (!mapping.active) {
      console.log(`   Reason: Marked as inactive`);
    }
  }
});

// Test 2: Check specific product
const testProductId = 'DVaRyrn2WGW1MUHIo7Qi';
console.log(`\n🎯 Testing specific product: ${testProductId}`);

const mapping = SPECIFIC_BOGO_MAPPINGS.find(m => m.mainProductId === testProductId);
if (mapping) {
  console.log('✅ Mapping found!');
  console.log(`   Promotion: ${mapping.promotionName}`);
  console.log(`   Description: ${mapping.description}`);
  console.log(`   Free Products: ${mapping.freeProductIds.length}`);
  
  const now = new Date();
  const startDate = new Date(mapping.promotionStartDate);
  const endDate = new Date(mapping.promotionEndDate);
  const isActive = now >= startDate && now <= endDate && mapping.active;
  
  console.log(`   Is Active: ${isActive ? '✅' : '❌'}`);
  
  if (isActive) {
    console.log('🎉 This product should show BOGO indicator!');
  } else {
    console.log('⚠️  This product will NOT show BOGO indicator');
    console.log(`   Current time: ${now}`);
    console.log(`   Promotion start: ${startDate}`);
    console.log(`   Promotion end: ${endDate}`);
  }
} else {
  console.log('❌ No mapping found for this product');
}

console.log('\n✨ BOGO System Test Complete!');