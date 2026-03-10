import { CartItem, Product } from '@/types';
import { calculateFinalPrice, calculateDutyAmount, calculatePlatformCommission } from '@/lib/priceUtils';
import { currencyService } from '@/lib/services/currencyService';

export interface StorefrontCartItem extends CartItem {
  storefrontContext?: {
    storefrontId?: string;
    storefrontHandle?: string;
    source: 'storefront';
  };
}

export interface CheckoutRedirectOptions {
  items: StorefrontCartItem[];
  storefrontId?: string;
  storefrontHandle?: string;
  returnUrl?: string;
  userId?: string;
}

export interface CheckoutRedirectResult {
  success: boolean;
  redirectUrl?: string;
  error?: string;
}

/**
 * Storefront Cart Integration Service
 * 
 * Handles cart operations specific to storefront functionality,
 * including checkout redirects to the main Stitches Africa flow.
 * 
 * Pricing logic is identical to the shops CartContext.addItem:
 * 1. Convert product price to USD via currencyService
 * 2. Apply duty-aware calculateFinalPrice with userCountry
 * 3. Track sourceCurrency, sourcePrice, sourceOriginalPrice, sourcePlatformCommission
 */
export class StorefrontCartService {
  
  /**
   * Add a product to the storefront cart with proper context.
   * 
   * Pricing model is identical to shops CartContext.addItem:
   * - Converts product price to USD using real-time exchange rates
   * - Applies duty-aware pricing (Nigerian users exempt from duty)
   * - Tracks source currency and price fields for display and order processing
   * 
   * @param product - Product to add to cart
   * @param quantity - Quantity to add
   * @param storefrontContext - Storefront context information
   * @param selectedOptions - Selected product options (size, color, etc.)
   * @param userCountry - User's detected country for duty calculation
   * @returns Cart item with storefront context
   */
  static async createStorefrontCartItem(
    product: Product,
    quantity: number,
    storefrontContext: { storefrontId?: string; storefrontHandle?: string },
    selectedOptions?: Record<string, string>,
    userCountry?: string
  ): Promise<StorefrontCartItem> {
    const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
    const productCurrency = typeof product.price === 'object' ? product.price.currency : 'USD';
    const discount = product.discount || 0;

    // Step 1: Convert to USD using real-time rates (cart stores everything in USD)
    // This matches CartContext.addItem logic exactly
    const conversionResult = await currencyService.convertPrice(
      basePrice,
      productCurrency,
      'USD',
      false // Skip rounding for high precision in cart
    );
    const priceInUSD = conversionResult.convertedPrice;

    // Step 2: Calculate final price with duty (exempt for Nigerian users)
    // Formula: Original * (1 - Discount) * (1 + Duty + Commission)
    const originalPrice = priceInUSD;
    const price = calculateFinalPrice(originalPrice, discount, userCountry);
    const dutyCharge = calculateDutyAmount(originalPrice, discount, userCountry);
    const platform_commission = calculatePlatformCommission(originalPrice, discount);

    // Step 3: Track source currency fields (identical to CartContext.addItem)
    const sourcePrice = calculateFinalPrice(basePrice, discount, userCountry);
    const sourcePlatformCommission = calculatePlatformCommission(basePrice, discount);

    return {
      product_id: product.product_id,
      title: product.title,
      description: product.description,
      price,              // Final price in USD (duty-inclusive, commission-inclusive)
      originalPrice,      // Always in USD (before duty/commission)
      dutyCharge,
      platform_commission,
      discount,
      quantity,
      color: selectedOptions?.color || null,
      size: selectedOptions?.size || null,
      sizes: null,
      images: product.images,
      tailor_id: product.tailor_id,
      tailor: product.tailor || product.vendor?.name || '',
      user_id: '', // Will be set by cart context
      createdAt: new Date(),
      updatedAt: new Date(),
      isCollectionItem: false,
      isRemovable: true,
      type: product.type,
      // Source currency tracking (identical to shops CartContext)
      sourceCurrency: productCurrency,
      sourcePrice,
      sourceOriginalPrice: basePrice,
      sourcePlatformCommission,
      storefrontContext: {
        storefrontId: storefrontContext.storefrontId,
        storefrontHandle: storefrontContext.storefrontHandle,
        source: 'storefront'
      }
    };
  }

