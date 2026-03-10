/**
 * Product Service Tests
 * Tests for storefront product fetching functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { getVendorProducts, getVendorProductCategories, getVendorProductPriceRange } from '../product-service';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        where: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              offset: vi.fn(() => ({
                limit: vi.fn(() => ({
                  get: vi.fn(() => Promise.resolve({
                    docs: [],
                    size: 0,
                  })),
                })),
              })),
              get: vi.fn(() => Promise.resolve({
                docs: [],
                size: 0,
              })),
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('Product Service', () => {
  const mockVendorId = 'test-vendor-123';

  describe('getVendorProducts', () => {
    it('should return empty products array when no products exist', async () => {
      const result = await getVendorProducts(mockVendorId);
      
      expect(result).toEqual({
        products: [],
        total: 0,
      });
    });

    it('should handle filters and sorting options', async () => {
      const options = {
        limit: 10,
        offset: 0,
        filters: {
          category: 'shirts',
          availability: 'in_stock' as const,
        },
        sort: {
          field: 'price' as const,
          direction: 'asc' as const,
        },
      };

      const result = await getVendorProducts(mockVendorId, options);
      
      expect(result).toEqual({
        products: [],
        total: 0,
      });
    });
  });

  describe('getVendorProductCategories', () => {
    it('should return empty categories array when no products exist', async () => {
      const result = await getVendorProductCategories(mockVendorId);
      
      expect(result).toEqual([]);
    });
  });

  describe('getVendorProductPriceRange', () => {
    it('should return zero price range when no products exist', async () => {
      const result = await getVendorProductPriceRange(mockVendorId);
      
      expect(result).toEqual({
        min: 0,
        max: 0,
      });
    });
  });
});