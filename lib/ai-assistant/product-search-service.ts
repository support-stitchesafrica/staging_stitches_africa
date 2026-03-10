/**
 * AI Assistant Product Search Service
 * 
 * Handles product search and filtering for the AI shopping assistant.
 * Queries Firestore products and applies AI-driven filters.
 * Optimized with caching for faster responses.
 * 
 * Requirements: 2.1, 2.2, 2.4, 8.1, 8.2, 8.3
 */

import { Product } from '@/types';
import { productRepository } from '@/lib/firestore';
import { cacheService, generateCacheKey } from './cache-service';
import { aiAssistantConfig } from './config';

/**
 * Product search filters that can be applied by the AI
 */
export interface ProductSearchFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: 'ready-to-wear' | 'bespoke';
  vendorId?: string;
  vendorName?: string;
  tags?: string[];
  availability?: 'in_stock' | 'pre_order' | 'out_of_stock';
  featured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  // New filters for smarter recommendations
  style?: string;
  occasion?: string;
  color?: string;
  pattern?: string;
  material?: string;
}

/**
 * Formatted product result for AI responses
 */
export interface FormattedProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  discount?: number;
  finalPrice: number;
  images: string[];
  category: string;
  type: 'ready-to-wear' | 'bespoke';
  availability: string;
  vendor: {
    id: string;
    name: string;
    logo?: string;
  };
  tags: string[];
  deliveryTimeline?: string;
}

/**
 * Product Search Service for AI Assistant
 */
export class ProductSearchService {
  /**
   * Search products with optional filters (with caching)
   * 
   * @param query - Search query string (optional)
   * @param filters - Product filters (optional)
   * @param limit - Maximum number of results (default: 10)
   * @returns Array of formatted products
   */
  static async searchProducts(
    query?: string,
    filters?: ProductSearchFilters,
    limit: number = 50
  ): Promise<FormattedProduct[]> {
    try {
      // Check cache if enabled
      if (aiAssistantConfig.features.caching) {
        const cacheKey = generateCacheKey('product_search', { query, filters, limit });
        const cached = cacheService.get<FormattedProduct[]>(cacheKey);
        
        if (cached) {
          return cached;
        }
      }

      // Get all products with tailor info
      let products = await productRepository.getAllWithTailorInfo();

      // Apply text search if query provided
      if (query && query.trim().length > 0) {
        products = this.filterByQuery(products, query);
      }

      // Apply filters
      if (filters) {
        products = this.applyFilters(products, filters);
      }

      // Sort by relevance - featured items first, then best sellers, then new arrivals
      products = this.sortByRelevance(products);

      // Only limit results if limit is explicitly set to a small number
      // For AI assistant, we want to show all relevant results
      if (limit < 50) {
        products = products.slice(0, limit);
      }

      // Format products for AI response
      const formatted = products.map(product => this.formatProduct(product));

      // Cache results if enabled
      if (aiAssistantConfig.features.caching) {
        const cacheKey = generateCacheKey('product_search', { query, filters, limit });
        cacheService.set(cacheKey, formatted, aiAssistantConfig.cache.productSearchTTL);
      }

      return formatted;
    } catch (error) {
      console.error('Error searching products:', error);
      // Return empty array instead of throwing to allow graceful degradation
      return [];
    }
  }

