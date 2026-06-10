/**
 * Send Order Confirmation Email API
 * POST: Send order confirmation emails to customer and vendors
 */

import { NextResponse } from 'next/server';
import { buildAdminOrderNotificationHtml } from '@/lib/email/admin-order-notification-html';
import { buildCustomerOrderConfirmationHtml } from '@/lib/email/customer-order-confirmation-html';
import { buildVendorOrderNotificationHtml } from '@/lib/email/vendor-order-notification-html';

const EMAIL_API_URL =
  process.env.STITCHES_EMAIL_API_URL ||
  'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';

/** Bearer for Render backend /api/Email/Send (required when the endpoint is [Authorize]d). */
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

// Admin emails to receive all order notifications
const ADMIN_EMAILS = [
  'stitchesafrica1m@gmail.com',
  'stitchesafrica2m@gmail.com',
  'stitchesafrica3m@gmail.com',
  'stitchesafrica4m@gmail.com',
  'stitchesafrica5m@gmail.com',
  'stitchesafrica6m@gmail.com',
  'stitchesafrica7m@gmail.com',
  'stitchesafrica8m@gmail.com',
  'stitchesafrica9m@gmail.com',
  'support@stitchesafrica.com',
  "uchinedu@stitchesafrica.com"
];

interface OrderItem {
  title: string;
  quantity: number;
  price: number;
  image?: string;
  type?: string;
  size?: string;
  color?: string;
}

interface VendorEmail {
  vendorName: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
}

interface CouponInfo {
  code: string;
  discountAmount: number;
  currency: string;
}

interface ReferralInfo {
  code: string;
  referrerName?: string;
  freeShippingGranted: boolean;
  freeShippingReason?: string;
}


/**
 * POST /api/shops/send-order-confirmation
 * Send order confirmation emails
 */
