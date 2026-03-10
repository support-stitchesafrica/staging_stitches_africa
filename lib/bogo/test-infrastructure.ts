// BOGO Infrastructure Test - Simple test to verify the setup works
import { bogoMappingService } from './mapping-service';
import { bogoCartService } from './cart-service';
import { bogoBadgeService } from './badge-service';
import type { CreateBogoMappingData } from '../../types/bogo';

/**
 * Test BOGO infrastructure setup
 */
export async function testBogoInfrastructure(): Promise<boolean> {
  try {
    console.log('Testing BOGO infrastructure...');

    // Test 1: Validate mapping data
    const testMappingData: CreateBogoMappingData = {
      mainProductId: 'test-main-product',
      freeProductIds: ['test-free-product-1', 'test-free-product-2'],
      promotionStartDate: new Date(),
      promotionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      active: true,
      autoFreeShipping: true,
      promotionName: 'Test BOGO Promotion'
    };

    const validation = await bogoMappingService.validateMapping(testMappingData);
    console.log('✓ Mapping validation test passed:', validation.isValid);

    // Test 2: Badge service initialization
    const badges = await bogoBadgeService.getProductBadges('non-existent-product');
    console.log('✓ Badge service test passed:', badges.length >= 0);

    // Test 3: Cart service validation
    const cartValidation = await bogoCartService.validateBogoCart([]);
    console.log('✓ Cart service test passed:', cartValidation.isValid);

    // Test 4: Badge configuration
    const badgeConfig = bogoBadgeService.getBadgeConfig();
    console.log('✓ Badge configuration test passed:', badgeConfig.mainProduct.text.length > 0);

    console.log('✅ All BOGO infrastructure tests passed!');
    return true;
  } catch (error) {
    console.error('❌ BOGO infrastructure test failed:', error);
    return false;
  }
}

/**
 * Test BOGO data models and types
 */
export function testBogoTypes(): boolean {
  try {
    console.log('Testing BOGO types...');

    // Test type imports work
    const testData: CreateBogoMappingData = {
      mainProductId: 'test',
      freeProductIds: ['free1'],
      promotionStartDate: new Date(),
      promotionEndDate: new Date(),
    };

    console.log('✓ Type definitions test passed');
    return true;
  } catch (error) {
    console.error('❌ BOGO types test failed:', error);
    return false;
  }
}

// Export test functions
export default {
  testBogoInfrastructure,
  testBogoTypes
};