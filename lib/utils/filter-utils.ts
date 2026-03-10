/**
 * Utility functions for product filtering and URL parameter parsing
 */

import { Product } from '@/types';

export interface FilterState {
    type: 'all' | 'bespoke' | 'ready-to-wear';
    category: string;
    vendor: string;
    priceRange: [number, number];
    availability: 'all' | 'in_stock' | 'pre_order' | 'out_of_stock';
    sortBy: 'newest' | 'price_low' | 'price_high' | 'discount';
}

/**
 * Parse URL search parameters into filter state
 */
export const parseUrlFilters = (searchParams: URLSearchParams): FilterState => {
    const typeParam = searchParams.get('type');
    const categoryParam = searchParams.get('category');
    const vendorParam = searchParams.get('vendor');
    const availabilityParam = searchParams.get('availability');
    const sortParam = searchParams.get('sort');
    
    return {
        type: (typeParam === 'bespoke' || typeParam === 'ready-to-wear') ? typeParam : 'all',
        category: categoryParam || 'all',
        vendor: vendorParam || 'all',
        priceRange: [0, 10000],
        availability: (availabilityParam === 'in_stock' || availabilityParam === 'pre_order' || availabilityParam === 'out_of_stock') 
            ? availabilityParam : 'all',
        sortBy: (sortParam === 'price_low' || sortParam === 'price_high' || sortParam === 'discount') 
            ? sortParam : 'newest'
    };
};

/**
 * Apply type-specific filtering to products array
 * Ensures strict separation between bespoke and ready-to-wear products
 */
export const applyTypeFilter = (products: Product[], type: string): Product[] => {
    if (type === 'all') {
        return products;
    }
    
    return products.filter(product => {
        const productType = product.type;
        const isMatch = productType === type;
        
        // Log filtering for debugging
        console.log(`Filter: Product ${product.product_id} type: ${productType}, filter: ${type}, match: ${isMatch}`);
        
        return isMatch;
    });
};

/**
 * Apply category filtering to products array
 */
export const applyCategoryFilter = (products: Product[], category: string): Product[] => {
    if (category === 'all') {
        return products;
    }
    
    return products.filter(product => product.category === category);
};

/**
 * Apply vendor/brand filtering to products array
 * Standardized to handle multiple vendor data access patterns
 */
export const applyVendorFilter = (products: Product[], vendor: string): Product[] => {
    if (vendor === 'all') {
        return products;
    }
    
    return products.filter(product => {
        // Primary check: vendor object with id
        if (product.vendor?.id === vendor) {
            return true;
        }
        
        // Secondary check: vendor object with name (for legacy compatibility)
        if (product.vendor?.name === vendor) {
            return true;
        }
        
        // Fallback check: tailor_id field (for products without enriched vendor data)
        if (product.tailor_id === vendor) {
            return true;
        }
        
        // Additional fallback: tailor field (legacy support)
        if (product.tailor === vendor) {
            return true;
        }
        
        return false;
    });
};

import { calculateCustomerPrice } from '@/lib/priceUtils';

/**
 * Apply price range filtering to products array
 */
export const applyPriceFilter = (products: Product[], priceRange: [number, number]): Product[] => {
    return products.filter(product => {
        const basePrice = typeof product.price === 'number' ? product.price : product.price.base;
        // Platform commission is applied to base price
        const customerBase = calculateCustomerPrice(basePrice); // No userCountry in filter context, assumes defaults/generic
        
        const price = product.discount > 0
            ? customerBase * (1 - product.discount / 100)
            : customerBase;
        return price >= priceRange[0] && price <= priceRange[1];
    });
};

/**
 * Apply availability filtering to products array
 */
export const applyAvailabilityFilter = (products: Product[], availability: string): Product[] => {
    if (availability === 'all') {
        return products;
    }
    
    return products.filter(product => product.availability === availability);
};

/**
 * Sort products array based on sort criteria
 */
export const sortProducts = (products: Product[], sortBy: string): Product[] => {
    const sorted = [...products];
    
    sorted.sort((a, b) => {
        switch (sortBy) {
            case 'price_low':
                const aPriceBase = typeof a.price === 'number' ? a.price : a.price.base;
                const bPriceBase = typeof b.price === 'number' ? b.price : b.price.base;
                return aPriceBase - bPriceBase;
            case 'price_high':
                const aPriceHigh = typeof a.price === 'number' ? a.price : a.price.base;
                const bPriceHigh = typeof b.price === 'number' ? b.price : b.price.base;
                return bPriceHigh - aPriceHigh;
            case 'discount':
                return b.discount - a.discount;
            case 'newest':
            default:
                return 0; // Would need createdAt field for proper sorting
        }
    });
    
    return sorted;
};

