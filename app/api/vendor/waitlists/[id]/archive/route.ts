import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CollectionWaitlist } from '@/types/vendor-waitlist';

const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'collection_waitlists'
} as const;

// POST /api/vendor/waitlists/[id]/archive - Archive collection
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    console.log('Archive waitlist API called with id:', id, 'vendorId:', vendorId);

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

    // Check if collection can be archived
    if (collection.status === 'draft') {
      return NextResponse.json(
        { error: 'Draft collections cannot be archived. Delete them instead.' },
        { status: 400 }
      );
    }

    if (collection.status === 'archived') {
      return NextResponse.json(
        { error: 'Collection is already archived' },
        { status: 400 }
      );
    }

    // Update collection status
    const now = Timestamp.now();
    await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .doc(id)
      .update({
        status: 'archived',
        updatedAt: now
      });

    const updatedCollection: CollectionWaitlist = {
      ...collection,
      status: 'archived',
      updatedAt: now
    };

    console.log('Collection archived successfully');
    return NextResponse.json({
      success: true,
      data: updatedCollection,
      message: 'Collection archived successfully'
    });
  } catch (error) {
    console.error('Error archiving collection:', error);
    return NextResponse.json(
      { error: 'Failed to archive collection', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}