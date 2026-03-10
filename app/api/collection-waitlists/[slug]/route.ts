import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CollectionWaitlist, ProductReference } from '@/types/vendor-waitlist';

const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'collection_waitlists',
  TAILOR_WORKS: 'tailor_works'
} as const;

// GET /api/collection-waitlists/[slug] - Get published collection by slug
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    console.log('Public collection API called with slug:', slug);

    // Find collection by slug
    const snapshot = await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const doc = snapshot.docs[0];
    const collection = {
      id: doc.id,
      ...doc.data()
    } as CollectionWaitlist;

    // Get product details if there are any
    let products: ProductReference[] = [];
    
    const allProductIds = [
      ...collection.pairedProducts.flatMap(pair => [pair.primaryProductId, pair.secondaryProductId]),
      ...(collection.featuredProducts || [])
    ];

    if (allProductIds.length > 0) {
      // Remove duplicates
      const uniqueProductIds = [...new Set(allProductIds)];
      
      // Get products in batches of 10 (Firestore limit)
      for (let i = 0; i < uniqueProductIds.length; i += 10) {
        const batch = uniqueProductIds.slice(i, i + 10);
        const productSnapshot = await adminDb
          .collection(COLLECTIONS.TAILOR_WORKS)
          .where('__name__', 'in', batch)
          .get();
        
        const batchProducts = productSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.title || data.name || 'Unnamed Product',
            images: data.images || [],
            price: data.price?.base || data.price || 0,
            vendorName: data.tailor_name || data.vendor_name || 'Unknown Vendor',
            category: data.category
          };
        });
        
        products.push(...batchProducts);
      }
    }

    console.log('Returning collection:', collection.name, 'with', products.length, 'products');
    
    return NextResponse.json({
      collection,
      products
    });
  } catch (error) {
    console.error('Error fetching public collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}