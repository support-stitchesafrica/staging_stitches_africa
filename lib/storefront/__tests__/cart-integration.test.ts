import { StorefrontCartService } from '../cart-integration';
import { Product } from '@/types';

// Mock product for testing
const mockProduct: Product = {
  product_id: 'test-product-1',
  title: 'Test Product',
  description: 'A test product',
  type: 'ready-to-wear',
  category: 'clothing',
  availability: 'in_stock',
  status: 'verified',
  price: { base: 100, currency: 'USD' },
  discount: 0,
  deliveryTimeline: '3-5 days',
  returnPolicy: '30 days',
  images: ['/test-image.jpg'],
  tailor_id: 'test-tailor',
  tailor: 'Test Tailor',
  tags: [],
  created_at: new Date(),
  updated_at: new Date()
};

describe('StorefrontCartService', () => {
  describe('createStorefrontCartItem', () => {
    it('should create cart item with storefront context', () => {
      const storefrontContext = {
        storefrontId: 'test-storefront-id',
        storefrontHandle: 'test-handle'
      };

      const cartItem = StorefrontCartService.createStorefrontCartItem(
        mockProduct,
        2,
        storefrontContext,
        { size: 'M', color: 'blue' }
      );

      expect(cartItem.product_id).toBe('test-product-1');
      expect(cartItem.quantity).toBe(2);
      expect(cartItem.size).toBe('M');
      expect(cartItem.color).toBe('blue');
      expect(cartItem.storefrontContext).toEqual({
        storefrontId: 'test-storefront-id',
        storefrontHandle: 'test-handle',
        source: 'storefront'
      });
    });

    it('should handle product with discount', () => {
      const discountedProduct = {
        ...mockProduct,
        discount: 20
      };

      const cartItem = StorefrontCartService.createStorefrontCartItem(
        discountedProduct,
        1,
        { storefrontId: 'test-id' }
      );

      expect(cartItem.price).toBe(80); // 100 - 20%
      expect(cartItem.discount).toBe(20);
    });
  });

  describe('calculateCartTotals', () => {
    it('should calculate correct totals', () => {
      const items = [
        StorefrontCartService.createStorefrontCartItem(
          mockProduct,
          2,
          { storefrontId: 'test' }
        ),
        StorefrontCartService.createStorefrontCartItem(
          { ...mockProduct, product_id: 'test-2', price: { base: 50, currency: 'USD' } },
          1,
          { storefrontId: 'test' }
        )
      ];

      const totals = StorefrontCartService.calculateCartTotals(items);

      expect(totals.subtotal).toBe(250); // (100 * 2) + (50 * 1)
      expect(totals.itemCount).toBe(3); // 2 + 1
      expect(totals.shippingCost).toBe(0); // Free shipping over $100
      expect(totals.total).toBe(250); // 250 + 0
    });

    it('should add shipping cost for orders under $100', () => {
      const items = [
        StorefrontCartService.createStorefrontCartItem(
          { ...mockProduct, price: { base: 30, currency: 'USD' } },
          1,
          { storefrontId: 'test' }
        )
      ];

      const totals = StorefrontCartService.calculateCartTotals(items);

      expect(totals.subtotal).toBe(30);
      expect(totals.shippingCost).toBe(15);
      expect(totals.total).toBe(45);
    });
  });

  describe('validateCart', () => {
    it('should validate valid cart', () => {
      const items = [
        StorefrontCartService.createStorefrontCartItem(
          mockProduct,
          1,
          { storefrontId: 'test' }
        )
      ];

      const validation = StorefrontCartService.validateCart(items);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject empty cart', () => {
      const validation = StorefrontCartService.validateCart([]);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Cart is empty');
    });

    it('should reject items with invalid quantity', () => {
      const items = [
        {
          ...StorefrontCartService.createStorefrontCartItem(
            mockProduct,
            1,
            { storefrontId: 'test' }
          ),
          quantity: 0
        }
      ];

      const validation = StorefrontCartService.validateCart(items);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('Invalid quantity'))).toBe(true);
    });
  });
});

/**
 * Feature: merchant-storefront-upgrade, Property 7: Product Showcase and Cart Integration
 * 
 * This test validates that cart items include storefront context when added from storefront
 */
describe('Property Test: Cart items include storefront context', () => {
  it('should always include storefront context when items are added from storefront', () => {
    // Test with various storefront contexts
    const testCases = [
      { storefrontId: 'store-1', storefrontHandle: 'fashion-hub' },
      { storefrontId: 'store-2', storefrontHandle: undefined },
      { storefrontId: undefined, storefrontHandle: 'boutique-store' },
    ];

    testCases.forEach(context => {
      const cartItem = StorefrontCartService.createStorefrontCartItem(
        mockProduct,
        1,
        context
      );

      // Property: All storefront cart items must have storefront context
      expect(cartItem.storefrontContext).toBeDefined();
      expect(cartItem.storefrontContext?.source).toBe('storefront');
      
      if (context.storefrontId) {
        expect(cartItem.storefrontContext?.storefrontId).toBe(context.storefrontId);
      }
      
      if (context.storefrontHandle) {
        expect(cartItem.storefrontContext?.storefrontHandle).toBe(context.storefrontHandle);
      }
    });
  });
});