import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CollectionWaitlist, CreateCollectionForm } from '@/types/vendor-waitlist';

const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'collection_waitlists',
  TAILOR_WORKS: 'tailor_works'
} as const;

// GET /api/vendor/waitlists - Get vendor's collections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    console.log('Vendor waitlists API called with vendorId:', vendorId);

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    console.log('Querying collection_waitlists for vendorId:', vendorId);

    const snapshot = await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .where('vendorId', '==', vendorId)
      .get();

    console.log(`Found ${snapshot.size} collections for vendor ${vendorId}`);

    const collections: CollectionWaitlist[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CollectionWaitlist[];

    console.log('Returning collections:', collections.length);
    return NextResponse.json(collections);
  } catch (error) {
    console.error('Error fetching vendor collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/vendor/waitlists - Create new collection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, imageUrl, pairedProducts, featuredProducts, minSubscribers, vendorId } = body;

    // Validate required fields
    if (!vendorId || !name || !description || !imageUrl || minSubscribers === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate form data
    const validation = validateCollectionForm({
      name,
      description,
      imageUrl,
      pairedProducts: pairedProducts || [],
      featuredProducts: featuredProducts || [],
      minSubscribers
    });

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Verify products exist (only if products are provided)
    const pairedProductIds = (pairedProducts || []).flatMap((pair: any) => [
      pair.primaryProductId,
      pair.secondaryProductId
    ]);
    const allProductIds = [...pairedProductIds, ...(featuredProducts || [])];
    
    if (allProductIds.length > 0) {
      const verifiedIds = await verifyProducts(allProductIds);
      
      // Only check if we have some valid products when products are provided
      if (allProductIds.length > 0 && verifiedIds.length === 0) {
        return NextResponse.json(
          { error: 'No valid products found' },
          { status: 400 }
        );
      }
    }

    // Generate collection ID and slug
    const collectionId = adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc().id;
    const slug = generateSlug(name);
    const now = Timestamp.now();

    // Create collection object
    const collection: CollectionWaitlist = {
      id: collectionId,
      vendorId,
      name: name.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      pairedProducts: pairedProducts || [],
      featuredProducts: featuredProducts || [],
      minSubscribers,
      currentSubscribers: 0,
      status: 'draft',
      slug,
      createdAt: now,
      updatedAt: now
    };

    // Save to Firestore
    await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .doc(collectionId)
      .set(collection);

    return NextResponse.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}

// Helper functions
function validateCollectionForm(data: CreateCollectionForm): { valid: boolean; error?: string } {
  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    return { valid: false, error: 'Collection name is required' };
  }
  if (data.name.trim().length < 3) {
    return { valid: false, error: 'Collection name must be at least 3 characters' };
  }
  if (data.name.trim().length > 100) {
    return { valid: false, error: 'Collection name must be less than 100 characters' };
  }

  // Validate description
  if (!data.description || data.description.trim().length === 0) {
    return { valid: false, error: 'Description is required' };
  }
  if (data.description.trim().length < 10) {
    return { valid: false, error: 'Description must be at least 10 characters' };
  }
  if (data.description.trim().length > 500) {
    return { valid: false, error: 'Description must be less than 500 characters' };
  }

  // Validate image
  if (!data.imageUrl || data.imageUrl.trim().length === 0) {
    return { valid: false, error: 'Collection image is required' };
  }

  // Validate minimum subscribers
  if (data.minSubscribers < 1) {
    return { valid: false, error: 'Minimum subscribers must be at least 1' };
  }
  if (data.minSubscribers > 10000) {
    return { valid: false, error: 'Minimum subscribers cannot exceed 10,000' };
  }

  // Validate paired products (now optional)
  if (data.pairedProducts && data.pairedProducts.length > 0) {
    // If paired products are provided, validate them
    for (const pair of data.pairedProducts) {
      if (!pair.primaryProductId || !pair.secondaryProductId) {
        return { valid: false, error: 'Invalid product pair data' };
      }
    }
  }

  // Validate featured products (optional)
  if (data.featuredProducts && data.featuredProducts.length > 0) {
    // If featured products are provided, validate them
    for (const productId of data.featuredProducts) {
      if (!productId || typeof productId !== 'string') {
        return { valid: false, error: 'Invalid featured product ID' };
      }
    }
  }

  // At least one product (paired or featured) should be provided - MADE OPTIONAL
  const hasPairedProducts = data.pairedProducts && data.pairedProducts.length > 0;
  const hasFeaturedProducts = data.featuredProducts && data.featuredProducts.length > 0;
  
  // Collections can now be created without products (they can be added later)
  // if (!hasPairedProducts && !hasFeaturedProducts) {
  //   return { valid: false, error: 'At least one product (featured or paired) is required' };
  // }

  return { valid: true };
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

async function verifyProducts(productIds: string[]): Promise<string[]> {
  const validIds: string[] = [];
  
  // Check products in batches of 10 (Firestore limit)
  for (let i = 0; i < productIds.length; i += 10) {
    const batch = productIds.slice(i, i + 10);
    const snapshot = await adminDb
      .collection(COLLECTIONS.TAILOR_WORKS)
      .where('__name__', 'in', batch)
      .get();
    
    snapshot.docs.forEach(doc => {
      validIds.push(doc.id);
    });
  }

  return validIds;
}