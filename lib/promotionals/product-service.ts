import { Product } from "@/types";
import { ProductDiscount } from "./types";
import { Timestamp } from "firebase/firestore";
import { productRepository } from "@/lib/firestore";

/**
 * Product filters for searching and filtering
 */
export interface ProductFilters {
  vendor?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  availability?: string;
}

/**
 * Promotional Product Service
 * 
 * Handles product operations for promotional events.
 * Fetches products from the tailor_works collection.
 * 
 * @module PromotionalProductService
 */
export class PromotionalProductService {
  /**
   * Gets all marketplace products from tailor_works collection
   * Uses the same productRepository as Collections for consistency
   * @returns Array of products with tailor info and images
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      // Use the same method as Collections to fetch products
      // This ensures consistency and includes tailor info enrichment
      const products = await productRepository.getAllWithTailorInfo();
      return products;
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  }

  /**
   * Searches products by name or description
   * @param searchQuery - Search query string
   * @returns Array of matching products
   */
  static async searchProducts(searchQuery: string): Promise<Product[]> {
    try {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return await this.getAllProducts();
      }

      // Get all products and filter client-side
      // Firestore doesn't support full-text search natively
      const allProducts = await this.getAllProducts();
      const query = searchQuery.toLowerCase();

      return allProducts.filter(product => {
        const title = product.title?.toLowerCase() || '';
        const description = product.description?.toLowerCase() || '';
        const tailor = product.tailor?.toLowerCase() || '';
        
        return title.includes(query) || 
               description.includes(query) || 
               tailor.includes(query);
      });
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  }

  /**
   * Filters products based on criteria
   * @param filters - Filter criteria
   * @returns Array of filtered products
   */
  static async filterProducts(filters: ProductFilters): Promise<Product[]> {
    try {
      // Get all products first
      let products = await this.getAllProducts();

      // Apply filters client-side
      if (filters.vendor) {
        const vendorLower = filters.vendor.toLowerCase();
        products = products.filter(p => 
          p.tailor?.toLowerCase().includes(vendorLower) ||
          p.vendor?.name?.toLowerCase().includes(vendorLower)
        );
      }

      if (filters.category) {
        const categoryLower = filters.category.toLowerCase();
        products = products.filter(p => 
          p.category?.toLowerCase().includes(categoryLower)
        );
      }

      if (filters.minPrice !== undefined) {
        products = products.filter(p => 
          (p.price?.base || 0) >= filters.minPrice!
        );
      }

      if (filters.maxPrice !== undefined) {
        products = products.filter(p => 
          (p.price?.base || 0) <= filters.maxPrice!
        );
      }

      if (filters.availability) {
        products = products.filter(p => 
          p.availability === filters.availability
        );
      }

      return products;
    } catch (error) {
      console.error("Error filtering products:", error);
      return [];
    }
  }

  /**
   * Gets unique vendors from products
   * @returns Array of vendor names
   */
  static async getVendors(): Promise<string[]> {
    try {
      const products = await this.getAllProducts();
      const vendorSet = new Set<string>();

      products.forEach(product => {
        if (product.tailor) {
          vendorSet.add(product.tailor);
        }
        if (product.vendor?.name) {
          vendorSet.add(product.vendor.name);
        }
      });

      return Array.from(vendorSet).sort();
    } catch (error) {
      console.error("Error getting vendors:", error);
      return [];
    }
  }

  /**
   * Gets unique categories from products
   * @returns Array of category names
   */
  static async getCategories(): Promise<string[]> {
    try {
      const products = await this.getAllProducts();
      const categorySet = new Set<string>();

      products.forEach(product => {
        if (product.category) {
          categorySet.add(product.category);
        }
      });

      return Array.from(categorySet).sort();
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  /**
   * Converts products to ProductDiscount format
   * @param products - Array of products
   * @param discountPercentage - Discount percentage to apply
   * @returns Array of ProductDiscount objects
   */
  static convertToProductDiscounts(
    products: Product[],
    discountPercentage: number
  ): ProductDiscount[] {
    return products.map(product => {
      const originalPrice = product.price?.base || 0;
      const discountedPrice = originalPrice * (1 - discountPercentage / 100);

      return {
        productId: product.product_id,
        discountPercentage,
        originalPrice,
        discountedPrice,
        addedAt: Timestamp.now(),
      };
    });
  }

  /**
   * Calculates discounted price for a product
   * @param originalPrice - Original product price
   * @param discountPercentage - Discount percentage (1-100)
   * @returns Discounted price
   */
  static calculateDiscountedPrice(
    originalPrice: number,
    discountPercentage: number
  ): number {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error("Discount percentage must be between 0 and 100");
    }
    return originalPrice * (1 - discountPercentage / 100);
  }

  /**
   * Validates discount percentage
   * @param percentage - Discount percentage to validate
   * @returns true if valid, false otherwise
   */
  static validateDiscountPercentage(percentage: number): boolean {
    return percentage >= 1 && percentage <= 100;
  }

  /**
   * Gets product by ID
   * @param productId - Product ID
   * @returns Product or null if not found
   */
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const products = await this.getAllProducts();
      return products.find(p => p.product_id === productId) || null;
    } catch (error) {
      console.error("Error getting product by ID:", error);
      return null;
    }
  }

  /**
   * Gets multiple products by IDs
   * @param productIds - Array of product IDs
   * @returns Array of products
   */
  static async getProductsByIds(productIds: string[]): Promise<Product[]> {
    try {
      if (!productIds || productIds.length === 0) {
        return [];
      }

      const products = await this.getAllProducts();
      return products.filter(p => productIds.includes(p.product_id));
    } catch (error) {
      console.error("Error getting products by IDs:", error);
      return [];
    }
  }
}