  /**
   * Get products by category
   * 
   * @param category - Product category
   * @param limit - Maximum number of results
   * @returns Array of formatted products
   */
  static async getByCategory(category: string, limit: number = 10): Promise<FormattedProduct[]> {
    try {
      const products = await productRepository.getByCategory(category);
      const limitedProducts = products.slice(0, limit);
      return limitedProducts.map(product => this.formatProduct(product));
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  /**
   * Get products by vendor
   * 
   * @param vendorId - Vendor/tailor ID
   * @param limit - Maximum number of results
   * @returns Array of formatted products
   */
  static async getByVendor(vendorId: string, limit: number = 10): Promise<FormattedProduct[]> {
    try {
      const products = await productRepository.getByTailorIdWithTailorInfo(vendorId);
      const limitedProducts = products.slice(0, limit);
      return limitedProducts.map(product => this.formatProduct(product));
    } catch (error) {
      console.error('Error getting products by vendor:', error);
      return [];
    }
  }

  /**
   * Get discounted products
   * 
   * @param limit - Maximum number of results
   * @returns Array of formatted products
   */
  static async getDiscountedProducts(limit: number = 10): Promise<FormattedProduct[]> {
    try {
      const products = await productRepository.getDiscountedProductsWithTailorInfo();
      const limitedProducts = products.slice(0, limit);
      return limitedProducts.map(product => this.formatProduct(product));
    } catch (error) {
      console.error('Error getting discounted products:', error);
      return [];
    }
  }

  /**
   * Get new arrival products
   * 
   * @param daysBack - Number of days to look back (default: 30)
   * @param limit - Maximum number of results
   * @returns Array of formatted products
   */
  static async getNewArrivals(daysBack: number = 30, limit: number = 10): Promise<FormattedProduct[]> {
    try {
      const products = await productRepository.getNewArrivalsWithTailorInfo(daysBack);
      const limitedProducts = products.slice(0, limit);
      return limitedProducts.map(product => this.formatProduct(product));
    } catch (error) {
      console.error('Error getting new arrivals:', error);
      return [];
    }
  }

  /**
   * Get product by ID
   * 
   * @param productId - Product ID
   * @returns Formatted product or null
   */
  static async getById(productId: string): Promise<FormattedProduct | null> {
    try {
      const product = await productRepository.getByIdWithTailorInfo(productId);
      if (!product) return null;
      return this.formatProduct(product);
    } catch (error) {
      console.error('Error getting product by ID:', error);
      return null;
    }
  }

  /**
   * Get personalized product recommendations based on user preferences
   * 
   * @param userId - User ID for personalization
   * @param limit - Maximum number of results
   * @returns Array of formatted products
   */
  static async getPersonalizedRecommendations(userId: string, limit: number = 10): Promise<FormattedProduct[]> {
    try {
      // Fetch user preferences from API
      const response = await fetch(`/api/ai-assistant/user-preferences?userId=${userId}&limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user preferences');
      }
      
      const data = await response.json();
      
      if (!data.preferences || data.preferences.length === 0) {
        // If no preferences, fall back to popular products
        return await this.getPopularProducts(limit);
      }
      
      // Get product IDs sorted by preference score
      const productIds = data.preferences
        .sort((a: any, b: any) => (b.score as number) - (a.score as number))
        .map((pref: any) => pref.productId)
        .slice(0, limit * 2); // Get more products to filter and sort
      
      // Fetch product details
      const products = await this.getByIds(productIds);
      
      // Sort products by preference score
      const productScoreMap = new Map(data.preferences.map((pref: any) => [pref.productId, pref.score as number]));
      
      return products
        .sort((a, b) => {
          const scoreA = productScoreMap.get(a.id) || 0;
          const scoreB = productScoreMap.get(b.id) || 0;
          return (scoreB as number) - (scoreA as number); // Descending order
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      // Fall back to popular products
      return await this.getPopularProducts(limit);
    }
  }

  /**
   * Get popular products based on general recommendations
   * 
   * @param limit - Maximum number of results
   * @returns Array of formatted products
   */
  static async getPopularProducts(limit: number = 10): Promise<FormattedProduct[]> {
    try {
      // Fetch general AI recommendations
      const response = await fetch('/api/ai-assistant/recommended-products?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommended products');
      }
      
      const data = await response.json();
      
      if (!data.products || data.products.length === 0) {
        // If no recommendations, fall back to new arrivals
        return await this.getNewArrivals(30, limit);
      }
      
      // Get unique product IDs
      const productIds = Array.from(
        new Set(data.products.map((item: any) => item.productId))
      ).slice(0, limit) as string[];
      
      // Fetch product details
      const products = await this.getByIds(productIds);
      
      return products.slice(0, limit);
    } catch (error) {
      console.error('Error getting popular products:', error);
      // Final fallback to new arrivals
      return await this.getNewArrivals(30, limit);
    }
  }

  /**
   * Get products by IDs
   * 
   * @param ids - Array of product IDs
   * @returns Array of formatted products
   */
  static async getByIds(ids: string[]): Promise<FormattedProduct[]> {
    try {
      if (ids.length === 0) return [];
      
      // Check cache if enabled
      if (aiAssistantConfig.features.caching) {
        const cacheKey = generateCacheKey('product_by_ids', { ids });
        const cached = cacheService.get<FormattedProduct[]>(cacheKey);
        
        if (cached) {
          return cached;
        }
      }
      
      // Get products with tailor info (one by one for now)
      const productPromises = ids.map(id => productRepository.getByIdWithTailorInfo(id));
      const products = await Promise.all(productPromises);
      
      // Filter out null products
      const validProducts = products.filter((product): product is Product => product !== null);
      
      // Format products
      const formatted = validProducts.map(product => this.formatProduct(product));
      
      // Cache results if enabled
      if (aiAssistantConfig.features.caching) {
        const cacheKey = generateCacheKey('product_by_ids', { ids });
        cacheService.set(cacheKey, formatted, aiAssistantConfig.cache.productSearchTTL);
      }
      
      return formatted;
    } catch (error) {
      console.error('Error getting products by IDs:', error);
      return [];
    }
  }

  /**
   * Get products similar to a specific product, prioritizing cross-vendor recommendations
   * 
   * @param productId - The ID of the product to find similar items for
   * @param limit - Maximum number of results
   * @returns Array of formatted products
   */
  static async getSimilarProducts(productId: string, limit: number = 8): Promise<FormattedProduct[]> {
    try {
      // Get the reference product
      const referenceProduct = await this.getById(productId);
      if (!referenceProduct) {
        return [];
      }

      // Get all products
      const allProducts = await this.searchProducts();
      
      // Score products based on similarity to reference product
      const scoredProducts = allProducts
        .filter((p) => p.id !== productId) // Exclude the reference product
        .map((p) => {
          let score = 0;
          
          // Higher score for products from different vendors (to promote diversity)
          if (p.vendor.id !== referenceProduct.vendor.id) score += 25;
          else score += 5; // Still include same vendor products but with lower priority
          
          // Similarity scoring based on attributes
          if (p.category === referenceProduct.category) score += 20;
          if (p.type === referenceProduct.type) score += 15;
          
          // Tag similarity - higher weight for exact matches
          if (referenceProduct.tags.length > 0 && p.tags.length > 0) {
            const commonTags = referenceProduct.tags.filter((tag) =>
              p.tags.includes(tag)
            );
            score += commonTags.length * 8; // Increased weight for tag similarity
            
            // Bonus for exact tag matches
            if (commonTags.length === referenceProduct.tags.length && 
                commonTags.length === p.tags.length) {
              score += 10;
            }
          }
          
          // Price similarity (within ranges)
          if (referenceProduct.price > 0 && p.price > 0) {
            const priceDiff = Math.abs(referenceProduct.price - p.price) / referenceProduct.price;
            if (priceDiff <= 0.2) score += 12;  // Very similar prices
            else if (priceDiff <= 0.4) score += 8;   // Moderately similar prices
            else if (priceDiff <= 0.6) score += 4;   // Somewhat similar prices
          }
          
          // Description/content similarity using keyword matching
          const refDesc = referenceProduct.description.toLowerCase();
          const prodDesc = p.description.toLowerCase();
          
          // Extract key terms from reference product
          const keyTerms = [
            ...referenceProduct.tags,
            referenceProduct.category,
            referenceProduct.type,
            ...refDesc.match(/\b(\w{4,})\b/g) || [] // Extract words 4+ characters
          ].filter(Boolean).map(term => term.toLowerCase());
          
          // Count matching terms
          const matchingTerms = keyTerms.filter(term => prodDesc.includes(term));
          score += matchingTerms.length * 2;
          
          // Color matching
          const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'pink', 'orange', 'brown', 
                         'navy', 'maroon', 'beige', 'ivory', 'tan', 'grey', 'gray', 'gold', 'silver', 'bronze'];
          colors.forEach(color => {
            if (refDesc.includes(color) && prodDesc.includes(color)) {
              score += 5;
            }
          });
          
          // Fabric/material matching
          const fabrics = ['cotton', 'silk', 'wool', 'linen', 'polyester', 'denim', 'leather', 'velvet', 
                          'chiffon', 'satin', 'lace', 'jersey', 'tweed', 'flannel', 'cashmere'];
          fabrics.forEach(fabric => {
            if (refDesc.includes(fabric) && prodDesc.includes(fabric)) {
              score += 5;
            }
          });
          
          // Pattern matching
          const patterns = ['striped', 'floral', 'polka dot', 'checkered', 'plaid', 'solid', 
                           'paisley', 'geometric', 'abstract', 'animal print'];
          patterns.forEach(pattern => {
            if (refDesc.includes(pattern) && prodDesc.includes(pattern)) {
              score += 4;
            }
          });
          
          // Occasion matching (for fashion products)
          const occasions = ['wedding', 'party', 'casual', 'formal', 'business', 'work', 
                            'evening', 'day', 'summer', 'winter', 'spring', 'fall'];
          occasions.forEach(occasion => {
            if (refDesc.includes(occasion) && prodDesc.includes(occasion)) {
              score += 3;
            }
          });
          
          return { product: p, score };
        })
        .filter((item) => item.score > 0) // Only include products with some similarity
        .sort((a, b) => b.score - a.score) // Sort by similarity score
        .slice(0, limit)
        .map((item) => item.product);

      return scoredProducts;
    } catch (error) {
      console.error('Error getting similar products:', error);
      return [];
    }
  }

  /**
   * Get cross-vendor product recommendations similar to a specific product
   * 
   * @param productId - The ID of the product to find similar items for
   * @param limit - Maximum number of results
   * @returns Array of formatted products from different vendors
   */
  static async getCrossVendorRecommendations(productId: string, limit: number = 8): Promise<FormattedProduct[]> {
    try {
      // Get the reference product
      const referenceProduct = await this.getById(productId);
      if (!referenceProduct) {
        return [];
      }

      // Get all products
      const allProducts = await this.searchProducts();
      
      // Score products based on similarity to reference product, prioritizing different vendors
      const scoredProducts = allProducts
        .filter((p) => p.id !== productId && p.vendor.id !== referenceProduct.vendor.id) // Exclude reference product and same vendor
        .map((p) => {
          let score = 0;
          
          // Strong preference for different vendors
          score += 30;
          
          // Similarity scoring based on attributes
          if (p.category === referenceProduct.category) score += 25;
          if (p.type === referenceProduct.type) score += 20;
          
          // Tag similarity - higher weight for exact matches
          if (referenceProduct.tags.length > 0 && p.tags.length > 0) {
            const commonTags = referenceProduct.tags.filter((tag) =>
              p.tags.includes(tag)
            );
            score += commonTags.length * 10; // High weight for tag similarity
            
            // Bonus for exact tag matches
            if (commonTags.length === referenceProduct.tags.length && 
                commonTags.length === p.tags.length) {
              score += 15;
            }
          }
          
          // Price similarity (within ranges)
          if (referenceProduct.price > 0 && p.price > 0) {
            const priceDiff = Math.abs(referenceProduct.price - p.price) / referenceProduct.price;
            if (priceDiff <= 0.2) score += 15;  // Very similar prices
            else if (priceDiff <= 0.4) score += 10;   // Moderately similar prices
            else if (priceDiff <= 0.6) score += 5;   // Somewhat similar prices
          }
          
          // Description/content similarity using keyword matching
          const refDesc = referenceProduct.description.toLowerCase();
          const prodDesc = p.description.toLowerCase();
          
          // Extract key terms from reference product
          const keyTerms = [
            ...referenceProduct.tags,
            referenceProduct.category,
            referenceProduct.type,
            ...refDesc.match(/\b(\w{4,})\b/g) || [] // Extract words 4+ characters
          ].filter(Boolean).map(term => term.toLowerCase());
          
          // Count matching terms
          const matchingTerms = keyTerms.filter(term => prodDesc.includes(term));
          score += matchingTerms.length * 3;
          
          // Color matching
          const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'purple', 'pink', 'orange', 'brown', 
                         'navy', 'maroon', 'beige', 'ivory', 'tan', 'grey', 'gray', 'gold', 'silver', 'bronze'];
          colors.forEach(color => {
            if (refDesc.includes(color) && prodDesc.includes(color)) {
              score += 7;
            }
          });
          
          // Fabric/material matching
          const fabrics = ['cotton', 'silk', 'wool', 'linen', 'polyester', 'denim', 'leather', 'velvet', 
                          'chiffon', 'satin', 'lace', 'jersey', 'tweed', 'flannel', 'cashmere'];
          fabrics.forEach(fabric => {
            if (refDesc.includes(fabric) && prodDesc.includes(fabric)) {
              score += 7;
            }
          });
          
          // Pattern matching
          const patterns = ['striped', 'floral', 'polka dot', 'checkered', 'plaid', 'solid', 
                           'paisley', 'geometric', 'abstract', 'animal print'];
          patterns.forEach(pattern => {
            if (refDesc.includes(pattern) && prodDesc.includes(pattern)) {
              score += 5;
            }
          });
          
          // Occasion matching (for fashion products)
          const occasions = ['wedding', 'party', 'casual', 'formal', 'business', 'work', 
                            'evening', 'day', 'summer', 'winter', 'spring', 'fall'];
          occasions.forEach(occasion => {
            if (refDesc.includes(occasion) && prodDesc.includes(occasion)) {
              score += 4;
            }
          });
          
          return { product: p, score };
        })
        .filter((item) => item.score > 10) // Higher threshold for cross-vendor recommendations
        .sort((a, b) => b.score - a.score) // Sort by similarity score
        .slice(0, limit)
        .map((item) => item.product);

      return scoredProducts;
    } catch (error) {
      console.error('Error getting cross-vendor recommendations:', error);
      return [];
    }
  }

  /**
   * Filter products by search query with enhanced matching
   * 
   * @param products - Array of products
   * @param query - Search query
   * @returns Filtered products
   */
  private static filterByQuery(products: Product[], query: string): Product[] {
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    return products.filter(product => {
      const searchableText = [
        product.title,
        product.description,
        product.category,
        product.tailor,
        product.vendor?.name,
        ...(product.tags || []),
        ...(product.keywords || []),
        ...(product.rtwOptions?.colors || []),
        ...(product.rtwOptions?.fabric ? [product.rtwOptions.fabric] : []),
        ...(product.bespokeOptions?.fabricChoices || [])
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      // Exact matches get higher priority
      const hasExactMatch = searchTerms.some(term => 
        product.title?.toLowerCase().includes(term) || 
        product.category?.toLowerCase().includes(term)
      );

      // Partial matches
      const hasPartialMatch = searchTerms.some(term => searchableText.includes(term));

      return hasExactMatch || hasPartialMatch;
    });
  }

  /**
   * Apply filters to products with enhanced filtering logic
   * 
   * @param products - Array of products
   * @param filters - Product filters
   * @returns Filtered products
   */
  private static applyFilters(products: Product[], filters: ProductSearchFilters): Product[] {
    let filtered = products;

    // Filter by category
    if (filters.category) {
      const categoryLower = filters.category.toLowerCase();
      filtered = filtered.filter(p =>
        p.category?.toLowerCase().includes(categoryLower)
      );
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(p => (p.price?.base || 0) >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(p => (p.price?.base || 0) <= filters.maxPrice!);
    }

    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    // Filter by vendor ID
    if (filters.vendorId) {
      filtered = filtered.filter(p => p.tailor_id === filters.vendorId);
    }

    // Filter by vendor name
    if (filters.vendorName) {
      const vendorNameLower = filters.vendorName.toLowerCase();
      filtered = filtered.filter(p =>
        p.tailor?.toLowerCase().includes(vendorNameLower) ||
        p.vendor?.name?.toLowerCase().includes(vendorNameLower)
      );
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(p =>
        filters.tags!.some(tag =>
          p.tags?.some(pTag => pTag.toLowerCase().includes(tag.toLowerCase()))
        )
      );
    }

    // Filter by availability
    if (filters.availability) {
      filtered = filtered.filter(p => p.availability === filters.availability);
    }

    // Filter by featured
    if (filters.featured !== undefined) {
      filtered = filtered.filter(p => p.featured === filters.featured);
    }

    // Filter by new arrival
    if (filters.isNewArrival !== undefined) {
      filtered = filtered.filter(p => p.isNewArrival === filters.isNewArrival);
    }

    // Filter by best seller
    if (filters.isBestSeller !== undefined) {
      filtered = filtered.filter(p => p.isBestSeller === filters.isBestSeller);
    }

    // Enhanced filters for smarter recommendations
    if (filters.style) {
      const styleLower = filters.style.toLowerCase();
      filtered = filtered.filter(p =>
        p.tags?.some(tag => tag.toLowerCase().includes(styleLower)) ||
        p.category?.toLowerCase().includes(styleLower) ||
        p.title?.toLowerCase().includes(styleLower)
      );
    }

    if (filters.occasion) {
      const occasionLower = filters.occasion.toLowerCase();
      filtered = filtered.filter(p =>
        p.tags?.some(tag => tag.toLowerCase().includes(occasionLower)) ||
        p.category?.toLowerCase().includes(occasionLower) ||
        p.title?.toLowerCase().includes(occasionLower) ||
        p.description?.toLowerCase().includes(occasionLower)
      );
    }

    if (filters.color) {
      const colorLower = filters.color.toLowerCase();
      filtered = filtered.filter(p =>
        p.rtwOptions?.colors?.some((color: string) => color.toLowerCase().includes(colorLower)) ||
        p.tags?.some((tag: string) => tag.toLowerCase().includes(colorLower)) ||
        p.title?.toLowerCase().includes(colorLower) ||
        p.description?.toLowerCase().includes(colorLower)
      );
    }

    if (filters.pattern) {
      const patternLower = filters.pattern.toLowerCase();
      filtered = filtered.filter(p =>
        p.tags?.some((tag: string) => tag.toLowerCase().includes(patternLower)) ||
        p.title?.toLowerCase().includes(patternLower) ||
        p.description?.toLowerCase().includes(patternLower)
      );
    }

    if (filters.material) {
      const materialLower = filters.material.toLowerCase();
      filtered = filtered.filter(p =>
        p.rtwOptions?.fabric?.toLowerCase().includes(materialLower) ||
        p.bespokeOptions?.fabricChoices?.some((fabric: string) => fabric.toLowerCase().includes(materialLower)) ||
        p.tags?.some((tag: string) => tag.toLowerCase().includes(materialLower)) ||
        p.title?.toLowerCase().includes(materialLower) ||
        p.description?.toLowerCase().includes(materialLower)
      );
    }

    return filtered;
  }

  /**
   * Sort products by relevance for better recommendations
   * 
   * @param products - Array of products
   * @returns Sorted products
   */
  private static sortByRelevance(products: Product[]): Product[] {
    return products.sort((a, b) => {
      // Featured products first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Then best sellers
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      
      // Then new arrivals
      if (a.isNewArrival && !b.isNewArrival) return -1;
      if (!a.isNewArrival && b.isNewArrival) return 1;
      
      // Then by price (lower prices first for better conversion)
      const aPrice = a.price?.base || 0;
      const bPrice = b.price?.base || 0;
      return aPrice - bPrice;
    });
  }

  /**
   * Format product for AI response
   * 
   * @param product - Raw product from database
   * @returns Formatted product
   */
  private static formatProduct(product: Product): FormattedProduct {
    const basePrice = product.price?.base || 0;
    const discount = product.discount || product.price?.discount || 0;
    const finalPrice = discount > 0 ? basePrice * (1 - discount / 100) : basePrice;

    return {
      id: product.product_id,
      title: product.title,
      description: product.description,
      price: basePrice,
      currency: product.price?.currency || 'NGN',
      discount: discount > 0 ? discount : undefined,
      finalPrice,
      images: product.images || [],
      category: product.category,
      type: product.type,
      availability: product.availability,
      vendor: {
        id: product.tailor_id,
        name: product.vendor?.name || product.tailor || 'Unknown Vendor',
        logo: product.vendor?.logo,
      },
      tags: product.tags || [],
      deliveryTimeline: product.deliveryTimeline,
    };
  }

  /**
   * Get available categories
   * 
   * @returns Array of unique categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const products = await productRepository.getAll();
      const categories = new Set<string>();

      products.forEach(product => {
        if (product.category) {
          categories.add(product.category);
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Get price range for products
   * 
   * @returns Object with min and max prices
   */
  static async getPriceRange(): Promise<{ min: number; max: number }> {
    try {
      const products = await productRepository.getAll();
      
      if (products.length === 0) {
        return { min: 0, max: 0 };
      }

      const prices = products
        .map(p => p.price?.base || 0)
        .filter(price => price > 0);

      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
    } catch (error) {
      console.error('Error getting price range:', error);
      return { min: 0, max: 0 };
    }
  }
}