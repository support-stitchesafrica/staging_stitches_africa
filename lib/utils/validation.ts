/**
 * Validation script to verify utility functions are working correctly
 * This file can be used to manually test the utility functions
 */

import {
  parseUrlFilters,
  applyTypeFilter,
  getProductParameters,
  formatParameterValue
} from './index';
import { calculateFixedShipping } from './shipping-utils';
import { getTypeSpecificContent } from './product-type-utils';
import { Product } from '@/types';

// Sample product for testing
const sampleProduct: Product = {
  product_id: 'test-1',
  title: 'Test Bespoke Suit',
  description: 'A custom tailored suit',
  type: 'bespoke',
  category: 'suits',
  availability: 'in_stock',
  status: 'verified',
  price: { base: 800, currency: 'USD' },
  discount: 15,
  deliveryTimeline: '4-6 weeks',
  returnPolicy: '30 days',
  images: ['suit1.jpg'],
  tags: ['formal', 'business'],
  tailor_id: 'tailor-123',
  tailor: 'Master Craftsman',
  vendor: {
    id: 'vendor-123',
    name: 'Premium Tailoring Co.',
    email: 'info@premium.com',
    phone: '+1-555-0123',
    location: 'New York, NY'
  },
  shipping: {
    actualWeightKg: 2.0,
    heightCm: 25,
    lengthCm: 35,
    widthCm: 20,
    manualOverride: false,
    tierKey: 'premium'
  },
  bespokeOptions: {
    customization: {
      lapelStyle: 'peak',
      buttons: '2-button',
      vents: 'double'
    },
    fabricChoices: ['wool', 'cashmere', 'silk'],
    measurementsRequired: ['chest', 'waist', 'inseam', 'shoulder'],
    productionTime: '4-6 weeks',
    depositAllowed: true
  },
  customSizes: true,
  wear_category: 'formal',
  featured: true,
  slug: 'test-bespoke-suit',
  metaTitle: 'Premium Bespoke Suit',
  createdAt: '2024-01-15T10:00:00Z',
  isPublished: true
};

/**
 * Validate shipping utilities
 */
export function validateShippingUtils(): boolean {
  try {
    // Test fixed shipping calculation
    const shipping1 = calculateFixedShipping(1);
    const shipping3 = calculateFixedShipping(3);
    const shipping0 = calculateFixedShipping(0);
    
    console.log('✅ Shipping Utils Validation:');
    console.log(`  - 1 item: $${shipping1} (expected: $30)`);
    console.log(`  - 3 items: $${shipping3} (expected: $90)`);
    console.log(`  - 0 items: $${shipping0} (expected: $0)`);
    
    return shipping1 === 30 && shipping3 === 90 && shipping0 === 0;
  } catch (error) {
    console.error('❌ Shipping Utils Error:', error);
    return false;
  }
}

/**
 * Validate filter utilities
 */
export function validateFilterUtils(): boolean {
  try {
    // Test URL parameter parsing
    const searchParams = new URLSearchParams('type=bespoke&category=suits&vendor=vendor-123');
    const filters = parseUrlFilters(searchParams);
    
    console.log('✅ Filter Utils Validation:');
    console.log(`  - Parsed type: ${filters.type} (expected: bespoke)`);
    console.log(`  - Parsed category: ${filters.category} (expected: suits)`);
    console.log(`  - Parsed vendor: ${filters.vendor} (expected: vendor-123)`);
    
    // Test type filtering
    const products = [sampleProduct];
    const bespokeFiltered = applyTypeFilter(products, 'bespoke');
    const rtwFiltered = applyTypeFilter(products, 'ready-to-wear');
    
    console.log(`  - Bespoke filter: ${bespokeFiltered.length} products (expected: 1)`);
    console.log(`  - RTW filter: ${rtwFiltered.length} products (expected: 0)`);
    
    return (
      filters.type === 'bespoke' &&
      filters.category === 'suits' &&
      filters.vendor === 'vendor-123' &&
      bespokeFiltered.length === 1 &&
      rtwFiltered.length === 0
    );
  } catch (error) {
    console.error('❌ Filter Utils Error:', error);
    return false;
  }
}

