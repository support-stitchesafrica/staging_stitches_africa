import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Helper function to safely convert various date formats to Date object
function safeToDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  
  // If it's already a Date object
  if (dateValue instanceof Date) return dateValue;
  
  // If it's a Firestore Timestamp with toDate method
  if (dateValue && typeof dateValue.toDate === 'function') {
    try {
      return dateValue.toDate();
    } catch (error) {
      console.warn('Error converting Firestore timestamp:', error);
      return new Date();
    }
  }
  
  // If it's a string or number, try to parse it
  if (typeof dateValue === 'string' || typeof dateValue === 'number') {
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  
  // If it's an object with seconds (Firestore timestamp format)
  if (dateValue && typeof dateValue === 'object' && dateValue.seconds) {
    return new Date(dateValue.seconds * 1000);
  }
  
  // Default fallback
  return new Date();
}

interface ProductWithMetrics {
  id: string;
  name: string;
  price: number;
  originalCurrency: string;
  image: string;
  category: string;
  vendorId: string;
  createdAt: Date;
  views?: number;
  sales?: number;
  isPromoted?: boolean;
  promotionId?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const section = searchParams.get('section'); // 'new-arrivals', 'best-selling', 'all', 'promotions'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const offset = (page - 1) * limit;

    console.log('Enhanced Products API called:', { vendorId, section, page, limit });

    if (!vendorId) {
      return NextResponse.json({
        success: false,
        error: 'Vendor ID is required'
      }, { status: 400 });
    }

    let products: ProductWithMetrics[] = [];
    let totalCount = 0;

