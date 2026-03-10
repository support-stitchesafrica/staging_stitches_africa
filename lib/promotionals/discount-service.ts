import { Product } from "@/types";
import { ProductWithDiscount, PromotionalEvent } from "./types";
import { PromotionalEventService } from "./event-service";

/**
 * Discount Service
 * 
 * Handles discount calculations and promotional pricing logic.
 * 
 * @module DiscountService
 */
export class DiscountService {
  /**
   * Calculates discounted price based on original price and discount percentage
   * @param originalPrice - Original product price
   * @param discountPercentage - Discount percentage (1-100)
   * @returns Discounted price rounded to 2 decimal places
   */
  static calculateDiscountedPrice(
    originalPrice: number,
    discountPercentage: number
  ): number {
    if (originalPrice < 0) {
      throw new Error("Original price cannot be negative");
    }

    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }

    const discountAmount = originalPrice * (discountPercentage / 100);
    const discountedPrice = originalPrice - discountAmount;
    
    // Round to 2 decimal places
    return Math.round(discountedPrice * 100) / 100;
  }

  /**
   * Validates discount percentage
   * @param percentage - Discount percentage to validate
   * @returns true if valid (1-100), false otherwise
   */
  static validateDiscountPercentage(percentage: number): boolean {
    return typeof percentage === 'number' && 
           percentage >= 1 && 
           percentage <= 100 &&
           !isNaN(percentage);
  }

  /**
   * Applies discount to a product and returns ProductWithDiscount
   * @param product - Product to apply discount to
   * @param discountPercentage - Discount percentage (1-100)
   * @returns ProductWithDiscount object
   */
  static applyDiscount(
    product: Product,
    discountPercentage: number
  ): ProductWithDiscount {
    if (!this.validateDiscountPercentage(discountPercentage)) {
      throw new Error("Invalid discount percentage");
    }

    const originalPrice = product.price?.base || 0;
    const discountedPrice = this.calculateDiscountedPrice(originalPrice, discountPercentage);
    const savings = originalPrice - discountedPrice;

    return {
      productId: product.product_id,
      title: product.title,
      description: product.description,
      images: product.images || [],
      originalPrice,
      discountPercentage,
      discountedPrice,
      savings,
      vendor: {
        id: product.tailor_id || product.vendor?.id || '',
        name: product.tailor || product.vendor?.name || 'Unknown Vendor',
      },
      category: product.category,
      availability: product.availability,
    };
  }

  /**
   * Gets active discount for a product (if it's in an active promotion)
   * @param productId - Product ID
   * @returns Discount percentage or null if not in active promotion
   */
  static async getActiveDiscountForProduct(productId: string): Promise<number | null> {
    try {
      const activeEvents = await PromotionalEventService.getActiveEvents();

      for (const event of activeEvents) {
        const productDiscount = event.products?.find(p => p.productId === productId);
        if (productDiscount) {
          return productDiscount.discountPercentage;
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting active discount for product:", error);
      return null;
    }
  }

  /**
   * Gets the currently active promotional event
   * @returns Active promotional event or null
   */
  static async getActivePromotionalEvent(): Promise<PromotionalEvent | null> {
    try {
      const activeEvents = await PromotionalEventService.getActiveEvents();
      
      // Return the first active event (most recent)
      return activeEvents.length > 0 ? activeEvents[0] : null;
    } catch (error) {
      console.error("Error getting active promotional event:", error);
      return null;
    }
  }

  /**
   * Checks if a product is in an active promotion
   * @param productId - Product ID
   * @returns true if product is in active promotion, false otherwise
   */
  static async isProductInActivePromotion(productId: string): Promise<boolean> {
    try {
      const discount = await this.getActiveDiscountForProduct(productId);
      return discount !== null;
    } catch (error) {
      console.error("Error checking if product is in active promotion:", error);
      return false;
    }
  }

  /**
   * Calculates total savings for multiple products with discounts
   * @param products - Array of ProductWithDiscount
   * @returns Total savings amount
   */
  static calculateTotalSavings(products: ProductWithDiscount[]): number {
    return products.reduce((total, product) => total + product.savings, 0);
  }

  /**
   * Gets the highest discount percentage from a list of products
   * @param products - Array of products with discounts
   * @returns Highest discount percentage
   */
  static getMaxDiscount(products: { discountPercentage: number }[]): number {
    if (!products || products.length === 0) {
      return 0;
    }

    return Math.max(...products.map(p => p.discountPercentage));
  }

  /**
   * Formats price with currency symbol
   * @param price - Price to format
   * @param currency - Currency code (default: USD)
   * @returns Formatted price string
   */
  static formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price);
  }

  /**
   * Calculates savings percentage
   * @param originalPrice - Original price
   * @param discountedPrice - Discounted price
   * @returns Savings percentage
   */
  static calculateSavingsPercentage(
    originalPrice: number,
    discountedPrice: number
  ): number {
    if (originalPrice === 0) {
      return 0;
    }

    const savings = originalPrice - discountedPrice;
    return Math.round((savings / originalPrice) * 100);
  }
}
