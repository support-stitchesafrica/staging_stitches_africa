/**
 * Dynamic Routing Tests
 * Tests for storefront dynamic routing functionality
 * 
 * **Feature: merchant-storefront-upgrade, Property 1: Storefront URL Management**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStorefrontByHandle } from '../storefront-service';
import { sanitizeHandle, validateHandleFormat } from '../url-service';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn(() => Promise.resolve({
            empty: false,
            docs: [{
              id: 'test-storefront-id',
              data: () => ({
                vendorId: 'test-vendor',
                handle: 'test-handle',
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
                pages: [],
                analytics: {
                  enabled: true,
                  customEvents: ['page_view'],
                  retentionDays: 90,
                  exportEnabled: true,
                },
                socialPixels: {},
                createdAt: { toDate: () => new Date() },
                updatedAt: { toDate: () => new Date() },
              })
            }]
          }))
        }))
      }))
    }))
  }
}));

describe('Dynamic Routing for Storefront Handles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Handle Sanitization', () => {
    it('should sanitize handles to be URL-safe', () => {
      expect(sanitizeHandle('Test Handle!')).toBe('test-handle');
      expect(sanitizeHandle('UPPERCASE')).toBe('uppercase');
      expect(sanitizeHandle('special@chars#')).toBe('special-chars');
      expect(sanitizeHandle('multiple---dashes')).toBe('multiple-dashes');
      expect(sanitizeHandle('-leading-trailing-')).toBe('leading-trailing');
    });

    it('should handle edge cases in sanitization', () => {
      expect(sanitizeHandle('')).toBe('');
      expect(sanitizeHandle('   ')).toBe('');
      expect(sanitizeHandle('123')).toBe('123');
      expect(sanitizeHandle('a')).toBe('a');
    });
  });

  describe('Handle Format Validation', () => {
    it('should validate correct handle formats', () => {
      const validHandles = [
        'valid-handle',
        'test123',
        'abc', // Changed from 'a' to meet minimum length
        'shop-name-2024',
        'my-awesome-store'
      ];

      validHandles.forEach(handle => {
        const result = validateHandleFormat(handle);
        if (!result.isValid) {
          console.log(`Handle "${handle}" failed validation:`, result.errors);
        }
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject invalid handle formats', () => {
      const invalidHandles = [
        '', // too short
        'ab', // too short
        'a'.repeat(51), // too long
        'admin', // reserved word
        'api', // reserved word
      ];

      invalidHandles.forEach(handle => {
        const result = validateHandleFormat(handle);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Storefront Retrieval', () => {
    it('should retrieve storefront by valid handle', async () => {
      const storefront = await getStorefrontByHandle('test-handle');
      
      expect(storefront).toBeDefined();
      expect(storefront?.handle).toBe('test-handle');
      expect(storefront?.vendorId).toBe('test-vendor');
      expect(storefront?.isPublic).toBe(true);
    });

    it('should handle case-insensitive handle lookup', async () => {
      const storefront = await getStorefrontByHandle('TEST-HANDLE');
      
      expect(storefront).toBeDefined();
      expect(storefront?.handle).toBe('test-handle');
    });

    it('should return null for non-existent handles', async () => {
      // Mock empty result by importing the module properly
      const { adminDb } = await import('@/lib/firebase-admin');
      const mockGet = vi.fn(() => Promise.resolve({ empty: true, docs: [] }));
      
      vi.mocked(adminDb.collection).mockReturnValue({
        where: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: mockGet
          }))
        }))
      } as any);

      const storefront = await getStorefrontByHandle('non-existent');
      expect(storefront).toBeNull();
    });
  });

  describe('Dynamic Route Compatibility', () => {
    it('should work with Next.js dynamic route patterns', () => {
      const testHandles = [
        'simple',
        'with-dashes',
        'numbers123',
        'long-handle-name-with-multiple-words'
      ];

      testHandles.forEach(handle => {
        const sanitized = sanitizeHandle(handle);
        const validation = validateHandleFormat(sanitized);
        
        // Should be valid for URL routing
        expect(validation.isValid).toBe(true);
        
        // Should not contain characters that break URLs
        expect(sanitized).not.toMatch(/[^a-z0-9-]/);
        
        // Should not start or end with dashes
        expect(sanitized).not.toMatch(/^-|-$/);
      });
    });

    it('should generate consistent URLs for the same handle', () => {
      const handle = 'Test Store Name!';
      const sanitized1 = sanitizeHandle(handle);
      const sanitized2 = sanitizeHandle(handle);
      
      expect(sanitized1).toBe(sanitized2);
      expect(sanitized1).toBe('test-store-name');
    });
  });
});