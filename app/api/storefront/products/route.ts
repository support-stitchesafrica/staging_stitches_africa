import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const action = searchParams.get('action') || 'products';
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortField = searchParams.get('sortField') || 'createdAt';
    const sortDirection = searchParams.get('sortDirection') || 'desc';
    const category = searchParams.get('category');
    const availability = searchParams.get('availability');
    const search = searchParams.get('search');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Handle different actions
    switch (action) {
      case 'categories':
        return await getVendorCategories(vendorId);
      case 'priceRange':
        return await getVendorPriceRange(vendorId);
      case 'products':
      default:
        return await getVendorProducts(vendorId, {
          limit,
          offset,
          sortField,
          sortDirection,
          category,
          availability,
          search,
          priceMin: priceMin ? parseFloat(priceMin) : undefined,
          priceMax: priceMax ? parseFloat(priceMax) : undefined,
        });
    }
  } catch (error) {
    console.error('Error in storefront products API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getVendorProducts(vendorId: string, options: any) {
  try {
    // Fetch from tailor_works collection for real vendor products
    let query = adminDb
      .collection("staging_tailor_works")
      .where('tailor_id', '==', vendorId);

    // Apply filters
    if (options.category) {
      query = query.where('category', '==', options.category);
    }

    // Get all matching products first (for total count and filtering)
    const allProductsSnapshot = await query.get();
    let allProducts = allProductsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        product_id: doc.id,
        title: data.title || 'Untitled Product',
        description: data.description || 'No description available',
        category: data.category || 'Fashion',
        price: {
          base: data.price?.base || data.price || 0,
          currency: data.price?.currency || 'USD',
          discount: data.price?.discount || 0
        },
        discount: data.discount || 0,
        availability: data.availability || 'in_stock',
        images: data.images || [],
        thumbnail: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
        featured: data.featured || false,
        isNewArrival: data.isNewArrival || false,
        isBestSeller: data.isBestSeller || false,
        tailor_id: data.tailor_id,
        vendor_id: data.tailor_id,
        createdAt: data.createdAt || data.created_at,
        updatedAt: data.updatedAt || data.updated_at,
        tags: data.tags || [],
        type: data.type || 'ready-to-wear',
        status: data.status || 'verified'
      };
    }) as any[];

    // Apply client-side filters that can't be done in Firestore
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      allProducts = allProducts.filter(product => 
        (product.title || product.name || '').toLowerCase().includes(searchTerm) ||
        (product.description || '').toLowerCase().includes(searchTerm)
      );
    }

    if (options.priceMin !== undefined || options.priceMax !== undefined) {
      allProducts = allProducts.filter(product => {
        const price = typeof product.price === 'number' ? product.price : product.price?.base || product.price?.amount || 0;
        if (options.priceMin !== undefined && price < options.priceMin) return false;
        if (options.priceMax !== undefined && price > options.priceMax) return false;
        return true;
      });
    }

    // Apply sorting
    allProducts.sort((a, b) => {
      let aValue, bValue;
      
      switch (options.sortField) {
        case 'price':
          aValue = typeof a.price === 'number' ? a.price : a.price?.base || a.price?.amount || 0;
          bValue = typeof b.price === 'number' ? b.price : b.price?.base || b.price?.amount || 0;
          break;
        case 'title':
          aValue = (a.title || a.name || '').toLowerCase();
          bValue = (b.title || b.name || '').toLowerCase();
          break;
        case 'createdAt':
          aValue = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          bValue = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          break;
        case 'featured':
          aValue = a.featured ? 1 : 0;
          bValue = b.featured ? 1 : 0;
          break;
        default:
          aValue = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          bValue = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
      }

      if (options.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const total = allProducts.length;
    const products = allProducts.slice(options.offset, options.offset + options.limit);

    return NextResponse.json({
      success: true,
      products,
      total
    });
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

async function getVendorCategories(vendorId: string) {
  try {
    const productsSnapshot = await adminDb
      .collection("staging_tailor_works")
      .where('tailor_id', '==', vendorId)
      .get();

    const categories = new Set<string>();
    productsSnapshot.docs.forEach(doc => {
      const category = doc.data().category;
      if (category) {
        categories.add(category);
      }
    });

    return NextResponse.json({
      success: true,
      categories: Array.from(categories).sort()
    });
  } catch (error) {
    console.error('Error fetching vendor categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

async function getVendorPriceRange(vendorId: string) {
  try {
    const productsSnapshot = await adminDb
      .collection("staging_tailor_works")
      .where('tailor_id', '==', vendorId)
      .get();

    let min = Infinity;
    let max = 0;

    productsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const price = typeof data.price === 'number' ? data.price : data.price?.base || data.price?.amount || 0;
      if (price > 0) {
        min = Math.min(min, price);
        max = Math.max(max, price);
      }
    });

    if (min === Infinity) {
      min = 0;
    }

    return NextResponse.json({
      success: true,
      priceRange: { min, max }
    });
  } catch (error) {
    console.error('Error fetching vendor price range:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch price range' },
      { status: 500 }
    );
  }
}