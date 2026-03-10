import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CollectionWaitlist } from '@/types/vendor-waitlist';

const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'collection_waitlists',
  WAITLIST_SUBSCRIPTIONS: 'waitlist_subscriptions'
} as const;

// GET /api/vendor/waitlists/[id] - Get collection by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    console.log('Individual waitlist API called with id:', id, 'vendorId:', vendorId);

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const doc = await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = doc.data() as CollectionWaitlist;

    // Verify ownership
    if (collection.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this collection.' },
        { status: 403 }
      );
    }

    const result: CollectionWaitlist = {
      id: doc.id,
      ...collection
    };

    console.log('Returning collection:', result.name);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching collection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/vendor/waitlists/[id] - Update collection
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { vendorId } = body;

    console.log('Update waitlist API called with id:', id, 'vendorId:', vendorId);

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Check if collection exists
    const existingDoc = await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .doc(id)
      .get();

    if (!existingDoc.exists) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const existingCollection = existingDoc.data() as CollectionWaitlist;

    // Verify ownership
    if (existingCollection.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this collection.' },
        { status: 403 }
      );
    }

    // Prevent editing published collections' minimum subscribers
    if (existingCollection.status === 'published' && body.minSubscribers !== undefined) {
      return NextResponse.json(
        { error: 'Cannot edit minimum subscribers for published collections' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<CollectionWaitlist> = {
      updatedAt: Timestamp.now()
    };

    // Update fields if provided
    if (body.name) {
      updateData.name = body.name.trim();
      updateData.slug = generateSlug(body.name);
    }
    if (body.description) updateData.description = body.description.trim();
    if (body.imageUrl) updateData.imageUrl = body.imageUrl.trim();
    if (body.pairedProducts) updateData.pairedProducts = body.pairedProducts;
    if (body.featuredProducts) updateData.featuredProducts = body.featuredProducts;
    if (body.minSubscribers !== undefined && existingCollection.status === 'draft') {
      updateData.minSubscribers = body.minSubscribers;
    }

    // Update in Firestore
    await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .doc(id)
      .update(updateData);

    // Return updated collection
    const updatedCollection = { ...existingCollection, ...updateData };
    console.log('Collection updated successfully');
    return NextResponse.json({
      success: true,
      data: updatedCollection
    });
  } catch (error) {
    console.error('Error updating collection:', error);
    return NextResponse.json(
      { error: 'Failed to update collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/vendor/waitlists/[id] - Delete collection
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    console.log('Delete waitlist API called with id:', id, 'vendorId:', vendorId);

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    // Check if collection exists
    const doc = await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .doc(id)
      .get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Collection not found' },
        { status: 404 }
      );
    }

    const collection = doc.data() as CollectionWaitlist;

    // Verify ownership
    if (collection.vendorId !== vendorId) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have access to this collection.' },
        { status: 403 }
      );
    }

    // Prevent deleting published collections
    if (collection.status === 'published') {
      return NextResponse.json(
        { error: 'Cannot delete published collections. Archive them instead.' },
        { status: 400 }
      );
    }

    // Delete all subscriptions first
    const subscriptionsSnapshot = await adminDb
      .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
      .where('collectionId', '==', id)
      .get();

    const batch = adminDb.batch();
    subscriptionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Delete the collection
    batch.delete(adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(id));

    await batch.commit();

    console.log('Collection deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting collection:', error);
    return NextResponse.json(
      { error: 'Failed to delete collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}