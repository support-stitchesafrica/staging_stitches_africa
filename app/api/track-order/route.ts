import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitiseId } from '@/lib/sanitise-id';
import type { SanitisedResponse, TrackingEvent } from '@/types/track-order';

/**
 * GET /api/track-order
 *
 * Public, unauthenticated endpoint for looking up shipment status.
 * Accepts either ?orderId=... or ?trackingNumber=...
 *
 * Returns a SanitisedResponse — no PII, no payment data.
 */
export async function GET(req: NextRequest) {
  // --- Rate limiting ---
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  // --- Input extraction ---
  const { searchParams } = new URL(req.url);
  const rawOrderId = searchParams.get('orderId') ?? '';
  const rawTrackingNumber = searchParams.get('trackingNumber') ?? '';

  const isTrackingNumberLookup = !rawOrderId && !!rawTrackingNumber;
  const rawInput = isTrackingNumberLookup ? rawTrackingNumber : rawOrderId;

  // --- Input validation ---
  if (!rawInput.trim()) {
    return NextResponse.json(
      { error: 'Order ID is required.' },
      { status: 400 }
    );
  }

  const sanitisedId = sanitiseId(rawInput);

  if (!sanitisedId) {
    return NextResponse.json(
      { error: 'Invalid Order ID format.' },
      { status: 400 }
    );
  }

  // --- Firestore query ---
  // Strategy: query users_orders top-level collection by user_id field,
  // then search within that user's user_orders subcollection.
  // This avoids needing a collection group index on order_id.
  try {
    let docRef: FirebaseFirestore.DocumentSnapshot | null = null;

    if (isTrackingNumberLookup) {
      // Fan-out: scan users_orders, search each user's subcollection for tracking number
      const usersSnap = await adminDb.collection('users_orders').limit(500).get();
      for (const userDoc of usersSnap.docs) {
        const orderSnap = await adminDb
          .collection('users_orders')
          .doc(userDoc.id)
          .collection('user_orders')
          .where('shipping.trackingNumber', '==', sanitisedId)
          .limit(1)
          .get();
        if (!orderSnap.empty) {
          docRef = orderSnap.docs[0];
          break;
        }
      }
    } else {
      // For order_id: scan users_orders top-level docs, then query subcollection
      // order_id is stored as a field AND as the document ID pattern
      // Try direct doc lookup first using order_id as doc ID
      const usersSnap = await adminDb.collection('users_orders').limit(500).get();
      for (const userDoc of usersSnap.docs) {
        const orderSnap = await adminDb
          .collection('users_orders')
          .doc(userDoc.id)
          .collection('user_orders')
          .where('order_id', '==', sanitisedId)
          .limit(1)
          .get();
        if (!orderSnap.empty) {
          docRef = orderSnap.docs[0];
          break;
        }
      }
    }

    if (!docRef) {
      return NextResponse.json(
        { error: 'Order not found.' },
        { status: 404 }
      );
    }

    const doc = docRef.data()!;

    // --- Build sanitised response (explicit field picking — no PII) ---
    // Fields explicitly never read: user_address, user_email, payment_provider,
    // amount_paid, coupon_code, payout_*, user_measurement, tailor_id, tailor_name,
    // phone_number, card details, internal admin notes.

    const rawEvents: any[] = doc.timeline ?? [];
    const events: TrackingEvent[] = rawEvents.map((t: any) => ({
      occurredAt: t.occurredAt ?? '',
      typeCode: t.typeCode ?? null,
      status: t.status ?? 'unknown',
      description: t.description ?? '',
      location: t.location ?? '',
    }));

    const response: SanitisedResponse = {
      orderId: doc.order_id ?? '',
      trackingNumber:
        doc.shipping?.packages?.[0]?.trackingNumber ??
        doc.packages?.[0]?.trackingNumber ??
        doc.shipping?.trackingNumber ??
        null,
      carrier: doc.shipping?.carrier ?? 'DHL',
      status: doc.order_status ?? 'unknown',
      events,
      estimatedDelivery: doc.delivery_date ?? null,
      lastUpdated: doc.last_update?.toDate?.()?.toISOString() ?? null,
      _docPath: docRef.ref.path,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    // Log server-side but never expose raw error to client
    console.error('[track-order] Firestore error:', err);
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
