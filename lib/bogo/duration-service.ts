// BOGO Duration Management Service - Handles promotion duration and expiration logic
import { bogoMappingService } from './mapping-service';
import { bogoCartService } from './cart-service';
import type { 
  BogoMapping
} from '../../types/bogo';
import type { CartItem } from '../../types';
import { 
  BogoError, 
  BogoErrorCode,
  BogoPromotionStatus
} from '../../types/bogo';

/**
 * BOGO Duration Management Service
 * Handles date-based promotion activation/deactivation, cart cleanup, and expiration validation
 */
export class BogoDurationService {
  private static instance: BogoDurationService;

  private constructor() {}

  public static getInstance(): BogoDurationService {
    if (!BogoDurationService.instance) {
      BogoDurationService.instance = new BogoDurationService();
    }
    return BogoDurationService.instance;
  }

  /**
   * Check if a BOGO mapping is active based on current date
   */
  isPromotionActive(mapping: BogoMapping, currentDate?: Date): boolean {
    const now = currentDate || new Date();
    const startDate = mapping.promotionStartDate.toDate();
    const endDate = mapping.promotionEndDate.toDate();

    return mapping.active && now >= startDate && now <= endDate;
  }

  /**
   * Check if a BOGO mapping is before start date
   */
  isPromotionBeforeStart(mapping: BogoMapping, currentDate?: Date): boolean {
    const now = currentDate || new Date();
    const startDate = mapping.promotionStartDate.toDate();

    return now < startDate;
  }

  /**
   * Check if a BOGO mapping is after end date
   */
  isPromotionAfterEnd(mapping: BogoMapping, currentDate?: Date): boolean {
    const now = currentDate || new Date();
    const endDate = mapping.promotionEndDate.toDate();

    return now > endDate;
  }

  /**
   * Get promotion status for a mapping
   */
  getPromotionStatus(mapping: BogoMapping, currentDate?: Date): BogoPromotionStatus {
    if (!mapping.active) {
      return BogoPromotionStatus.INACTIVE;
    }

    const now = currentDate || new Date();
    const startDate = mapping.promotionStartDate.toDate();
    const endDate = mapping.promotionEndDate.toDate();

    if (now < startDate) {
      return BogoPromotionStatus.NOT_STARTED;
    }
    if (now > endDate) {
      return BogoPromotionStatus.EXPIRED;
    }
    return BogoPromotionStatus.ACTIVE;
  }

