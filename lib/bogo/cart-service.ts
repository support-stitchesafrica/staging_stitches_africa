// BOGO Cart Service - Handles BOGO logic for cart operations
import { CartItem, Product } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { bogoMappingService } from './mapping-service';

export interface BogoCartResult {
  success: boolean;
  error?: string;
  freeProductAdded?: boolean;
  freeProductId?: string;
  requiresSelection?: boolean;
  availableFreeProducts?: string[];
  itemsToRemove?: string[];
  mappingId?: string; // MAPPING ID FOR TRACKING
}

export class BogoCartService {
  private static instance: BogoCartService;

  private constructor() {}

  public static getInstance(): BogoCartService {
    if (!BogoCartService.instance) {
      BogoCartService.instance = new BogoCartService();
    }
    return BogoCartService.instance;
  }

  /**
   * Check if a product is eligible for BOGO and handle the addition
   */
  async addProductWithBogo(
    product: Product, 
    quantity: number, 
    currentCartItems: CartItem[]
  ): Promise<BogoCartResult> {
    try {
      // Find BOGO mapping for this product
      // CHANGED: Use dynamic mapping service instead of hardcoded list
      const mapping = await bogoMappingService.getActiveMapping(product.product_id);
      
      if (!mapping) {
        return { success: true, freeProductAdded: false };
      }

      // Check if this product already has BOGO items in cart
      const existingBogoItems = currentCartItems.filter(
        item => item.bogoMainProductId === product.product_id
      );

      if (existingBogoItems.length > 0) {
        // Already has BOGO items, just add the main product normally
        return { success: true, freeProductAdded: false, mappingId: mapping.id };
      }

      // Handle free product selection
      if (mapping.freeProductIds.length === 1) {
        // Single free product - add automatically
        return {
          success: true,
          freeProductAdded: true,
          freeProductId: mapping.freeProductIds[0],
          mappingId: mapping.id
        };
      } else {
        // Multiple free products - require selection
        return {
          success: true,
          requiresSelection: true,
          availableFreeProducts: mapping.freeProductIds,
          mappingId: mapping.id
        };
      }
    } catch (error) {
      console.error('Error in addProductWithBogo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Handle free product selection for BOGO promotions
   */
  async handleFreeProductSelection(
    mainProductId: string,
    freeProductId: string,
    currentCartItems: CartItem[]
  ): Promise<BogoCartResult> {
    try {
      // Validate that the free product is valid for this main product
      // CHANGED: Use dynamic mapping service
      const mapping = await bogoMappingService.getActiveMapping(mainProductId);
      
      if (!mapping || !mapping.freeProductIds.includes(freeProductId)) {
        return {
          success: false,
          error: 'Invalid free product selection'
        };
      }

      return {
        success: true,
        freeProductAdded: true,
        freeProductId,
        mappingId: mapping.id
      };
    } catch (error) {
      console.error('Error in handleFreeProductSelection:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Remove a BOGO pair (main product and associated free products)
   */
  async removeBogoPair(
    mainProductId: string,
    currentCartItems: CartItem[]
  ): Promise<BogoCartResult> {
    try {
      const itemsToRemove: string[] = [];
      
      // Find main product and associated free products
      currentCartItems.forEach(item => {
        if (item.product_id === mainProductId || item.bogoMainProductId === mainProductId) {
          itemsToRemove.push(item.product_id);
        }
      });

      return {
        success: true,
        itemsToRemove
      };
    } catch (error) {
      console.error('Error in removeBogoPair:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update BOGO quantity (maintain 1:1 ratio between main and free products)
   */
  async updateBogoQuantity(
    mainProductId: string,
    quantity: number,
    currentCartItems: CartItem[]
  ): Promise<BogoCartResult> {
    try {
      // Validate that main product exists and has BOGO items
      const mainProduct = currentCartItems.find(item => item.product_id === mainProductId);
      const freeProducts = currentCartItems.filter(item => item.bogoMainProductId === mainProductId);
      
      if (!mainProduct || freeProducts.length === 0) {
        return {
          success: false,
          error: 'No BOGO pair found for this product'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateBogoQuantity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Synchronize BOGO quantities (ensure 1:1 ratio)
   */
  async synchronizeBogoQuantities(
    mainProductId: string,
    quantity: number,
    currentCartItems: CartItem[]
  ): Promise<CartItem[]> {
    return currentCartItems.map(item => {
      // Update main product quantity
      if (item.product_id === mainProductId) {
        return { ...item, quantity };
      }
      // Update associated free product quantity
      if (item.bogoMainProductId === mainProductId) {
        return { ...item, quantity };
      }
      return item;
    }).filter(item => item.quantity > 0);
  }

  /**
   * Calculate shipping with BOGO (free shipping for BOGO items)
   */
  calculateShippingWithBogo(cartItems: CartItem[]): number {
    // Filter out free BOGO items - only charge shipping for main products and regular items
    const chargeableItems = cartItems.filter(item => !item.isBogoFree);

    // Calculate regular shipping for non-free items only
    return this.calculateRegularShipping(chargeableItems);
  }

  /**
   * Calculate regular shipping (fallback)
   */
  private calculateRegularShipping(cartItems: CartItem[]): number {
    // Standard shipping calculation: $30 per item
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    return totalItems * 30;
  }

  /**
   * Validate BOGO cart structure
   */
  async validateBogoCart(cartItems: CartItem[]): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for orphaned free products (free products without main products)
    const freeProducts = cartItems.filter(item => item.isBogoFree);
    const mainProductIds = new Set(cartItems.map(item => item.product_id));

    for (const freeProduct of freeProducts) {
      if (freeProduct.bogoMainProductId && !mainProductIds.has(freeProduct.bogoMainProductId)) {
        errors.push(`Free product ${freeProduct.title} has no corresponding main product`);
      }
    }

    // Check for quantity mismatches
    const bogoGroups = new Map<string, { main: CartItem | null; free: CartItem[] }>();
    
    cartItems.forEach(item => {
      if (item.isBogoFree && item.bogoMainProductId) {
        if (!bogoGroups.has(item.bogoMainProductId)) {
          bogoGroups.set(item.bogoMainProductId, { main: null, free: [] });
        }
        bogoGroups.get(item.bogoMainProductId)!.free.push(item);
      } else {
        // Check if this is a main product with free products
        const hasFreeProducts = cartItems.some(otherItem => otherItem.bogoMainProductId === item.product_id);
        if (hasFreeProducts) {
          if (!bogoGroups.has(item.product_id)) {
            bogoGroups.set(item.product_id, { main: null, free: [] });
          }
          bogoGroups.get(item.product_id)!.main = item;
        }
      }
    });

    // Validate quantity ratios
    bogoGroups.forEach((group, mainProductId) => {
      if (group.main) {
        group.free.forEach(freeProduct => {
          if (freeProduct.quantity !== group.main!.quantity) {
            errors.push(`Quantity mismatch: ${group.main!.title} (${group.main!.quantity}) vs ${freeProduct.title} (${freeProduct.quantity})`);
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle multiple BOGO pairs in the same cart
   */
  async handleMultipleBogoPairs(cartItems: CartItem[]): Promise<{ isValid: boolean; conflicts: string[] }> {
    const conflicts: string[] = [];
    const bogoMainProducts = new Set<string>();

    // Check for conflicts between different BOGO promotions
    cartItems.forEach(item => {
      if (item.bogoMainProductId) {
        bogoMainProducts.add(item.bogoMainProductId);
      } else {
        // Check if this product is a main product in a BOGO
        const hasFreeProducts = cartItems.some(otherItem => otherItem.bogoMainProductId === item.product_id);
        if (hasFreeProducts) {
          bogoMainProducts.add(item.product_id);
        }
      }
    });

    // Validate that multiple BOGO promotions don't conflict
    // For now, we allow multiple BOGO pairs as they are independent
    
    return {
      isValid: conflicts.length === 0,
      conflicts
    };
  }

  /**
   * Clean up expired BOGO items
   */
  async cleanupExpiredBogoItems(cartItems: CartItem[]): Promise<string[]> {
    const expiredItems: string[] = [];
    const now = new Date();

    for (const item of cartItems) {
      // Check if item is part of a BOGO promotion
      const isBogoItem = item.isBogoFree || cartItems.some(otherItem => otherItem.bogoMainProductId === item.product_id);
      
      if (isBogoItem) {
        // Find the corresponding BOGO mapping
        const mainProductId = item.isBogoFree ? item.bogoMainProductId : item.product_id;
        if (mainProductId) {
            const mapping = await bogoMappingService.getActiveMapping(mainProductId);
            
            if (mapping) {
              const endDate = mapping.promotionEndDate.toDate();
              if (now > endDate) {
                expiredItems.push(item.product_id);
              }
            } else {
                // Mapping no longer exists or is inactive
                expiredItems.push(item.product_id);
            }
        }
      }
    }

    return expiredItems;
  }

  /**
   * Get BOGO cart summary
   */
  getBogoCartSummary(cartItems: CartItem[]): {
    hasBogoItems: boolean;
    bogoSavings: number;
    freeShipping: boolean;
    bogoItemsCount: number;
  } {
    const freeProducts = cartItems.filter(item => item.isBogoFree);
    const hasBogoItems = freeProducts.length > 0;
    
    const bogoSavings = freeProducts.reduce((sum, item) => {
      const originalPrice = item.bogoOriginalPrice || 0;
      return sum + (originalPrice * item.quantity);
    }, 0);

    return {
      hasBogoItems,
      bogoSavings,
      freeShipping: hasBogoItems,
      bogoItemsCount: freeProducts.length
    };
  }

  /**
   * Get BOGO promotion details for a product
   */
  async getBogoPromotionDetails(productId: string): Promise<{
    isEligible: boolean;
    promotionName?: string;
    description?: string;
    freeProducts?: Array<{
      id: string;
      title: string;
      price: number;
      image: string;
    }>;
    totalSavings?: number;
    endDate?: Date;
  }> {
    try {
      const mapping = await bogoMappingService.getActiveMapping(productId);
      
      if (!mapping) {
        return { isEligible: false };
      }

      // Fetch free product details
      const freeProducts = [];
      let totalSavings = 0;

      for (const freeProductId of mapping.freeProductIds) {
        try {
          const freeProductDoc = await getDoc(doc(db, "staging_tailor_works", freeProductId));
          if (freeProductDoc.exists()) {
            const freeProductData = freeProductDoc.data();
            const price = typeof freeProductData.price === 'number' 
              ? freeProductData.price 
              : freeProductData.price?.base || 0;
            
            freeProducts.push({
              id: freeProductId,
              title: freeProductData.title || 'Free Product',
              price: price,
              image: freeProductData.images?.[0] || '/placeholder-product.svg'
            });
            
            totalSavings += price;
          }
        } catch (error) {
          console.error(`Error fetching free product ${freeProductId}:`, error);
        }
      }

      return {
        isEligible: true,
        promotionName: mapping.promotionName,
        description: mapping.description,
        freeProducts,
        totalSavings,
        endDate: mapping.promotionEndDate.toDate()
      };
    } catch (error) {
      console.error('Error getting BOGO promotion details:', error);
      return { isEligible: false };
    }
  }
}

// Export singleton instance
export const bogoCartService = BogoCartService.getInstance();