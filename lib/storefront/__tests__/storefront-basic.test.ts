/**
 * Basic test for storefront functionality
 * 
 * Validates: Requirements 1.2, 7.1
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHandle, validateHandleFormat } from '../url-service';

describe('Storefront Basic Functionality', () => {
  describe('Handle Sanitization', () => {
    it('should sanitize handles correctly', () => {
      expect(sanitizeHandle('Test Store')).toBe('test-store');
      expect(sanitizeHandle('My-Awesome-Shop!')).toBe('my-awesome-shop');
      expect(sanitizeHandle('123-store-456')).toBe('123-store-456');
      expect(sanitizeHandle('')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(sanitizeHandle('---test---')).toBe('test');
      expect(sanitizeHandle('UPPERCASE')).toBe('uppercase');
      expect(sanitizeHandle('special@#$chars')).toBe('special-chars');
    });
  });

  describe('Handle Validation', () => {
    it('should validate handle format correctly', () => {
      const validResult = validateHandleFormat('valid-store');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      const invalidResult = validateHandleFormat('ab');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Handle must be at least 3 characters long');
    });

    it('should reject reserved handles', () => {
      const result = validateHandleFormat('admin');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Handle cannot use reserved words');
    });
  });
});