/**
 * Apply all filters to products array in the correct order
 * Enhanced to ensure proper filter combination and logging
 */
export const applyAllFilters = (products: Product[], filters: FilterState): Product[] => {
    let filtered = [...products];
    const originalCount = filtered.length;
    
    console.log(`Starting filter application with ${originalCount} products`);
    console.log('Filter state:', filters);
    
    // Apply filters in order with logging
    filtered = applyTypeFilter(filtered, filters.type);
    console.log(`After type filter (${filters.type}): ${filtered.length} products`);
    
    filtered = applyCategoryFilter(filtered, filters.category);
    console.log(`After category filter (${filters.category}): ${filtered.length} products`);
    
    filtered = applyVendorFilter(filtered, filters.vendor);
    console.log(`After vendor filter (${filters.vendor}): ${filtered.length} products`);
    
    filtered = applyPriceFilter(filtered, filters.priceRange);
    console.log(`After price filter (${filters.priceRange}): ${filtered.length} products`);
    
    filtered = applyAvailabilityFilter(filtered, filters.availability);
    console.log(`After availability filter (${filters.availability}): ${filtered.length} products`);
    
    // Sort the filtered results
    filtered = sortProducts(filtered, filters.sortBy);
    console.log(`After sorting (${filters.sortBy}): ${filtered.length} products`);
    
    console.log(`Filter application complete: ${filtered.length} products (from ${originalCount} total)`);
    
    return filtered;
};

/**
 * Validate that a product type is one of the expected values
 */
export const isValidProductType = (type: string): type is 'bespoke' | 'ready-to-wear' => {
    return type === 'bespoke' || type === 'ready-to-wear';
};

/**
 * Normalize vendor data for consistent access patterns
 * Ensures all products have a standardized vendor object
 */
export const normalizeVendorData = (product: Product): Product => {
    // If vendor object already exists and is complete, return as-is
    if (product.vendor?.id && product.vendor?.name) {
        return product;
    }
    
    // Create or enhance vendor object from available data
    const normalizedVendor = {
        id: product.vendor?.id || product.tailor_id || 'unknown',
        name: product.vendor?.name || product.tailor || `Tailor ${(product.tailor_id || 'unknown').slice(-6)}`,
        logo: product.vendor?.logo,
        email: product.vendor?.email,
        phone: product.vendor?.phone,
        location: product.vendor?.location
    };
    
    return {
        ...product,
        vendor: normalizedVendor
    };
};

/**
 * Normalize vendor data for an array of products
 */
export const normalizeProductsVendorData = (products: Product[]): Product[] => {
    return products.map(normalizeVendorData);
};

/**
 * Get unique categories from products array
 */
export const getUniqueCategories = (products: Product[]): string[] => {
    return Array.from(new Set(products.map(p => p.category)));
};

/**
 * Get unique vendors from products array
 * Standardized to handle multiple vendor data access patterns
 */
