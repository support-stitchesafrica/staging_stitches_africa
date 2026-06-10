/**
 * POST /api/dev/customer-email-preview
 * Sends two sample emails to one address only: payment-complete (order confirmation)
 * and delivery-complete (order status "delivered"). No vendor or admin recipients.
 *
 * Headers: x-email-preview-secret: must match process.env.EMAIL_PREVIEW_SECRET
 * Body: { "recipient": "you@example.com", "customerName"?: "Optional name" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildCustomerOrderConfirmationHtml } from '@/lib/email/customer-order-confirmation-html';
import {
  buildCustomerOrderStatusHtml,
  prettyStatus,
  sendMarketingStatusEmail,
} from '@/lib/marketing/vendor-order-status-email';

const EMAIL_API_URL =
  process.env.STITCHES_EMAIL_API_URL ||
  'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';

function emailApiHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    accept: '*/*',
    'Content-Type': 'application/json',
  };
  const key = process.env.STITCHES_BACKEND_EMAIL_API_KEY;
  if (key) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

export async function POST(request: NextRequest) {
  const secret = process.env.EMAIL_PREVIEW_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: 'EMAIL_PREVIEW_SECRET is not configured' },
      { status: 503 },
    );
  }
  if (request.headers.get('x-email-preview-secret')?.trim() !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { recipient?: string; customerName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const recipient = body.recipient?.trim();
  if (!recipient || !recipient.includes('@')) {
    return NextResponse.json(
      { error: 'recipient must be a valid email address' },
      { status: 400 },
    );
  }

  if (!process.env.STITCHES_BACKEND_EMAIL_API_KEY) {
    console.warn(
      '[customer-email-preview] STITCHES_BACKEND_EMAIL_API_KEY is unset — sends may return 401.',
    );
  }

  const demoOrderId = 'DEMO-PREVIEW-001';
  const displayName = body.customerName?.trim() || 'Preview Customer';

  const paymentHtml = buildCustomerOrderConfirmationHtml({
    customerName: displayName,
    orderId: demoOrderId,
    orderDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
    items: [
      {
        title: 'Sample ready-to-wear item',
        quantity: 1,
        price: 45000,
        image: 'https://www.stitchesafrica.com/android-chrome-192x192.png',
        size: 'M',
        color: 'Navy',
      },
      {
        title: 'Sample bespoke garment',
        quantity: 1,
        price: 120000,
        type: 'bespoke',
        size: 'Custom',
        color: 'Gold',
      },
    ],
    subtotal: 165000,
    shippingCost: 3500,
    total: 168500,
    currency: 'NGN',
    shippingAddress: '12 Preview Street\nLagos\nNG',
  });

  const deliveredHtml = buildCustomerOrderStatusHtml({
    customerName: displayName,
    orderTitle: 'Sample linen two-piece',
    orderStatus: 'delivered',
  });

  const statusLabel = prettyStatus('delivered');

  const paymentRes = await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: emailApiHeaders(),
    body: JSON.stringify({
      body: paymentHtml,
      subject: `[PREVIEW] Payment complete — customer email`,
      emails: [{ emailAddress: recipient, name: displayName }],
      from: 'orders@stitchesafrica.com',
      replyTo: 'support@stitchesafrica.com',
    }),
  });

  const paymentOk = paymentRes.ok;
  const paymentDetail = await paymentRes.text().catch(() => '');

  const deliveryResult = await sendMarketingStatusEmail(
    recipient,
    displayName,
    `[PREVIEW] Delivery complete — Order ${demoOrderId} status: ${statusLabel}`,
    deliveredHtml,
  );

  return NextResponse.json({
    success: paymentOk && deliveryResult.sent,
    customerEmailsOnly: true,
    payment: {
      ok: paymentOk,
      status: paymentRes.status,
      detail: paymentDetail.slice(0, 500),
    },
    delivery: deliveryResult,
  });
}
