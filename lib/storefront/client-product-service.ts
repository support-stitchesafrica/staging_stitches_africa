/**
 * Client-side Product Service for Storefront
 * Handles fetching and displaying vendor products in storefronts via API calls
 * 
 * Validates: Requirements 7.1, 7.2
 */

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

    const params = new URLSearchParams({
      vendorId,
      action: 'products',
      limit: limit.toString(),
      offset: offset.toString(),
      sortField: sort.field,
      sortDirection: sort.direction,
    });

    // Add filters to params
    if (filters.category) {
      params.append('category', filters.category);
    }
    if (filters.availability) {
      params.append('availability', filters.availability);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.priceRange) {
      params.append('priceMin', filters.priceRange.min.toString());
      params.append('priceMax', filters.priceRange.max.toString());
    }

    const response = await fetch(`/api/storefront/products?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
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
    const params = new URLSearchParams({
      vendorId,
      action: 'categories',
    });

    const response = await fetch(`/api/storefront/products?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.categories || [];
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
    const params = new URLSearchParams({
      vendorId,
      action: 'priceRange',
    });

    const response = await fetch(`/api/storefront/products?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.priceRange || { min: 0, max: 0 };
  } catch (error) {
    console.error('Error fetching vendor product price range:', error);
    return { min: 0, max: 0 };
  }
}