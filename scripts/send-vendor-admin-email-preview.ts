/**
 * Send sample vendor + admin order notification emails (no customer email).
 *
 * Usage:
 *   npx tsx scripts/send-vendor-admin-email-preview.ts [email ...]
 *
 * Default recipient: chimaobi.dev@gmail.com
 */

import { config } from 'dotenv';
import path from 'path';
import { buildAdminOrderNotificationHtml } from '../lib/email/admin-order-notification-html';
import { buildVendorOrderNotificationHtml } from '../lib/email/vendor-order-notification-html';

config({ path: path.resolve(process.cwd(), '.env.local') });

const EMAIL_API_URL =
  process.env.STITCHES_EMAIL_API_URL ||
  'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';

const UNSPLASH_PLACEHOLDERS = [
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&w=400&q=80',
  'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&w=400&q=80',
];

function randomUnsplashItemImage(): string {
  return UNSPLASH_PLACEHOLDERS[Math.floor(Math.random() * UNSPLASH_PLACEHOLDERS.length)]!;
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

async function sendEmail(params: {
  to: string;
  name: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; status: number; body: string }> {
  const res = await fetch(EMAIL_API_URL, {
    method: 'POST',
    headers: emailHeaders(),
    body: JSON.stringify({
      body: params.html,
      subject: params.subject,
      emails: [{ emailAddress: params.to, name: params.name }],
      from: 'orders@stitchesafrica.com',
      replyTo: 'support@stitchesafrica.com',
    }),
  });
  const body = await res.text().catch(() => '');
  return { ok: res.ok, status: res.status, body };
}

async function main() {
  const argv = process.argv.slice(2);
  const recipients =
    argv.filter((a) => a.includes('@')).length > 0
      ? argv.filter((a) => a.includes('@'))
      : ['chimaobi.dev@gmail.com'];

  if (!process.env.STITCHES_BACKEND_EMAIL_API_KEY) {
    console.warn(
      'STITCHES_BACKEND_EMAIL_API_KEY not in .env.local — trying unauthenticated request.',
    );
  }

  const demoOrderId = 'DEMO-VENDOR-ADMIN-001';
  const orderDate = new Date().toLocaleDateString('en-US', { dateStyle: 'full' });
  const placeholderImage = randomUnsplashItemImage();
  console.log('Using Unsplash placeholder image:', placeholderImage);

  const sampleItems = [
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
      type: 'bespoke' as const,
      size: '42',
      color: 'Ivory',
    },
  ];

  const vendorHtml = buildVendorOrderNotificationHtml({
    vendorName: 'Preview Vendor',
    orderId: demoOrderId,
    orderDate,
    items: sampleItems,
    subtotal: 165000,
    currency: 'NGN',
    hasBespokeItems: true,
  });

  const adminHtml = buildAdminOrderNotificationHtml({
    orderId: demoOrderId,
    orderDate,
    customerName: 'Preview Customer',
    customerEmail: 'preview.customer@example.com',
    shippingAddress: '12 Preview Street\nLagos\nNG',
    items: sampleItems,
    subtotal: 165000,
    shippingCost: 3500,
    total: 168500,
    currency: 'NGN',
    vendorEmails: [
      { vendorName: 'Preview Vendor', email: 'vendor.preview@example.com' },
    ],
    hasBespokeItems: true,
  });

  let allOk = true;

  for (const recipient of recipients) {
    console.log(`Sending vendor notification to ${recipient}…`);
    const v = await sendEmail({
      to: recipient,
      name: 'Preview Vendor',
      subject: `[PREVIEW] Vendor — New Order ${demoOrderId}`,
      html: vendorHtml,
    });
    console.log('  vendor', v.ok ? 'OK' : 'FAIL', v.status, v.body.slice(0, 200));
    if (!v.ok) allOk = false;

    console.log(`Sending admin notification to ${recipient}…`);
    const a = await sendEmail({
      to: recipient,
      name: 'Stitches Africa Admin',
      subject: `[PREVIEW] Admin — New Order ${demoOrderId}`,
      html: adminHtml,
    });
    console.log('  admin', a.ok ? 'OK' : 'FAIL', a.status, a.body.slice(0, 200));
    if (!a.ok) allOk = false;
  }

  if (!allOk) process.exit(1);
  console.log('Done. Recipients:', recipients.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