  /**
   * Initiate checkout redirect from storefront to main Stitches Africa checkout
   * 
   * Requirements validated:
   * - 7.4: WHEN customers proceed to checkout THEN the system SHALL redirect to Stitches Africa's secure checkout process
   * - Cart items include storefront context during checkout
   * 
   * @param options - Checkout redirect options
   * @returns Promise resolving to redirect result
   */
  static async initiateCheckoutRedirect(options: CheckoutRedirectOptions): Promise<CheckoutRedirectResult> {
    try {
      const { items, storefrontId, storefrontHandle, returnUrl, userId } = options;

      // Validate cart items
      if (!items || items.length === 0) {
        return {
          success: false,
          error: 'Cart is empty'
        };
      }

      // Validate cart item structure
      for (const item of items) {
        if (!item.product_id || !item.title || typeof item.price !== 'number' || typeof item.quantity !== 'number') {
          return {
            success: false,
            error: 'Invalid cart items detected'
          };
        }

        if (item.quantity <= 0) {
          return {
            success: false,
            error: 'All cart items must have positive quantities'
          };
        }
      }

      // Ensure all items have storefront context
      const itemsWithContext = items.map(item => ({
        ...item,
        storefrontContext: item.storefrontContext || {
          storefrontId,
          storefrontHandle,
          source: 'storefront' as const
        }
      }));

      // Prepare request payload
      const requestBody = {
        items: itemsWithContext,
        storefrontId,
        storefrontHandle,
        returnUrl
      };

      // Get auth token if user is logged in
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (userId && typeof window !== 'undefined') {
        try {
          // Get Firebase auth token if available
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Could not get auth token:', error);
          // Continue without auth token
        }
      }

      // Call checkout API
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Checkout failed with status ${response.status}`
        };
      }

      return {
        success: true,
        redirectUrl: result.redirectUrl
      };

    } catch (error) {
      console.error('[StorefrontCartService] Checkout redirect error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initiate checkout'
      };
    }
  }

  /**
   * Calculate cart totals for storefront items
   * 
   * @param items - Cart items to calculate totals for
   * @returns Cart totals
   */
  static calculateCartTotals(items: StorefrontCartItem[]) {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Basic shipping calculation (can be enhanced based on requirements)
    const shippingCost = subtotal > 100 ? 0 : 15; // Free shipping over $100
    const total = subtotal + shippingCost;

    return {
      subtotal,
      itemCount,
      shippingCost,
      total
    };
  }

  /**
   * Validate storefront cart before checkout
   * 
   * @param items - Cart items to validate
   * @returns Validation result
   */
  static validateCart(items: StorefrontCartItem[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!items || items.length === 0) {
      errors.push('Cart is empty');
      return { isValid: false, errors };
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (!item.product_id) {
        errors.push(`Item ${i + 1}: Missing product ID`);
      }
      
      if (!item.title) {
        errors.push(`Item ${i + 1}: Missing product title`);
      }
      
      if (typeof item.price !== 'number' || item.price < 0) {
        errors.push(`Item ${i + 1}: Invalid price`);
      }
      
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        errors.push(`Item ${i + 1}: Invalid quantity`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle checkout redirect in browser
   * 
   * @param redirectUrl - URL to redirect to
   * @param openInNewTab - Whether to open in new tab (default: false)
   */
  static handleCheckoutRedirect(redirectUrl: string, openInNewTab: boolean = false): void {
    if (typeof window === 'undefined') {
      console.warn('Cannot redirect: not in browser environment');
      return;
    }

    if (openInNewTab) {
      window.open(redirectUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = redirectUrl;
    }
  }

  /**
   * Store cart items in localStorage for cross-page persistence
   * 
   * @param items - Cart items to store
   * @param storefrontContext - Storefront context
   */
  static storeCartInLocalStorage(
    items: StorefrontCartItem[], 
    storefrontContext: { storefrontId?: string; storefrontHandle?: string }
  ): void {
    if (typeof window === 'undefined') return;

    try {
      const cartData = {
        items,
        storefrontContext,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('storefront_cart', JSON.stringify(cartData));
    } catch (error) {
      console.warn('Could not store cart in localStorage:', error);
    }
  }

  /**
   * Update cart item quantity in localStorage for guest users
   * 
   * @param productId - Product ID to update
   * @param quantity - New quantity (0 to remove item)
   * @param size - Product size (optional)
   * @param color - Product color (optional)
   * @returns Updated cart data or null if failed
   */
  static updateQuantityInLocalStorage(
    productId: string,
    quantity: number,
    size?: string,
    color?: string
  ): { items: StorefrontCartItem[]; storefrontContext: any } | null {
    if (typeof window === 'undefined') return null;

    try {
      const cartData = this.getCartFromLocalStorage();
      if (!cartData) return null;

      // Find the item to update
      const itemIndex = cartData.items.findIndex(item => 
        item.product_id === productId && 
        (item.size || null) === (size || null) && 
        (item.color || null) === (color || null)
      );

      if (itemIndex === -1) {
        console.warn(`Cart item not found: ${productId}`);
        return null;
      }

      if (quantity === 0) {
        // Remove item
        cartData.items.splice(itemIndex, 1);
      } else {
        // Update quantity
        cartData.items[itemIndex] = {
          ...cartData.items[itemIndex],
          quantity,
          updatedAt: new Date()
        };
      }

      // Update timestamp
      cartData.timestamp = new Date().toISOString();

      // Store updated cart
      localStorage.setItem('storefront_cart', JSON.stringify(cartData));

      return {
        items: cartData.items,
        storefrontContext: cartData.storefrontContext
      };

    } catch (error) {
      console.warn('Could not update cart quantity in localStorage:', error);
      return null;
    }
  }

  /**
   * Add or update item quantity in localStorage for guest users
   * 
   * @param item - Cart item to add or update
   * @param storefrontContext - Storefront context
   * @returns Updated cart data or null if failed
   */
  static addOrUpdateItemInLocalStorage(
    item: StorefrontCartItem,
    storefrontContext: { storefrontId?: string; storefrontHandle?: string }
  ): { items: StorefrontCartItem[]; storefrontContext: any } | null {
    if (typeof window === 'undefined') return null;

    try {
      let cartData = this.getCartFromLocalStorage();
      
      if (!cartData) {
        // Create new cart
        cartData = {
          items: [],
          storefrontContext,
          timestamp: new Date().toISOString()
        };
      }

      // Find existing item with same product, size, and color
      const existingItemIndex = cartData.items.findIndex(existingItem => 
        existingItem.product_id === item.product_id && 
        (existingItem.size || null) === (item.size || null) && 
        (existingItem.color || null) === (item.color || null)
      );

      if (existingItemIndex >= 0) {
        // Update existing item quantity
        cartData.items[existingItemIndex] = {
          ...cartData.items[existingItemIndex],
          quantity: cartData.items[existingItemIndex].quantity + item.quantity,
          updatedAt: new Date()
        };
      } else {
        // Add new item
        cartData.items.push({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Update timestamp
      cartData.timestamp = new Date().toISOString();

      // Store updated cart
      localStorage.setItem('storefront_cart', JSON.stringify(cartData));

      return {
        items: cartData.items,
        storefrontContext: cartData.storefrontContext
      };

    } catch (error) {
      console.warn('Could not add/update item in localStorage:', error);
      return null;
    }
  }

  /**
   * Retrieve cart items from localStorage
   * 
   * @returns Stored cart data or null
   */
  static getCartFromLocalStorage(): { 
    items: StorefrontCartItem[]; 
    storefrontContext: { storefrontId?: string; storefrontHandle?: string };
    timestamp: string;
  } | null {
    if (typeof window === 'undefined') return null;

    try {
      const stored = localStorage.getItem('storefront_cart');
      if (!stored) return null;

      const cartData = JSON.parse(stored);
      
      // Validate stored data structure
      if (!cartData.items || !Array.isArray(cartData.items)) {
        return null;
      }

      return cartData;
    } catch (error) {
      console.warn('Could not retrieve cart from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear cart from localStorage
   */
  static clearCartFromLocalStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem('storefront_cart');
    } catch (error) {
      console.warn('Could not clear cart from localStorage:', error);
    }
  }

  /**
   * Add item to cart via API with storefront context
   * 
   * @param item - Cart item to add
   * @param storefrontContext - Storefront context
   * @returns Promise resolving to add result
   */
  static async addItemToCart(
    item: StorefrontCartItem,
    storefrontContext: { storefrontId?: string; storefrontHandle?: string }
  ): Promise<{ success: boolean; error?: string; item?: StorefrontCartItem }> {
    try {
      // Get auth token if user is logged in
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (typeof window !== 'undefined') {
        try {
          // Get Firebase auth token if available
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Could not get auth token:', error);
          // Continue without auth token for guest users
        }
      }

      // Call add to cart API
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          item,
          storefrontContext
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Failed to add item to cart (${response.status})`
        };
      }

