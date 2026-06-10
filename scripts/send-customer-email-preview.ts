/**
 * Send sample customer emails via Render `/api/Email/Send` (loads `.env.local`).
 *
 * Usage:
 *   npx tsx scripts/send-customer-email-preview.ts [email ...]
 *   npx tsx scripts/send-customer-email-preview.ts --payment-only [email ...]
 *
 * Default (no args): payment + delivery to chimaobi.dev@gmail.com
 * --payment-only: order confirmation only (no delivery email)
 */

import { config } from 'dotenv';
import path from 'path';
import { buildCustomerOrderConfirmationHtml } from '../lib/email/customer-order-confirmation-html';

config({ path: path.resolve(process.cwd(), '.env.local') });

const EMAIL_API_URL =
  process.env.STITCHES_EMAIL_API_URL ||
  'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';

/** Curated Unsplash fashion/clothing photos (images.unsplash.com, https only for email HTML). */
const UNSPLASH_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1523381210438-271e8be1f52b?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&w=400&q=80',
];

function randomUnsplashItemImage(): string {
  const i = Math.floor(Math.random() * UNSPLASH_PLACEHOLDERS.length);
  return UNSPLASH_PLACEHOLDERS[i]!;
}

function emailHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    accept: '*/*',
    'Content-Type': 'application/json',
  };
  const key = process.env.STITCHES_BACKEND_EMAIL_API_KEY;
  if (key) h.Authorization = `Bearer ${key}`;
  return h;
}

/** Matches lib/marketing/vendor-order-status-email buildCustomerOrderStatusHtml (delivered). */
function buildDeliveredCustomerHtml(
  customerName: string,
  orderTitle: string,
): string {
  return `<html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px;">
      <div style="max-width:620px;margin:auto;background:#fff;padding:24px;border-radius:8px;">
      <h2 style="margin-top:0;">Order Status Updated</h2>
      <p>Hello ${customerName},</p>
      <p>Your order ${orderTitle} is now <strong>Delivered</strong>.</p>
      <p>You can check your account orders page for latest tracking details.</p>
      <p style="color:#6b7280;font-size:12px;">Stitches Africa Team</p>
      </div></body></html>`;
}

function nameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() || 'Customer';
  const words = local.replace(/[._-]+/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'Customer';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

async function sendEmail(params: {
  to: string;
  name: string;
  subject: string;
  html: string;
  from: string;
  replyTo: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: emailHeaders(),
    body: JSON.stringify({
      body: params.html,
      subject: params.subject,
      emails: [{ emailAddress: params.to, name: params.name }],
      from: params.from,
      replyTo: params.replyTo,
    }),
  });
  const body = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body };
}

function parseArgs(argv: string[]): {
  paymentOnly: boolean;
  recipients: string[];
} {
  const paymentOnly = argv.includes('--payment-only');
  const recipients = argv.filter(
    (a) => a && a !== '--payment-only' && a.includes('@'),
  );
  return { paymentOnly, recipients };
}

async function main() {
  const argv = process.argv.slice(2);
  const { paymentOnly, recipients } = parseArgs(argv);
  const toList =
    recipients.length > 0
      ? recipients
      : ['chimaobi.dev@gmail.com'];

  if (!process.env.STITCHES_BACKEND_EMAIL_API_KEY) {
    console.warn(
      'STITCHES_BACKEND_EMAIL_API_KEY not in .env.local — trying unauthenticated request (same as VVIP email path).',
    );
  }

  const demoOrderId = 'DEMO-PREVIEW-001';
  const placeholderImage = randomUnsplashItemImage();
  console.log('Using Unsplash placeholder image:', placeholderImage);

  let allOk = true;

  for (const recipient of toList) {
    const name = nameFromEmail(recipient);

    const paymentHtml = buildCustomerOrderConfirmationHtml({
      customerName: name,
      orderId: demoOrderId,
      orderDate: new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
      items: [
        {
          title: 'Sample ready-to-wear item',
          quantity: 1,
          price: 45000,
          image: placeholderImage,
          size: 'L',
          color: 'Emerald',
        },
        {
          title: 'Sample bespoke garment',
          quantity: 1,
          price: 120000,
          type: 'bespoke',
          size: '42',
          color: 'Ivory',
        },
      ],
      subtotal: 165000,
      shippingCost: 3500,
      total: 168500,
      currency: 'NGN',
      shippingAddress: '12 Preview Street\nLagos\nNG',
    });

    console.log(`Sending payment-complete email to ${recipient}…`);
    const r1 = await sendEmail({
      to: recipient,
      name,
      subject: `[PREVIEW] Payment complete — customer email`,
      html: paymentHtml,
      from: 'orders@stitchesafrica.com',
      replyTo: 'support@stitchesafrica.com',
    });
    console.log('  ', r1.ok ? 'OK' : 'FAIL', r1.status, r1.body.slice(0, 200));
    if (!r1.ok) allOk = false;

    if (!paymentOnly) {
      const deliveryHtml = buildDeliveredCustomerHtml(name, 'Sample linen two-piece');
      console.log(`Sending delivery-complete email to ${recipient}…`);
      const r2 = await sendEmail({
        to: recipient,
        name,
        subject: `[PREVIEW] Delivery complete — Order ${demoOrderId} status: Delivered`,
        html: deliveryHtml,
        from: 'support@stitchesafrica.com',
        replyTo: 'support@stitchesafrica.com',
      });
      console.log('  ', r2.ok ? 'OK' : 'FAIL', r2.status, r2.body.slice(0, 200));
      if (!r2.ok) allOk = false;
    }
  }

  if (!allOk) process.exit(1);
  console.log('Done. Recipients:', toList.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
