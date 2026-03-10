/**
 * Dynamic Routing Integration Tests
 * End-to-end tests for storefront dynamic routing
 * 
 * **Feature: merchant-storefront-upgrade, Property 1: Storefront URL Management**
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createStorefront, getStorefrontByHandle, deleteStorefront } from '../storefront-service';
import { StorefrontConfig } from '@/types/storefront';

// Mock Firebase Admin for integration tests
vi.mock('@/lib/firebase-admin', () => {
  const mockStorefronts = new Map();
  
  return {
    adminDb: {
      collection: vi.fn(() => ({
        add: vi.fn(async (data) => {
          const id = `test-${Date.now()}-${Math.random()}`;
          const now = new Date();
          mockStorefronts.set(id, { 
            id, 
            ...data,
            createdAt: { toDate: () => now },
            updatedAt: { toDate: () => now }
          });
          return { id };
        }),
        doc: vi.fn((id) => ({
          delete: vi.fn(async () => {
            mockStorefronts.delete(id);
          }),
          update: vi.fn(async (updates) => {
            const existing = mockStorefronts.get(id);
            if (existing) {
              mockStorefronts.set(id, { ...existing, ...updates });
            }
          })
        })),
        where: vi.fn((field, op, value) => ({
          limit: vi.fn(() => ({
            get: vi.fn(async () => {
              const results = Array.from(mockStorefronts.values()).filter(doc => {
                if (field === 'handle' && op === '==') {
                  return doc.handle === value;
                }
                if (field === 'vendorId' && op === '==') {
                  return doc.vendorId === value;
                }
                return false;
              });
              
              return {
                empty: results.length === 0,
                docs: results.map(doc => ({
                  id: doc.id,
                  data: () => doc
                }))
              };
            })
          }))
        }))
      }))
    }
  };
});

describe('Dynamic Routing Integration', () => {
  let testStorefrontId: string;
  
  const testStorefront: Omit<StorefrontConfig, 'id' | 'createdAt' | 'updatedAt'> = {
    vendorId: 'test-vendor-123',
    handle: 'test-integration-store',
    isPublic: true,
    templateId: 'default',
    theme: {
      colors: {
        primary: '#3B82F6',
        secondary: '#64748B',
        accent: '#F59E0B',
        background: '#FFFFFF',
        text: '#1F2937',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
      },
      layout: {
        headerStyle: 'modern',
        productCardStyle: 'card',
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
        },
      },
      media: {},
    },
    pages: [{
      id: 'home',
      type: 'home',
      title: 'Test Store Home',
      content: [],
      seoMetadata: {
        title: 'Test Integration Store',
        description: 'A test store for integration testing',
        keywords: ['test', 'integration', 'store'],
      },
      productDisplay: {
        layout: 'grid',
        productsPerPage: 12,
        showFilters: true,
        showSorting: true,
        cartIntegration: {
          enabled: true,
          redirectToStitchesAfrica: true,
        },
        promotionalDisplay: {
          showBadges: true,
          showBanners: true,
          highlightPromotions: true,
        },
      },
    }],
    analytics: {
      enabled: true,
      customEvents: ['page_view', 'product_view'],
      retentionDays: 90,
      exportEnabled: true,
    },
    socialPixels: {},
  };

  beforeEach(async () => {
    // Create a test storefront
    testStorefrontId = await createStorefront(testStorefront);
  });

  afterEach(async () => {
    // Clean up test storefront
    if (testStorefrontId) {
      try {
        await deleteStorefront(testStorefrontId);
      } catch (error) {
        console.warn('Failed to clean up test storefront:', error);
      }
    }
  });

  describe('End-to-End Dynamic Routing', () => {
    it('should create and retrieve storefront by handle', async () => {
      const retrieved = await getStorefrontByHandle('test-integration-store');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.handle).toBe('test-integration-store');
      expect(retrieved?.vendorId).toBe('test-vendor-123');
      expect(retrieved?.isPublic).toBe(true);
    });

    it('should handle case-insensitive routing', async () => {
      const variations = [
        'test-integration-store',
        'TEST-INTEGRATION-STORE',
        'Test-Integration-Store',
        'test-INTEGRATION-store'
      ];

      for (const variation of variations) {
        const retrieved = await getStorefrontByHandle(variation);
        expect(retrieved).toBeDefined();
        expect(retrieved?.handle).toBe('test-integration-store');
      }
    });

    it('should return null for non-existent handles', async () => {
      const nonExistent = await getStorefrontByHandle('non-existent-store');
      expect(nonExistent).toBeNull();
    });

    it('should maintain data integrity across operations', async () => {
      // Retrieve the storefront
      const retrieved = await getStorefrontByHandle('test-integration-store');
      expect(retrieved).toBeDefined();
      
      // Verify all required fields are present
      expect(retrieved?.id).toBeDefined();
      expect(retrieved?.vendorId).toBe('test-vendor-123');
      expect(retrieved?.theme).toBeDefined();
      expect(retrieved?.pages).toHaveLength(1);
      expect(retrieved?.analytics).toBeDefined();
      
      // Verify theme structure
      expect(retrieved?.theme.colors.primary).toBe('#3B82F6');
      expect(retrieved?.theme.typography.headingFont).toBe('Inter');
      
      // Verify page structure
      expect(retrieved?.pages[0].type).toBe('home');
      expect(retrieved?.pages[0].seoMetadata.title).toBe('Test Integration Store');
    });

    it('should support URL-safe handle formats', async () => {
      const urlSafeHandles = [
        'simple-store',
        'store-with-numbers-123',
        'long-store-name-with-multiple-words',
        'a-b-c-d-e-f-g'
      ];

      for (const handle of urlSafeHandles) {
        const testData = { ...testStorefront, handle };
        const id = await createStorefront(testData);
        
        try {
          const retrieved = await getStorefrontByHandle(handle);
          expect(retrieved).toBeDefined();
          expect(retrieved?.handle).toBe(handle);
        } finally {
          await deleteStorefront(id);
        }
      }
    });
  });

  describe('Route Parameter Validation', () => {
    it('should handle empty and invalid handles gracefully', async () => {
      const invalidHandles = ['', '  ', null, undefined];
      
      for (const handle of invalidHandles) {
        const retrieved = await getStorefrontByHandle(handle as any);
        expect(retrieved).toBeNull();
      }
    });

    it('should sanitize handles before lookup', async () => {
      // Create storefront with clean handle
      const cleanHandle = 'clean-test-store';
      const testData = { ...testStorefront, handle: cleanHandle };
      const id = await createStorefront(testData);
      
      try {
        // Try to access with dirty handle that should sanitize to the same value
        const dirtyHandle = 'Clean Test Store!';
        const retrieved = await getStorefrontByHandle(dirtyHandle);
        
        expect(retrieved).toBeDefined();
        expect(retrieved?.handle).toBe(cleanHandle);
      } finally {
        await deleteStorefront(id);
      }
    });
  });
});