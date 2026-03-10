// BOGO Product Badge Service - Manages BOGO badge display on products
import { bogoMappingService } from './mapping-service';
import type { 
  BogoProductBadge, 
  BogoProductBadgeType, 
  BogoMapping,
  Product
} from '../../types';
import { 
  BogoError,
  BogoErrorCode
} from '../../types';

/**
 * BOGO Product Badge Service
 * Manages BOGO badge display on product listings and detail pages
 */
export class BogoBadgeService {
  private static instance: BogoBadgeService;
  private badgeCache = new Map<string, { badge: BogoProductBadge; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): BogoBadgeService {
    if (!BogoBadgeService.instance) {
      BogoBadgeService.instance = new BogoBadgeService();
    }
    return BogoBadgeService.instance;
  }

  /**
   * Get BOGO badges for a product
   */
  async getProductBadges(productId: string): Promise<BogoProductBadge[]> {
    try {
      // Check cache first
      const cached = this.badgeCache.get(productId);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return [cached.badge];
      }

      const badges: BogoProductBadge[] = [];

      // Check if product is a main product
      const mainProductBadge = await this.getMainProductBadge(productId);
      if (mainProductBadge.type !== 'none') {
        badges.push(mainProductBadge);
      }

      // Check if product is a free product
      const freeProductBadge = await this.getFreeProductBadge(productId);
      if (freeProductBadge.type !== 'none') {
        badges.push(freeProductBadge);
      }

      // Cache the result (cache the first badge if any)
      if (badges.length > 0) {
        this.badgeCache.set(productId, {
          badge: badges[0],
          timestamp: Date.now()
        });
      }

      return badges;
    } catch (error) {
      console.error('Failed to get product badges:', error);
      return [{
        type: 'none',
        text: ''
      }];
    }
  }

  /**
   * Check if product is a BOGO main product
   */
  async isBogoMainProduct(productId: string): Promise<boolean> {
    try {
      const mapping = await bogoMappingService.getActiveMapping(productId);
      return mapping !== null;
    } catch (error) {
      console.error('Failed to check if product is BOGO main product:', error);
      return false;
    }
  }

  /**
   * Check if product is a BOGO free product
   */
  async isBogoFreeProduct(productId: string): Promise<boolean> {
    try {
      const mappings = await bogoMappingService.getAllMappings({ active: true });
      return mappings.some(mapping => mapping.freeProductIds.includes(productId));
    } catch (error) {
      console.error('Failed to check if product is BOGO free product:', error);
      return false;
    }
  }

  /**
   * Check if a free product can be added to cart (i.e., main product is present)
   */
  async canAddFreeProduct(freeProductId: string, cartItems: any[]): Promise<boolean> {
    try {
      const mainProductId = await this.getMainProductForFreeProduct(freeProductId);
      if (!mainProductId) {
        return false;
      }

      // Check if main product is in cart
      return cartItems.some(item => item.product_id === mainProductId);
    } catch (error) {
      console.error('Failed to check if free product can be added:', error);
      return false;
    }
  }

  /**
   * Get restriction message for free product
   */
  getFreeProductRestrictionMessage(): string {
    return 'This item is only available as part of the December BOGO promotion';
  }

  /**
   * Get associated free products for a main product
   */
  async getAssociatedFreeProducts(mainProductId: string): Promise<string[]> {
    try {
      const mapping = await bogoMappingService.getActiveMapping(mainProductId);
      return mapping ? mapping.freeProductIds : [];
    } catch (error) {
      console.error('Failed to get associated free products:', error);
      return [];
    }
  }

  /**
   * Get main product for a free product
   */
  async getMainProductForFreeProduct(freeProductId: string): Promise<string | null> {
    try {
      const mappings = await bogoMappingService.getAllMappings({ 
        active: true,
        freeProductId: freeProductId 
      });
      
      return mappings.length > 0 ? mappings[0].mainProductId : null;
    } catch (error) {
      console.error('Failed to get main product for free product:', error);
      return null;
    }
  }

  /**
   * Get BOGO badge configuration for product listings
   */
  getBadgeConfig(): {
    mainProduct: { className: string; text: string };
    freeProduct: { className: string; text: string };
  } {
    return {
      mainProduct: {
        className: 'bg-green-500 text-white px-2 py-1 text-xs font-semibold rounded',
        text: 'Buy 1 Get 1 Free'
      },
      freeProduct: {
        className: 'bg-blue-500 text-white px-2 py-1 text-xs font-semibold rounded',
        text: 'Free with Purchase'
      }
    };
  }

  /**
   * Generate badge HTML for product cards
   */
  generateBadgeHtml(badge: BogoProductBadge): string {
    if (badge.type === 'none') {
      return '';
    }

    const className = badge.className || this.getDefaultClassName(badge.type);
    return `<span class="${className}">${badge.text}</span>`;
  }

  /**
   * Clear badge cache
   */
  clearCache(): void {
    this.badgeCache.clear();
  }

  /**
   * Clear cache for specific product
   */
  clearProductCache(productId: string): void {
    this.badgeCache.delete(productId);
  }

  /**
   * Preload badges for multiple products
   */
  async preloadBadges(productIds: string[]): Promise<Map<string, BogoProductBadge[]>> {
    const badgeMap = new Map<string, BogoProductBadge[]>();
    
    // Process in batches to avoid overwhelming the service
    const batchSize = 10;
    for (let i = 0; i < productIds.length; i += batchSize) {
      const batch = productIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (productId) => {
        try {
          const badges = await this.getProductBadges(productId);
          return { productId, badges };
        } catch (error) {
          console.error(`Failed to preload badges for product ${productId}:`, error);
          return { productId, badges: [] };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ productId, badges }) => {
        badgeMap.set(productId, badges);
      });
    }

    return badgeMap;
  }

  // Private helper methods

  private async getMainProductBadge(productId: string): Promise<BogoProductBadge> {
    try {
      const mapping = await bogoMappingService.getActiveMapping(productId);
      
      if (!mapping) {
        return { type: 'none', text: '' };
      }

      const config = this.getBadgeConfig();
      return {
        type: 'main_product',
        text: config.mainProduct.text,
        className: config.mainProduct.className,
        associatedProducts: mapping.freeProductIds
      };
    } catch (error) {
      return { type: 'none', text: '' };
    }
  }

  private async getFreeProductBadge(productId: string): Promise<BogoProductBadge> {
    try {
      const mainProduct = await this.getMainProductForFreeProduct(productId);
      
      if (!mainProduct) {
        return { type: 'none', text: '' };
      }

      const config = this.getBadgeConfig();
      return {
        type: 'free_product',
        text: config.freeProduct.text,
        className: config.freeProduct.className,
        mainProduct: mainProduct
      };
    } catch (error) {
      return { type: 'none', text: '' };
    }
  }

  private getDefaultClassName(type: BogoProductBadgeType): string {
    const config = this.getBadgeConfig();
    
    switch (type) {
      case 'main_product':
        return config.mainProduct.className;
      case 'free_product':
        return config.freeProduct.className;
      default:
        return '';
    }
  }
}

// Export singleton instance
export const bogoBadgeService = BogoBadgeService.getInstance();