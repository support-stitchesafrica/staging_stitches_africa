import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authenticateRequest } from '@/lib/marketing/auth-middleware';
import { sendOrderStatusNotifications } from '@/lib/marketing/vendor-order-status-email';

const AUTHORIZED_ROLES = ['team_lead', 'bdm', 'super_admin'] as const;
const ALLOWED_STATUSES = [
  'pending',
  'processing',
  'payment_failed',
  'shipped',
  'delivered',
  'cancelled',
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

const STATUS_TO_TYPE_CODE: Record<AllowedStatus, string> = {
  pending: 'PU',
  processing: 'PL',
  payment_failed: 'OH',
  shipped: 'DF',
  delivered: 'OK',
  cancelled: 'RT',
};

const STATUS_TO_DESCRIPTION: Record<AllowedStatus, string> = {
  pending: 'Shipment picked up',
  processing: 'Processed at location',
  payment_failed: 'On hold',
  shipped: 'Departed facility',
  delivered: 'Delivered',
  cancelled: 'Returned to consignor',
};

function formatDateUTC(d: Date): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeUTC(d: Date): string {
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function normalizeEvents(events: unknown): unknown[] {
  return Array.isArray(events) ? events : [];
}

export async function POST(request: NextRequest) {
  let body: { userId?: string; orderId?: string; orderStatus?: AllowedStatus };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 },
    );
  }

  const { userId, orderId, orderStatus } = body;
  if (!userId || !orderId || !orderStatus) {
    return NextResponse.json(
      { success: false, error: 'userId, orderId and orderStatus are required' },
      { status: 400 },
    );
  }

  if (!ALLOWED_STATUSES.includes(orderStatus)) {
    return NextResponse.json(
      { success: false, error: 'Invalid order status value' },
      { status: 400 },
    );
  }

  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { user } = authResult;
  if (!AUTHORIZED_ROLES.includes(user.role as (typeof AUTHORIZED_ROLES)[number])) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 },
    );
  }

  const orderRef = adminDb
    .collection('users_orders')
    .doc(userId)
    .collection('user_orders')
    .doc(orderId);

  const orderSnap = await orderRef.get();
  if (!orderSnap.exists) {
    return NextResponse.json(
      { success: false, error: 'Order not found' },
      { status: 404 },
    );
  }

  const orderData = orderSnap.data() ?? {};
  const now = new Date();
  const locationDescription =
    [orderData?.user_address?.city, orderData?.user_address?.state, orderData?.user_address?.country_code || orderData?.user_address?.country]
      .filter(Boolean)
      .join('-') || 'Lagos-NG';

  const simulatedEvent = {
    typeCode: STATUS_TO_TYPE_CODE[orderStatus],
    time: formatTimeUTC(now),
    description: STATUS_TO_DESCRIPTION[orderStatus],
    date: formatDateUTC(now),
    serviceArea: [{ description: locationDescription, code: 'LOS' }],
    deliveryType: 'custom',
    signedBy: '',
  };

  const existingEvents = normalizeEvents(orderData.dhl_events_snapshot);
  const updatedEvents = [simulatedEvent, ...existingEvents];

  const updatePayload = {
    order_status: orderStatus,
    dhl_events_snapshot: updatedEvents,
    last_dhl_event: simulatedEvent,
    last_update: FieldValue.serverTimestamp(),
  };

  const sharedOrderId = orderData.order_id;
  if (sharedOrderId) {
    try {
      const siblingsSnap = await adminDb
        .collection('users_orders')
        .doc(userId)
        .collection('user_orders')
        .where('order_id', '==', sharedOrderId)
        .get();

      if (!siblingsSnap.empty) {
        const batch = adminDb.batch();
        siblingsSnap.docs.forEach((d) => batch.update(d.ref, updatePayload));
        await batch.commit();
      } else {
        await orderRef.update(updatePayload);
      }
    } catch (err) {
      console.warn(
        '[vendor-transactions/order-status] sibling batch update failed, falling back to single doc:',
        err,
      );
      await orderRef.update(updatePayload);
    }
  } else {
    await orderRef.update(updatePayload);
  }

  const emailNotifications = await sendOrderStatusNotifications({
    orderData: orderData as Record<string, unknown>,
    orderId,
    orderStatus,
    changedByEmail: user.email,
  });

  return NextResponse.json({
    success: true,
    data: {
      userId,
      orderId,
      order_status: orderStatus,
      last_dhl_event: simulatedEvent,
      dhl_events_snapshot: updatedEvents,
      notifications: emailNotifications,
    },
  });
}