export async function POST(request: Request) {
  try {
    if (!process.env.STITCHES_BACKEND_EMAIL_API_KEY) {
      console.warn(
        '[send-order-confirmation] STITCHES_BACKEND_EMAIL_API_KEY is unset â€” backend /api/Email/Send may return 401.'
      );
    }

    const body = await request.json();

    const previewSecret = process.env.EMAIL_PREVIEW_SECRET?.trim();
    const previewHeader = request.headers.get('x-email-preview-secret')?.trim();
    /** When set, send only the customer order confirmation â€” no vendor or admin copies. */
    const customerOnlyPreview = Boolean(
      previewSecret && previewHeader && previewHeader === previewSecret,
    );

    const {
      customerEmail,
      customerName,
      orderId,
      orderDate,
      items,
      subtotal,
      shippingCost,
      total,
      currency,
      shippingAddress,
      vendorEmails,
      measurements,
      coupon,
      referral,
    }: {
      customerEmail: string;
      customerName: string;
      orderId: string;
      orderDate: string;
      items: OrderItem[];
      subtotal: number;
      shippingCost: number;
      total: number;
      currency: string;
      shippingAddress: string;
      vendorEmails: VendorEmail[];
      measurements?: any;
      coupon?: CouponInfo;
      referral?: ReferralInfo;
    } = body;

    // Format currency
    const curr = currency || 'NGN';
    const formatPrice = (amount: number, c: string = curr) => {
      if (c === 'NGN') {
        return `â‚¦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      return `$${amount.toFixed(2)}`;
    };

    const emailsSent: string[] = [];
    const emailsFailed: string[] = [];

    // Validate required fields
    if (!customerEmail || !orderId || !items || items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 },
      );
    }

    const safeShippingAddress = shippingAddress ?? '';

    // 1. Send customer confirmation email
    try {
      const customerEmailHtml = buildCustomerOrderConfirmationHtml({
        customerName: customerName || 'Customer',
        orderId,
        orderDate: orderDate || '',
        items,
        subtotal,
        shippingCost,
        total,
        currency: curr,
        shippingAddress: safeShippingAddress,
        coupon,
        referral,
        measurements,
      });

      const customerEmailResponse = await fetch(EMAIL_API_URL, {
        method: 'POST',
        headers: emailApiHeaders(),
        body: JSON.stringify({
          body: customerEmailHtml,
          subject: customerOnlyPreview
            ? `[PREVIEW] Order Confirmation - ${orderId}`
            : `Order Confirmation - ${orderId}`,
          emails: [{ emailAddress: customerEmail, name: customerName || 'Customer' }],
          from: 'orders@stitchesafrica.com',
          replyTo: 'support@stitchesafrica.com',
        }),
      });

      if (!customerEmailResponse.ok) {
        const detail = await customerEmailResponse.text().catch(() => '');
        throw new Error(
          `Email API returned ${customerEmailResponse.status}${detail ? `: ${detail}` : ''}`
        );
      }

      emailsSent.push(customerEmail);
      console.log(`âœ… Customer confirmation email sent to ${customerEmail}`);
    } catch (error) {
      console.error(`âŒ Failed to send customer email to ${customerEmail}:`, error);
      emailsFailed.push(customerEmail);
    }

    if (customerOnlyPreview) {
      return NextResponse.json({
        success: emailsFailed.length === 0,
        customerOnlyPreview: true,
        emailsSent,
        emailsFailed,
        message:
          emailsFailed.length === 0
            ? 'Customer confirmation sent only (preview: vendor and admin emails skipped).'
            : 'Customer confirmation failed; vendor and admin emails were not attempted.',
      });
    }

    // 2. Send vendor notification emails
    if (vendorEmails && vendorEmails.length > 0) {
      for (const vendor of vendorEmails) {
        try {
          const vendorEmailHtml = buildVendorOrderNotificationHtml({
            vendorName: vendor.vendorName,
            orderId,
            orderDate: orderDate || new Date().toLocaleDateString('en-US', { dateStyle: 'full' }),
            items: vendor.items,
            subtotal: vendor.subtotal,
            currency: curr,
            hasBespokeItems: Boolean(
              measurements && vendor.items.some((item: OrderItem) => item.type === 'bespoke'),
            ),
          });

          const vendorEmailResponse = await fetch(EMAIL_API_URL, {
            method: 'POST',
            headers: emailApiHeaders(),
            body: JSON.stringify({
              body: vendorEmailHtml,
              subject: `New Order - ${orderId}`,
              emails: [{ emailAddress: vendor.email, name: vendor.vendorName || 'Vendor' }],
              from: 'orders@stitchesafrica.com',
              replyTo: 'support@stitchesafrica.com',
            }),
          });

          if (!vendorEmailResponse.ok) {
            const detail = await vendorEmailResponse.text().catch(() => '');
            throw new Error(
              `Email API returned ${vendorEmailResponse.status}${detail ? `: ${detail}` : ''}`
            );
          }

          emailsSent.push(vendor.email);
          console.log(`âœ… Vendor notification email sent to ${vendor.email}`);
        } catch (error) {
          console.error(`âŒ Failed to send vendor email to ${vendor.email}:`, error);
          emailsFailed.push(vendor.email);
        }
      }
    }

    // 3. Send admin notification emails
    for (const adminEmail of ADMIN_EMAILS) {
      try {
        const adminEmailHtml = buildAdminOrderNotificationHtml({
          orderId,
          orderDate: orderDate || '',
          customerName: customerName || '',
          customerEmail,
          shippingAddress: safeShippingAddress,
          items,
          subtotal,
          shippingCost,
          total,
          currency: curr,
          coupon,
          referral: referral
            ? { code: referral.code, freeShippingGranted: referral.freeShippingGranted }
            : undefined,
          vendorEmails: vendorEmails?.map((v) => ({
            vendorName: v.vendorName,
            email: v.email,
          })),
          hasBespokeItems: Boolean(measurements),
        });

        const adminEmailResponse = await fetch(EMAIL_API_URL, {
          method: 'POST',
          headers: emailApiHeaders(),
          body: JSON.stringify({
            body: adminEmailHtml,
            subject: `New Order ${orderId} - ${customerName}`,
            emails: [{ emailAddress: adminEmail, name: 'Stitches Africa' }],
            from: 'orders@stitchesafrica.com',
            replyTo: 'support@stitchesafrica.com',
          }),
        });

        if (!adminEmailResponse.ok) {
          const detail = await adminEmailResponse.text().catch(() => '');
          throw new Error(
            `Email API returned ${adminEmailResponse.status}${detail ? `: ${detail}` : ''}`
          );
        }

        emailsSent.push(adminEmail);
        console.log(`âœ… Admin notification email sent to ${adminEmail}`);
      } catch (error) {
        console.error(`âŒ Failed to send admin email to ${adminEmail}:`, error);
        emailsFailed.push(adminEmail);
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      emailsFailed,
      message: `Successfully sent ${emailsSent.length} emails${emailsFailed.length > 0 ? `, ${emailsFailed.length} failed` : ''}`
    });
  } catch (error: any) {
    console.error('Error sending order confirmation emails:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send order confirmation emails'
      },
      { status: 500 }
    );
  }
}
