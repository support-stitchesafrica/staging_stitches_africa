import { StorefrontCartService } from '../cart-integration';
import { Product } from '@/types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

import { vi } from 'vitest';

// Mock fetch for API calls
global.fetch = vi.fn();

describe('StorefrontCartService - Quantity Management', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const mockProduct: Product = {
    product_id: 'test-product-1',
    title: 'Test Product',
    description: 'A test product',
    type: 'ready-to-wear',
    category: 'clothing',
    availability: 'in_stock',
    status: 'verified',
    price: { base: 50, currency: 'USD' },
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

  const mockStorefrontContext = {
    storefrontId: 'test-storefront',
    storefrontHandle: 'test-handle'
  };

  describe('localStorage quantity management', () => {
    test('should add item to localStorage cart', () => {
      const cartItem = StorefrontCartService.createStorefrontCartItem(
        mockProduct,
        2,
        mockStorefrontContext
      );

      const result = StorefrontCartService.addOrUpdateItemInLocalStorage(
        cartItem,
        mockStorefrontContext
      );

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].quantity).toBe(2);
      expect(result!.items[0].product_id).toBe('test-product-1');
    });

    test('should update existing item quantity in localStorage', () => {
      // Add initial item
      const cartItem = StorefrontCartService.createStorefrontCartItem(
        mockProduct,
        2,
        mockStorefrontContext
      );

      StorefrontCartService.addOrUpdateItemInLocalStorage(cartItem, mockStorefrontContext);

      // Update quantity
      const result = StorefrontCartService.updateQuantityInLocalStorage(
        'test-product-1',
        5
      );

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].quantity).toBe(5);
    });

    test('should remove item when quantity is set to 0', () => {
      // Add initial item
      const cartItem = StorefrontCartService.createStorefrontCartItem(
        mockProduct,
        2,
        mockStorefrontContext
      );

      StorefrontCartService.addOrUpdateItemInLocalStorage(cartItem, mockStorefrontContext);

      // Remove item by setting quantity to 0
      const result = StorefrontCartService.updateQuantityInLocalStorage(
        'test-product-1',
        0
      );

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(0);
    });

    test('should handle items with different sizes and colors separately', () => {
      // Add item with size S
      const cartItemS = StorefrontCartService.createStorefrontCartItem(
        mockProduct,
        1,
        mockStorefrontContext,
        { size: 'S' }
      );

      // Add item with size M
      const cartItemM = StorefrontCartService.createStorefrontCartItem(
        mockProduct,
        2,
        mockStorefrontContext,
        { size: 'M' }
      );

      StorefrontCartService.addOrUpdateItemInLocalStorage(cartItemS, mockStorefrontContext);
      const result = StorefrontCartService.addOrUpdateItemInLocalStorage(cartItemM, mockStorefrontContext);

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(2);

      // Update only size S quantity
      const updatedResult = StorefrontCartService.updateQuantityInLocalStorage(
        'test-product-1',
        3,
        'S'
      );

      expect(updatedResult).not.toBeNull();
      expect(updatedResult!.items).toHaveLength(2);
      
      const sizeS = updatedResult!.items.find(item => item.size === 'S');
      const sizeM = updatedResult!.items.find(item => item.size === 'M');
      
      expect(sizeS?.quantity).toBe(3);
      expect(sizeM?.quantity).toBe(2);
    });
  });

  describe('API quantity management', () => {
    test('should call update API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        action: 'updated'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await StorefrontCartService.updateItemQuantity(
        'test-product-1',
        3,
        'M',
        'blue'
      );

      expect(global.fetch).toHaveBeenCalledWith('/api/cart/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: 'test-product-1',
          quantity: 3,
          size: 'M',
          color: 'blue'
        })
      });

      expect(result.success).toBe(true);
      expect(result.action).toBe('updated');
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid quantity' })
      });

      const result = await StorefrontCartService.updateItemQuantity(
        'test-product-1',
        -1
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid quantity');
    });

    test('should call remove API with correct parameters', async () => {
      const mockResponse = {
        success: true,
        action: 'removed'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await StorefrontCartService.removeItemFromCart(
        'test-product-1',
        'L',
        'red'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/cart/update?productId=test-product-1&size=L&color=red',
        {
          method: 'DELETE',
          headers: {}
        }
      );

      expect(result.success).toBe(true);
    });
  });

  describe('batch quantity updates', () => {
    test('should process multiple quantity updates', async () => {
      const mockResponse = {
        success: true,
        action: 'updated'
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const updates = [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1, size: 'M' },
        { productId: 'product-3', quantity: 0 } // Remove this item
      ];

      const result = await StorefrontCartService.batchUpdateQuantities(updates);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should handle partial failures in batch updates', async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, action: 'updated' })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Item not found' })
        });

      const updates = [
        { productId: 'product-1', quantity: 2 },
        { productId: 'product-2', quantity: 1 }
      ];

      const result = await StorefrontCartService.batchUpdateQuantities(updates);

      expect(result.success).toBe(false);
      expect(result.results).toHaveLength(2);
      expect(result.results![0].success).toBe(true);
      expect(result.results![1].success).toBe(false);
      expect(result.results![1].error).toBe('Item not found');
    });
  });

  describe('cart validation', () => {
    test('should validate cart items correctly', () => {
      const validItems = [
        StorefrontCartService.createStorefrontCartItem(mockProduct, 1, mockStorefrontContext),
        StorefrontCartService.createStorefrontCartItem(mockProduct, 2, mockStorefrontContext, { size: 'M' })
      ];

      const result = StorefrontCartService.validateCart(validItems);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect invalid cart items', () => {
      const invalidItems = [
        { ...StorefrontCartService.createStorefrontCartItem(mockProduct, 1, mockStorefrontContext), product_id: '' },
        { ...StorefrontCartService.createStorefrontCartItem(mockProduct, 1, mockStorefrontContext), quantity: 0 },
        { ...StorefrontCartService.createStorefrontCartItem(mockProduct, 1, mockStorefrontContext), price: -10 }
      ];

      const result = StorefrontCartService.validateCart(invalidItems);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('cart totals calculation', () => {
    test('should calculate correct totals', () => {
      const items = [
        StorefrontCartService.createStorefrontCartItem(mockProduct, 2, mockStorefrontContext), // 2 * $50 = $100
        { ...StorefrontCartService.createStorefrontCartItem(mockProduct, 1, mockStorefrontContext), price: 25 } // 1 * $25 = $25
      ];

      const totals = StorefrontCartService.calculateCartTotals(items);

      expect(totals.subtotal).toBe(125);
      expect(totals.itemCount).toBe(3);
      expect(totals.shippingCost).toBe(0); // Free shipping over $100
      expect(totals.total).toBe(125);
    });

    test('should apply shipping cost for orders under $100', () => {
      const items = [
        { ...StorefrontCartService.createStorefrontCartItem(mockProduct, 1, mockStorefrontContext), price: 50 }
      ];

      const totals = StorefrontCartService.calculateCartTotals(items);

      expect(totals.subtotal).toBe(50);
      expect(totals.itemCount).toBe(1);
      expect(totals.shippingCost).toBe(15);
      expect(totals.total).toBe(65);
    });
  });
});