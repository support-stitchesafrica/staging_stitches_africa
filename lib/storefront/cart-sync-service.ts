import { CartItem } from '@/types';
import { StorefrontCartItem } from './cart-integration';

/**
 * Storefront Cart Synchronization Service
 * 
 * Handles synchronization between storefront cart and main cart system
 */
export class StorefrontCartSyncService {
  
  /**
   * Check if there are storefront cart items that need to be merged
   * 
   * @returns Storefront cart items or null if none exist
   */
  static getStorefrontCartForMerging(): StorefrontCartItem[] | null {
    if (typeof window === 'undefined') return null;

    try {
      const storedCart = localStorage.getItem('storefront_cart');
      if (!storedCart) return null;

      const cartData = JSON.parse(storedCart);
      
      // Validate stored data structure
      if (!cartData.items || !Array.isArray(cartData.items) || cartData.items.length === 0) {
        return null;
      }

      // Check if cart is recent (within last 24 hours)
      const timestamp = new Date(cartData.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        // Clear old cart
        localStorage.removeItem('storefront_cart');
        return null;
      }

      return cartData.items;
    } catch (error) {
      console.warn('Could not retrieve storefront cart for merging:', error);
      return null;
    }
  }

  /**
   * Convert storefront cart items to regular cart items
   * 
   * @param storefrontItems - Storefront cart items
   * @returns Regular cart items with storefront context preserved
   */
  static convertStorefrontItemsToCartItems(storefrontItems: StorefrontCartItem[]): CartItem[] {
    return storefrontItems.map(item => ({
      ...item,
      // Ensure dates are properly converted
      createdAt: item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt),
      updatedAt: item.updatedAt instanceof Date ? item.updatedAt : new Date(item.updatedAt),
      // Preserve storefront context
      storefrontContext: item.storefrontContext
    }));
  }

  /**
   * Clear storefront cart after successful merge
   */
  static clearStorefrontCartAfterMerge(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('storefront_cart');
      console.log('[StorefrontCartSyncService] Cleared storefront cart after merge');
    } catch (error) {
      console.warn('Could not clear storefront cart after merge:', error);
    }
  }

  /**
   * Check if a cart item originated from a storefront
   * 
   * @param item - Cart item to check
   * @returns True if item has storefront context
   */
  static isStorefrontItem(item: CartItem): boolean {
    return !!(item.storefrontContext && item.storefrontContext.source === 'storefront');
  }

  /**
   * Get storefront context from cart items
   * 
   * @param items - Cart items
   * @returns Map of storefront contexts found in cart
   */
  static getStorefrontContextsFromCart(items: CartItem[]): Map<string, {
    storefrontId?: string;
    storefrontHandle?: string;
    itemCount: number;
  }> {
    const contexts = new Map<string, {
      storefrontId?: string;
      storefrontHandle?: string;
      itemCount: number;
    }>();

    items.forEach(item => {
      if (this.isStorefrontItem(item) && item.storefrontContext) {
        const key = item.storefrontContext.storefrontId || item.storefrontContext.storefrontHandle || 'unknown';
        const existing = contexts.get(key);
        
        if (existing) {
          existing.itemCount += item.quantity;
        } else {
          contexts.set(key, {
            storefrontId: item.storefrontContext.storefrontId,
            storefrontHandle: item.storefrontContext.storefrontHandle,
            itemCount: item.quantity
          });
        }
      }
    });

    return contexts;
  }

  /**
   * Filter cart items by storefront context
   * 
   * @param items - Cart items
   * @param storefrontId - Storefront ID to filter by
   * @param storefrontHandle - Storefront handle to filter by
   * @returns Filtered cart items
   */
  static filterItemsByStorefront(
    items: CartItem[], 
    storefrontId?: string, 
    storefrontHandle?: string
  ): CartItem[] {
    return items.filter(item => {
      if (!this.isStorefrontItem(item) || !item.storefrontContext) {
        return false;
      }

      return (
        (storefrontId && item.storefrontContext.storefrontId === storefrontId) ||
        (storefrontHandle && item.storefrontContext.storefrontHandle === storefrontHandle)
      );
    });
  }

  /**
   * Auto-merge storefront cart when user navigates to main site
   * This should be called when the main cart context loads
   * 
   * @param mergeFunction - Function to merge items into main cart
   */
  static async autoMergeStorefrontCart(
    mergeFunction: (items: CartItem[]) => Promise<void>
  ): Promise<void> {
    try {
      const storefrontItems = this.getStorefrontCartForMerging();
      
      if (storefrontItems && storefrontItems.length > 0) {
        const cartItems = this.convertStorefrontItemsToCartItems(storefrontItems);
        await mergeFunction(cartItems);
        this.clearStorefrontCartAfterMerge();
        
        console.log(`[StorefrontCartSyncService] Auto-merged ${cartItems.length} storefront items`);
      }
    } catch (error) {
      console.error('[StorefrontCartSyncService] Auto-merge failed:', error);
    }
  }
}