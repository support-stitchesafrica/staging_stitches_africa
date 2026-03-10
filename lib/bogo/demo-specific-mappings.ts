// BOGO Specific Mappings Demonstration
// This script demonstrates how the 7 specific product mappings work

import { bogoMappingService } from './mapping-service';
import { bogoCartService } from './cart-service';
import { SPECIFIC_BOGO_MAPPINGS, PRODUCT_ID_MAPPINGS } from './configure-specific-mappings';
import type { Product, CartItem } from '../../types';
import type { BogoCartItem } from '../../types/bogo';

/**
 * Create mock products for demonstration
 */
function createMockProduct(productId: string, title: string, price: number): Product {
  return {
    product_id: productId,
    title,
    description: `Mock product: ${title}`,
    type: 'ready-to-wear',
    category: 'accessories',
    availability: 'in_stock',
    status: 'verified',
    price: { base: price, currency: 'USD' },
    discount: 0,
    deliveryTimeline: '3-5 days',
    returnPolicy: '30 days',
    images: ['/placeholder-product.svg'],
    tailor_id: 'demo-tailor',
    tailor: 'Demo Tailor',
    tags: ['demo', 'bogo']
  };
}

/**
 * Demonstrate a single BOGO mapping
 */
export async function demonstrateBOGOMapping(
  mainProductId: string,
  mainProductTitle: string,
  mainPrice: number,
  freeProductId: string,
  freeProductTitle: string,
  freePrice: number
): Promise<void> {
  console.log(`\n🛍️  Demonstrating: ${mainProductTitle} → ${freeProductTitle}`);
  console.log(`   Main product: $${mainPrice.toFixed(2)}`);
  console.log(`   Free product: $${freePrice.toFixed(2)} (FREE!)`);
  console.log(`   Total savings: $${freePrice.toFixed(2)}`);

  // Create mock products
  const mainProduct = createMockProduct(mainProductId, mainProductTitle, mainPrice);
  const freeProduct = createMockProduct(freeProductId, freeProductTitle, freePrice);

  // Simulate adding main product to cart
  const cartItems: CartItem[] = [];
  
  try {
    // Check for BOGO mapping
    const mapping = await bogoMappingService.getActiveMapping(mainProductId);
    
    if (mapping) {
      console.log('   ✅ Active BOGO mapping found');
      
      // Add main product to cart
      const mainCartItem: CartItem = {
        product_id: mainProduct.product_id,
        title: mainProduct.title,
        description: mainProduct.description,
        price: mainProduct.price.base,
        discount: 0,
        quantity: 1,
        color: null,
        size: null,
        sizes: null,
        images: mainProduct.images,
        tailor_id: mainProduct.tailor_id,
        tailor: mainProduct.tailor,
        user_id: 'demo-user',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      cartItems.push(mainCartItem);
      
      // Add free product automatically
      const freeCartItem: BogoCartItem = {
        product_id: freeProduct.product_id,
        title: freeProduct.title,
        description: freeProduct.description,
        price: 0, // Free!
        discount: 0,
        quantity: 1,
        color: null,
        size: null,
        sizes: null,
        images: freeProduct.images,
        tailor_id: freeProduct.tailor_id,
        tailor: freeProduct.tailor,
        user_id: 'demo-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        isBogoFree: true,
        bogoMainProductId: mainProduct.product_id,
        bogoOriginalPrice: freeProduct.price.base
      };
      
      cartItems.push(freeCartItem);
      
      // Calculate shipping (should be free)
      const shippingCost = bogoCartService.calculateShippingWithBogo(cartItems);
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = subtotal + shippingCost;
      
      console.log('   📦 Cart Summary:');
      console.log(`      Subtotal: $${subtotal.toFixed(2)}`);
      console.log(`      Shipping: $${shippingCost.toFixed(2)} ${shippingCost === 0 ? '(FREE!)' : ''}`);
      console.log(`      Total: $${total.toFixed(2)}`);
      console.log(`      You save: $${(freePrice + (shippingCost === 0 ? 15 : 0)).toFixed(2)}`); // Assume $15 standard shipping
      
    } else {
      console.log('   ❌ No active BOGO mapping found');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Demonstrate all 7 specific BOGO mappings
 */
export async function demonstrateAllBOGOMappings(): Promise<void> {
  console.log('🎉 BOGO Promotion Demonstration');
  console.log('================================');
  console.log('December 2024 - Buy One Get One Free Promotion');
  console.log('All orders include FREE SHIPPING! 🚚\n');

  const demonstrations = [
    {
      mainId: 'ouch-sneakers-240',
      mainTitle: 'OUCH SNEAKERS',
      mainPrice: 240.00,
      freeId: 'ttdalk-long-wallet-96',
      freeTitle: 'TTDALK LONG WALLET',
      freePrice: 96.00
    },
    {
      mainId: 'trax-pants-wide-leg-pant',
      mainTitle: 'TRAX PANTS WIDE LEG PANT',
      mainPrice: 85.00, // Estimated price
      freeId: 'ttdalk-long-wallet-96',
      freeTitle: 'TTDALK LONG WALLET',
      freePrice: 96.00
    },
    {
      mainId: 'trax-pants-splattered-shorts',
      mainTitle: 'TRAX PANTS SPLATTERED SHORTS',
      mainPrice: 75.00, // Estimated price
      freeId: 'ttdalk-long-wallet-96',
      freeTitle: 'TTDALK LONG WALLET',
      freePrice: 96.00
    },
    {
      mainId: 'haute-afrikana-akwete-maxi-dress-120',
      mainTitle: 'HAUTE AFRIKANA AKWETE MAXI DRESS',
      mainPrice: 120.00,
      freeId: 'by-ore-sequin-purse-79',
      freeTitle: 'BY ORE SEQUIN PURSE',
      freePrice: 79.00
    }
  ];

  for (const demo of demonstrations) {
    await demonstrateBOGOMapping(
      demo.mainId,
      demo.mainTitle,
      demo.mainPrice,
      demo.freeId,
      demo.freeTitle,
      demo.freePrice
    );
  }

  // Special cases: Products with multiple free options
  console.log(`\n🛍️  Demonstrating: NANCY HANSON SILENT POWER TOP (Multiple Options)`);
  console.log(`   Main product: $120.00`);
  console.log(`   Choose your FREE item:`);
  console.log(`   Option 1: LOLA SIGNATURE CANDY ($108.00)`);
  console.log(`   Option 2: LOLA SIGNATURE EWA BEAD BAG ($98.00)`);
  console.log(`   💡 Customer gets to choose their preferred free item!`);

  console.log(`\n🛍️  Demonstrating: NANCY HANSON PEARL NEUTRAL (Multiple Options)`);
  console.log(`   Main product: $78.00`);
  console.log(`   Choose your FREE item:`);
  console.log(`   Option 1: LOLA SIGNATURE CANDY ($108.00)`);
  console.log(`   Option 2: LOLA SIGNATURE EWA BEAD BAG ($98.00)`);
  console.log(`   💡 Customer gets to choose their preferred free item!`);

  console.log(`\n🛍️  Demonstrating: IYANGA WOMAN AINA DRESS (Multiple Options)`);
  console.log(`   Main product: $366.00`);
  console.log(`   Choose your FREE item:`);
  console.log(`   Option 1: LOLA SIGNATURE CANDY ($108.00)`);
  console.log(`   Option 2: LOLA SIGNATURE EWA BEAD BAG ($98.00)`);
  console.log(`   💡 Customer gets to choose their preferred free item!`);

  console.log('\n📊 Promotion Summary:');
  console.log('====================');
  console.log('✅ 7 product pairs configured');
  console.log('✅ All orders include free shipping');
  console.log('✅ Automatic free product addition');
  console.log('✅ Customer choice for multiple options');
  console.log('✅ Valid from December 1-31, 2024');
  
  const totalSavings = demonstrations.reduce((sum, demo) => sum + demo.freePrice, 0) + 108; // Add max choice option
  console.log(`💰 Maximum potential savings: $${totalSavings.toFixed(2)} + Free Shipping`);
}

/**
 * Test cart behavior with BOGO items
 */
export async function testCartBehavior(): Promise<void> {
  console.log('\n🧪 Testing Cart Behavior');
  console.log('========================');

  // Test 1: Quantity synchronization
  console.log('\n📝 Test 1: Quantity Synchronization');
  const cartItems: CartItem[] = [
    {
      product_id: 'nancy-hanson-pearl-neutral-78',
      title: 'NANCY HANSON PEARL NEUTRAL',
      description: 'Main product',
      price: 78.00,
      discount: 0,
      quantity: 2,
      color: null,
      size: null,
      sizes: null,
      images: ['/test-image.jpg'],
      tailor_id: 'test-tailor',
      tailor: 'Test Tailor',
      user_id: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      product_id: 'lola-signature-ewa-bead-bag-98',
      title: 'LOLA SIGNATURE EWA BEAD BAG',
      description: 'Free product',
      price: 0,
      discount: 0,
      quantity: 2,
      color: null,
      size: null,
      sizes: null,
      images: ['/test-image.jpg'],
      tailor_id: 'test-tailor',
      tailor: 'Test Tailor',
      user_id: 'test-user',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBogoFree: true,
      bogoMainProductId: 'nancy-hanson-pearl-neutral-78'
    } as BogoCartItem
  ];

  const validation = await bogoCartService.validateBogoCart(cartItems);
  console.log(`   Quantity sync validation: ${validation.isValid ? '✅ PASS' : '❌ FAIL'}`);
  if (!validation.isValid) {
    validation.errors.forEach(error => console.log(`   Error: ${error}`));
  }

  // Test 2: Free shipping calculation
  console.log('\n📝 Test 2: Free Shipping Calculation');
  const shippingCost = bogoCartService.calculateShippingWithBogo(cartItems);
  console.log(`   Shipping cost: $${shippingCost.toFixed(2)} ${shippingCost === 0 ? '✅ FREE' : '❌ NOT FREE'}`);

  // Test 3: Cart summary
  console.log('\n📝 Test 3: Cart Summary');
  const summary = bogoCartService.getBogoCartSummary(cartItems);
  console.log(`   Has BOGO items: ${summary.hasBogoItems ? '✅ YES' : '❌ NO'}`);
  console.log(`   BOGO savings: $${summary.bogoSavings.toFixed(2)}`);
  console.log(`   Free shipping: ${summary.freeShipping ? '✅ YES' : '❌ NO'}`);
  console.log(`   BOGO items count: ${summary.bogoItemsCount}`);
}

// Export for use in other scripts
export {
  SPECIFIC_BOGO_MAPPINGS,
  PRODUCT_ID_MAPPINGS
};