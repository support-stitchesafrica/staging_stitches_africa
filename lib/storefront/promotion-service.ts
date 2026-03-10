/**
 * Storefront Promotion Service
 * Handles promotional data and logic for storefront-wide offers
 */

import { PromotionalConfig } from '@/types/storefront';
import { BogoMapping } from '@/types/bogo';

export interface StorefrontPromotion {
  id: string;
  vendorId: string;
  type: 'storefront_wide' | 'product_specific' | 'bogo' | 'discount';
  title: string;
  description: string;
  bannerMessage: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  displaySettings: {
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
    position: 'top' | 'middle' | 'bottom';
    priority: number;
    showIcon: boolean;
    iconType?: 'percent' | 'tag' | 'star' | 'fire';
  };
  discountInfo?: {
    type: 'percentage' | 'fixed_amount';
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
  };
  applicableProducts?: string[];
  conditions?: {
    minOrderValue?: number;
    maxUsesPerCustomer?: number;
    totalMaxUses?: number;
    currentUses?: number;
  };
}

export interface PromotionDisplayData {
  promotion: StorefrontPromotion;
  isValid: boolean;
  timeRemaining?: {
    days: number;
    hours: number;
    minutes: number;
  };
  applicableToCurrentProducts?: boolean;
}

/**
 * Mock promotion service for development
 * In production, this would connect to Firebase/API
 */
export class PromotionService {
  /**
   * Get active promotions for a vendor's storefront
   */
  static async getActivePromotions(vendorId: string): Promise<StorefrontPromotion[]> {
    // Mock data for development - replace with actual API call
    const mockPromotions: StorefrontPromotion[] = [
      {
        id: 'promo-1',
        vendorId,
        type: 'storefront_wide',
        title: 'Summer Sale',
        description: 'Get 25% off all items in our summer collection',
        bannerMessage: '🌞 Summer Sale: 25% OFF Everything! Limited Time Only',
        isActive: true,
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started yesterday
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Ends in 7 days
        displaySettings: {
          backgroundColor: '#f59e0b',
          textColor: '#ffffff',
          borderColor: '#d97706',
          position: 'top',
          priority: 1,
          showIcon: true,
          iconType: 'percent',
        },
        discountInfo: {
          type: 'percentage',
          value: 25,
          minOrderValue: 50,
        },
        conditions: {
          minOrderValue: 50,
          maxUsesPerCustomer: 1,
          totalMaxUses: 1000,
          currentUses: 234,
        },
      },
      {
        id: 'promo-2',
        vendorId,
        type: 'storefront_wide',
        title: 'Free Shipping Weekend',
        description: 'Free shipping on all orders this weekend',
        bannerMessage: '🚚 Free Shipping Weekend - No Minimum Order!',
        isActive: true,
        startDate: new Date(Date.now() - 12 * 60 * 60 * 1000), // Started 12 hours ago
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Ends in 2 days
        displaySettings: {
          backgroundColor: '#10b981',
          textColor: '#ffffff',
          position: 'middle',
          priority: 2,
          showIcon: true,
          iconType: 'star',
        },
      },
      {
        id: 'promo-3',
        vendorId,
        type: 'product_specific',
        title: 'New Arrivals Discount',
        description: '15% off all new arrivals',
        bannerMessage: '✨ New Arrivals: 15% OFF Selected Items',
        isActive: true,
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Started 3 days ago
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Ends in 14 days
        displaySettings: {
          backgroundColor: '#8b5cf6',
          textColor: '#ffffff',
          position: 'bottom',
          priority: 3,
          showIcon: true,
          iconType: 'fire',
        },
        discountInfo: {
          type: 'percentage',
          value: 15,
        },
        applicableProducts: ['product-1', 'product-2', 'product-3'],
      },
    ];

    // Filter active promotions
    const now = new Date();
    return mockPromotions.filter(promo => 
      promo.isActive && 
      promo.startDate <= now && 
      promo.endDate >= now
    );
  }

  /**
   * Get promotion display data with validation and time calculations
   */
  static async getPromotionDisplayData(vendorId: string): Promise<PromotionDisplayData[]> {
    const promotions = await this.getActivePromotions(vendorId);
    const now = new Date();

    return promotions.map(promotion => {
      const isValid = promotion.isActive && 
                     promotion.startDate <= now && 
                     promotion.endDate >= now;

      let timeRemaining;
      if (isValid) {
        const timeDiff = promotion.endDate.getTime() - now.getTime();
        const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        timeRemaining = { days, hours, minutes };
      }

      return {
        promotion,
        isValid,
        timeRemaining,
        applicableToCurrentProducts: !promotion.applicableProducts || promotion.applicableProducts.length === 0,
      };
    });
  }

  /**
   * Check if a promotion is applicable to specific products
   */
  static isPromotionApplicableToProducts(promotion: StorefrontPromotion, productIds: string[]): boolean {
    if (!promotion.applicableProducts || promotion.applicableProducts.length === 0) {
      return true; // Storefront-wide promotion
    }

    return productIds.some(productId => promotion.applicableProducts!.includes(productId));
  }

  /**
   * Calculate discount amount for a promotion
   */
  static calculateDiscount(promotion: StorefrontPromotion, orderValue: number): number {
    if (!promotion.discountInfo) return 0;

    const { type, value, minOrderValue, maxDiscount } = promotion.discountInfo;

    // Check minimum order value
    if (minOrderValue && orderValue < minOrderValue) {
      return 0;
    }

    let discount = 0;
    if (type === 'percentage') {
      discount = (orderValue * value) / 100;
    } else if (type === 'fixed_amount') {
      discount = value;
    }

    // Apply maximum discount limit
    if (maxDiscount && discount > maxDiscount) {
      discount = maxDiscount;
    }

    return Math.min(discount, orderValue); // Don't exceed order value
  }

