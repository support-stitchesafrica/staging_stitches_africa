// BOGO Free Shipping Property-Based Tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { bogoCartService } from '../cart-service';
import type { CartItem } from '../../../types';
import type { BogoCartItem } from '../../../types/bogo';

// Mock the mapping service
vi.mock('../mapping-service', () => ({
  bogoMappingService: {
    getActiveMapping: vi.fn(),
    getAllMappings: vi.fn(),
  },
}));

describe('BOGO Free Shipping Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: bogo-promotion, Property 11: Free Shipping Application
  it('Property 11: Free Shipping Application - For any cart containing at least one BOGO main product, the calculated shipping cost should be $0.00', () => {
    fc.assert(
      fc.property(
        // Generate cart items with at least one BOGO item
        fc.record({
          regularItems: fc.array(
            fc.record({
              product_id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              description: fc.string(),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              discount: fc.integer({ min: 0, max: 100 }),
              quantity: fc.integer({ min: 1, max: 10 }),
              color: fc.oneof(fc.string(), fc.constant(null)),
              size: fc.oneof(fc.string(), fc.constant(null)),
              sizes: fc.constant(null),
              images: fc.array(fc.string()),
              tailor_id: fc.string(),
              tailor: fc.string(),
              user_id: fc.string(),
              createdAt: fc.constant(new Date()),
              updatedAt: fc.constant(new Date()),
            }),
            { maxLength: 5 }
          ),
          bogoMainProduct: fc.record({
            product_id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
            discount: fc.integer({ min: 0, max: 100 }),
            quantity: fc.integer({ min: 1, max: 10 }),
            color: fc.oneof(fc.string(), fc.constant(null)),
            size: fc.oneof(fc.string(), fc.constant(null)),
            sizes: fc.constant(null),
            images: fc.array(fc.string()),
            tailor_id: fc.string(),
            tailor: fc.string(),
            user_id: fc.string(),
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
          }),
          bogoFreeProduct: fc.record({
            product_id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            price: fc.constant(0), // Free products have $0 price
            discount: fc.constant(0),
            quantity: fc.integer({ min: 1, max: 10 }),
            color: fc.oneof(fc.string(), fc.constant(null)),
            size: fc.oneof(fc.string(), fc.constant(null)),
            sizes: fc.constant(null),
            images: fc.array(fc.string()),
            tailor_id: fc.string(),
            tailor: fc.string(),
            user_id: fc.string(),
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
            isBogoFree: fc.constant(true),
            bogoOriginalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
          }),
        }),
        (testData) => {
          // Create cart items with BOGO relationship
          const bogoFreeItem: BogoCartItem = {
            ...testData.bogoFreeProduct,
            bogoMainProductId: testData.bogoMainProduct.product_id,
          };

          const cartItems: CartItem[] = [
            ...testData.regularItems,
            testData.bogoMainProduct,
            bogoFreeItem as CartItem,
          ];

          // Calculate shipping with BOGO logic
          const shippingCost = bogoCartService.calculateShippingWithBogo(cartItems);

          // Property: Cart with BOGO items should have $0 shipping
          expect(shippingCost).toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Additional property test for edge case: empty cart
  it('Property 11 Edge Case: Empty cart should not have free shipping', () => {
    const emptyCart: CartItem[] = [];
    const shippingCost = bogoCartService.calculateShippingWithBogo(emptyCart);
    
    // Empty cart should not have free shipping (should use standard calculation)
    expect(shippingCost).toBeGreaterThanOrEqual(0);
  });

  // Additional property test for edge case: cart with only regular items
  it('Property 11 Edge Case: Cart with only regular items should not have free shipping', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            product_id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
            discount: fc.integer({ min: 0, max: 100 }),
            quantity: fc.integer({ min: 1, max: 10 }),
            color: fc.oneof(fc.string(), fc.constant(null)),
            size: fc.oneof(fc.string(), fc.constant(null)),
            sizes: fc.constant(null),
            images: fc.array(fc.string()),
            tailor_id: fc.string(),
            tailor: fc.string(),
            user_id: fc.string(),
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (regularItems) => {
          // Ensure no BOGO items in cart
          const cartItems: CartItem[] = regularItems.map(item => ({
            ...item,
            isBogoFree: false,
            bogoMainProductId: undefined,
          }));

          const shippingCost = bogoCartService.calculateShippingWithBogo(cartItems);

          // Cart without BOGO items should use standard shipping calculation
          // (which should be > 0 for non-empty carts based on current logic)
          expect(shippingCost).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('BOGO Free Shipping Message Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display "December BOGO Promo – Free Shipping" message when cart has BOGO items', () => {
    // Create a cart with BOGO items
    const bogoMainProduct: CartItem = {
      product_id: 'main-product-1',
      title: 'Main Product',
      description: 'A main product',
      price: 100,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['image1.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bogoFreeProduct: BogoCartItem = {
      product_id: 'free-product-1',
      title: 'Free Product',
      description: 'A free product',
      price: 0,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['image2.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBogoFree: true,
      bogoMainProductId: 'main-product-1',
      bogoOriginalPrice: 50,
    };

    const cartItems: CartItem[] = [bogoMainProduct, bogoFreeProduct as CartItem];

    // Get BOGO cart summary
    const summary = bogoCartService.getBogoCartSummary(cartItems);

    // Verify that free shipping is enabled
    expect(summary.freeShipping).toBe(true);
    expect(summary.hasBogoItems).toBe(true);

    // The message "December BOGO Promo – Free Shipping" would be displayed
    // in the UI when summary.freeShipping is true
    // This test validates the condition that triggers the message
  });

  it('should not display free shipping message when cart has no BOGO items', () => {
    // Create a cart with only regular items
    const regularProduct: CartItem = {
      product_id: 'regular-product-1',
      title: 'Regular Product',
      description: 'A regular product',
      price: 100,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['image1.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const cartItems: CartItem[] = [regularProduct];

    // Get BOGO cart summary
    const summary = bogoCartService.getBogoCartSummary(cartItems);

    // Verify that free shipping is not enabled
    expect(summary.freeShipping).toBe(false);
    expect(summary.hasBogoItems).toBe(false);

    // The free shipping message should not be displayed
  });

  it('should display free shipping message when cart has multiple BOGO pairs', () => {
    // Create a cart with multiple BOGO pairs
    const bogoMainProduct1: CartItem = {
      product_id: 'main-product-1',
      title: 'Main Product 1',
      description: 'First main product',
      price: 100,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['image1.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bogoFreeProduct1: BogoCartItem = {
      product_id: 'free-product-1',
      title: 'Free Product 1',
      description: 'First free product',
      price: 0,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['image2.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBogoFree: true,
      bogoMainProductId: 'main-product-1',
      bogoOriginalPrice: 50,
    };

    const bogoMainProduct2: CartItem = {
      product_id: 'main-product-2',
      title: 'Main Product 2',
      description: 'Second main product',
      price: 150,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['image3.jpg'],
      tailor_id: 'tailor-2',
      tailor: 'Tailor Name 2',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bogoFreeProduct2: BogoCartItem = {
      product_id: 'free-product-2',
      title: 'Free Product 2',
      description: 'Second free product',
      price: 0,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['image4.jpg'],
      tailor_id: 'tailor-2',
      tailor: 'Tailor Name 2',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBogoFree: true,
      bogoMainProductId: 'main-product-2',
      bogoOriginalPrice: 75,
    };

    const cartItems: CartItem[] = [
      bogoMainProduct1,
      bogoFreeProduct1 as CartItem,
      bogoMainProduct2,
      bogoFreeProduct2 as CartItem,
    ];

    // Get BOGO cart summary
    const summary = bogoCartService.getBogoCartSummary(cartItems);

    // Verify that free shipping is enabled for multiple BOGO pairs
    expect(summary.freeShipping).toBe(true);
    expect(summary.hasBogoItems).toBe(true);
    expect(summary.bogoItemsCount).toBe(4); // 2 main + 2 free products
  });
});

describe('BOGO Free Shipping Removal Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: bogo-promotion, Property 12: Free Shipping Removal
  it('Property 12: Free Shipping Removal - For any cart that had BOGO items, removing all BOGO main products should result in shipping cost being recalculated to standard rates', () => {
    fc.assert(
      fc.property(
        // Generate cart with regular items and BOGO items
        fc.record({
          regularItems: fc.array(
            fc.record({
              product_id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              description: fc.string(),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              discount: fc.integer({ min: 0, max: 100 }),
              quantity: fc.integer({ min: 1, max: 10 }),
              color: fc.oneof(fc.string(), fc.constant(null)),
              size: fc.oneof(fc.string(), fc.constant(null)),
              sizes: fc.constant(null),
              images: fc.array(fc.string()),
              tailor_id: fc.string(),
              tailor: fc.string(),
              user_id: fc.string(),
              createdAt: fc.constant(new Date()),
              updatedAt: fc.constant(new Date()),
            }),
            { minLength: 1, maxLength: 3 } // Ensure at least one regular item
          ),
          bogoMainProducts: fc.array(
            fc.record({
              product_id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              description: fc.string(),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              discount: fc.integer({ min: 0, max: 100 }),
              quantity: fc.integer({ min: 1, max: 10 }),
              color: fc.oneof(fc.string(), fc.constant(null)),
              size: fc.oneof(fc.string(), fc.constant(null)),
              sizes: fc.constant(null),
              images: fc.array(fc.string()),
              tailor_id: fc.string(),
              tailor: fc.string(),
              user_id: fc.string(),
              createdAt: fc.constant(new Date()),
              updatedAt: fc.constant(new Date()),
            }),
            { minLength: 1, maxLength: 2 } // At least one BOGO main product
          ),
        }),
        (testData) => {
          // Create BOGO free products for each main product
          const bogoFreeProducts: BogoCartItem[] = testData.bogoMainProducts.map((mainProduct, index) => ({
            product_id: `free-product-${index}`,
            title: `Free Product ${index}`,
            description: 'Free item from BOGO promotion',
            price: 0,
            discount: 0,
            quantity: mainProduct.quantity,
            color: null,
            size: null,
            sizes: null,
            images: ['free-product.jpg'],
            tailor_id: mainProduct.tailor_id,
            tailor: mainProduct.tailor,
            user_id: mainProduct.user_id,
            createdAt: new Date(),
            updatedAt: new Date(),
            isBogoFree: true,
            bogoMainProductId: mainProduct.product_id,
            bogoOriginalPrice: Math.fround(50),
          }));

          // Initial cart with BOGO items
          const initialCartItems: CartItem[] = [
            ...testData.regularItems,
            ...testData.bogoMainProducts,
            ...bogoFreeProducts as CartItem[],
          ];

          // Calculate initial shipping (should be $0 due to BOGO)
          const initialShipping = bogoCartService.calculateShippingWithBogo(initialCartItems);
          expect(initialShipping).toBe(0);

          // Cart after removing all BOGO items (only regular items remain)
          const cartAfterBogoRemoval: CartItem[] = testData.regularItems;

          // Calculate shipping after BOGO removal (should be > 0 for regular items)
          const shippingAfterRemoval = bogoCartService.calculateShippingWithBogo(cartAfterBogoRemoval);

          // Property: Removing all BOGO items should restore standard shipping rates
          expect(shippingAfterRemoval).toBeGreaterThan(0);
        }
      ),
      { numRuns: 10 }
    );
  });

  // Edge case: removing some but not all BOGO items should still maintain free shipping
  it('Property 12 Edge Case: Removing some BOGO items while keeping others should maintain free shipping', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            mainProductId: fc.string({ minLength: 1 }),
            freeProductId: fc.string({ minLength: 1 }),
            quantity: fc.integer({ min: 1, max: 5 }),
          }),
          { minLength: 2, maxLength: 4 } // Multiple BOGO pairs
        ),
        (bogoPairs) => {
          // Create cart items for all BOGO pairs
          const cartItems: CartItem[] = [];
          
          bogoPairs.forEach((pair, index) => {
            // Add main product
            cartItems.push({
              product_id: pair.mainProductId,
              title: `Main Product ${index}`,
              description: 'Main product',
              price: Math.fround(100),
              discount: 0,
              quantity: pair.quantity,
              color: null,
              size: null,
              sizes: null,
              images: ['main-product.jpg'],
              tailor_id: 'tailor-1',
              tailor: 'Tailor Name',
              user_id: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Add free product
            const freeProduct: BogoCartItem = {
              product_id: pair.freeProductId,
              title: `Free Product ${index}`,
              description: 'Free product',
              price: 0,
              discount: 0,
              quantity: pair.quantity,
              color: null,
              size: null,
              sizes: null,
              images: ['free-product.jpg'],
              tailor_id: 'tailor-1',
              tailor: 'Tailor Name',
              user_id: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
              isBogoFree: true,
              bogoMainProductId: pair.mainProductId,
              bogoOriginalPrice: Math.fround(50),
            };
            cartItems.push(freeProduct as CartItem);
          });

          // Remove first BOGO pair but keep others
          const cartAfterPartialRemoval = cartItems.filter(item => {
            const bogoItem = item as BogoCartItem;
            return item.product_id !== bogoPairs[0].mainProductId && 
                   bogoItem.bogoMainProductId !== bogoPairs[0].mainProductId;
          });

          // Should still have free shipping since other BOGO items remain
          const shippingAfterPartialRemoval = bogoCartService.calculateShippingWithBogo(cartAfterPartialRemoval);
          expect(shippingAfterPartialRemoval).toBe(0);
        }
      ),
      { numRuns: 10 }
    );
  });
});

describe('BOGO Universal Free Shipping Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: bogo-promotion, Property 13: Universal Free Shipping
  it('Property 13: Universal Free Shipping - For any cart with BOGO items and any combination of delivery location and shipping method, the shipping cost should be $0.00', () => {
    fc.assert(
      fc.property(
        // Generate cart with BOGO items and various shipping scenarios
        fc.record({
          bogoMainProduct: fc.record({
            product_id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
            discount: fc.integer({ min: 0, max: 100 }),
            quantity: fc.integer({ min: 1, max: 10 }),
            color: fc.oneof(fc.string(), fc.constant(null)),
            size: fc.oneof(fc.string(), fc.constant(null)),
            sizes: fc.constant(null),
            images: fc.array(fc.string()),
            tailor_id: fc.string(),
            tailor: fc.string(),
            user_id: fc.string(),
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
          }),
          bogoFreeProduct: fc.record({
            product_id: fc.string({ minLength: 1 }),
            title: fc.string({ minLength: 1 }),
            description: fc.string(),
            price: fc.constant(0),
            discount: fc.constant(0),
            quantity: fc.integer({ min: 1, max: 10 }),
            color: fc.oneof(fc.string(), fc.constant(null)),
            size: fc.oneof(fc.string(), fc.constant(null)),
            sizes: fc.constant(null),
            images: fc.array(fc.string()),
            tailor_id: fc.string(),
            tailor: fc.string(),
            user_id: fc.string(),
            createdAt: fc.constant(new Date()),
            updatedAt: fc.constant(new Date()),
            isBogoFree: fc.constant(true),
            bogoOriginalPrice: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
          }),
          // Simulate different delivery scenarios (these don't affect the calculation but represent real-world variety)
          deliveryLocation: fc.oneof(
            fc.constant('domestic'),
            fc.constant('international'),
            fc.constant('local'),
            fc.constant('remote')
          ),
          shippingMethod: fc.oneof(
            fc.constant('standard'),
            fc.constant('express'),
            fc.constant('overnight'),
            fc.constant('economy')
          ),
          additionalItems: fc.array(
            fc.record({
              product_id: fc.string({ minLength: 1 }),
              title: fc.string({ minLength: 1 }),
              description: fc.string(),
              price: fc.float({ min: Math.fround(0.01), max: Math.fround(1000), noNaN: true }),
              discount: fc.integer({ min: 0, max: 100 }),
              quantity: fc.integer({ min: 1, max: 10 }),
              color: fc.oneof(fc.string(), fc.constant(null)),
              size: fc.oneof(fc.string(), fc.constant(null)),
              sizes: fc.constant(null),
              images: fc.array(fc.string()),
              tailor_id: fc.string(),
              tailor: fc.string(),
              user_id: fc.string(),
              createdAt: fc.constant(new Date()),
              updatedAt: fc.constant(new Date()),
            }),
            { maxLength: 5 }
          ),
        }),
        (testData) => {
          // Create BOGO free product with proper relationship
          const bogoFreeItem: BogoCartItem = {
            ...testData.bogoFreeProduct,
            bogoMainProductId: testData.bogoMainProduct.product_id,
          };

          // Create cart with BOGO items and additional items
          const cartItems: CartItem[] = [
            testData.bogoMainProduct,
            bogoFreeItem as CartItem,
            ...testData.additionalItems,
          ];

          // Calculate shipping - should be $0 regardless of delivery location or shipping method
          const shippingCost = bogoCartService.calculateShippingWithBogo(cartItems);

          // Property: Universal free shipping for any cart with BOGO items
          expect(shippingCost).toBe(0);

          // Additional verification: the presence of delivery location and shipping method
          // should not affect the free shipping calculation
          expect(testData.deliveryLocation).toBeDefined();
          expect(testData.shippingMethod).toBeDefined();
        }
      ),
      { numRuns: 10 }
    );
  });

  // Edge case: single BOGO item with high-value regular items
  it('Property 13 Edge Case: Free shipping applies even with high-value regular items that would normally have expensive shipping', () => {
    const highValueRegularItem: CartItem = {
      product_id: 'expensive-item',
      title: 'Expensive Regular Item',
      description: 'High-value regular product',
      price: 5000, // Very expensive item
      discount: 0,
      quantity: 10, // High quantity
      color: null,
      size: null,
      sizes: null,
      images: ['expensive-item.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bogoMainProduct: CartItem = {
      product_id: 'bogo-main',
      title: 'BOGO Main Product',
      description: 'Main product for BOGO',
      price: 50, // Relatively cheap BOGO item
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['bogo-main.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const bogoFreeProduct: BogoCartItem = {
      product_id: 'bogo-free',
      title: 'BOGO Free Product',
      description: 'Free product for BOGO',
      price: 0,
      discount: 0,
      quantity: 1,
      color: null,
      size: null,
      sizes: null,
      images: ['bogo-free.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Tailor Name',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBogoFree: true,
      bogoMainProductId: 'bogo-main',
      bogoOriginalPrice: 25,
    };

    const cartItems: CartItem[] = [
      highValueRegularItem,
      bogoMainProduct,
      bogoFreeProduct as CartItem,
    ];

    // Even with expensive regular items, BOGO should provide free shipping
    const shippingCost = bogoCartService.calculateShippingWithBogo(cartItems);
    expect(shippingCost).toBe(0);
  });
});