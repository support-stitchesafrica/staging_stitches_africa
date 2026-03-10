/**
 * Tests for Storefront Promotion Integration Service
 */

import { storefrontPromotionService } from '../promotion-integration';

describe('StorefrontPromotionIntegrationService', () => {
  const mockVendorId = 'test-vendor-123';
  const mockCurrentDate = new Date('2024-01-15T10:00:00Z');

  describe('getActivePromotionsForVendor', () => {
    it('should return empty array when no promotions exist', async () => {
      const promotions = await storefrontPromotionService.getActivePromotionsForVendor(
        'non-existent-vendor',
        { currentDate: mockCurrentDate }
      );

      expect(Array.isArray(promotions)).toBe(true);
      expect(promotions.length).toBe(0);
    });

    it('should handle invalid vendor ID gracefully', async () => {
      const promotions = await storefrontPromotionService.getActivePromotionsForVendor(
        '',
        { currentDate: mockCurrentDate }
      );

      expect(Array.isArray(promotions)).toBe(true);
      expect(promotions.length).toBe(0);
    });

    it('should filter promotions by product IDs when specified', async () => {
      const promotions = await storefrontPromotionService.getActivePromotionsForVendor(
        mockVendorId,
        { 
          currentDate: mockCurrentDate,
          productIds: ['product-1', 'product-2']
        }
      );

      expect(Array.isArray(promotions)).toBe(true);
      // All returned promotions should be applicable to the specified products
      promotions.forEach(promotion => {
        const hasMatchingProduct = promotion.applicableProducts.some(productId => 
          ['product-1', 'product-2'].includes(productId)
        ) || promotion.applicableProducts.length === 0; // Storefront-wide promotions
        expect(hasMatchingProduct).toBe(true);
      });
    });
  });

  describe('applyPromotionsToCart', () => {
    const mockCartItems = [
      { productId: 'product-1', quantity: 2, price: 100 },
      { productId: 'product-2', quantity: 1, price: 50 }
    ];

    it('should return valid application result structure', async () => {
      const result = await storefrontPromotionService.applyPromotionsToCart(
        mockVendorId,
        mockCartItems,
        { currentDate: mockCurrentDate }
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('appliedPromotions');
      expect(result).toHaveProperty('discountAmount');
      expect(result).toHaveProperty('freeShipping');
      expect(result).toHaveProperty('freeProducts');
      
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.appliedPromotions)).toBe(true);
      expect(typeof result.discountAmount).toBe('number');
      expect(typeof result.freeShipping).toBe('boolean');
      expect(Array.isArray(result.freeProducts)).toBe(true);
    });

    it('should handle empty cart gracefully', async () => {
      const result = await storefrontPromotionService.applyPromotionsToCart(
        mockVendorId,
        [],
        { currentDate: mockCurrentDate }
      );

      expect(result.success).toBe(false);
      expect(result.appliedPromotions.length).toBe(0);
      expect(result.discountAmount).toBe(0);
      expect(result.freeShipping).toBe(false);
      expect(result.freeProducts.length).toBe(0);
    });

    it('should validate cart item structure', async () => {
      const invalidCartItems = [
        { productId: 'product-1', quantity: 2 }, // Missing price
        { quantity: 1, price: 50 }, // Missing productId
      ];

      const result = await storefrontPromotionService.applyPromotionsToCart(
        mockVendorId,
        invalidCartItems as any,
        { currentDate: mockCurrentDate }
      );

      // Should handle gracefully and not throw
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });
  });

  describe('validatePromotion', () => {
    it('should return invalid for non-existent promotion', async () => {
      const result = await storefrontPromotionService.validatePromotion(
        'non-existent-promotion',
        mockVendorId,
        mockCurrentDate
      );

      expect(result.isValid).toBe(false);
      expect(result.isActive).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid vendor ID', async () => {
      const result = await storefrontPromotionService.validatePromotion(
        'some-promotion',
        '',
        mockCurrentDate
      );

      expect(result.isValid).toBe(false);
      expect(result.isActive).toBe(false);
    });
  });

  describe('getPromotionExpiryInfo', () => {
    it('should return expired status for non-existent promotion', async () => {
      const result = await storefrontPromotionService.getPromotionExpiryInfo(
        'non-existent-promotion',
        mockVendorId,
        mockCurrentDate
      );

      expect(result.isExpiring).toBe(false);
      expect(result.hasExpired).toBe(true);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid dates gracefully', async () => {
      const result = await storefrontPromotionService.getPromotionExpiryInfo(
        'some-promotion',
        mockVendorId,
        new Date('invalid-date')
      );

      expect(result.isExpiring).toBe(false);
      expect(result.hasExpired).toBe(true);
    });
  });

  describe('cleanupExpiredPromotions', () => {
    it('should return cleanup result structure', async () => {
      const result = await storefrontPromotionService.cleanupExpiredPromotions(
        mockVendorId,
        mockCurrentDate
      );

      expect(result).toHaveProperty('cleanedCount');
      expect(result).toHaveProperty('errors');
      expect(typeof result.cleanedCount).toBe('number');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should handle invalid vendor ID gracefully', async () => {
      const result = await storefrontPromotionService.cleanupExpiredPromotions(
        '',
        mockCurrentDate
      );

      expect(result.cleanedCount).toBe(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});