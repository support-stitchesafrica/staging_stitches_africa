// BOGO Quantity Management Tests
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { bogoCartService } from '../cart-service';
import type { CartItem, Product } from '../../../types';
import type { BogoCartItem } from '../../../types/bogo';

// Mock the mapping service
vi.mock('../mapping-service', () => ({
  bogoMappingService: {
    getActiveMapping: vi.fn(),
    getAllMappings: vi.fn(),
    getMapping: vi.fn(),
    getPromotionStatus: vi.fn()
  }
}));

// Mock shipping utils
vi.mock('../../utils/shipping-utils', () => ({
  calculateCartShipping: vi.fn(() => 10) // Default shipping cost
}));

describe('BOGO Quantity Management Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Feature: bogo-promotion, Property 16: Quantity Synchronization
  // **Validates: Requirements 7.1**
  it('Property 16: Quantity Synchronization - For any cart with a BOGO pair, changing the main product quantity should result in the free product quantity matching (1:1 ratio)', async () => {
    // Create test data
    const mainProductId = 'main-product-1';
    const freeProductId = 'free-product-1';
    const initialQuantity = 2;
    const newQuantity = 5;

    // Create initial cart with BOGO pair
    const mainProduct: CartItem = {
      product_id: mainProductId,
      title: 'Main Product',
      description: 'Main product description',
      price: 100,
      discount: 0,
      quantity: initialQuantity,
      color: null,
      size: null,
      sizes: null,
      images: ['/test-image.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Test Tailor',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const freeProduct: BogoCartItem = {
      product_id: freeProductId,
      title: 'Free Product',
      description: 'Free product description',
      price: 0,
      discount: 0,
      quantity: initialQuantity, // Should match main product initially
      color: null,
      size: null,
      sizes: null,
      images: ['/test-free-image.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Test Tailor',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBogoFree: true,
      bogoMainProductId: mainProductId,
      bogoMappingId: 'test-mapping',
      bogoOriginalPrice: 50
    };

    const initialCart: CartItem[] = [mainProduct, freeProduct];

    // Update the main product quantity
    const result = await bogoCartService.updateBogoQuantity(
      mainProductId,
      newQuantity,
      initialCart
    );

    // Verify the operation succeeded
    expect(result.success).toBe(true);

    // Use the service's synchronization method to get updated cart
    const updatedCart = await bogoCartService.synchronizeBogoQuantities(
      mainProductId,
      newQuantity,
      initialCart
    );

    // Verify 1:1 ratio is maintained
    const updatedMainProduct = updatedCart.find(item => item.product_id === mainProductId);
    const updatedFreeProduct = updatedCart.find(item => 
      (item as BogoCartItem).bogoMainProductId === mainProductId
    );

    expect(updatedMainProduct).toBeDefined();
    expect(updatedFreeProduct).toBeDefined();
    expect(updatedMainProduct!.quantity).toBe(newQuantity);
    expect(updatedFreeProduct!.quantity).toBe(newQuantity);
    
    // Verify quantities are equal (1:1 ratio)
    expect(updatedMainProduct!.quantity).toBe(updatedFreeProduct!.quantity);
  });

  // Feature: bogo-promotion, Property 17: Multiple BOGO Independence  
  // **Validates: Requirements 7.3**
  it('Property 17: Multiple BOGO Independence - For any cart with multiple different BOGO pairs, each free product should be correctly associated with its own main product without interference', async () => {
    // Create test data for multiple BOGO pairs
    const bogoPairs = [
      { mainProductId: 'main-0', freeProductId: 'free-0', quantity: 2 },
      { mainProductId: 'main-1', freeProductId: 'free-1', quantity: 3 }
    ];

    // Create cart with multiple BOGO pairs
    const cartItems: CartItem[] = [];

    bogoPairs.forEach((pair, index) => {
      // Add main product
      const mainProduct: CartItem = {
        product_id: pair.mainProductId,
        title: `Main Product ${index}`,
        description: `Main product ${index} description`,
        price: 100 + index * 10,
        discount: 0,
        quantity: pair.quantity,
        color: null,
        size: null,
        sizes: null,
        images: [`/test-main-${index}.jpg`],
        tailor_id: `tailor-${index}`,
        tailor: `Test Tailor ${index}`,
        user_id: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add free product
      const freeProduct: BogoCartItem = {
        product_id: pair.freeProductId,
        title: `Free Product ${index}`,
        description: `Free product ${index} description`,
        price: 0,
        discount: 0,
        quantity: pair.quantity,
        color: null,
        size: null,
        sizes: null,
        images: [`/test-free-${index}.jpg`],
        tailor_id: `tailor-${index}`,
        tailor: `Test Tailor ${index}`,
        user_id: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        isBogoFree: true,
        bogoMainProductId: pair.mainProductId,
        bogoMappingId: `test-mapping-${index}`,
        bogoOriginalPrice: 50 + index * 5
      };

      cartItems.push(mainProduct, freeProduct);
    });

    // Verify each free product is correctly associated with its main product
    bogoPairs.forEach((pair, index) => {
      const mainProduct = cartItems.find(item => item.product_id === pair.mainProductId);
      const freeProduct = cartItems.find(item => 
        item.product_id === pair.freeProductId && 
        (item as BogoCartItem).bogoMainProductId === pair.mainProductId
      );

      // Verify both products exist
      expect(mainProduct).toBeDefined();
      expect(freeProduct).toBeDefined();

      // Verify correct association
      expect((freeProduct as BogoCartItem).bogoMainProductId).toBe(pair.mainProductId);
      expect((freeProduct as BogoCartItem).isBogoFree).toBe(true);

      // Verify quantities match
      expect(mainProduct!.quantity).toBe(pair.quantity);
      expect(freeProduct!.quantity).toBe(pair.quantity);

      // Verify no cross-contamination with other BOGO pairs
      const otherFreeProducts = cartItems.filter(item => 
        (item as BogoCartItem).isBogoFree && 
        item.product_id !== pair.freeProductId
      );

      otherFreeProducts.forEach(otherFree => {
        // Each free product should only be associated with its own main product
        expect((otherFree as BogoCartItem).bogoMainProductId).not.toBe(pair.mainProductId);
      });
    });

    // Test updating one BOGO pair doesn't affect others
    const firstPair = bogoPairs[0];
    const newQuantity = firstPair.quantity + 1;

    const result = await bogoCartService.updateBogoQuantity(
      firstPair.mainProductId,
      newQuantity,
      cartItems
    );

    expect(result.success).toBe(true);

    // Use the service's synchronization method
    const updatedCart = await bogoCartService.synchronizeBogoQuantities(
      firstPair.mainProductId,
      newQuantity,
      cartItems
    );

    // Verify first pair was updated
    const updatedMainProduct = updatedCart.find(item => item.product_id === firstPair.mainProductId);
    const updatedFreeProduct = updatedCart.find(item => 
      (item as BogoCartItem).bogoMainProductId === firstPair.mainProductId
    );

    expect(updatedMainProduct!.quantity).toBe(newQuantity);
    expect(updatedFreeProduct!.quantity).toBe(newQuantity);

    // Verify other pairs were NOT affected
    bogoPairs.slice(1).forEach((pair) => {
      const otherMainProduct = updatedCart.find(item => item.product_id === pair.mainProductId);
      const otherFreeProduct = updatedCart.find(item => 
        (item as BogoCartItem).bogoMainProductId === pair.mainProductId
      );

      expect(otherMainProduct!.quantity).toBe(pair.quantity); // Original quantity
      expect(otherFreeProduct!.quantity).toBe(pair.quantity); // Original quantity
    });
  });

  // Additional test for quantity synchronization edge case: zero quantity removal
  it('Property 16 Edge Case: Zero quantity should remove both main and free products', async () => {
    // Create test data
    const mainProductId = 'main-product-1';
    const freeProductId = 'free-product-1';
    const initialQuantity = 3;

    const mainProduct: CartItem = {
      product_id: mainProductId,
      title: 'Main Product',
      description: 'Main product description',
      price: 100,
      discount: 0,
      quantity: initialQuantity,
      color: null,
      size: null,
      sizes: null,
      images: ['/test-image.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Test Tailor',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const freeProduct: BogoCartItem = {
      product_id: freeProductId,
      title: 'Free Product',
      description: 'Free product description',
      price: 0,
      discount: 0,
      quantity: initialQuantity,
      color: null,
      size: null,
      sizes: null,
      images: ['/test-free-image.jpg'],
      tailor_id: 'tailor-1',
      tailor: 'Test Tailor',
      user_id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      isBogoFree: true,
      bogoMainProductId: mainProductId,
      bogoMappingId: 'test-mapping',
      bogoOriginalPrice: 50
    };

    const initialCart: CartItem[] = [mainProduct, freeProduct];

    // Update quantity to 0 (should trigger removal)
    const result = await bogoCartService.updateBogoQuantity(
      mainProductId,
      0,
      initialCart
    );

    expect(result.success).toBe(true);

    // Use synchronizeBogoQuantities which filters out 0 quantity items
    const updatedCart = await bogoCartService.synchronizeBogoQuantities(
      mainProductId,
      0,
      initialCart
    );
    
    // Verify both products are removed (filtered out due to 0 quantity)
    const remainingMainProduct = updatedCart.find(item => item.product_id === mainProductId);
    const remainingFreeProduct = updatedCart.find(item => item.product_id === freeProductId);
    
    expect(remainingMainProduct).toBeUndefined();
    expect(remainingFreeProduct).toBeUndefined();
    expect(updatedCart.length).toBe(0);
  });
});