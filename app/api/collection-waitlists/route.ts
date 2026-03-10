import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { CollectionWaitlist } from '@/types/vendor-waitlist';

const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'collection_waitlists'
} as const;

// GET /api/collection-waitlists - Get all published collections
export async function GET(request: NextRequest) {
  try {
    console.log('Public collections API called');

    const snapshot = await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .where('status', '==', 'published')
      .orderBy('publishedAt', 'desc')
      .limit(20) // Limit to prevent large responses
      .get();

    console.log(`Found ${snapshot.size} published collections`);

    const collections: CollectionWaitlist[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CollectionWaitlist[];

    return NextResponse.json({
      collections,
      total: collections.length
    });
  } catch (error) {
    console.error('Error fetching published collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}