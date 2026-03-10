/**
 * Tests for Cart Action Service
 * 
 * These tests verify:
 * - Action parsing from AI responses
 * - Product validation
 * - Message formatting
 * - Quick action generation
 */

import { describe, it, expect } from 'vitest';
import { CartActionService } from '../cart-action-service';
import type { Product } from '@/types';

describe('Cart Action Service', () => {
  describe('parseAction', () => {
    it('should parse add_to_cart action without options', () => {
      const action = CartActionService.parseAction('add_to_cart:product_123');
      
      expect(action).toEqual({
        type: 'add_to_cart',
        productId: 'product_123',
        size: undefined,
        color: undefined,
        quantity: 1,
      });
    });

    it('should parse add_to_cart action with size', () => {
      const action = CartActionService.parseAction('add_to_cart:product_123:M');
      
      expect(action).toEqual({
        type: 'add_to_cart',
        productId: 'product_123',
        size: 'M',
        color: undefined,
        quantity: 1,
      });
    });

    it('should parse add_to_cart action with size and color', () => {
      const action = CartActionService.parseAction('add_to_cart:product_123:M:Blue');
      
      expect(action).toEqual({
        type: 'add_to_cart',
        productId: 'product_123',
        size: 'M',
        color: 'Blue',
        quantity: 1,
      });
    });

    it('should return null for invalid action format', () => {
      const action = CartActionService.parseAction('invalid');
      expect(action).toBeNull();
    });

    it('should return null for invalid action type', () => {
      const action = CartActionService.parseAction('invalid_action:product_123');
      expect(action).toBeNull();
    });
  });

  describe('requiresSize', () => {
    it('should return true for RTW product with sizes', () => {
      const product: Partial<Product> = {
        type: 'ready-to-wear',
        rtwOptions: {
          sizes: ['S', 'M', 'L'],
        },
      };

      expect(CartActionService.requiresSize(product as Product)).toBe(true);
    });

    it('should return false for bespoke product', () => {
      const product: Partial<Product> = {
        type: 'bespoke',
      };

      expect(CartActionService.requiresSize(product as Product)).toBe(false);
    });

    it('should return false for RTW product without sizes', () => {
      const product: Partial<Product> = {
        type: 'ready-to-wear',
        rtwOptions: {},
      };

      expect(CartActionService.requiresSize(product as Product)).toBe(false);
    });
  });

  describe('requiresColor', () => {
    it('should return true for RTW product with colors', () => {
      const product: Partial<Product> = {
        type: 'ready-to-wear',
        rtwOptions: {
          colors: ['Red', 'Blue', 'Green'],
        },
      };

      expect(CartActionService.requiresColor(product as Product)).toBe(true);
    });

    it('should return false for product without colors', () => {
      const product: Partial<Product> = {
        type: 'ready-to-wear',
        rtwOptions: {},
      };

      expect(CartActionService.requiresColor(product as Product)).toBe(false);
    });
  });

  describe('getAvailableSizes', () => {
    it('should return array of size strings', () => {
      const product: Partial<Product> = {
        rtwOptions: {
          sizes: ['S', 'M', 'L', 'XL'],
        },
      };

      const sizes = CartActionService.getAvailableSizes(product as Product);
      expect(sizes).toEqual(['S', 'M', 'L', 'XL']);
    });

    it('should handle size objects with labels', () => {
      const product: Partial<Product> = {
        rtwOptions: {
          sizes: [
            { label: 'Small', quantity: 10 },
            { label: 'Medium', quantity: 5 },
          ],
        },
      };

      const sizes = CartActionService.getAvailableSizes(product as Product);
      expect(sizes).toEqual(['Small', 'Medium']);
    });

    it('should return empty array when no sizes', () => {
      const product: Partial<Product> = {
        rtwOptions: {},
      };

      const sizes = CartActionService.getAvailableSizes(product as Product);
      expect(sizes).toEqual([]);
    });
  });

  describe('isValidSize', () => {
    it('should return true for valid size', () => {
      const product: Partial<Product> = {
        rtwOptions: {
          sizes: ['S', 'M', 'L'],
        },
      };

      expect(CartActionService.isValidSize(product as Product, 'M')).toBe(true);
    });

    it('should be case insensitive', () => {
      const product: Partial<Product> = {
        rtwOptions: {
          sizes: ['S', 'M', 'L'],
        },
      };

      expect(CartActionService.isValidSize(product as Product, 'm')).toBe(true);
    });

    it('should return false for invalid size', () => {
      const product: Partial<Product> = {
        rtwOptions: {
          sizes: ['S', 'M', 'L'],
        },
      };

      expect(CartActionService.isValidSize(product as Product, 'XXL')).toBe(false);
    });
  });

  describe('formatAddToCartMessage', () => {
    it('should format message for single item', () => {
      const product: Partial<Product> = {
        title: 'Blue Dress',
      };

      const message = CartActionService.formatAddToCartMessage(product as Product, 1);
      expect(message).toContain('Blue Dress');
      expect(message).toContain('item');
      expect(message).not.toContain('items');
    });

    it('should format message for multiple items', () => {
      const product: Partial<Product> = {
        title: 'Blue Dress',
      };

      const message = CartActionService.formatAddToCartMessage(product as Product, 3);
      expect(message).toContain('Blue Dress');
      expect(message).toContain('3 items');
    });
  });

  describe('formatErrorMessage', () => {
    it('should format product not found error', () => {
      const message = CartActionService.formatErrorMessage('product_not_found');
      expect(message).toContain('couldn\'t find');
    });

    it('should format out of stock error', () => {
      const message = CartActionService.formatErrorMessage('out_of_stock');
      expect(message).toContain('out of stock');
    });

    it('should format missing size error', () => {
      const message = CartActionService.formatErrorMessage('missing_size');
      expect(message).toContain('size');
    });

    it('should format missing color error', () => {
      const message = CartActionService.formatErrorMessage('missing_color');
      expect(message).toContain('color');
    });

    it('should format generic error for unknown error type', () => {
      const message = CartActionService.formatErrorMessage('unknown_error');
      expect(message).toContain('trouble');
    });
  });

  describe('generateQuickActions', () => {
    it('should generate add to cart action for in-stock product', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        availability: 'in_stock',
        type: 'ready-to-wear',
      };

      const actions = CartActionService.generateQuickActions(product as Product);
      const addToCartAction = actions.find(a => a.type === 'add_to_cart');
      
      expect(addToCartAction).toBeDefined();
      expect(addToCartAction?.label).toBe('Add to Cart');
    });

    it('should show "Select Options" for product requiring size', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        availability: 'in_stock',
        type: 'ready-to-wear',
        rtwOptions: {
          sizes: ['S', 'M', 'L'],
        },
      };

      const actions = CartActionService.generateQuickActions(product as Product);
      const addToCartAction = actions.find(a => a.type === 'add_to_cart');
      
      expect(addToCartAction?.label).toBe('Select Options');
    });

    it('should not generate add to cart for out of stock product', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        availability: 'out_of_stock',
        type: 'ready-to-wear',
      };

      const actions = CartActionService.generateQuickActions(product as Product);
      const addToCartAction = actions.find(a => a.type === 'add_to_cart');
      
      expect(addToCartAction).toBeUndefined();
    });

    it('should always generate view details action', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        availability: 'in_stock',
        type: 'ready-to-wear',
      };

      const actions = CartActionService.generateQuickActions(product as Product);
      const viewDetailsAction = actions.find(a => a.type === 'view_details');
      
      expect(viewDetailsAction).toBeDefined();
    });

    it('should generate try on action for RTW products', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        availability: 'in_stock',
        type: 'ready-to-wear',
      };

      const actions = CartActionService.generateQuickActions(product as Product);
      const tryOnAction = actions.find(a => a.type === 'try_on');
      
      expect(tryOnAction).toBeDefined();
    });

    it('should not generate try on action for bespoke products', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        availability: 'in_stock',
        type: 'bespoke',
      };

      const actions = CartActionService.generateQuickActions(product as Product);
      const tryOnAction = actions.find(a => a.type === 'try_on');
      
      expect(tryOnAction).toBeUndefined();
    });
  });

  describe('formatProductCard', () => {
    it('should format product card with all required fields', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        title: 'Blue Dress',
        price: { base: 10000, currency: 'NGN' },
        discount: 0,
        images: ['image1.jpg', 'image2.jpg'],
        vendor: { id: 'vendor_1', name: 'Fashion House' },
        availability: 'in_stock',
        type: 'ready-to-wear',
      };

      const card = CartActionService.formatProductCard(product as Product);
      
      expect(card.id).toBe('product_123');
      expect(card.title).toBe('Blue Dress');
      expect(card.price).toBe(10000);
      expect(card.finalPrice).toBe(10000);
      expect(card.image).toBe('image1.jpg');
      expect(card.vendor).toBe('Fashion House');
      expect(card.availability).toBe('in_stock');
      expect(card.quickActions).toBeDefined();
    });

    it('should calculate final price with discount', () => {
      const product: Partial<Product> = {
        product_id: 'product_123',
        title: 'Blue Dress',
        price: { base: 10000, currency: 'NGN', discount: 20 },
        discount: 20,
        images: ['image1.jpg'],
        vendor: { id: 'vendor_1', name: 'Fashion House' },
        availability: 'in_stock',
        type: 'ready-to-wear',
      };

      const card = CartActionService.formatProductCard(product as Product);
      
      expect(card.price).toBe(10000);
      expect(card.discount).toBe(20);
      expect(card.finalPrice).toBe(8000); // 20% off
    });
  });

  describe('getSuggestedQuestionsAfterAddToCart', () => {
    it('should return array of suggested questions', () => {
      const questions = CartActionService.getSuggestedQuestionsAfterAddToCart();
      
      expect(questions).toBeInstanceOf(Array);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions).toContain('Continue shopping');
      expect(questions).toContain('View my cart');
    });
  });

  describe('getSuggestedQuestionsForOptions', () => {
    it('should include size options when product requires size', () => {
      const product: Partial<Product> = {
        type: 'ready-to-wear',
        rtwOptions: {
          sizes: ['S', 'M', 'L'],
        },
      };

      const questions = CartActionService.getSuggestedQuestionsForOptions(product as Product);
      
      expect(questions.some(q => q.includes('sizes'))).toBe(true);
      expect(questions.some(q => q.includes('S, M, L'))).toBe(true);
    });

    it('should include color options when product requires color', () => {
      const product: Partial<Product> = {
        type: 'ready-to-wear',
        rtwOptions: {
          colors: ['Red', 'Blue'],
        },
      };

      const questions = CartActionService.getSuggestedQuestionsForOptions(product as Product);
      
      expect(questions.some(q => q.includes('colors'))).toBe(true);
      expect(questions.some(q => q.includes('Red, Blue'))).toBe(true);
    });
  });
});
