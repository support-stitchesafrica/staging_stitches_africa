/**
 * Storefront Promotion Integration Service
 * Integrates existing BOGO system with storefront promotional displays
 */

import { bogoMappingService } from '../bogo/mapping-service';
import { bogoDurationService } from '../bogo/duration-service';
import { PromotionService } from './promotion-service';
import type { BogoMapping } from '@/types/bogo';
import type { PromotionalConfig } from '@/types/storefront';
import { Timestamp } from 'firebase/firestore';

export interface ActivePromotionResult {
  id: string;
  vendorId: string;
  type: 'bogo' | 'discount' | 'bundle';
  title: string;
  description: string;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  applicableProducts: string[];
  displaySettings: {
    badgeText: string;
    badgeColor: string;
    bannerMessage: string;
    priority: number;
    customColors?: {
      background: string;
      text: string;
      border?: string;
    };
    customText?: {
      primary: string;
      secondary?: string;
      prefix?: string;
      suffix?: string;
    };
    badgeVariant?: 'default' | 'compact' | 'minimal' | 'savings';
    showIcon?: boolean;
  };
  bogoDetails?: {
    mainProductId: string;
    freeProductIds: string[];
    autoFreeShipping: boolean;
    redemptionCount: number;
    maxRedemptions?: number;
  };
  discountDetails?: {
    type: 'percentage' | 'fixed_amount';
    value: number;
    minOrderValue?: number;
    maxDiscount?: number;
  };
}

export interface PromotionApplicationResult {
  success: boolean;
  appliedPromotions: string[];
  discountAmount: number;
  freeShipping: boolean;
  freeProducts?: Array<{
    productId: string;
    quantity: number;
    originalPrice: number;
  }>;
  error?: string;
}

/**
 * Service for integrating BOGO mappings with storefront promotions
 */
export class StorefrontPromotionIntegrationService {
  private static instance: StorefrontPromotionIntegrationService;

  private constructor() {}

  public static getInstance(): StorefrontPromotionIntegrationService {
    if (!StorefrontPromotionIntegrationService.instance) {
      StorefrontPromotionIntegrationService.instance = new StorefrontPromotionIntegrationService();
    }
    return StorefrontPromotionIntegrationService.instance;
  }