  /**
   * Format time remaining for display
   */
  static formatTimeRemaining(timeRemaining: { days: number; hours: number; minutes: number }): string {
    const { days, hours, minutes } = timeRemaining;

    if (days > 0) {
      return `${days}d ${hours}h remaining`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  }

  /**
   * Get promotion priority order (lower number = higher priority)
   */
  static sortPromotionsByPriority(promotions: PromotionDisplayData[]): PromotionDisplayData[] {
    return promotions.sort((a, b) => a.promotion.displaySettings.priority - b.promotion.displaySettings.priority);
  }

  /**
   * Calculate savings amount between original and sale price
   */
  static calculateSavingsAmount(originalPrice: number, salePrice: number): number {
    if (originalPrice <= 0 || salePrice < 0 || salePrice >= originalPrice) {
      return 0;
    }
    return originalPrice - salePrice;
  }

  /**
   * Calculate discount percentage from original and sale price
   */
  static calculateDiscountPercentage(originalPrice: number, salePrice: number): number {
    if (originalPrice <= 0 || salePrice < 0 || salePrice >= originalPrice) {
      return 0;
    }
    return ((originalPrice - salePrice) / originalPrice) * 100;
  }

  /**
   * Apply promotion discount to a product price
   */
  static applyPromotionToPrice(originalPrice: number, promotion: StorefrontPromotion): {
    salePrice: number;
    savingsAmount: number;
    discountPercentage: number;
  } {
    if (!promotion.discountInfo) {
      return {
        salePrice: originalPrice,
        savingsAmount: 0,
        discountPercentage: 0,
      };
    }

    const discount = this.calculateDiscount(promotion, originalPrice);
    const salePrice = Math.max(0, originalPrice - discount);
    const savingsAmount = this.calculateSavingsAmount(originalPrice, salePrice);
    const discountPercentage = this.calculateDiscountPercentage(originalPrice, salePrice);

    return {
      salePrice,
      savingsAmount,
      discountPercentage,
    };
  }

  /**
   * Format price for display
   */
  static formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  }

  /**
   * Format savings amount for display
   */
  static formatSavings(savingsAmount: number, currency: string = 'USD'): string {
    if (savingsAmount <= 0) return '';
    return `Save ${this.formatPrice(savingsAmount, currency)}`;
  }

  /**
   * Convert promotion configuration to PromotionalBadge props
   */
  static getPromotionalBadgeProps(promotion: StorefrontPromotion, discountPercentage: number, originalPrice?: number, salePrice?: number) {
    const { displaySettings } = promotion;
    
    return {
      discountPercentage,
      text: displaySettings.customText?.primary || promotion.title,
      variant: displaySettings.badgeVariant || 'default',
      showIcon: displaySettings.showIcon !== false, // Default to true
      customColors: displaySettings.customColors || {
        background: displaySettings.backgroundColor,
        text: displaySettings.textColor,
        border: displaySettings.borderColor,
      },
      customText: displaySettings.customText,
      originalPrice,
      salePrice,
      showSavingsAmount: Boolean(originalPrice && salePrice),
    };
  }

  /**
   * Get predefined color schemes for badges
   */
  static getPresetColorSchemes() {
    return {
      fire: {
        background: '#dc2626',
        text: '#ffffff',
        border: '#b91c1c',
      },
      ocean: {
        background: '#0891b2',
        text: '#ffffff',
        border: '#0e7490',
      },
      forest: {
        background: '#059669',
        text: '#ffffff',
        border: '#047857',
      },
      sunset: {
        background: '#ea580c',
        text: '#ffffff',
        border: '#c2410c',
      },
      royal: {
        background: '#7c3aed',
        text: '#ffffff',
        border: '#6d28d9',
      },
      gold: {
        background: '#d97706',
        text: '#ffffff',
        border: '#b45309',
      },
      rose: {
        background: '#e11d48',
        text: '#ffffff',
        border: '#be185d',
      },
      slate: {
        background: '#475569',
        text: '#ffffff',
        border: '#334155',
      },
    };
  }

  /**
   * Validate custom color configuration
   */
  static validateCustomColors(colors: { background: string; text: string; border?: string }): boolean {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const rgbColorRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    const rgbaColorRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[01]?\.?\d*\s*\)$/;
    const hslColorRegex = /^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/;
    const hslaColorRegex = /^hsla\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[01]?\.?\d*\s*\)$/;
    
    // Common named colors
    const namedColors = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink',
      'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'maroon', 'navy', 'olive',
      'silver', 'teal', 'aqua', 'fuchsia', 'transparent'
    ];
    
    const isValidColor = (color: string) => {
      if (!color || typeof color !== 'string') return false;
      
      const normalizedColor = color.toLowerCase().trim();
      
      // Check basic color formats
      if (hexColorRegex.test(normalizedColor) || 
          rgbColorRegex.test(normalizedColor) || 
          rgbaColorRegex.test(normalizedColor) ||
          hslColorRegex.test(normalizedColor) ||
          hslaColorRegex.test(normalizedColor) ||
          namedColors.includes(normalizedColor)) {
        return true;
      }
      
      // Check CSS.supports if available (browser environment)
      if (typeof CSS !== 'undefined' && CSS.supports) {
        try {
          return CSS.supports('color', color);
        } catch {
          return false;
        }
      }
      
      return false;
    };

    return isValidColor(colors.background) && 
           isValidColor(colors.text) && 
           (!colors.border || isValidColor(colors.border));
  }
}