import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { CollectionWaitlist } from '@/types/vendor-waitlist';

const COLLECTIONS = {
  COLLECTION_WAITLISTS: 'collection_waitlists',
  WAITLIST_SUBSCRIPTIONS: 'waitlist_subscriptions'
} as const;

// POST /api/collection-waitlists/[slug]/subscribe - Subscribe to waitlist
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();
    const { fullName, email, phoneNumber } = body;

    console.log('Subscription request for slug:', slug);

    // Validate required fields
    if (!fullName || !email || !phoneNumber) {
      return NextResponse.json(
        { error: 'Full name, email, and phone number are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find collection by slug
    const collectionSnapshot = await adminDb
      .collection(COLLECTIONS.COLLECTION_WAITLISTS)
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();

    if (collectionSnapshot.empty) {
      return NextResponse.json(
        { error: 'Collection not found or not published' },
        { status: 404 }
      );
    }

    const collectionDoc = collectionSnapshot.docs[0];
    const collection = collectionDoc.data() as CollectionWaitlist;

    // Check if user already subscribed (by email)
    const existingSubscription = await adminDb
      .collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS)
      .where('collectionId', '==', collectionDoc.id)
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingSubscription.empty) {
      return NextResponse.json(
        { error: 'You are already subscribed to this waitlist' },
        { status: 400 }
      );
    }

    // Create subscription
    const now = Timestamp.now();
    const subscriptionData = {
      collectionId: collectionDoc.id,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      subscribedAt: now,
      source: 'direct',
      metadata: {
        userAgent: request.headers.get('user-agent') || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   undefined
      }
    };

    // Use a transaction to ensure consistency
    await adminDb.runTransaction(async (transaction) => {
      // Create subscription
      const subscriptionRef = adminDb.collection(COLLECTIONS.WAITLIST_SUBSCRIPTIONS).doc();
      transaction.set(subscriptionRef, subscriptionData);

      // Update collection subscriber count
      const collectionRef = adminDb.collection(COLLECTIONS.COLLECTION_WAITLISTS).doc(collectionDoc.id);
      transaction.update(collectionRef, {
        currentSubscribers: (collection.currentSubscribers || 0) + 1,
        updatedAt: now
      });
    });

    console.log('Subscription created successfully for:', email);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist',
      data: {
        subscriptionId: 'created',
        currentSubscribers: (collection.currentSubscribers || 0) + 1
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to join waitlist', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}