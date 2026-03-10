// Automatic Promotion Expiry Service
// Handles real-time promotion expiry detection and cleanup

import { bogoDurationService } from '../bogo/duration-service';
import { bogoMappingService } from '../bogo/mapping-service';
import { storefrontPromotionService } from './promotion-integration';
import type { BogoMapping } from '../../types/bogo';
import type { PromotionalConfig } from '../../types/storefront';

/**
 * Service for automatically handling promotion expiry
 * Provides real-time expiry detection and cleanup mechanisms
 */
export class PromotionExpiryService {
  private static instance: PromotionExpiryService;
  private expiryCheckInterval: NodeJS.Timeout | null = null;
  private expiryCallbacks: Array<(expiredPromotions: PromotionalConfig[]) => void> = [];

  private constructor() {}

  public static getInstance(): PromotionExpiryService {
    if (!PromotionExpiryService.instance) {
      PromotionExpiryService.instance = new PromotionExpiryService();
    }
    return PromotionExpiryService.instance;
  }

  /**
   * Start automatic promotion expiry monitoring
   * Checks for expired promotions every minute and triggers callbacks
   */
  startExpiryMonitoring(intervalMs: number = 60000): void {
    if (this.expiryCheckInterval) {
      this.stopExpiryMonitoring();
    }

    this.expiryCheckInterval = setInterval(async () => {
      try {
        await this.checkAndHandleExpiredPromotions();
      } catch (error) {
        console.error('Error during automatic promotion expiry check:', error);
      }
    }, intervalMs);

    console.log(`Started promotion expiry monitoring with ${intervalMs}ms interval`);
  }

  /**
   * Stop automatic promotion expiry monitoring
   */
  stopExpiryMonitoring(): void {
    if (this.expiryCheckInterval) {
      clearInterval(this.expiryCheckInterval);
      this.expiryCheckInterval = null;
      console.log('Stopped promotion expiry monitoring');
    }
  }

  /**
   * Register a callback to be called when promotions expire
   */
  onPromotionExpiry(callback: (expiredPromotions: PromotionalConfig[]) => void): void {
    this.expiryCallbacks.push(callback);
  }

  /**
   * Remove a callback from the expiry notification list
   */
  removeExpiryCallback(callback: (expiredPromotions: PromotionalConfig[]) => void): void {
    const index = this.expiryCallbacks.indexOf(callback);
    if (index > -1) {
      this.expiryCallbacks.splice(index, 1);
    }
  }

  /**
   * Check for expired promotions and handle them automatically
   */
  async checkAndHandleExpiredPromotions(currentDate?: Date): Promise<{
    expiredPromotions: PromotionalConfig[];
    deactivatedMappings: string[];
    notifiedCallbacks: number;
  }> {
    const now = currentDate || new Date();
    const expiredPromotions: PromotionalConfig[] = [];
    const deactivatedMappings: string[] = [];

    try {
      // Get all currently active BOGO mappings
      const activeMappings = await bogoMappingService.getAllMappings({
        active: true,
        orderBy: 'promotionEndDate',
        orderDirection: 'asc'
      });

      // Check each mapping for expiry
      for (const mapping of activeMappings) {
        if (bogoDurationService.isPromotionAfterEnd(mapping, now)) {
          // This promotion has expired - deactivate it
          try {
            await bogoMappingService.updateMapping(mapping.id, {
              active: false
            }, 'system');

            deactivatedMappings.push(mapping.id);

            // Convert to storefront format for callbacks
            const storefrontPromotions = await storefrontPromotionService.getActivePromotionsForVendor(
              mapping.createdBy,
              { currentDate: mapping.promotionEndDate.toDate() } // Use end date to get the promotion
            );

            const expiredPromotion = storefrontPromotions.find(p => p.id === mapping.id);
            if (expiredPromotion) {
              // Mark as expired
              expiredPromotion.isActive = false;
              expiredPromotions.push(expiredPromotion);
            }

            console.log(`Automatically deactivated expired promotion: ${mapping.id} (${mapping.promotionName || 'Unnamed promotion'})`);
          } catch (error) {
            console.error(`Failed to deactivate expired promotion ${mapping.id}:`, error);
          }
        }
      }

      // Notify all registered callbacks if there are expired promotions
      if (expiredPromotions.length > 0) {
        for (const callback of this.expiryCallbacks) {
          try {
            callback(expiredPromotions);
          } catch (error) {
            console.error('Error in promotion expiry callback:', error);
          }
        }
      }

      return {
        expiredPromotions,
        deactivatedMappings,
        notifiedCallbacks: this.expiryCallbacks.length
      };

    } catch (error) {
      console.error('Error checking for expired promotions:', error);
      return {
        expiredPromotions: [],
        deactivatedMappings: [],
        notifiedCallbacks: 0
      };
    }
  }

