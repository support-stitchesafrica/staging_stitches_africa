import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const type = searchParams.get('type') || '';

    // Get all tailor works using Admin SDK
    let query = adminDb.collection("staging_tailor_works");
    
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
      // Filter out disabled products (only if is_disabled is explicitly true)
      return product.is_disabled !== true;
    });

    // Apply filters
    if (category) {
      products = products.filter((product: any) => product.category === category);
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

    return NextResponse.json({
      success: true,
      data: products.length
    });
  } catch (error) {
    console.error('Error counting products:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to count products' },
      { status: 500 }
    );
  }
}