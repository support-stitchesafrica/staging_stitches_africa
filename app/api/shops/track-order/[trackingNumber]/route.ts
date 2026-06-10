import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const DHL_BACKEND_BASE = 'https://stitchesafricamobile-backend.onrender.com/api';

// DHL type code → internal status string (mirrors the Firebase poller)
const DHL_TYPECODE_TO_STATUS: Record<string, string> = {
  AD: 'agreedDelivery', AF: 'arrivedFacility', AR: 'arrivalInDeliveryFacility',
  BA: 'badAddress', BN: 'customerBrokerNotified', BR: 'brokerRelease',
  CA: 'closedOnArrival', CC: 'awaitingConsigneeCollection', CD: 'controllableClearanceDelay',
  CM: 'customerMoved', CR: 'clearanceRelease', CS: 'closedShipment',
  DD: 'deliveredDamaged', DF: 'departFacility', DS: 'destroyedDisposal',
  FD: 'forwardDestination', HP: 'heldForPayment', IC: 'inClearanceProcessing',
  MC: 'miscode', MD: 'missedDeliveryCycle', MS: 'misSort',
  ND: 'notDelivered', NH: 'notHome', OH: 'onHold', OK: 'delivered',
  PD: 'partialDelivery', PL: 'processedAtLocation', PU: 'pickedUp',
  RD: 'refusedDelivery', RR: 'responseReceived', RT: 'returnedToConsignor',
  SA: 'shipmentAcceptance', SC: 'serviceChanged', SS: 'shipmentStopped',
  TP: 'forwardedToThirdParty', TR: 'recordOfTransfer', UD: 'uncontrollableClearanceDelay',
  WC: 'withDeliveringCourier',
};

function fingerprintEvent(evt: any): string {
  const date = evt?.date ?? '';
  const time = evt?.time ?? '';
  const typeCode = evt?.typeCode ?? '';
  const desc = evt?.description ?? '';
  const area = Array.isArray(evt?.serviceArea) ? (evt.serviceArea[0]?.code ?? '') : '';
  return `${date}|${time}|${typeCode}|${desc}|${area}`;
}

function sortNewestFirst(events: any[]): any[] {
  return [...events].sort((a, b) => {
    const aKey = `${a?.date ?? ''}T${a?.time ?? ''}`;
    const bKey = `${b?.date ?? ''}T${b?.time ?? ''}`;
    return bKey.localeCompare(aKey);
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ trackingNumber: string }> | { trackingNumber: string } }
) {
  try {
    // Next.js newer route handlers provide params as a Promise.
    // Support both Promise and plain object for compatibility.
    const resolvedParams = await Promise.resolve(context.params);
    const { trackingNumber } = resolvedParams;
    if (!trackingNumber) {
      return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
    }

    // Verify the user's Firebase ID token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }
    const idToken = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userId = decoded.uid;

    // userId and orderId passed as query params so we know which doc to update
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const pieceTrackingNumber = searchParams.get('pieceTrackingNumber');

    // Fetch live tracking from DHL backend
    // Use shipmentTrackingNumber in path + pieceTrackingNumber as query param (per DHL API spec)
    let dhlUrl = `${DHL_BACKEND_BASE}/delivery/Dhl/Shipments/${encodeURIComponent(trackingNumber)}/tracking`;
    if (pieceTrackingNumber) {
      dhlUrl += `?pieceTrackingNumber=${encodeURIComponent(pieceTrackingNumber)}`;
    }
    console.log('[DHL Track] Fetching:', dhlUrl);
    // Try with auth first, then without if it fails
    const dhlRes = await fetch(dhlUrl, {
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!dhlRes.ok) {
      const errText = await dhlRes.text().catch(() => '');
      console.error('[DHL Track] Error:', dhlRes.status, errText.slice(0, 500));
      // 400 from DHL usually means the shipment hasn't been picked up yet
      // or the tracking number isn't in DHL's system yet
      if (dhlRes.status === 400 || dhlRes.status === 404) {
        return NextResponse.json(
          { error: 'Tracking not available yet. DHL will update once the package is collected.', notReady: true },
          { status: 200 }
        );
      }
      if (dhlRes.status === 401) {
        return NextResponse.json(
          { error: 'Authentication failed with DHL backend.' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `DHL tracking failed (${dhlRes.status}): ${errText.slice(0, 200)}` },
        { status: dhlRes.status }
      );
    }

    const dhlData = await dhlRes.json();

    // Extract events from DHL response: { shipments: [{ events: [...] }] }
    const rawEvents: any[] = dhlData?.shipments?.[0]?.events ?? [];
    const events = sortNewestFirst(rawEvents);
    const latestEvent = events[0];

    if (!latestEvent) {
      return NextResponse.json({ events: [], latestEvent: null, saved: false });
    }

    const newStatus = DHL_TYPECODE_TO_STATUS[latestEvent.typeCode] ?? 'unknown';
    const latestHash = fingerprintEvent(latestEvent);

    // Save to Firestore if we have the doc reference
    let saved = false;
    if (orderId && userId) {
      try {
        const orderRef = adminDb
          .collection('users_orders')
          .doc(userId)
          .collection('user_orders')
          .doc(orderId);

        const orderSnap = await orderRef.get();
        if (orderSnap.exists) {
          const orderData = orderSnap.data() ?? {};

          // Build new timeline entries (skip already-stored ones)
          const prevHashes = new Set<string>(
            (orderData.timeline ?? []).map((t: any) => t.hash).filter(Boolean)
          );

          const newTimelineEntries = events
            .filter((evt) => !prevHashes.has(fingerprintEvent(evt)))
            .map((evt) => {
              const location = Array.isArray(evt.serviceArea)
                ? evt.serviceArea.map((s: any) => s.description || s.code || '').filter(Boolean).join(', ')
                : '';
              const occurredAt = evt.date && evt.time ? `${evt.date}T${evt.time}` : evt.date ?? '';
              return {
                occurredAt,
                typeCode: evt.typeCode ?? null,
                status: DHL_TYPECODE_TO_STATUS[evt.typeCode] ?? 'unknown',
                description: evt.description ?? '',
                location,
                hash: fingerprintEvent(evt),
                actor: 'system/tracker',
                source: 'dhl',
                raw: { date: evt.date, time: evt.time, serviceArea: evt.serviceArea },
              };
            });

          const update: Record<string, any> = {
            order_status: newStatus,
            last_update: FieldValue.serverTimestamp(),
            dhl_events_snapshot: events,
            last_dhl_event: {
              typeCode: latestEvent.typeCode ?? null,
              description: latestEvent.description ?? null,
              date: latestEvent.date ?? null,
              time: latestEvent.time ?? null,
              serviceArea: latestEvent.serviceArea ?? null,
              hash: latestHash,
            },
          };

          if (newTimelineEntries.length > 0) {
            update.timeline = FieldValue.arrayUnion(...newTimelineEntries);
          }

          await orderRef.update(update);
          saved = true;
        }
      } catch (saveErr) {
        // Non-blocking — still return the data even if save fails
        console.error('[DHL Track] Firestore save error:', saveErr);
      }
    }

    return NextResponse.json({ events, latestEvent, newStatus, saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[DHL Track Route] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
