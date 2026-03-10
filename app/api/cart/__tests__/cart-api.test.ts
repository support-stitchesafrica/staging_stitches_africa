/**
 * Integration tests for cart API endpoints
 * 
 * These tests verify that cart items include storefront context
 * when processed through the API endpoints.
 */

import { NextRequest } from 'next/server';
import { POST as addToCart } from '../add/route';
import { POST as checkout } from '../checkout/route';

import { vi } from 'vitest';

// Mock Firebase Admin
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: vi.fn().mockResolvedValue({ uid: 'test-user-id' })
  })
}));

// Mock cart repository
vi.mock('@/lib/firestore', () => ({
  cartRepository: {
    addItem: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Cart API Endpoints', () => {
  describe('POST /api/cart/add', () => {
    it('should add item with storefront context', async () => {
      const requestBody = {
        item: {
          product_id: 'test-product',
          title: 'Test Product',
          price: 100,
          quantity: 1,
          images: ['/test.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor'
        },
        storefrontContext: {
          storefrontId: 'test-storefront',
          storefrontHandle: 'test-handle'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/cart/add', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await addToCart(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.item.storefrontContext).toEqual({
        storefrontId: 'test-storefront',
        storefrontHandle: 'test-handle',
        source: 'storefront'
      });
    });

    it('should reject invalid item data', async () => {
      const requestBody = {
        item: {
          // Missing required fields
          product_id: 'test-product'
        },
        storefrontContext: {}
      };

      const request = new NextRequest('http://localhost:3000/api/cart/add', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await addToCart(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid cart item data');
    });
  });

  describe('POST /api/cart/checkout', () => {
    it('should process checkout with storefront context', async () => {
      const requestBody = {
        items: [{
          product_id: 'test-product',
          title: 'Test Product',
          price: 100,
          quantity: 1,
          images: ['/test.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor'
        }],
        storefrontId: 'test-storefront',
        storefrontHandle: 'test-handle',
        returnUrl: '/store/test-handle'
      };

      const request = new NextRequest('http://localhost:3000/api/cart/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await checkout(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.redirectUrl).toContain('/shops/cart');
      expect(data.redirectUrl).toContain('storefront_id=test-storefront');
      expect(data.redirectUrl).toContain('storefront_handle=test-handle');
    });

    it('should reject empty cart', async () => {
      const requestBody = {
        items: [],
        storefrontId: 'test-storefront'
      };

      const request = new NextRequest('http://localhost:3000/api/cart/checkout', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await checkout(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Cart is empty');
    });
  });
});

/**
 * Feature: merchant-storefront-upgrade, Property 7: Product Showcase and Cart Integration
 * 
 * Property test: Cart items include storefront context during API processing
 */
describe('Property Test: API preserves storefront context', () => {
  it('should preserve storefront context through add to cart API', async () => {
    const testContexts = [
      { storefrontId: 'store-1', storefrontHandle: 'fashion-store' },
      { storefrontId: 'store-2', storefrontHandle: undefined },
      { storefrontId: undefined, storefrontHandle: 'boutique' }
    ];

    for (const context of testContexts) {
      const requestBody = {
        item: {
          product_id: `test-product-${Math.random()}`,
          title: 'Test Product',
          price: 100,
          quantity: 1,
          images: ['/test.jpg'],
          tailor_id: 'test-tailor',
          tailor: 'Test Tailor'
        },
        storefrontContext: context
      };

      const request = new NextRequest('http://localhost:3000/api/cart/add', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await addToCart(request);
      const data = await response.json();

      // Property: API must preserve storefront context
      expect(data.item.storefrontContext.source).toBe('storefront');
      
      if (context.storefrontId) {
        expect(data.item.storefrontContext.storefrontId).toBe(context.storefrontId);
      }
      
      if (context.storefrontHandle) {
        expect(data.item.storefrontContext.storefrontHandle).toBe(context.storefrontHandle);
      }
    }
  });
});