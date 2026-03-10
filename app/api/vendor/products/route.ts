import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ProductReference } from '@/types/vendor-waitlist';

const COLLECTIONS = {
  TAILOR_WORKS: 'tailor_works'
} as const;

// GET /api/vendor/products - Get vendor's products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    console.log('Vendor products API called with vendorId:', vendorId);

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Query products by vendor
    const snapshot = await adminDb
      .collection(COLLECTIONS.TAILOR_WORKS)
      .where('tailor_id', '==', vendorId)
      .orderBy('created_at', 'desc')
      .limit(100) // Limit to prevent large responses
      .get();

    console.log(`Found ${snapshot.size} products for vendor ${vendorId}`);

    const products: ProductReference[] = snapshot.docs.map(doc => {
      const data = doc.data();
      const product = {
        id: doc.id,
        name: data.title || data.name || 'Unnamed Product',
        images: data.images || [],
        price: data.price?.base || data.price || 0,
        vendorName: data.tailor_name || data.vendor_name || 'Unknown Vendor',
        category: data.category
      };
      console.log('Mapped product:', product);
      return product;
    });

    console.log('Returning products:', products.length);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching vendor products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}