      return {
        success: true,
        item: result.item
      };

    } catch (error) {
      console.error('[StorefrontCartService] Add item error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add item to cart'
      };
    }
  }

  /**
   * Update cart item quantity via API
   * 
   * Requirements validated:
   * - Quantity management and updates for cart items
   * - Support for both authenticated and guest users
   * 
   * @param productId - Product ID to update
   * @param quantity - New quantity (0 to remove item)
   * @param size - Product size (optional)
   * @param color - Product color (optional)
   * @returns Promise resolving to update result
   */
  static async updateItemQuantity(
    productId: string,
    quantity: number,
    size?: string,
    color?: string
  ): Promise<{ success: boolean; error?: string; action?: 'updated' | 'removed' }> {
    try {
      // Validate inputs
      if (!productId) {
        return {
          success: false,
          error: 'Product ID is required'
        };
      }

      if (typeof quantity !== 'number' || quantity < 0) {
        return {
          success: false,
          error: 'Quantity must be a non-negative number'
        };
      }

      // Get auth token if user is logged in
      let headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (typeof window !== 'undefined') {
        try {
          // Get Firebase auth token if available
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Could not get auth token:', error);
          // Continue without auth token for guest users
        }
      }

      // Call update cart API
      const response = await fetch('/api/cart/update', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          productId,
          quantity,
          size,
          color
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Failed to update cart item (${response.status})`
        };
      }

      return {
        success: true,
        action: result.action
      };

    } catch (error) {
      console.error('[StorefrontCartService] Update quantity error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update cart item quantity'
      };
    }
  }

  /**
   * Remove item from cart via API
   * 
   * @param productId - Product ID to remove
   * @param size - Product size (optional)
   * @param color - Product color (optional)
   * @returns Promise resolving to remove result
   */
  static async removeItemFromCart(
    productId: string,
    size?: string,
    color?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!productId) {
        return {
          success: false,
          error: 'Product ID is required'
        };
      }

      // Get auth token if user is logged in
      let headers: Record<string, string> = {};

      if (typeof window !== 'undefined') {
        try {
          // Get Firebase auth token if available
          const { getAuth } = await import('firebase/auth');
          const auth = getAuth();
          if (auth.currentUser) {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Could not get auth token:', error);
          // Continue without auth token for guest users
        }
      }

      // Build query parameters
      const params = new URLSearchParams({ productId });
      if (size) params.append('size', size);
      if (color) params.append('color', color);

      // Call remove cart API
      const response = await fetch(`/api/cart/update?${params.toString()}`, {
        method: 'DELETE',
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || `Failed to remove cart item (${response.status})`
        };
      }

      return {
        success: true
      };

    } catch (error) {
      console.error('[StorefrontCartService] Remove item error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove cart item'
      };
    }
  }

  /**
   * Update multiple cart items at once
   * 
   * @param updates - Array of quantity updates
   * @returns Promise resolving to batch update result
   */
  static async batchUpdateQuantities(
    updates: Array<{
      productId: string;
      quantity: number;
      size?: string;
      color?: string;
    }>
  ): Promise<{ success: boolean; error?: string; results?: Array<{ success: boolean; productId: string; action?: string; error?: string }> }> {
    try {
      if (!updates || updates.length === 0) {
        return {
          success: false,
          error: 'No updates provided'
        };
      }

      // Process updates sequentially to avoid race conditions
      const results = [];
      
      for (const update of updates) {
        const result = await this.updateItemQuantity(
          update.productId,
          update.quantity,
          update.size,
          update.color
        );
        
        results.push({
          success: result.success,
          productId: update.productId,
          action: result.action,
          error: result.error
        });
      }

      // Check if all updates succeeded
      const allSucceeded = results.every(result => result.success);

      return {
        success: allSucceeded,
        results,
        error: allSucceeded ? undefined : 'Some updates failed'
      };

    } catch (error) {
      console.error('[StorefrontCartService] Batch update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to batch update cart items'
      };
    }
  }
}