export const getUniqueVendors = (products: Product[]): Array<{id: string, name: string}> => {
    const vendorMap = new Map();
    
    console.log(`getUniqueVendors: Processing ${products.length} products`);
    
    products.forEach((product, index) => {
        let vendorId: string | undefined;
        let vendorName: string | undefined;
        
        // Primary: Use vendor object if available
        if (product.vendor?.id && product.vendor?.name) {
            vendorId = product.vendor.id;
            vendorName = product.vendor.name;
            console.log(`Product ${index}: Using vendor object - ID: ${vendorId}, Name: ${vendorName}`);
        }
        // Fallback 1: Use tailor_id and tailor fields
        else if (product.tailor_id && product.tailor) {
            vendorId = product.tailor_id;
            vendorName = product.tailor;
            console.log(`Product ${index}: Using tailor fields - ID: ${vendorId}, Name: ${vendorName}`);
        }
        // Fallback 2: Use tailor_id only (create name from id)
        else if (product.tailor_id) {
            vendorId = product.tailor_id;
            vendorName = `Tailor ${product.tailor_id.slice(-6)}`; // Use last 6 chars of ID
            console.log(`Product ${index}: Using tailor_id only - ID: ${vendorId}, Name: ${vendorName}`);
        }
        // Fallback 3: Use tailor field only (create id from name)
        else if (product.tailor) {
            vendorId = product.tailor.toLowerCase().replace(/\s+/g, '-');
            vendorName = product.tailor;
            console.log(`Product ${index}: Using tailor name only - ID: ${vendorId}, Name: ${vendorName}`);
        }
        else {
            console.log(`Product ${index} (${product.product_id}): No vendor data found`);
        }
        
        // Add to map if we have both id and name
        if (vendorId && vendorName && !vendorMap.has(vendorId)) {
            vendorMap.set(vendorId, {
                id: vendorId,
                name: vendorName
            });
        }
    });
    
    const vendors = Array.from(vendorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    console.log(`getUniqueVendors: Found ${vendors.length} unique vendors:`, vendors);
    
    return vendors;
};
/**
 
* Debug function to analyze vendor data consistency across products
 */
export const analyzeVendorData = (products: Product[]): {
    totalProducts: number;
    productsWithVendor: number;
    productsWithTailorId: number;
    productsWithTailorName: number;
    uniqueVendorIds: string[];
    vendorDataIssues: string[];
} => {
    const analysis = {
        totalProducts: products.length,
        productsWithVendor: 0,
        productsWithTailorId: 0,
        productsWithTailorName: 0,
        uniqueVendorIds: [] as string[],
        vendorDataIssues: [] as string[]
    };
    
    const vendorIds = new Set<string>();
    
    products.forEach((product, index) => {
        if (product.vendor?.id) {
            analysis.productsWithVendor++;
            vendorIds.add(product.vendor.id);
        }
        
        if (product.tailor_id) {
            analysis.productsWithTailorId++;
            vendorIds.add(product.tailor_id);
        }
        
        if (product.tailor) {
            analysis.productsWithTailorName++;
        }
        
        // Check for data consistency issues
        if (!product.vendor?.id && !product.tailor_id) {
            analysis.vendorDataIssues.push(`Product ${index} (${product.product_id}) has no vendor ID or tailor ID`);
        }
        
        if (product.vendor?.id && product.tailor_id && product.vendor.id !== product.tailor_id) {
            analysis.vendorDataIssues.push(`Product ${index} (${product.product_id}) has mismatched vendor.id and tailor_id`);
        }
    });
    
    analysis.uniqueVendorIds = Array.from(vendorIds).sort();
    
    return analysis;
};

/**
 * Create a default filter state
 */
export const createDefaultFilterState = (): FilterState => ({
    type: 'all',
    category: 'all',
    vendor: 'all',
    priceRange: [0, 10000],
    availability: 'all',
    sortBy: 'newest'
});

/**
 * Check if filters have any active (non-default) values
 */
export const hasActiveFilters = (filters: FilterState): boolean => {
    const defaultFilters = createDefaultFilterState();
    
    return (
        filters.type !== defaultFilters.type ||
        filters.category !== defaultFilters.category ||
        filters.vendor !== defaultFilters.vendor ||
        filters.availability !== defaultFilters.availability ||
        filters.priceRange[0] !== defaultFilters.priceRange[0] ||
        filters.priceRange[1] !== defaultFilters.priceRange[1] ||
        filters.sortBy !== defaultFilters.sortBy
    );
};

/**
 * Validate filter state and provide fallbacks for invalid values
 */
export const validateFilterState = (filters: Partial<FilterState>): FilterState => {
    const defaultFilters = createDefaultFilterState();
    
    return {
        type: isValidProductType(filters.type || '') ? filters.type as 'bespoke' | 'ready-to-wear' : defaultFilters.type,
        category: typeof filters.category === 'string' ? filters.category : defaultFilters.category,
        vendor: typeof filters.vendor === 'string' ? filters.vendor : defaultFilters.vendor,
        priceRange: Array.isArray(filters.priceRange) && filters.priceRange.length === 2 
            ? [Math.max(0, filters.priceRange[0]), Math.max(filters.priceRange[0], filters.priceRange[1])]
            : defaultFilters.priceRange,
        availability: ['all', 'in_stock', 'pre_order', 'out_of_stock'].includes(filters.availability || '') 
            ? filters.availability as FilterState['availability'] 
            : defaultFilters.availability,
        sortBy: ['newest', 'price_low', 'price_high', 'discount'].includes(filters.sortBy || '')
            ? filters.sortBy as FilterState['sortBy']
            : defaultFilters.sortBy
    };
};