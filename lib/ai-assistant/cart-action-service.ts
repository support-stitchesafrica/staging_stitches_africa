/**
 * AI Assistant Cart Action Service
 * 
 * Handles cart operations triggered from the AI shopping assistant.
 * Integrates with the existing cart system to add products, update quantities, etc.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { Product } from '@/types';
import { ProductSearchService } from './product-search-service';

/**
 * Cart action types that can be triggered from AI chat
 */
export type CartActionType = 'add_to_cart' | 'view_cart' | 'remove_from_cart' | 'update_quantity';

/**
 * Cart action data structure
 */
export interface CartAction {
  type: CartActionType;
  productId: string;
  quantity?: number;
  size?: string;
  color?: string;
}

/**
 * Cart action result
 */
export interface CartActionResult {
  success: boolean;
  message: string;
  productTitle?: string;
  cartItemCount?: number;
  error?: string;
}

/**
 * Cart Action Service for AI Assistant
 * 
 * This service provides methods to interact with the cart from the AI assistant.
 * It validates products, formats cart actions, and provides user-friendly responses.
 */
export class CartActionService {
  /**
   * Parse action string from AI response
   * Format: "add_to_cart:product_id:size" or "add_to_cart:product_id"
   * 
   * @param actionString - Action string from AI
   * @returns Parsed cart action or null
   */
  static parseAction(actionString: string): CartAction | null {
    try {
      const parts = actionString.split(':');
      
      if (parts.length < 2) {
        return null;
      }

      const type = parts[0] as CartActionType;
      const productId = parts[1];
      const size = parts[2] || undefined;
      const color = parts[3] || undefined;

      // Validate action type
      const validTypes: CartActionType[] = ['add_to_cart', 'view_cart', 'remove_from_cart', 'update_quantity'];
      if (!validTypes.includes(type)) {
        return null;
      }

      return {
        type,
        productId,
        size,
        color,
        quantity: 1, // Default quantity
      };
    } catch (error) {
      console.error('[Cart Action Service] Error parsing action:', error);
      return null;
    }
  }

  /**
   * Validate product before adding to cart
   * 
   * @param productId - Product ID to validate
   * @returns Product if valid, null otherwise
   */
  static async validateProduct(productId: string): Promise<Product | null> {
    try {
      const formattedProduct = await ProductSearchService.getById(productId);
      
      if (!formattedProduct) {
        return null;
      }

      // Check availability
      if (formattedProduct.availability === 'out_of_stock') {
        return null;
      }

      // Get full product details from repository
      const { productRepository } = await import('@/lib/firestore');
      const product = await productRepository.getById(productId);

      return product;
    } catch (error) {
      console.error('[Cart Action Service] Error validating product:', error);
      return null;
    }
  }

  /**
   * Format add to cart confirmation message
   * 
   * @param product - Product that was added
   * @param quantity - Quantity added
   * @returns User-friendly confirmation message
   */
  static formatAddToCartMessage(product: Product, quantity: number = 1): string {
    const productName = product.title;
    const quantityText = quantity > 1 ? `${quantity} items` : 'item';
    
    return `Great! I've added ${quantityText} of "${productName}" to your cart. Would you like to continue shopping or proceed to checkout?`;
  }

  /**
   * Format cart action error message
   * 
   * @param error - Error type
   * @param productId - Product ID (optional)
   * @returns User-friendly error message
   */
  static formatErrorMessage(error: string, productId?: string): string {
    switch (error) {
      case 'product_not_found':
        return `I couldn't find that product. Would you like me to help you find something similar?`;
      
      case 'out_of_stock':
        return `Unfortunately, this item is currently out of stock. Can I help you find an alternative?`;
      
      case 'invalid_action':
        return `I'm not sure what you'd like me to do. Could you clarify?`;
      
      case 'missing_size':
        return `This product requires a size selection. What size would you like?`;
      
      case 'missing_color':
        return `This product requires a color selection. What color would you prefer?`;
      
      default:
        return `I had trouble processing that request. Could you try again?`;
    }
  }

  /**
   * Check if product requires size selection
   * 
   * @param product - Product to check
   * @returns True if size is required
   */
  static requiresSize(product: Product): boolean {
    return !!(
      product.type === 'ready-to-wear' &&
      product.rtwOptions?.sizes &&
      product.rtwOptions.sizes.length > 0
    );
  }