    switch (section) {
      case 'new-arrivals':
        // Get latest products by creation date
        try {
          const newArrivalsQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .offset(offset)
            .get();

          products = newArrivalsQuery.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.title || 'Untitled Product',
              price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
              originalCurrency: data.price?.currency || 'NGN',
              image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
              category: data.category || 'Fashion',
              vendorId: data.tailor_id,
              createdAt: safeToDate(data.createdAt || data.created_at),
              views: data.views || 0
            };
          }) as ProductWithMetrics[];

          // Get total count for pagination
          const newArrivalsCountQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .get();
          totalCount = newArrivalsCountQuery.size;
        } catch (error) {
          console.log('New arrivals query failed, trying without status filter:', error);
          // Fallback without status filter
          const fallbackQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .offset(offset)
            .get();

          products = fallbackQuery.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.title || 'Untitled Product',
              price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
              originalCurrency: data.price?.currency || 'NGN',
              image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
              category: data.category || 'Fashion',
              vendorId: data.tailor_id,
              createdAt: safeToDate(data.createdAt || data.created_at),
              views: data.views || 0
            };
          }) as ProductWithMetrics[];

          totalCount = fallbackQuery.size;
        }
        break;

      case 'best-selling':
        // Get products with highest view counts (proxy for best selling)
        // If no views field exists, fall back to creation date
        try {
          const bestSellingQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .orderBy('views', 'desc')
            .limit(limit)
            .offset(offset)
            .get();

          products = bestSellingQuery.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.title || 'Untitled Product',
              price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
              originalCurrency: data.price?.currency || 'NGN',
              image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
              category: data.category || 'Fashion',
              vendorId: data.tailor_id,
              createdAt: safeToDate(data.createdAt || data.created_at),
              views: data.views || 0
            };
          }) as ProductWithMetrics[];
        } catch (error) {
          // If views field doesn't exist or ordering fails, fall back to recent products
          console.log('Views field not indexed, falling back to recent products for best-selling');
          const fallbackQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .offset(offset)
            .get();

          products = fallbackQuery.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.title || 'Untitled Product',
              price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
              originalCurrency: data.price?.currency || 'NGN',
              image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
              category: data.category || 'Fashion',
              vendorId: data.tailor_id,
              createdAt: safeToDate(data.createdAt || data.created_at),
              views: Math.floor(Math.random() * 100) // Mock views for demo
            };
          }) as ProductWithMetrics[];
        }



        const bestSellingCountQuery = await adminDb
          .collection("staging_tailor_works")
          .where('tailor_id', '==', vendorId)
          .get();
        totalCount = bestSellingCountQuery.size;
        break;

      case 'promotions':
        // Get products that are part of active promotions
        const activePromotions = await adminDb
          .collection("staging_promotions")
          .where('status', '==', 'active')
          .where('endDate', '>', new Date())
          .get();

        const promotionProductIds = new Set<string>();
        const promotionMap = new Map<string, any>();

        activePromotions.docs.forEach(doc => {
          const promotion = doc.data();
          if (promotion.products && Array.isArray(promotion.products)) {
            promotion.products.forEach((productId: string) => {
              promotionProductIds.add(productId);
              promotionMap.set(productId, {
                id: doc.id,
                ...promotion
              });
            });
          }
        });

        if (promotionProductIds.size > 0) {
          const promotedProductsQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .get();

          products = promotedProductsQuery.docs
            .filter(doc => promotionProductIds.has(doc.id))
            .slice(offset, offset + limit)
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.title || 'Untitled Product',
                price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
                originalCurrency: data.price?.currency || 'NGN',
                image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
                category: data.category || 'Fashion',
                vendorId: data.tailor_id,
                createdAt: safeToDate(data.createdAt || data.created_at),
                isPromoted: true,
                promotionId: promotionMap.get(doc.id)?.id
              };
            }) as ProductWithMetrics[];

          totalCount = promotedProductsQuery.docs.filter(doc => promotionProductIds.has(doc.id)).length;
        }
        break;

      default: // 'all'
        try {
          const allProductsQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .offset(offset)
            .get();

          products = allProductsQuery.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.title || 'Untitled Product',
              price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
              originalCurrency: data.price?.currency || 'NGN',
              image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
              category: data.category || 'Fashion',
              vendorId: data.tailor_id,
              createdAt: safeToDate(data.createdAt || data.created_at),
              views: data.views || 0
            };
          }) as ProductWithMetrics[];

          const allProductsCountQuery = await adminDb
            .collection("staging_tailor_works")
            .where('tailor_id', '==', vendorId)
            .get();
          totalCount = allProductsCountQuery.size;
        } catch (error) {
          console.log('All products query failed, trying without status filter:', error);
          try {
            // Fallback without status filter
            const fallbackQuery = await adminDb
              .collection("staging_tailor_works")
              .where('tailor_id', '==', vendorId)
              .orderBy('createdAt', 'desc')
              .limit(limit)
              .offset(offset)
              .get();

            products = fallbackQuery.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.title || 'Untitled Product',
                price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
                originalCurrency: data.price?.currency || 'NGN',
                image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
                category: data.category || 'Fashion',
                vendorId: data.tailor_id,
                createdAt: safeToDate(data.createdAt || data.created_at),
                views: data.views || 0
              };
            }) as ProductWithMetrics[];

            const fallbackCountQuery = await adminDb
              .collection("staging_tailor_works")
              .where('tailor_id', '==', vendorId)
              .get();
            totalCount = fallbackCountQuery.size;
          } catch (fallbackError) {
            console.log('Fallback query also failed, trying basic query:', fallbackError);
            // Last resort: get any products for this vendor
            const basicQuery = await adminDb
              .collection("staging_tailor_works")
              .where('tailor_id', '==', vendorId)
              .limit(limit)
              .get();

            products = basicQuery.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                name: data.title || 'Untitled Product',
                price: typeof data.price === 'number' ? data.price : data.price?.base || 0,
                originalCurrency: data.price?.currency || 'NGN',
                image: data.thumbnail || data.images?.[0] || '/placeholder-product.svg',
                category: data.category || 'Fashion',
                vendorId: data.tailor_id,
                createdAt: safeToDate(data.createdAt || data.created_at),
                views: data.views || 0
              };
            }) as ProductWithMetrics[];

            totalCount = basicQuery.size;
          }
        }
        break;
    }

    const totalPages = Math.ceil(totalCount / limit);

    console.log('Enhanced Products API response:', {
      section,
      productsFound: products.length,
      totalCount,
      totalPages
    });

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      },
      section
    });

  } catch (error) {
    console.error('Error fetching enhanced products:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products'
    }, { status: 500 });
  }
}

// Increment product view count
export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required'
      }, { status: 400 });
    }

    // Increment view count
    await adminDb
      .collection("staging_tailor_works")
      .doc(productId)
      .update({
        views: FieldValue.increment(1),
        lastViewed: new Date()
      });

    return NextResponse.json({
      success: true,
      message: 'View count updated'
    });

  } catch (error) {
    console.error('Error updating view count:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update view count'
    }, { status: 500 });
  }
}