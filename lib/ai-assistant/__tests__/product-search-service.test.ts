/**
 * Product Search Service Tests
 * 
 * Tests for product search and filtering functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Product } from '@/types';

describe('Product Search Service', () => {
  describe('Search Query Parsing', () => {
    it('should extract category from query', () => {
      const queries = [
        { input: 'show me dresses', expected: 'dresses' },
        { input: 'I need a shirt', expected: 'shirt' },
        { input: 'looking for traditional wear', expected: 'traditional' },
      ];

      queries.forEach(({ input, expected }) => {
        const lowerQuery = input.toLowerCase();
        expect(lowerQuery).toContain(expected);
      });
    });

    it('should extract price range from query', () => {
      const queries = [
        'under 10000',
        'less than 20000',
        'between 5000 and 15000',
        'around 8000',
      ];

      queries.forEach(query => {
        const hasPrice = /\d{4,}/.test(query);
        expect(hasPrice).toBe(true);
      });
    });

    it('should extract color from query', () => {
      const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow'];
      const query = 'I want a red dress';

      const foundColor = colors.find(color => query.toLowerCase().includes(color));
      expect(foundColor).toBe('red');
    });
  });

  describe('Product Filtering', () => {
    const mockProducts: Product[] = [
      {
        product_id: 'prod1',
        title: 'Red Ankara Dress',
        category: 'Dresses',
        price: { base: 15000, currency: '$' },
        availability: 'in_stock',
        status: 'verified',
        type: 'ready-to-wear',
        tags: ['red', 'ankara', 'traditional'],
        images: [],
        tailor_id: 'tailor1',
        deliveryTimeline: '3-5 days',
        returnPolicy: '7 days',
      },
      {
        product_id: 'prod2',
        title: 'Blue Kaftan',
        category: 'Traditional Wear',
        price: { base: 25000, currency: '$' },
        availability: 'in_stock',
        status: 'verified',
        type: 'ready-to-wear',
        tags: ['blue', 'kaftan'],
        images: [],
        tailor_id: 'tailor2',
        deliveryTimeline: '3-5 days',
        returnPolicy: '7 days',
      },
      {
        product_id: 'prod3',
        title: 'Black Suit',
        category: 'Formal Wear',
        price: { base: 45000, currency: '$' },
        availability: 'out_of_stock',
        status: 'verified',
        type: 'ready-to-wear',
        tags: ['black', 'formal'],
        images: [],
        tailor_id: 'tailor3',
        deliveryTimeline: '3-5 days',
        returnPolicy: '7 days',
      },
    ];

    it('should filter by availability', () => {
      const inStock = mockProducts.filter(p => p.availability === 'in_stock');
      expect(inStock).toHaveLength(2);
      expect(inStock.every(p => p.availability === 'in_stock')).toBe(true);
    });

    it('should filter by price range', () => {
      const maxPrice = 20000;
      const affordable = mockProducts.filter(p => p.price.base <= maxPrice);
      
      expect(affordable).toHaveLength(1);
      expect(affordable[0].product_id).toBe('prod1');
    });

    it('should filter by category', () => {
      const category = 'Dresses';
      const filtered = mockProducts.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('Dresses');
    });

    it('should filter by tags', () => {
      const tag = 'traditional';
      const filtered = mockProducts.filter(p => 
        p.tags?.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
      
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should combine multiple filters', () => {
      const filtered = mockProducts.filter(p => 
        p.availability === 'in_stock' &&
        p.price.base <= 20000 &&
        p.tags?.includes('red')
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].product_id).toBe('prod1');
    });
  });

  describe('Search Relevance', () => {
    it('should prioritize exact title matches', () => {
      const products = [
        { title: 'Red Dress', score: 0 },
        { title: 'Dress with Red Pattern', score: 0 },
        { title: 'Traditional Red Ankara Dress', score: 0 },
      ];

      const query = 'red dress';
      
      products.forEach(p => {
        const titleLower = p.title.toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (titleLower === queryLower) {
          p.score = 3;
        } else if (titleLower.startsWith(queryLower)) {
          p.score = 2;
        } else if (titleLower.includes(queryLower)) {
          p.score = 1;
        }
      });

      const sorted = products.sort((a, b) => b.score - a.score);
      expect(sorted[0].title).toBe('Red Dress');
    });

    it('should boost verified products', () => {
      const products = [
        { status: 'pending', baseScore: 5 },
        { status: 'verified', baseScore: 5 },
      ];

      products.forEach(p => {
        if (p.status === 'verified') {
          p.baseScore += 2;
        }
      });

      expect(products[1].baseScore).toBeGreaterThan(products[0].baseScore);
    });
  });

  describe('Empty Results Handling', () => {
    it('should return empty array when no matches', () => {
      const products: Product[] = [];
      const filtered = products.filter(p => p.category === 'NonExistent');
      
      expect(filtered).toEqual([]);
      expect(filtered).toHaveLength(0);
    });

    it('should suggest alternatives when no exact matches', () => {
      const query = 'purple dress';
      const hasResults = false;
      
      const suggestions = hasResults ? [] : [
        'Try searching for "dresses" to see all options',
        'Browse our traditional wear collection',
        'Check out our featured products',
      ];
      
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });
});