  /**
   * Check if a specific promotion is expired and handle it
   */
  async checkPromotionExpiry(promotionId: string, currentDate?: Date): Promise<{
    isExpired: boolean;
    wasDeactivated: boolean;
    promotion?: PromotionalConfig;
  }> {
    const now = currentDate || new Date();

    try {
      const mapping = await bogoMappingService.getMapping(promotionId);
      
      if (!mapping) {
        return { isExpired: false, wasDeactivated: false };
      }

      const isExpired = bogoDurationService.isPromotionAfterEnd(mapping, now);
      
      if (isExpired && mapping.active) {
        // Deactivate the expired promotion
        await bogoMappingService.updateMapping(mapping.id, {
          active: false
        }, 'system');

        // Convert to storefront format
        const storefrontPromotions = await storefrontPromotionService.getActivePromotionsForVendor(
          mapping.createdBy,
          { currentDate: mapping.promotionEndDate.toDate() }
        );

        const promotion = storefrontPromotions.find(p => p.id === mapping.id);
        if (promotion) {
          promotion.isActive = false;
        }

        return {
          isExpired: true,
          wasDeactivated: true,
          promotion
        };
      }

      return {
        isExpired,
        wasDeactivated: false
      };

    } catch (error) {
      console.error(`Error checking promotion expiry for ${promotionId}:`, error);
      return { isExpired: false, wasDeactivated: false };
    }
  }

  /**
   * Get promotions that will expire within a specified timeframe
   */
  async getPromotionsExpiringWithin(
    hours: number = 24,
    currentDate?: Date
  ): Promise<{
    promotions: PromotionalConfig[];
    count: number;
    earliestExpiry?: Date;
  }> {
    try {
      const expiringMappings = await bogoDurationService.getExpiringPromotions(hours, currentDate);
      
      if (expiringMappings.length === 0) {
        return { promotions: [], count: 0 };
      }

      // Convert to storefront format
      const promotions: PromotionalConfig[] = [];
      
      for (const expiring of expiringMappings) {
        const mapping = await bogoMappingService.getMapping(expiring.mappingId);
        if (mapping) {
          const storefrontPromotions = await storefrontPromotionService.getActivePromotionsForVendor(
            mapping.createdBy,
            { currentDate }
          );
          
          const promotion = storefrontPromotions.find(p => p.id === mapping.id);
          if (promotion) {
            promotions.push(promotion);
          }
        }
      }

      const earliestExpiry = expiringMappings.length > 0 ? expiringMappings[0].expiresAt : undefined;

      return {
        promotions,
        count: promotions.length,
        earliestExpiry
      };

    } catch (error) {
      console.error('Error getting expiring promotions:', error);
      return { promotions: [], count: 0 };
    }
  }

  /**
   * Force check and cleanup of all expired promotions
   * Useful for manual cleanup or initialization
   */
  async forceExpiryCleanup(currentDate?: Date): Promise<{
    totalChecked: number;
    expiredFound: number;
    deactivated: number;
    errors: string[];
  }> {
    const now = currentDate || new Date();
    const errors: string[] = [];
    let totalChecked = 0;
    let expiredFound = 0;
    let deactivated = 0;

    try {
      // Get all active mappings
      const activeMappings = await bogoMappingService.getAllMappings({
        active: true
      });

      totalChecked = activeMappings.length;

      for (const mapping of activeMappings) {
        if (bogoDurationService.isPromotionAfterEnd(mapping, now)) {
          expiredFound++;
          
          try {
            await bogoMappingService.updateMapping(mapping.id, {
              active: false
            }, 'system');
            
            deactivated++;
            console.log(`Force deactivated expired promotion: ${mapping.id}`);
          } catch (error) {
            const errorMsg = `Failed to deactivate ${mapping.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            errors.push(errorMsg);
            console.error(errorMsg);
          }
        }
      }

      return {
        totalChecked,
        expiredFound,
        deactivated,
        errors
      };

    } catch (error) {
      const errorMsg = `Force cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      console.error(errorMsg);
      
      return {
        totalChecked,
        expiredFound: 0,
        deactivated: 0,
        errors
      };
    }
  }

  /**
   * Get service status and statistics
   */
  getServiceStatus(): {
    isMonitoring: boolean;
    intervalMs: number | null;
    callbackCount: number;
    lastCheck?: Date;
  } {
    return {
      isMonitoring: this.expiryCheckInterval !== null,
      intervalMs: this.expiryCheckInterval ? 60000 : null, // Default interval
      callbackCount: this.expiryCallbacks.length,
      lastCheck: undefined // Could be enhanced to track last check time
    };
  }
}

// Export singleton instance
export const promotionExpiryService = PromotionExpiryService.getInstance();