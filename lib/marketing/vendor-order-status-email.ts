import { adminDb } from '@/lib/firebase-admin';

const EMAIL_API_URL =
  process.env.STITCHES_EMAIL_API_URL ||
  'https://stitchesafricamobile-backend.onrender.com/api/Email/Send';
const EMAIL_FROM = 'support@stitchesafrica.com';
const EMAIL_REPLY_TO = 'support@stitchesafrica.com';
const LOG_PREFIX = '[vendor-order-status-email]';

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

export type OrderStatusEmailSendResult = {
  sent: boolean;
  to: string | null;
  status?: number;
  error?: string;
  responseBody?: string;
};

export function prettyStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Same layout as production customer order-status email. */
export function buildCustomerOrderStatusHtml(params: {
  customerName: string;
  orderTitle: string;
  orderStatus: string;
}): string {
  const { customerName, orderTitle, orderStatus } = params;
  const statusLabel = prettyStatus(orderStatus);
  return `<html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px;">
      <div style="max-width:620px;margin:auto;background:#fff;padding:24px;border-radius:8px;">
      <h2 style="margin-top:0;">Order Status Updated</h2>
      <p>Hello ${customerName},</p>
      <p>Your order ${orderTitle} is now <strong>${statusLabel}</strong>.</p>
      <p>You can check your account orders page for latest tracking details.</p>
      <p style="color:#6b7280;font-size:12px;">Stitches Africa Team</p>
      </div></body></html>`;
}

/** Sends HTML via the same backend `/api/Email/Send` as order confirmation (Bearer when configured). */
export async function sendMarketingStatusEmail(
  to: string,
  name: string,
  subject: string,
  body: string,
): Promise<OrderStatusEmailSendResult> {
  if (!to) return { sent: false, to: null, error: 'Missing recipient email' };
  try {
    const res = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: emailApiHeaders(),
      body: JSON.stringify({
        body,
        subject,
        emails: [{ emailAddress: to, name: name || to }],
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
      }),
    });
    const raw = await res.text().catch(() => '');
    if (!res.ok) {
      console.error(`${LOG_PREFIX} Email API error:`, { to, status: res.status, raw });
      return {
        sent: false,
        to,
        status: res.status,
        error: `Email API ${res.status}`,
        responseBody: raw,
      };
    }
    return { sent: true, to, status: res.status, responseBody: raw };
  } catch (err) {
    console.error(`${LOG_PREFIX} sendHtmlEmail failed:`, err);
    return {
      sent: false,
      to,
      error: err instanceof Error ? err.message : 'Unknown email error',
    };
  }
}

export async function resolveVendorEmail(orderData: Record<string, unknown>): Promise<string> {
  const o = orderData as {
    vendor_email?: string;
    tailor_email?: string;
    tailor_id?: string;
  };
  if (o.vendor_email) return o.vendor_email;
  if (o.tailor_email) return o.tailor_email;
  const tailorId = o.tailor_id;
  if (!tailorId) return '';

  try {
    const tailorDoc = await adminDb.collection('tailors').doc(tailorId).get();
    const t = tailorDoc.data();
    const fromTailor =
      t?.email || t?.user_email || t?.contact?.email || '';
    if (fromTailor) return fromTailor;
  } catch (err) {
    console.warn(`${LOG_PREFIX} Failed to resolve tailor email:`, err);
  }

  try {
    const userDoc = await adminDb.collection('users').doc(tailorId).get();
    return userDoc.data()?.email || '';
  } catch (err) {
    console.warn(`${LOG_PREFIX} Failed to resolve user email for tailor:`, err);
    return '';
  }
}

export type OrderStatusNotifications = {
  customer: { email: string | null } & OrderStatusEmailSendResult;
  vendor: { email: string | null } & OrderStatusEmailSendResult;
};

/**
 * Notifies customer and vendor when a marketing user updates order status.
 */
export async function sendOrderStatusNotifications(params: {
  orderData: Record<string, unknown>;
  orderId: string;
  orderStatus: string;
  changedByEmail?: string;
}): Promise<OrderStatusNotifications> {
  const { orderData, orderId, orderStatus, changedByEmail } = params;
  const addr = orderData.user_address as
    | { user_email?: string; first_name?: string; last_name?: string }
    | undefined;
  const statusLabel = prettyStatus(orderStatus);
  const customerEmail = addr?.user_email || (orderData.user_email as string) || '';
  const customerName = `${addr?.first_name || ''} ${addr?.last_name || ''}`.trim() || 'Customer';
  const vendorName = (orderData.tailor_name as string) || 'Vendor';
  const orderTitle = (orderData.title as string) || 'your order';
  const vendorEmail = await resolveVendorEmail(orderData);

  const customerHtml = buildCustomerOrderStatusHtml({
    customerName,
    orderTitle,
    orderStatus,
  });

  const vendorHtml = `<html><body style="font-family:Arial,sans-serif;background:#f9fafb;padding:20px;">
      <div style="max-width:620px;margin:auto;background:#fff;padding:24px;border-radius:8px;">
      <h2 style="margin-top:0;">Order Status Updated</h2>
      <p>Hello ${vendorName},</p>
      <p>Order <strong>#${orderId}</strong> (${orderTitle}) has been updated to <strong>${statusLabel}</strong></p>
      <p>Please review order details in your vendor portal.</p>
      <p style="color:#6b7280;font-size:12px;">Updated by: ${changedByEmail || 'Stitches Africa Team'}</p>
      </div></body></html>`;

  const [customerResult, vendorResult] = await Promise.all([
    customerEmail
      ? sendMarketingStatusEmail(
          customerEmail,
          customerName,
          `Order ${orderId} status: ${statusLabel}`,
          customerHtml,
        )
      : Promise.resolve({ sent: false, to: null, error: 'Customer email missing' } as const),
    vendorEmail
      ? sendMarketingStatusEmail(vendorEmail, vendorName, `Order ${orderId} status updated`, vendorHtml)
      : Promise.resolve({ sent: false, to: null, error: 'Vendor email missing' } as const),
  ]);

  if (!customerResult.sent || !vendorResult.sent) {
    console.error(`${LOG_PREFIX} Notification send failure:`, {
      orderId,
      orderStatus,
      customer: customerResult,
      vendor: vendorResult,
    });
  }

  return {
    customer: { email: customerEmail || null, ...customerResult },
    vendor: { email: vendorEmail || null, ...vendorResult },
  };
}
