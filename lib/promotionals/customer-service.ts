import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  PromotionalEvent,
  ProductWithDiscount,
  CountdownValues,
} from '@/types/promotionals';
import { Product } from '@/types';
import { productRepository } from '@/lib/firestore';
import { toDate } from '@/lib/utils/timestamp-helpers';

/**
 * Service for customer-facing promotional features
 */
export class CustomerPromotionalService {
  /**
   * Fetches a promotional event by ID (only if published and active)
   * @param eventId - ID of the promotional event
   * @returns Promise resolving to the promotional event or null
   */
  static async getPromotionalEvent(
    eventId: string
  ): Promise<PromotionalEvent | null> {
    try {
      const eventRef = doc(db, 'promotionalEvents', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        return null;
      }

      const event = {
        id: eventDoc.id,
        ...eventDoc.data(),
      } as PromotionalEvent;

      // Only return if event is published
      if (!event.isPublished) {
        return null;
      }

      // Check if event is active
      if (!this.isPromotionActive(event)) {
        return null;
      }

      return event;
    } catch (error) {
      console.error('Error fetching promotional event:', error);
      throw new Error(
        `Failed to fetch promotional event: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Helper method to transform a product into ProductWithDiscount
   */
  private static transformProductToDiscount(
    product: any,
    productDiscount: any,
    event: PromotionalEvent
  ): ProductWithDiscount | null {
    if (!product || !productDiscount) {
      return null;
    }

    // Calculate discounted price accounting for existing product discounts
    const basePrice = product.price?.base || 0;
    
    // Get current price after applying existing product discount (if any)
    const existingDiscount = product.discount || product.price?.discount || 0;
    const currentPrice = existingDiscount > 0
      ? basePrice * (1 - existingDiscount / 100)
      : basePrice;
    
    // Apply promotional discount on top of current price
    const promotionalDiscount = productDiscount.discountPercentage;
    const finalDiscountedPrice = currentPrice * (1 - promotionalDiscount / 100);
    
    // Calculate savings from base price
    const savings = basePrice - finalDiscountedPrice;
    
    // Calculate total effective discount percentage from base price
    const totalDiscountPercentageRaw = basePrice > 0 
      ? ((basePrice - finalDiscountedPrice) / basePrice) * 100 
      : 0;

    // Get vendor name from enriched product data
    const vendorName = product.vendor?.name || product.tailor || 'Unknown Vendor';
    const vendorId = product.vendor?.id || product.tailor_id || '';

    return {
      productId: product.product_id,
      title: product.title,
      description: product.description,
      images: product.images || [],
      originalPrice: basePrice,
      discountPercentage: totalDiscountPercentageRaw,
      promotionalDiscountPercentage: promotionalDiscount,
      discountedPrice: Math.round(finalDiscountedPrice * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      vendor: {
        id: vendorId,
        name: vendorName,
      },
      category: product.category,
      type: product.type, // Include product type (ready-to-wear or bespoke)
      availability: product.availability,
      rtwOptions: product.rtwOptions,
    } as ProductWithDiscount;
  }

  /**
   * Fetches products for a promotional event with pagination support
   * @param eventId - ID of the promotional event
   * @param limit - Number of products to fetch (default: 20)
   * @param offset - Number of products to skip (default: 0)
   * @returns Promise resolving to array of products with discounts
   */
  static async getPromotionalProductsPaginated(
    eventId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ products: ProductWithDiscount[]; total: number; hasMore: boolean }> {
    try {
      // Get the promotional event
      const event = await this.getPromotionalEvent(eventId);

      if (!event || !event.products || event.products.length === 0) {
        return { products: [], total: 0, hasMore: false };
      }

      // Get product IDs from event
      const allProductIds = event.products.map((p) => p.productId);
      const total = allProductIds.length;

      // Get paginated product IDs
      const paginatedProductIds = allProductIds.slice(offset, offset + limit);

      // Batch fetch products using whereIn (Firestore limit is 10 items per whereIn)
      // So we'll batch them in chunks of 10 and fetch in parallel
      const BATCH_SIZE = 10;
      const productBatches: string[][] = [];
      
      for (let i = 0; i < paginatedProductIds.length; i += BATCH_SIZE) {
        productBatches.push(paginatedProductIds.slice(i, i + BATCH_SIZE));
      }

      // Fetch all batches in parallel using optimized batch loader
      const { batchGetDocuments } = await import('@/lib/utils/firestore-query-optimizer');
      const { db } = await import('@/firebase');
      
      // Use optimized batch fetch with caching
      const allFetchedProducts = await batchGetDocuments(
        db,
        'tailor_works',
        paginatedProductIds,
        { useCache: true, cacheTTL: 5 * 60 * 1000 } // 5 min cache
      );
      
      // Enrich products with tailor info - use parallel processing with Promise.allSettled
      // This is faster than sequential batching and Firestore can handle it
      const enrichedResults = await Promise.allSettled(
        allFetchedProducts.map(async (product: any) => {
          try {
            // Try to get from cache first, then fetch if needed
            const enrichedProduct = await productRepository.getByIdWithTailorInfo(product.product_id || product.id);
            return enrichedProduct || product;
          } catch {
            return product;
          }
        })
      );
      
      // Extract successful results
      const enrichedProducts = enrichedResults
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter(p => p !== null);
      
      // Create a map for quick lookup
      const productMap = new Map(enrichedProducts.map(p => [p?.product_id || p?.id, p]));

      // Transform products with discount info
      const products = paginatedProductIds
        .map((productId) => {
          const product = productMap.get(productId);
          if (!product) return null;

          const productDiscount = event.products.find(
            (p) => p.productId === productId
          );

          if (!productDiscount) return null;

          return this.transformProductToDiscount(product, productDiscount, event);
        })
        .filter((p): p is ProductWithDiscount => p !== null);

      // Filter out null values and out-of-stock products
      const validProducts = products
        .filter((p): p is ProductWithDiscount => p !== null)
        .filter(p => {
          if (!p.availability) return true;
          const availability = p.availability.toLowerCase();
          return availability !== 'out_of_stock' && availability !== 'out of stock';
        });
      const hasMore = offset + limit < total;

      return { products: validProducts, total, hasMore };
    } catch (error) {
      console.error('Error fetching promotional products:', error);
      throw new Error(
        `Failed to fetch promotional products: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetches all products for a promotional event with discount information
   * @param eventId - ID of the promotional event
   * @returns Promise resolving to array of products with discounts
   * @deprecated Use getPromotionalProductsPaginated for better performance
   */
  static async getPromotionalProducts(
    eventId: string
  ): Promise<ProductWithDiscount[]> {
    try {
      // Get the promotional event
      const event = await this.getPromotionalEvent(eventId);

      if (!event || !event.products || event.products.length === 0) {
        return [];
      }

      // Get product IDs from event
      const productIds = event.products.map((p) => p.productId);

      // Fetch products from tailor_works collection with tailor info
      const productsPromises = productIds.map(async (productId) => {
        // Use productRepository to get product with tailor info
        const product = await productRepository.getByIdWithTailorInfo(productId);

        if (!product) {
          return null;
        }

        const productDiscount = event.products.find(
          (p) => p.productId === productId
        );

        if (!productDiscount) {
          return null;
        }

        return this.transformProductToDiscount(product, productDiscount, event);
      });

      const products = await Promise.all(productsPromises);

      // Filter out null values and out-of-stock products
      return products
        .filter((p): p is ProductWithDiscount => p !== null)
        .filter(p => {
          if (!p.availability) return true;
          const availability = p.availability.toLowerCase();
          return availability !== 'out_of_stock' && availability !== 'out of stock';
        });
    } catch (error) {
      console.error('Error fetching promotional products:', error);
      throw new Error(
        `Failed to fetch promotional products: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Fetches a single promotional product with discount information
   * @param eventId - ID of the promotional event
   * @param productId - ID of the product
   * @returns Promise resolving to product with discount or null
   */
  static async getPromotionalProduct(
    eventId: string,
    productId: string
  ): Promise<ProductWithDiscount | null> {
    try {
      // Get the promotional event
      const event = await this.getPromotionalEvent(eventId);

      if (!event) {
        return null;
      }

      // Find product discount in event
      const productDiscount = event.products.find(
        (p) => p.productId === productId
      );

      if (!productDiscount) {
        return null;
      }

      // Fetch product from tailor_works collection with tailor info
      const product = await productRepository.getByIdWithTailorInfo(productId);

      if (!product) {
        return null;
      }

      // Filter out out-of-stock products
      if (product.availability) {
        const availability = product.availability.toLowerCase();
        if (availability === 'out_of_stock' || availability === 'out of stock') {
          return null;
        }
      }

      // Calculate discounted price accounting for existing product discounts
      const basePrice = product.price?.base || 0;
      
      // Get current price after applying existing product discount (if any)
      const existingDiscount = product.discount || product.price?.discount || 0;
      const currentPrice = existingDiscount > 0
        ? basePrice * (1 - existingDiscount / 100)
        : basePrice;
      
      // Apply promotional discount on top of current price
      const promotionalDiscount = productDiscount.discountPercentage;
      const finalDiscountedPrice = currentPrice * (1 - promotionalDiscount / 100);
      
      // Calculate savings from base price
      const savings = basePrice - finalDiscountedPrice;
      
      // Calculate total effective discount percentage from base price
      const totalDiscountPercentageRaw = basePrice > 0 
        ? ((basePrice - finalDiscountedPrice) / basePrice) * 100 
        : 0;

      // Get vendor name from enriched product data
      const vendorName = product.vendor?.name || product.tailor || 'Unknown Vendor';
      const vendorId = product.vendor?.id || product.tailor_id || '';

      return {
        productId: product.product_id,
        title: product.title,
        description: product.description,
        images: product.images || [],
        originalPrice: basePrice, // Always show base price as original
        discountPercentage: totalDiscountPercentageRaw, // Total discount percentage (not rounded here)
        promotionalDiscountPercentage: promotionalDiscount, // Promotional discount only (e.g., 2%)
        discountedPrice: Math.round(finalDiscountedPrice * 100) / 100, // Round to 2 decimals
        savings: Math.round(savings * 100) / 100, // Round to 2 decimals
        vendor: {
          id: vendorId,
          name: vendorName,
        },
        category: product.category,
        availability: product.availability,
      } as ProductWithDiscount;
    } catch (error) {
      console.error('Error fetching promotional product:', error);
      throw new Error(
        `Failed to fetch promotional product: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Checks if a promotional event is currently active
   * @param event - The promotional event to check
   * @returns Boolean indicating if promotion is active
   */
  static isPromotionActive(event: PromotionalEvent): boolean {
    const now = new Date();
    const startDate = toDate(event.startDate);
    const endDate = toDate(event.endDate);

    return now >= startDate && now <= endDate && event.isPublished;
  }

  /**
   * Calculates time remaining until promotion ends
   * @param endDate - End date of the promotion
   * @returns Object with days, hours, minutes, seconds, and isExpired flag
   */
  static calculateTimeRemaining(endDate: Date): CountdownValues {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return {
      days,
      hours,
      minutes,
      seconds,
      isExpired: false,
    };
  }

  /**
   * Gets all active promotional events
   * @returns Promise resolving to array of active promotional events
   */
  static async getActivePromotionalEvents(): Promise<PromotionalEvent[]> {
    try {
      const eventsRef = collection(db, 'promotionalEvents');
      const q = query(eventsRef, where('isPublished', '==', true));
      const querySnapshot = await getDocs(q);

      const events: PromotionalEvent[] = [];
      const now = new Date();

      querySnapshot.forEach((doc) => {
        const event = {
          id: doc.id,
          ...doc.data(),
        } as PromotionalEvent;

        // Check if event is within date range
        if (this.isPromotionActive(event)) {
          events.push(event);
        }
      });

      return events;
    } catch (error) {
      console.error('Error fetching active promotional events:', error);
      throw new Error(
        `Failed to fetch active promotional events: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Checks if a specific product is in any active promotion
   * @param productId - ID of the product to check
   * @returns Promise resolving to promotional event if product is in promotion, null otherwise
   */
  static async getActivePromotionForProduct(
    productId: string
  ): Promise<PromotionalEvent | null> {
    try {
      const activeEvents = await this.getActivePromotionalEvents();

      for (const event of activeEvents) {
        const hasProduct = event.products.some((p) => p.productId === productId);
        if (hasProduct) {
          return event;
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking product promotion:', error);
      return null;
    }
  }

  /**
   * Gets discount information for a product if it's in an active promotion
   * @param productId - ID of the product
   * @returns Promise resolving to discount percentage or null
   */
  static async getProductDiscount(productId: string): Promise<number | null> {
    try {
      const event = await this.getActivePromotionForProduct(productId);

      if (!event) {
        return null;
      }

      const productDiscount = event.products.find(
        (p) => p.productId === productId
      );

      return productDiscount?.discountPercentage || null;
    } catch (error) {
      console.error('Error getting product discount:', error);
      return null;
    }
  }
}