/**
 * Validate product parameter utilities
 */
export function validateProductUtils(): boolean {
  try {
    // Test parameter extraction
    const parameters = getProductParameters(sampleProduct);
    const basicParams = parameters.filter(p => p.category === 'basic');
    const shippingParams = parameters.filter(p => p.category === 'shipping');
    const vendorParams = parameters.filter(p => p.category === 'vendor');
    
    console.log('✅ Product Utils Validation:');
    console.log(`  - Total parameters: ${parameters.length}`);
    console.log(`  - Basic parameters: ${basicParams.length}`);
    console.log(`  - Shipping parameters: ${shippingParams.length}`);
    console.log(`  - Vendor parameters: ${vendorParams.length}`);
    
    // Test parameter value formatting
    const formattedBoolean = formatParameterValue(true);
    const formattedNumber = formatParameterValue(42);
    const formattedString = formatParameterValue('snake_case_value');
    
    console.log(`  - Boolean format: ${formattedBoolean} (expected: Yes)`);
    console.log(`  - Number format: ${formattedNumber} (expected: 42)`);
    console.log(`  - String format: ${formattedString} (expected: Snake Case Value)`);
    
    return (
      parameters.length > 0 &&
      basicParams.length > 0 &&
      shippingParams.length > 0 &&
      vendorParams.length > 0 &&
      formattedBoolean === 'Yes' &&
      formattedNumber === '42' &&
      formattedString === 'Snake Case Value'
    );
  } catch (error) {
    console.error('❌ Product Utils Error:', error);
    return false;
  }
}

/**
 * Validate type-specific content utilities
 */
export function validateTypeSpecificUtils(): boolean {
  try {
    // Test bespoke content generation
    const bespokeContent = getTypeSpecificContent(sampleProduct);
    
    console.log('✅ Type-Specific Utils Validation:');
    console.log(`  - Bespoke sections: ${bespokeContent.sections.length}`);
    console.log(`  - Bespoke actions: ${bespokeContent.actions.length}`);
    console.log(`  - Bespoke warnings: ${bespokeContent.warnings.length}`);
    
    // Test RTW product
    const rtwProduct: Product = {
      ...sampleProduct,
      type: 'ready-to-wear',
      bespokeOptions: undefined,
      rtwOptions: {
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['navy', 'charcoal', 'black'],
        fabric: 'Premium Cotton',
        season: 'All Season'
      }
    };
    
    const rtwContent = getTypeSpecificContent(rtwProduct);
    console.log(`  - RTW sections: ${rtwContent.sections.length}`);
    console.log(`  - RTW actions: ${rtwContent.actions.length}`);
    
    return (
      bespokeContent.sections.length > 0 &&
      bespokeContent.actions.length > 0 &&
      rtwContent.sections.length > 0
    );
  } catch (error) {
    console.error('❌ Type-Specific Utils Error:', error);
    return false;
  }
}

/**
 * Run all validations
 */
export function runAllValidations(): boolean {
  console.log('🔍 Running Utility Function Validations...\n');
  
  const results = [
    validateShippingUtils(),
    validateFilterUtils(),
    validateProductUtils(),
    validateTypeSpecificUtils()
  ];
  
  const allPassed = results.every(result => result);
  
  console.log('\n📊 Validation Summary:');
  console.log(`✅ Shipping Utils: ${results[0] ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Filter Utils: ${results[1] ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Product Utils: ${results[2] ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Type-Specific Utils: ${results[3] ? 'PASS' : 'FAIL'}`);
  console.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  
  return allPassed;
}

// Export sample data for external testing
export { sampleProduct };