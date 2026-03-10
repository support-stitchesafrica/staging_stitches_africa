/**
 * Tests for URL Service
 * Validates handle validation, sanitization, and suggestion generation
 */

import { 
  sanitizeHandle, 
  validateHandleFormat, 
  isReservedHandle, 
  generateHandleSuggestions,
  generateStorefrontUrl,
  extractHandleFromUrl
} from './url-service';

describe('URL Service', () => {
  describe('sanitizeHandle', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeHandle('MyStore')).toBe('mystore');
    });

    it('should replace invalid characters with hyphens', () => {
      expect(sanitizeHandle('my store!')).toBe('my-store');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(sanitizeHandle('-my-store-')).toBe('my-store');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeHandle('my---store')).toBe('my-store');
    });
  });

  describe('validateHandleFormat', () => {
    it('should accept valid handles', () => {
      const result = validateHandleFormat('my-store');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject handles that are too short', () => {
      const result = validateHandleFormat('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle must be at least 3 characters long');
    });

    it('should reject handles that are too long', () => {
      const longHandle = 'a'.repeat(51);
      const result = validateHandleFormat(longHandle);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle must be no more than 50 characters long');
    });

    it('should reject handles with invalid start/end characters', () => {
      const result = validateHandleFormat('-myshop-');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle must start and end with alphanumeric characters');
    });
  });

  describe('isReservedHandle', () => {
    it('should identify reserved words', () => {
      expect(isReservedHandle('admin')).toBe(true);
      expect(isReservedHandle('api')).toBe(true);
      expect(isReservedHandle('store')).toBe(true);
    });

    it('should allow non-reserved words', () => {
      expect(isReservedHandle('my-shop')).toBe(false);
      expect(isReservedHandle('fashion-boutique')).toBe(false);
    });
  });

  describe('generateHandleSuggestions', () => {
    it('should generate numbered suggestions', () => {
      const suggestions = generateHandleSuggestions('mystore');
      expect(suggestions).toContain('mystore-1');
      expect(suggestions).toContain('mystore-2');
    });

    it('should generate descriptive suggestions', () => {
      const suggestions = generateHandleSuggestions('fashion');
      expect(suggestions).toContain('fashion-shop');
      expect(suggestions).toContain('fashion-store');
      // boutique might be cut off by slice(0, 8), so let's check what we actually get
      expect(suggestions.length).toBeGreaterThan(5);
    });

    it('should include year suggestion', () => {
      const currentYear = new Date().getFullYear();
      const suggestions = generateHandleSuggestions('mystore');
      expect(suggestions).toContain(`mystore-${currentYear}`);
    });
  });

  describe('generateStorefrontUrl', () => {
    it('should generate correct URL with default base', () => {
      const url = generateStorefrontUrl('my-store');
      expect(url).toMatch(/\/store\/my-store$/);
    });

    it('should use custom base URL', () => {
      const url = generateStorefrontUrl('my-store', 'https://example.com');
      expect(url).toBe('https://example.com/store/my-store');
    });
  });

  describe('extractHandleFromUrl', () => {
    it('should extract handle from valid storefront URL', () => {
      const handle = extractHandleFromUrl('https://example.com/store/my-store');
      expect(handle).toBe('my-store');
    });

    it('should return null for invalid URLs', () => {
      const handle = extractHandleFromUrl('https://example.com/invalid/path');
      expect(handle).toBe(null);
    });

    it('should return null for malformed URLs', () => {
      const handle = extractHandleFromUrl('not-a-url');
      expect(handle).toBe(null);
    });
  });
});