  /**
   * Get active BOGO mapping for a product (respects date constraints)
   */
  async getActiveMappingWithDateCheck(productId: string, currentDate?: Date): Promise<BogoMapping | null> {
    try {
      const mapping = await bogoMappingService.getActiveMapping(productId);
      
      if (!mapping) {
        return null;
      }

      // Additional date check beyond the basic active flag
      if (!this.isPromotionActive(mapping, currentDate)) {
        return null;
      }

      return mapping;
    } catch (error) {
      throw new BogoError(
        BogoErrorCode.UNKNOWN_ERROR,
        `Failed to get active mapping with date check: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Failed to check promotion availability.',
        true
      );
    }
  }

  /**
   * Clean up expired BOGO items from cart
   */
  async cleanupExpiredBogoItems(cartItems: CartItem[], currentDate?: Date): Promise<string[]> {
    const expiredItems: string[] = [];
    const now = currentDate || new Date();

    try {
      // Get all mappings (both active and inactive) to check expiration
      const allMappings = await bogoMappingService.getAllMappings();
      
      for (const item of cartItems) {
        const bogoItem = item as any; // Cast to access BOGO properties
        
        // Check if this is a BOGO item (either main or free)
        if (bogoItem.isBogoFree || bogoItem.bogoMainProductId) {
          let isExpired = false;
          
          if (bogoItem.isBogoFree && bogoItem.bogoMainProductId) {
            // This is a free product - check if its main product's mapping is expired
            const mainProductMapping = allMappings.find(mapping => 
              mapping.mainProductId === bogoItem.bogoMainProductId
            );
            
            if (mainProductMapping && this.isPromotionAfterEnd(mainProductMapping, now)) {
              isExpired = true;
            }
          } else {
            // This might be a main product - check if it has an expired mapping
            const mapping = allMappings.find(m => m.mainProductId === item.product_id);
            
            if (mapping && this.isPromotionAfterEnd(mapping, now)) {
              isExpired = true;
            }
          }
          
          if (isExpired) {
            expiredItems.push(item.product_id);
          }
        } else {
          // For non-BOGO items, check if they are main products with expired mappings
          const mapping = allMappings.find(m => m.mainProductId === item.product_id);
          
          if (mapping && this.isPromotionAfterEnd(mapping, now)) {
            // This is a main product with an expired mapping
            // Also find and mark associated free products for removal
            const associatedFreeProducts = cartItems.filter(cartItem => 
              (cartItem as any).bogoMainProductId === item.product_id
            );
            
            expiredItems.push(item.product_id);
            for (const freeProduct of associatedFreeProducts) {
              expiredItems.push(freeProduct.product_id);
            }
          }
        }
      }

      return expiredItems;
    } catch (error) {
      console.error('Failed to cleanup expired BOGO items:', error);
      return [];
    }
  }

  /**
   * Validate checkout for expired promotions
   */
  async validateCheckoutExpiration(cartItems: CartItem[], currentDate?: Date): Promise<{
    isValid: boolean;
    expiredItems: string[];
    errors: string[];
    recalculatedPrices?: { productId: string; newPrice: number; originalPrice: number }[];
  }> {
    const errors: string[] = [];
    const expiredItems: string[] = [];
    const recalculatedPrices: { productId: string; newPrice: number; originalPrice: number }[] = [];
    const now = currentDate || new Date();

    try {
      const allMappings = await bogoMappingService.getAllMappings();
      
      for (const item of cartItems) {
        const bogoItem = item as any;
        
        if (bogoItem.isBogoFree) {
          // Free product - check if promotion is still active
          const mainProductMapping = allMappings.find(mapping => 
            mapping.mainProductId === bogoItem.bogoMainProductId
          );
          
          if (!mainProductMapping || this.isPromotionAfterEnd(mainProductMapping, now)) {
            expiredItems.push(item.product_id);
            
            // Calculate what the price would be without BOGO
            const originalPrice = bogoItem.bogoOriginalPrice || 0;
            if (originalPrice > 0) {
              recalculatedPrices.push({
                productId: item.product_id,
                newPrice: originalPrice,
                originalPrice: item.price
              });
            }
            
            errors.push(`Free product ${item.product_id} promotion has expired`);
          }
        } else {
          // Check if this is a main product with expired BOGO
          const mapping = allMappings.find(m => m.mainProductId === item.product_id);
          
          if (mapping && this.isPromotionAfterEnd(mapping, now)) {
            // Main product promotion expired - remove associated free products
            const associatedFreeProducts = cartItems.filter(cartItem => 
              (cartItem as any).bogoMainProductId === item.product_id
            );
            
            for (const freeProduct of associatedFreeProducts) {
              expiredItems.push(freeProduct.product_id);
              errors.push(`Free product ${freeProduct.product_id} promotion has expired`);
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        expiredItems,
        errors,
        recalculatedPrices: recalculatedPrices.length > 0 ? recalculatedPrices : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        expiredItems: [],
        errors: [`Checkout validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get countdown information for active promotions
   */
  async getPromotionCountdown(productId: string, currentDate?: Date): Promise<{
    hasCountdown: boolean;
    timeRemaining?: {
      days: number;
      hours: number;
      minutes: number;
      seconds: number;
    };
    promotionEndDate?: Date;
    isExpiringSoon?: boolean; // Less than 24 hours remaining
  }> {
    try {
      const mapping = await this.getActiveMappingWithDateCheck(productId, currentDate);
      
      if (!mapping) {
        return { hasCountdown: false };
      }

      const now = currentDate || new Date();
      const endDate = mapping.promotionEndDate.toDate();
      const timeRemainingMs = endDate.getTime() - now.getTime();

      if (timeRemainingMs <= 0) {
        return { hasCountdown: false };
      }

      const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeRemainingMs % (1000 * 60)) / 1000);

      const isExpiringSoon = timeRemainingMs < (24 * 60 * 60 * 1000); // Less than 24 hours

      return {
        hasCountdown: true,
        timeRemaining: { days, hours, minutes, seconds },
        promotionEndDate: endDate,
        isExpiringSoon
      };
    } catch (error) {
      console.error('Failed to get promotion countdown:', error);
      return { hasCountdown: false };
    }
  }

  /**
   * Schedule automatic cleanup of expired promotions
   */
  schedulePromotionCleanup(callback: (expiredItems: string[]) => void): NodeJS.Timeout {
    // Check for expired promotions every minute
    return setInterval(async () => {
      try {
        // This would typically get cart items from a cart service
        // For now, we'll just trigger the callback with an empty array
        // In a real implementation, this would integrate with the cart context
        const expiredItems = await this.cleanupExpiredBogoItems([]);
        if (expiredItems.length > 0) {
          callback(expiredItems);
        }
      } catch (error) {
        console.error('Error during scheduled promotion cleanup:', error);
      }
    }, 60000); // Check every minute
  }

  /**
   * Get all promotions expiring within a specified timeframe
   */
  async getExpiringPromotions(withinHours: number = 24, currentDate?: Date): Promise<{
    mappingId: string;
    mainProductId: string;
    promotionName?: string;
    expiresAt: Date;
    timeRemaining: {
      days: number;
      hours: number;
      minutes: number;
    };
  }[]> {
    try {
      const now = currentDate || new Date();
      const cutoffTime = new Date(now.getTime() + (withinHours * 60 * 60 * 1000));
      
      const activeMappings = await bogoMappingService.getAllMappings({ active: true });
      
      return activeMappings
        .filter(mapping => {
          const endDate = mapping.promotionEndDate.toDate();
          return endDate > now && endDate <= cutoffTime;
        })
        .map(mapping => {
          const endDate = mapping.promotionEndDate.toDate();
          const timeRemainingMs = endDate.getTime() - now.getTime();
          
          const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
          
          return {
            mappingId: mapping.id,
            mainProductId: mapping.mainProductId,
            promotionName: mapping.promotionName,
            expiresAt: endDate,
            timeRemaining: { days, hours, minutes }
          };
        })
        .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    } catch (error) {
      console.error('Failed to get expiring promotions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const bogoDurationService = BogoDurationService.getInstance();