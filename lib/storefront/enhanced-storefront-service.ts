/**
 * Enhanced Storefront Service
 * Provides enhanced product sections for storefronts
 */

export interface EnhancedProductSection {
  id: string;
  title: string;
  products: any[];
  type: 'new-arrivals' | 'best-selling' | 'promotions' | 'all';
}

export interface EnhancedStorefrontData {
  sections: EnhancedProductSection[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export async function getEnhancedStorefrontData(
  vendorId: string,
  page: number = 1
): Promise<EnhancedStorefrontData> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Fetch all sections in parallel
    const [newArrivalsRes, bestSellingRes, promotionsRes, allProductsRes] = await Promise.all([
      fetch(`${baseUrl}/api/storefront/enhanced-products?vendorId=${vendorId}&section=new-arrivals&limit=6`),
      fetch(`${baseUrl}/api/storefront/enhanced-products?vendorId=${vendorId}&section=best-selling&limit=6`),
      fetch(`${baseUrl}/api/storefront/enhanced-products?vendorId=${vendorId}&section=promotions&limit=4`),
      fetch(`${baseUrl}/api/storefront/enhanced-products?vendorId=${vendorId}&section=all&limit=12&page=${page}`)
    ]);

    const sections: EnhancedProductSection[] = [];
    let pagination;

    // Process new arrivals
    if (newArrivalsRes.ok) {
      const data = await newArrivalsRes.json();
      if (data.success && data.products.length > 0) {
        sections.push({
          id: 'new-arrivals',
          title: '✨ New Arrivals',
          products: data.products,
          type: 'new-arrivals'
        });
      }
    }

    // Process promotions
    if (promotionsRes.ok) {
      const data = await promotionsRes.json();
      if (data.success && data.products.length > 0) {
        sections.push({
          id: 'promotions',
          title: '🔥 Special Offers',
          products: data.products,
          type: 'promotions'
        });
      }
    }

    // Process best selling
    if (bestSellingRes.ok) {
      const data = await bestSellingRes.json();
      if (data.success && data.products.length > 0) {
        sections.push({
          id: 'best-selling',
          title: '🏆 Best Sellers',
          products: data.products,
          type: 'best-selling'
        });
      }
    }

    // Process all products
    if (allProductsRes.ok) {
      const data = await allProductsRes.json();
      if (data.success) {
        sections.push({
          id: 'all-products',
          title: 'All Products',
          products: data.products,
          type: 'all'
        });
        pagination = data.pagination;
      }
    }

    return {
      sections,
      pagination
    };

  } catch (error) {
    console.error('Error fetching enhanced storefront data:', error);
    return {
      sections: []
    };
  }
}

export async function trackProductView(productId: string): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    await fetch(`${baseUrl}/api/storefront/enhanced-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    });
  } catch (error) {
    console.error('Error tracking product view:', error);
  }
}