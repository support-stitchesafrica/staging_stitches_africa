import { PromotionService } from '../promotion-service';

describe('PromotionService', () => {
  describe('getPromotionalBadgeProps', () => {
    it('converts promotion configuration to badge props', () => {
      const promotion = {
        id: 'test-promo',
        vendorId: 'vendor-1',
        type: 'storefront_wide' as const,
        title: 'Summer Sale',
        description: 'Test promotion',
        bannerMessage: 'Test banner',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(),
        displaySettings: {
          backgroundColor: '#ff0000',
          textColor: '#ffffff',
          borderColor: '#cc0000',
          position: 'top' as const,
          priority: 1,
          showIcon: true,
          customColors: {
            background: '#10b981',
            text: '#ffffff',
            border: '#059669',
          },
          customText: {
            primary: 'MEGA SALE',
            secondary: 'Limited Time',
            prefix: '🔥',
            suffix: '🔥',
          },
          badgeVariant: 'compact' as const,
        },
      };

      const props = PromotionService.getPromotionalBadgeProps(promotion, 25, 100, 75);

      expect(props).toEqual({
        discountPercentage: 25,
        text: 'MEGA SALE',
        variant: 'compact',
        showIcon: true,
        customColors: {
          background: '#10b981',
          text: '#ffffff',
          border: '#059669',
        },
        customText: {
          primary: 'MEGA SALE',
          secondary: 'Limited Time',
          prefix: '🔥',
          suffix: '🔥',
        },
        originalPrice: 100,
        salePrice: 75,
        showSavingsAmount: true,
      });
    });

    it('falls back to display settings when custom colors not provided', () => {
      const promotion = {
        id: 'test-promo',
        vendorId: 'vendor-1',
        type: 'storefront_wide' as const,
        title: 'Basic Sale',
        description: 'Test promotion',
        bannerMessage: 'Test banner',
        isActive: true,
        startDate: new Date(),
        endDate: new Date(),
        displaySettings: {
          backgroundColor: '#dc2626',
          textColor: '#ffffff',
          position: 'top' as const,
          priority: 1,
          showIcon: false,
        },
      };

      const props = PromotionService.getPromotionalBadgeProps(promotion, 15);

      expect(props.customColors).toEqual({
        background: '#dc2626',
        text: '#ffffff',
        border: undefined,
      });
      expect(props.showIcon).toBe(false);
      expect(props.text).toBe('Basic Sale');
      expect(props.variant).toBe('default');
    });
  });

  describe('getPresetColorSchemes', () => {
    it('returns predefined color schemes', () => {
      const schemes = PromotionService.getPresetColorSchemes();
      
      expect(schemes).toHaveProperty('fire');
      expect(schemes).toHaveProperty('ocean');
      expect(schemes).toHaveProperty('forest');
      expect(schemes.fire).toEqual({
        background: '#dc2626',
        text: '#ffffff',
        border: '#b91c1c',
      });
    });
  });

  describe('validateCustomColors', () => {
    it('validates hex colors', () => {
      const validHex = {
        background: '#ff0000',
        text: '#ffffff',
        border: '#cc0000',
      };
      
      expect(PromotionService.validateCustomColors(validHex)).toBe(true);
    });

    it('validates RGB colors', () => {
      const validRgb = {
        background: 'rgb(255, 0, 0)',
        text: 'rgb(255, 255, 255)',
      };
      
      expect(PromotionService.validateCustomColors(validRgb)).toBe(true);
    });

    it('validates RGBA colors', () => {
      const validRgba = {
        background: 'rgba(255, 0, 0, 0.8)',
        text: 'rgba(255, 255, 255, 1)',
      };
      
      expect(PromotionService.validateCustomColors(validRgba)).toBe(true);
    });

    it('rejects invalid colors', () => {
      const invalidColors = {
        background: 'not-a-color',
        text: '#ffffff',
      };
      
      expect(PromotionService.validateCustomColors(invalidColors)).toBe(false);
    });

    it('validates without border color', () => {
      const validWithoutBorder = {
        background: '#ff0000',
        text: '#ffffff',
      };
      
      expect(PromotionService.validateCustomColors(validWithoutBorder)).toBe(true);
    });
  });
});