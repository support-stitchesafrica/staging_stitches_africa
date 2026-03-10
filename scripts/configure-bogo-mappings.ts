#!/usr/bin/env tsx
/**
 * Script to configure the specific BOGO product mappings
 * Run with: npx tsx scripts/configure-bogo-mappings.ts
 */

import { 
  configureSpecificBogoMappings, 
  validateProductIds, 
  testMappingsWithProductData,
  verifyFreeShippingForAllMappings 
} from '../lib/bogo/configure-specific-mappings';

async function main() {
  console.log('🚀 Starting BOGO mappings configuration...\n');

  try {
    // Step 1: Validate product IDs
    console.log('📋 Step 1: Validating product IDs...');
    const validation = await validateProductIds();
    
    if (validation.valid) {
      console.log('✅ All product IDs are valid');
      console.log(`   Valid products: ${validation.validProducts.length}`);
    } else {
      console.log('❌ Some product IDs are missing:');
      validation.missingProducts.forEach(id => console.log(`   - ${id}`));
      console.log('\n⚠️  Proceeding anyway for testing purposes...\n');
    }

    // Step 2: Configure mappings
    console.log('🔧 Step 2: Configuring BOGO mappings...');
    const adminUserId = 'bogo-admin-script'; // Mock admin user for script
    const configResult = await configureSpecificBogoMappings(adminUserId);
    
    if (configResult.success) {
      console.log(`✅ Successfully created ${configResult.created} BOGO mappings`);
    } else {
      console.log(`⚠️  Created ${configResult.created} mappings with ${configResult.errors.length} errors:`);
      configResult.errors.forEach(error => {
        console.log(`   - ${error.mapping.promotionName}: ${error.error}`);
      });
    }

    // Step 3: Test mappings
    console.log('\n🧪 Step 3: Testing mappings with product data...');
    const testResult = await testMappingsWithProductData();
    
    if (testResult.success) {
      console.log('✅ All mappings tested successfully');
    } else {
      console.log('⚠️  Some mappings failed testing:');
      testResult.results.forEach(result => {
        if (!result.tested) {
          console.log(`   - ${result.mainProductId}: ${result.error}`);
        }
      });
    }

    // Step 4: Verify free shipping
    console.log('\n🚚 Step 4: Verifying free shipping configuration...');
    const shippingResult = await verifyFreeShippingForAllMappings();
    
    if (shippingResult.success) {
      console.log(`✅ All ${shippingResult.mappingsWithFreeShipping} mappings have free shipping enabled`);
    } else {
      console.log('❌ Some mappings do not have free shipping:');
      shippingResult.mappingsWithoutFreeShipping.forEach(id => {
        console.log(`   - Mapping ID: ${id}`);
      });
    }

    console.log('\n🎉 BOGO mappings configuration completed!');
    console.log('\n📊 Summary:');
    console.log(`   - Product IDs validated: ${validation.validProducts.length}`);
    console.log(`   - Mappings created: ${configResult.created}`);
    console.log(`   - Mappings tested: ${testResult.results.filter(r => r.tested).length}`);
    console.log(`   - Free shipping enabled: ${shippingResult.mappingsWithFreeShipping}`);

  } catch (error) {
    console.error('💥 Configuration failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { main as configureBOGOMappings };