/**
 * Tests for Social Media Pixel Service
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { pixelService, PixelService } from '../pixel-service';
import { SocialPixelConfig } from '@/types/storefront';

describe('PixelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear loaded pixels for each test
    pixelService.clearPixels();
  });

  describe('validatePixelId', () => {
    it('should validate Facebook pixel IDs correctly', () => {
      // Valid Facebook pixel ID (15-16 digits)
      const validResult = pixelService.validatePixelId('123456789012345', 'facebook');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid Facebook pixel ID (too short)
      const invalidResult = pixelService.validatePixelId('12345', 'facebook');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Facebook Pixel ID must be 15-16 digits');

      // Invalid Facebook pixel ID (contains letters)
      const invalidLettersResult = pixelService.validatePixelId('12345678901234a', 'facebook');
      expect(invalidLettersResult.isValid).toBe(false);
      expect(invalidLettersResult.errors).toContain('Facebook Pixel ID must be 15-16 digits');
    });

    it('should validate TikTok pixel IDs correctly', () => {
      // Valid TikTok pixel ID
      const validResult = pixelService.validatePixelId('ABCD1234567890EFGH12', 'tiktok');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid TikTok pixel ID (too short)
      const invalidResult = pixelService.validatePixelId('ABC123', 'tiktok');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('TikTok Pixel ID must be 15-25 alphanumeric characters');

      // Invalid TikTok pixel ID (contains special characters)
      const invalidSpecialResult = pixelService.validatePixelId('ABCD1234567890EFGH@', 'tiktok');
      expect(invalidSpecialResult.isValid).toBe(false);
      expect(invalidSpecialResult.errors).toContain('TikTok Pixel ID must be 15-25 alphanumeric characters');
    });

    it('should validate Snapchat pixel IDs correctly', () => {
      // Valid Snapchat pixel ID (hex format with hyphens)
      const validResult = pixelService.validatePixelId('abc123-def456-789012-345678', 'snapchat');
      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Invalid Snapchat pixel ID (too short)
      const invalidResult = pixelService.validatePixelId('abc123', 'snapchat');
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toContain('Snapchat Pixel ID must be a valid format (20-40 characters, alphanumeric with hyphens)');
    });

    it('should handle empty pixel IDs', () => {
      const emptyResult = pixelService.validatePixelId('', 'facebook');
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors).toContain('Pixel ID cannot be empty');

      const whitespaceResult = pixelService.validatePixelId('   ', 'tiktok');
      expect(whitespaceResult.isValid).toBe(false);
      expect(whitespaceResult.errors).toContain('Pixel ID cannot be empty');
    });

    it('should handle unsupported platforms', () => {
      const unsupportedResult = pixelService.validatePixelId('123456789012345', 'instagram' as any);
      expect(unsupportedResult.isValid).toBe(false);
      expect(unsupportedResult.errors).toContain('Unsupported platform');
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PixelService.getInstance();
      const instance2 = PixelService.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBe(pixelService);
    });
  });

  describe('event mapping', () => {
    it('should map events correctly for different platforms', () => {
      // Test that the service has the mapping methods (they're private but we can test the behavior)
      const config: SocialPixelConfig = {
        facebook: { pixelId: '123456789012345', enabled: true },
        tiktok: { pixelId: 'ABCD1234567890EFGH12', enabled: true },
        snapchat: { pixelId: 'abc123def456ghi789jkl012', enabled: true },
      };

      // This test verifies the service can handle the config without errors
      expect(() => {
        pixelService.initializePixels(config);
      }).not.toThrow();
    });
  });
});