  /**
   * Check if product requires color selection
   * 
   * @param product - Product to check
   * @returns True if color is required
   */
  static requiresColor(product: Product): boolean {
    return !!(
      product.type === 'ready-to-wear' &&
      product.rtwOptions?.colors &&
      product.rtwOptions.colors.length > 0
    );
  }

  /**
   * Get available sizes for a product
   * 
   * @param product - Product to get sizes for
   * @returns Array of available sizes
   */
  static getAvailableSizes(product: Product): string[] {
    if (!product.rtwOptions?.sizes) {
      return [];
    }

    return product.rtwOptions.sizes.map(size => 
      typeof size === 'string' ? size : size.label
    );
  }

  /**
   * Get available colors for a product
   * 
   * @param product - Product to get colors for
   * @returns Array of available colors
   */
  static getAvailableColors(product: Product): string[] {
    return product.rtwOptions?.colors || [];
  }

  /**
   * Validate size selection
   * 
   * @param product - Product to validate against
   * @param size - Selected size
   * @returns True if size is valid
   */
  static isValidSize(product: Product, size: string): boolean {
    const availableSizes = this.getAvailableSizes(product);
    return availableSizes.some(s => s.toLowerCase() === size.toLowerCase());
  }

  /**
   * Validate color selection
   * 
   * @param product - Product to validate against
   * @param color - Selected color
   * @returns True if color is valid
   */
  static isValidColor(product: Product, color: string): boolean {
    const availableColors = this.getAvailableColors(product);
    return availableColors.some(c => c.toLowerCase() === color.toLowerCase());
  }

  /**
   * Generate quick action buttons for a product
   * 
   * @param product - Product to generate actions for
   * @returns Array of quick action objects
   */
  static generateQuickActions(product: Product): Array<{
    type: string;
    label: string;
    action: string;
  }> {
    const actions = [];

    // Add to cart action (if in stock)
    if (product.availability !== 'out_of_stock') {
      const requiresOptions = this.requiresSize(product) || this.requiresColor(product);
      
      actions.push({
        type: 'add_to_cart',
        label: requiresOptions ? 'Select Options' : 'Add to Cart',
        action: `add_to_cart:${product.product_id}`,
      });
    }

    // View details action
    actions.push({
      type: 'view_details',
      label: 'View Details',
      action: `view_details:${product.product_id}`,
    });

    // Try on action (for ready-to-wear)
    if (product.type === 'ready-to-wear') {
      actions.push({
        type: 'try_on',
        label: 'Try It On',
        action: `try_on:${product.product_id}`,
      });
    }

    return actions;
  }

  /**
   * Format product card data for chat display
   * 
   * @param product - Product to format
   * @returns Formatted product card data
   */
  static formatProductCard(product: Product): {
    id: string;
    title: string;
    price: number;
    discount?: number;
    finalPrice: number;
    image: string;
    vendor: string;
    availability: string;
    quickActions: Array<{ type: string; label: string; action: string }>;
  } {
    const basePrice = product.price?.base || 0;
    const discount = product.discount || product.price?.discount || 0;
    const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

    return {
      id: product.product_id,
      title: product.title,
      price: basePrice,
      discount: discount > 0 ? discount : undefined,
      finalPrice,
      image: product.images?.[0] || '',
      vendor: product.vendor?.name || product.tailor || 'Unknown Vendor',
      availability: product.availability,
      quickActions: this.generateQuickActions(product),
    };
  }

  /**
   * Generate suggested questions after adding to cart
   * 
   * @returns Array of suggested questions
   */
  static getSuggestedQuestionsAfterAddToCart(): string[] {
    return [
      'Continue shopping',
      'View my cart',
      'Proceed to checkout',
      'Show me similar items',
    ];
  }

  /**
   * Generate suggested questions when size/color is needed
   * 
   * @param product - Product that needs options
   * @returns Array of suggested questions
   */
  static getSuggestedQuestionsForOptions(product: Product): string[] {
    const suggestions: string[] = [];

    if (this.requiresSize(product)) {
      const sizes = this.getAvailableSizes(product);
      suggestions.push(`Available sizes: ${sizes.join(', ')}`);
    }

    if (this.requiresColor(product)) {
      const colors = this.getAvailableColors(product);
      suggestions.push(`Available colors: ${colors.join(', ')}`);
    }

    suggestions.push('Show me size guide');
    suggestions.push('Help me choose');

    return suggestions;
  }
}
