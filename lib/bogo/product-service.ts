// BOGO Product Service - High-level service for product-related BOGO operations
import { bogoMappingService } from './mapping-service';
import { bogoBadgeService } from './badge-service';
import { bogoCartService } from './cart-service';
import type { 
  Product, 
  CartItem 
} from '@/types';
import type { 
  BogoProductBadge,
  BogoCartUpdateResult
} from '@/types/bogo';

/**
 * BOGO Product Service
 * High-level service that coordinates BOGO functionality for products
 */
export class BogoProductService {
  private static instance: BogoProductService;

  private constructor() {}

  public static getInstance(): BogoProductService {
    if (!BogoProductService.instance) {
      BogoProductService.instance = new BogoProductService();
    }
    return BogoProductService.instance;
  }

  /**
   * Get complete BOGO information for a product
   */
  async getProductBogoInfo(productId: string): Promise<{
    badges: BogoProductBadge[];
    isMainProduct: boolean;
    isFreeProduct: boolean;
    associatedProducts: string[];
    canAddDirectly: boolean;
    restrictionMessage?: string;
  }> {
    try {
      const [badges, isMainProduct, isFreeProduct] = await Promise.all([
        bogoBadgeService.getProductBadges(productId),
        bogoBadgeService.isBogoMainProduct(productId),
        bogoBadgeService.isBogoFreeProduct(productId),
      ]);

      let associatedProducts: string[] = [];
      let canAddDirectly = true;
      let restrictionMessage: string | undefined;

      if (isMainProduct) {
        associatedProducts = await bogoBadgeService.getAssociatedFreeProducts(productId);
      } else if (isFreeProduct) {
        const mainProduct = await bogoBadgeService.getMainProductForFreeProduct(productId);
        if (mainProduct) {
          associatedProducts = [mainProduct];
        }
        canAddDirectly = false;
        restrictionMessage = bogoBadgeService.getFreeProductRestrictionMessage();
      }

      return {
        badges,
        isMainProduct,
        isFreeProduct,
        associatedProducts,
        canAddDirectly,
        restrictionMessage,
      };
    } catch (error) {
      console.error('Failed to get product BOGO info:', error);
      return {
        badges: [],
        isMainProduct: false,
        isFreeProduct: false,
        associatedProducts: [],
        canAddDirectly: true,
      };
    }
  }

  /**
   * Check if a free product can be added to cart given current cart state
   */
  async canAddFreeProductToCart(freeProductId: string, cartItems: CartItem[]): Promise<boolean> {
    try {
      return await bogoBadgeService.canAddFreeProduct(freeProductId, cartItems);
    } catch (error) {
      console.error('Failed to check if free product can be added to cart:', error);
      return false;
    }
  }

  /**
   * Add product to cart with BOGO logic
   */
  async addProductToCart(
    product: Product,
    quantity: number,
    cartItems: CartItem[],
    selectedOptions?: Record<string, string>
  ): Promise<BogoCartUpdateResult> {
    try {
      return await bogoCartService.addProductWithBogo(product, quantity, cartItems);
    } catch (error) {
      console.error('Failed to add product to cart with BOGO:', error);
      throw error;
    }
  }

  /**
   * Get BOGO badges for multiple products (for product listings)
   */
  async getProductsBadges(productIds: string[]): Promise<Map<string, BogoProductBadge[]>> {
    try {
      return await bogoBadgeService.preloadBadges(productIds);
    } catch (error) {
      console.error('Failed to get products badges:', error);
      return new Map();
    }
  }

  /**
   * Check if any products in a list have BOGO promotions
   */
  async hasAnyBogoPromotions(productIds: string[]): Promise<boolean> {
    try {
      const badgeMap = await this.getProductsBadges(productIds);
      
      for (const badges of badgeMap.values()) {
        if (badges.some(badge => badge.type !== 'none')) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check for BOGO promotions:', error);
      return false;
    }
  }

  /**
   * Get active BOGO mappings count (for admin dashboards)
   */
  async getActivePromotionsCount(): Promise<number> {
    try {
      const mappings = await bogoMappingService.getAllMappings({ active: true });
      return mappings.length;
    } catch (error) {
      console.error('Failed to get active promotions count:', error);
      return 0;
    }
  }

  /**
   * Validate cart for BOGO consistency
   */
  async validateCartBogo(cartItems: CartItem[]): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    try {
      const result = await bogoCartService.validateBogoCart(cartItems);
      return {
        isValid: result.isValid,
        errors: result.errors,
        warnings: [], // Could add warnings for expiring promotions, etc.
      };
    } catch (error) {
      console.error('Failed to validate cart BOGO:', error);
      return {
        isValid: false,
        errors: ['Failed to validate cart'],
        warnings: [],
      };
    }
  }

  /**
   * Clean up expired BOGO items from cart
   */
  async cleanupExpiredItems(cartItems: CartItem[]): Promise<string[]> {
    try {
      return await bogoCartService.cleanupExpiredBogoItems(cartItems);
    } catch (error) {
      console.error('Failed to cleanup expired BOGO items:', error);
      return [];
    }
  }

  /**
   * Get BOGO promotion summary for cart
   */
  getCartBogoSummary(cartItems: CartItem[]): {
    hasBogoItems: boolean;
    bogoSavings: number;
    freeShipping: boolean;
    bogoItemsCount: number;
  } {
    try {
      return bogoCartService.getBogoCartSummary(cartItems);
    } catch (error) {
      console.error('Failed to get cart BOGO summary:', error);
      return {
        hasBogoItems: false,
        bogoSavings: 0,
        freeShipping: false,
        bogoItemsCount: 0,
      };
    }
  }
}

// Export singleton instance
export const bogoProductService = BogoProductService.getInstance();