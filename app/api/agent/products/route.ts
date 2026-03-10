import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    // Get all tailor works using Admin SDK with optimized query
    let query = adminDb.collection("staging_tailor_works").select(
      'title', 'description', 'tailor', 'category', 'status', 
      'type', 'price', 'is_disabled', 'created_at', 'updated_at',
      'images', 'wear_quantity', 'wearQuantity', 'discount'
    );
    
    const snapshot = await query.get();
    
    let products = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_at: data.updated_at?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    }).filter((product: any) => {
      return product.is_disabled !== true;
    });

    // Apply additional filters
    if (category) {
      products = products.filter((product: any) => product.category === category);
    }
    if (status) {
      products = products.filter((product: any) => product.status === status);
    }
    if (type) {
      products = products.filter((product: any) => product.type === type);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter((product: any) => 
        product.title?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.tailor?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedProducts = products.slice(startIndex, endIndex);

    const response = NextResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page,
        pageSize,
        total: products.length,
        totalPages: Math.ceil(products.length / pageSize),
        hasNext: page * pageSize < products.length,
        hasPrev: page > 1
      }
    });
    
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    response.headers.set('CDN-Cache-Control', 'max-age=30');
    
    return response;
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Here you would add the product creation logic
    // For now, we'll return a placeholder response
    
    return NextResponse.json({
      success: true,
      message: 'Product creation endpoint - implementation needed'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create product' },
      { status: 500 }
    );
  }
}