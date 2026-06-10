import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

/**
 * Returns wallet balance per provider, split into:
 *   available  — earnings from orders with fulfilmentStatus === "delivered"
 *   pending    — earnings from orders not yet delivered (in transit / processing)
 *
 * The total wallet_by_provider on the tailor doc is the gross balance.
 * We compute the delivered portion by summing source_original_price across
 * delivered orders for each provider, then cap it at the gross balance.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const vendorId = searchParams.get('vendorId');

  if (!vendorId) {
    return NextResponse.json({ error: 'vendorId is required' }, { status: 400 });
  }

  try {
    const tailorDoc = await adminDb.collection('tailors').doc(vendorId).get();

    if (!tailorDoc.exists) {
      return NextResponse.json({
        total: 0,
        providers: {
          paystack: { total: 0, available: 0, pending: 0 },
          stripe:   { total: 0, available: 0, pending: 0 },
          flutterwave: { total: 0, available: 0, pending: 0 },
        },
        unattributed: 0,
        currency: 'NGN',
      });
    }

    const data = tailorDoc.data()!;
    const total = Number(data.wallet_balance ?? data.wallet ?? data.wallet_details?.balance ?? 0);
    const byProvider: Record<string, number> = data.wallet_by_provider || {};

    const grossPaystack   = Number(byProvider.paystack ?? 0);
    const grossStripe     = Number(byProvider.stripe ?? 0);
    const grossFlutterwave = Number(byProvider.flutterwave ?? 0);

    // Query all orders for this vendor's items to compute delivered earnings per provider.
    // Orders store items with tailor_id — query by tailor_id across the orders collection.
    const ordersSnap = await adminDb
      .collection('orders')
      .where('items', 'array-contains-any', []) // fallback — we use a broader query below
      .limit(1)
      .get()
      .catch(() => null);

    // Better approach: query orders that contain this vendor's items via tailor_id on items.
    // Firestore doesn't support array-contains on nested fields, so we query all orders
    // where ANY item has this tailor_id using the denormalized tailor_ids array if present,
    // or fall back to a collectionGroup on the tailor's own orders subcollection.
    const deliveredByProvider: Record<string, number> = {
      paystack: 0, stripe: 0, flutterwave: 0,
    };

    // Use the tailor's orders subcollection (written by writeTailorOrderDocs at checkout)
    // Each doc there has: source_original_price, payment_status, order_id
    // We cross-reference with the parent order's fulfilmentStatus via the order_id.
    const tailorOrdersSnap = await adminDb
      .collection('tailors')
      .doc(vendorId)
      .collection('orders')
      .get();

    if (!tailorOrdersSnap.empty) {
      // Collect unique order IDs so we can batch-fetch fulfilmentStatus
      const orderIdSet = new Set<string>();
      tailorOrdersSnap.docs.forEach((d) => {
        const orderId = d.data().order_id;
        if (orderId) orderIdSet.add(orderId);
      });

      // Fetch fulfilmentStatus and paymentProvider for each order in batches of 10
      const orderIds = Array.from(orderIdSet);
      const orderStatusMap = new Map<string, { status: string; provider: string }>();

      for (let i = 0; i < orderIds.length; i += 10) {
        const batch = orderIds.slice(i, i + 10);
        const snap = await adminDb
          .collection('orders')
          .where('orderId', 'in', batch)
          .get();
        snap.docs.forEach((d) => {
          const od = d.data();
          orderStatusMap.set(od.orderId, {
            status: (od.fulfilmentStatus ?? od.status ?? '').toLowerCase(),
            provider: (od.paymentProvider ?? '').toLowerCase(),
          });
        });
      }

      // Sum delivered earnings per provider from the tailor's order sub-docs
      tailorOrdersSnap.docs.forEach((d) => {
        const item = d.data();
        const orderId = item.order_id;
        if (!orderId) return;

        const orderInfo = orderStatusMap.get(orderId);
        if (!orderInfo) return;
        if (orderInfo.status !== 'delivered') return;

        const providerKey = orderInfo.provider;
        if (!['paystack', 'stripe', 'flutterwave'].includes(providerKey)) return;

        const earning = Number(
          item.source_original_price ?? item.sourceOriginalPrice ?? item.price ?? 0
        ) * Math.max(1, Number(item.quantity ?? 1));

        if (earning > 0) {
          deliveredByProvider[providerKey] = (deliveredByProvider[providerKey] ?? 0) + earning;
        }
      });
    }

    // Cap available at the gross wallet balance per provider (can't withdraw more than earned)
    const availablePaystack    = Math.min(deliveredByProvider.paystack,    grossPaystack);
    const availableStripe      = Math.min(deliveredByProvider.stripe,      grossStripe);
    const availableFlutterwave = Math.min(deliveredByProvider.flutterwave, grossFlutterwave);

    const knownSum = grossPaystack + grossStripe + grossFlutterwave;
    const unattributed = Math.max(0, total - knownSum);

    return NextResponse.json({
      total,
      providers: {
        paystack:    { total: grossPaystack,    available: availablePaystack,    pending: Math.max(0, grossPaystack    - availablePaystack)    },
        stripe:      { total: grossStripe,      available: availableStripe,      pending: Math.max(0, grossStripe      - availableStripe)      },
        flutterwave: { total: grossFlutterwave, available: availableFlutterwave, pending: Math.max(0, grossFlutterwave - availableFlutterwave) },
      },
      unattributed,
      currency: 'NGN',
    });
  } catch (error: any) {
    console.error('[wallet-balance] error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet balance' }, { status: 500 });
  }
}
