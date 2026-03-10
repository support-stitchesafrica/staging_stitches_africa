/**
 * Product Service for Storefront
 * Handles fetching and displaying vendor products in storefronts
 * 
 * Validates: Requirements 7.1, 7.2
 */

import { adminDb } from '@/lib/firebase-admin';
import { Product } from '@/types';

export interface ProductFilters {
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: 'in_stock' | 'pre_order' | 'out_of_stock';
  search?: string;
}

export interface ProductSortOptions {
  field: 'price' | 'title' | 'createdAt' | 'featured';
  direction: 'asc' | 'desc';
}

/**
 * Fetches products for a vendor to display in their storefront
 */
export async function getVendorProducts(
  vendorId: string,
  options: {
    limit?: number;
    offset?: number;
    filters?: ProductFilters;
    sort?: ProductSortOptions;
  } = {}
): Promise<{ products: Product[]; total: number }> {
  try {
    const { limit = 12, offset = 0, filters = {}, sort = { field: 'createdAt', direction: 'desc' } } = options;

    // Build the base query
    let query = adminDb
      .collection('tailor_works')
      .where('tailor_id', '==', vendorId)
      .where('status', '==', 'verified')
      .where('isPublished', '==', true);

    // Apply filters
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }

    if (filters.availability) {
      query = query.where('availability', '==', filters.availability);
    }

    // Apply sorting
    query = query.orderBy(sort.field, sort.direction);

    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const productsSnapshot = await query
      .offset(offset)
      .limit(limit)
      .get();

    const products: Product[] = [];

    for (const doc of productsSnapshot.docs) {
      const data = doc.data();
      
      // Apply client-side filters that can't be done in Firestore
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const title = (data.title || '').toLowerCase();
        const description = (data.description || '').toLowerCase();
        const tags = (data.tags || []).join(' ').toLowerCase();
        
        if (!title.includes(searchTerm) && 
            !description.includes(searchTerm) && 
            !tags.includes(searchTerm)) {
          continue;
        }
      }

      if (filters.priceRange) {
        const price = data.price?.base || 0;
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          continue;
        }
      }

      const product: Product = {
        product_id: doc.id,
        title: data.title || '',
        description: data.description || '',
        type: data.type || 'ready-to-wear',
        category: data.category || '',
        availability: data.availability || 'in_stock',
        status: data.status || 'verified',
        price: {
          base: data.price?.base || 0,
          currency: data.price?.currency || 'NGN',
          discount: data.price?.discount || 0,
        },
        discount: data.discount || 0,
        deliveryTimeline: data.deliveryTimeline || '',
        returnPolicy: data.returnPolicy || '',
        rtwOptions: data.rtwOptions,
        bespokeOptions: data.bespokeOptions,
        shipping: data.shipping,
        userSizes: data.userSizes,
        userCustomSizes: data.userCustomSizes,
        customSizes: data.customSizes,
        wear_category: data.wear_category,
        wear_quantity: data.wear_quantity,
        images: data.images || [],
        thumbnail: data.thumbnail,
        videoUrl: data.videoUrl,
        tailor_id: data.tailor_id || vendorId,
        tailor: data.tailor || '',
        vendor: data.vendor,
        tags: data.tags || [],
        keywords: data.keywords,
        featured: data.featured || false,
        isNewArrival: data.isNewArrival || false,
        isBestSeller: data.isBestSeller || false,
        slug: data.slug,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.created_at?.toDate?.()?.toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updated_at?.toDate?.()?.toISOString(),
        created_at: data.created_at,
        updated_at: data.updated_at,
        isPublished: data.isPublished ?? true,
      };

      products.push(product);
    }

    return { products, total };
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return { products: [], total: 0 };
  }
}

/**
 * Gets unique categories for a vendor's products
 */
export async function getVendorProductCategories(vendorId: string): Promise<string[]> {
  try {
    const snapshot = await adminDb
      .collection('tailor_works')
      .where('tailor_id', '==', vendorId)
      .where('status', '==', 'verified')
      .where('isPublished', '==', true)
      .get();

    const categories = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category && typeof category === 'string') {
        categories.add(category);
      }
    });

    return Array.from(categories).sort();
  } catch (error) {
    console.error('Error fetching vendor product categories:', error);
    return [];
  }
}

/**
 * Gets price range for a vendor's products
 */
export async function getVendorProductPriceRange(vendorId: string): Promise<{ min: number; max: number }> {
  try {
    const snapshot = await adminDb
      .collection('tailor_works')
      .where('tailor_id', '==', vendorId)
      .where('status', '==', 'verified')
      .where('isPublished', '==', true)
      .get();

    let min = Infinity;
    let max = 0;

    snapshot.docs.forEach(doc => {
      const price = doc.data().price?.base || 0;
      if (price > 0) {
        min = Math.min(min, price);
        max = Math.max(max, price);
      }
    });

    return {
      min: min === Infinity ? 0 : min,
      max,
    };
  } catch (error) {
    console.error('Error fetching vendor product price range:', error);
    return { min: 0, max: 0 };
  }
}