  /**
   * Get all active promotions for a vendor
   * Combines BOGO mappings with other promotional configurations
   */
  async getActivePromotionsForVendor(
    vendorId: string,
    options?: {
      currentDate?: Date;
      includeExpired?: boolean;
      productIds?: string[];
    }
  ): Promise<ActivePromotionResult[]> {
    try {
      const currentDate = options?.currentDate || new Date();
      const promotions: ActivePromotionResult[] = [];

      // Get active BOGO mappings for this vendor
      const bogoMappings = await bogoMappingService.getAllMappings({
        createdBy: vendorId,
        active: true,
        orderBy: 'promotionStartDate',
        orderDirection: 'desc'
      });

      // Convert BOGO mappings to promotion format
      for (const mapping of bogoMappings) {
        const startDate = mapping.promotionStartDate.toDate();
        const endDate = mapping.promotionEndDate.toDate();
        
        // Check if promotion is currently active (unless includeExpired is true)
        const isCurrentlyActive = currentDate >= startDate && currentDate <= endDate;
        if (!options?.includeExpired && !isCurrentlyActive) {
          continue;
        }

        // Filter by product IDs if specified
        if (options?.productIds && options.productIds.length > 0) {
          const hasMatchingProduct = options.productIds.some(productId => 
            mapping.mainProductId === productId || 
            mapping.freeProductIds.includes(productId)
          );
          if (!hasMatchingProduct) {
            continue;
          }
        }

        const promotion: ActivePromotionResult = {
          id: mapping.id,
          vendorId: mapping.createdBy,
          type: 'bogo',
          title: mapping.promotionName || 'Buy One Get One Free',
          description: mapping.description || `Buy ${mapping.mainProductId} and get a free product!`,
          isActive: mapping.active && isCurrentlyActive,
          startDate,
          endDate,
          applicableProducts: [mapping.mainProductId, ...mapping.freeProductIds],
          displaySettings: {
            badgeText: 'BOGO',
            badgeColor: '#dc2626',
            bannerMessage: `🎉 ${mapping.promotionName || 'Buy One Get One Free'} - Limited Time!`,
            priority: 1,
            customColors: {
              background: '#dc2626',
              text: '#ffffff',
              border: '#b91c1c'
            },
            customText: {
              primary: 'BOGO',
              secondary: 'Buy 1 Get 1 FREE'
            },
            badgeVariant: 'default',
            showIcon: true
          },
          bogoDetails: {
            mainProductId: mapping.mainProductId,
            freeProductIds: mapping.freeProductIds,
            autoFreeShipping: mapping.autoFreeShipping,
            redemptionCount: mapping.redemptionCount,
            maxRedemptions: mapping.maxRedemptions
          }
        };

        promotions.push(promotion);
      }

      // Get other promotional configurations from the promotion service
      const storefrontPromotions = await PromotionService.getActivePromotions(vendorId);
      
      for (const storefrontPromo of storefrontPromotions) {
        // Skip if this is already covered by BOGO mappings
        const isDuplicateBogo = promotions.some(p => 
          p.type === 'bogo' && 
          p.bogoDetails?.mainProductId === storefrontPromo.id
        );
        
        if (isDuplicateBogo) {
          continue;
        }

        // Filter by product IDs if specified
        if (options?.productIds && options.productIds.length > 0) {
          const hasMatchingProduct = options.productIds.some(productId => 
            storefrontPromo.applicableProducts?.includes(productId)
          );
          if (!hasMatchingProduct && storefrontPromo.applicableProducts?.length > 0) {
            continue;
          }
        }

        const promotion: ActivePromotionResult = {
          id: storefrontPromo.id,
          vendorId: storefrontPromo.vendorId,
          type: storefrontPromo.type as 'discount' | 'bundle',
          title: storefrontPromo.title,
          description: storefrontPromo.description,
          isActive: storefrontPromo.isActive,
          startDate: storefrontPromo.startDate,
          endDate: storefrontPromo.endDate,
          applicableProducts: storefrontPromo.applicableProducts || [],
          displaySettings: {
            badgeText: storefrontPromo.displaySettings.customText?.primary || storefrontPromo.title,
            badgeColor: storefrontPromo.displaySettings.backgroundColor,
            bannerMessage: storefrontPromo.bannerMessage,
            priority: storefrontPromo.displaySettings.priority,
            customColors: storefrontPromo.displaySettings.customColors,
            customText: storefrontPromo.displaySettings.customText,
            badgeVariant: storefrontPromo.displaySettings.badgeVariant,
            showIcon: storefrontPromo.displaySettings.showIcon
          },
          discountDetails: storefrontPromo.discountInfo
        };

        promotions.push(promotion);
      }

      // Sort by priority (lower number = higher priority)
      return promotions.sort((a, b) => a.displaySettings.priority - b.displaySettings.priority);

    } catch (error) {
      console.error('Error getting active promotions for vendor:', error);
      throw new Error(`Failed to get active promotions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply promotions to a cart/order
   */
  async applyPromotionsToCart(
    vendorId: string,
    cartItems: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>,
    options?: {
      currentDate?: Date;
      promotionIds?: string[];
    }
  ): Promise<PromotionApplicationResult> {
    try {
      const currentDate = options?.currentDate || new Date();
      const result: PromotionApplicationResult = {
        success: false,
        appliedPromotions: [],
        discountAmount: 0,
        freeShipping: false,
        freeProducts: []
      };

      // Get active promotions for this vendor
      const productIds = cartItems.map(item => item.productId);
      const activePromotions = await this.getActivePromotionsForVendor(vendorId, {
        currentDate,
        productIds
      });

      // Filter promotions if specific IDs are requested
      const promotionsToApply = options?.promotionIds 
        ? activePromotions.filter(p => options.promotionIds!.includes(p.id))
        : activePromotions;

      let totalDiscount = 0;
      let hasFreeShipping = false;
      const freeProducts: Array<{ productId: string; quantity: number; originalPrice: number }> = [];

      for (const promotion of promotionsToApply) {
        if (!promotion.isActive) continue;

        if (promotion.type === 'bogo' && promotion.bogoDetails) {
          // Handle BOGO promotion
          const mainProductItem = cartItems.find(item => 
            item.productId === promotion.bogoDetails!.mainProductId
          );

          if (mainProductItem && mainProductItem.quantity > 0) {
            // Add free products based on main product quantity
            for (const freeProductId of promotion.bogoDetails.freeProductIds) {
              // For simplicity, assume free product price is 0 in calculation
              // In real implementation, you'd fetch the actual product price
              freeProducts.push({
                productId: freeProductId,
                quantity: mainProductItem.quantity,
                originalPrice: 0 // Would be fetched from product data
              });
            }

            if (promotion.bogoDetails.autoFreeShipping) {
              hasFreeShipping = true;
            }

            result.appliedPromotions.push(promotion.id);
          }
        } else if (promotion.type === 'discount' && promotion.discountDetails) {
          // Handle discount promotion
          const applicableItems = promotion.applicableProducts.length === 0 
            ? cartItems // Apply to all items if no specific products
            : cartItems.filter(item => promotion.applicableProducts.includes(item.productId));

          if (applicableItems.length > 0) {
            const subtotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Check minimum order value
            if (!promotion.discountDetails.minOrderValue || subtotal >= promotion.discountDetails.minOrderValue) {
              let discount = 0;
              
              if (promotion.discountDetails.type === 'percentage') {
                discount = (subtotal * promotion.discountDetails.value) / 100;
              } else if (promotion.discountDetails.type === 'fixed_amount') {
                discount = promotion.discountDetails.value;
              }

              // Apply maximum discount limit
              if (promotion.discountDetails.maxDiscount && discount > promotion.discountDetails.maxDiscount) {
                discount = promotion.discountDetails.maxDiscount;
              }

              // Don't exceed subtotal
              discount = Math.min(discount, subtotal);
              
              if (discount > 0) {
                totalDiscount += discount;
                result.appliedPromotions.push(promotion.id);
              }
            }
          }
        }
      }

      result.success = result.appliedPromotions.length > 0;
      result.discountAmount = totalDiscount;
      result.freeShipping = hasFreeShipping;
      result.freeProducts = freeProducts;

      return result;

    } catch (error) {
      console.error('Error applying promotions to cart:', error);
      return {
        success: false,
        appliedPromotions: [],
        discountAmount: 0,
        freeShipping: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a specific promotion is valid and active
   */
  async validatePromotion(
    promotionId: string,
    vendorId: string,
    currentDate?: Date
  ): Promise<{
    isValid: boolean;
    isActive: boolean;
    promotion?: ActivePromotionResult;
    error?: string;
  }> {
    try {
      const promotions = await this.getActivePromotionsForVendor(vendorId, {
        currentDate,
        includeExpired: true
      });

      const promotion = promotions.find(p => p.id === promotionId);
      
      if (!promotion) {
        return {
          isValid: false,
          isActive: false,
          error: 'Promotion not found'
        };
      }

      const now = currentDate || new Date();
      const isActive = promotion.isActive && 
                      now >= promotion.startDate && 
                      now <= promotion.endDate;

      return {
        isValid: true,
        isActive,
        promotion
      };

    } catch (error) {
      console.error('Error validating promotion:', error);
      return {
        isValid: false,
        isActive: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get promotion expiry information
   */
  async getPromotionExpiryInfo(
    promotionId: string,
    vendorId: string,
    currentDate?: Date
  ): Promise<{
    isExpiring: boolean;
    timeRemaining?: {
      days: number;
      hours: number;
      minutes: number;
    };
    hasExpired: boolean;
    error?: string;
  }> {
    try {
      const validation = await this.validatePromotion(promotionId, vendorId, currentDate);
      
      if (!validation.isValid || !validation.promotion) {
        return {
          isExpiring: false,
          hasExpired: true,
          error: validation.error
        };
      }

      const now = currentDate || new Date();
      const endDate = validation.promotion.endDate;
      const hasExpired = now > endDate;

      if (hasExpired) {
        return {
          isExpiring: false,
          hasExpired: true
        };
      }

      // Calculate time remaining
      const timeDiff = endDate.getTime() - now.getTime();
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

      // Consider expiring if less than 24 hours remaining
      const isExpiring = timeDiff < 24 * 60 * 60 * 1000;

      return {
        isExpiring,
        timeRemaining: { days, hours, minutes },
        hasExpired: false
      };

    } catch (error) {
      console.error('Error getting promotion expiry info:', error);
      return {
        isExpiring: false,
        hasExpired: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Cleanup expired promotions
   */
  async cleanupExpiredPromotions(vendorId: string, currentDate?: Date): Promise<{
    cleanedCount: number;
    errors: string[];
  }> {
    try {
      const now = currentDate || new Date();
      const result = { cleanedCount: 0, errors: [] as string[] };

      // Get all BOGO mappings for this vendor (including expired ones)
      const bogoMappings = await bogoMappingService.getAllMappings({
        createdBy: vendorId,
        active: true
      });

      // Deactivate expired BOGO mappings
      for (const mapping of bogoMappings) {
        const endDate = mapping.promotionEndDate.toDate();
        if (now > endDate) {
          try {
            await bogoMappingService.updateMapping(mapping.id, { active: false }, 'system');
            result.cleanedCount++;
          } catch (error) {
            result.errors.push(`Failed to deactivate BOGO mapping ${mapping.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      return result;

    } catch (error) {
      console.error('Error cleaning up expired promotions:', error);
      return {
        cleanedCount: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }
}

// Export singleton instance
export const storefrontPromotionService = StorefrontPromotionIntegrationService.getInstance();