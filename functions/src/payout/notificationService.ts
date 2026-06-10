import { Firestore, Timestamp } from "firebase-admin/firestore";
import { PayoutProvider, PayoutStatus } from "./types";

const EMAIL_API_URL =
  "https://stitchesafricamobile-backend.onrender.com/api/Email/Send";

const ADMIN_EMAILS = [
  "stitchesafrica1m@gmail.com",
  "stitchesafrica8m@gmail.com",
  "support@stitchesafrica.com",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendEmail(
  to: string,
  name: string,
  subject: string,
  html: string
): Promise<void> {
  const response = await fetch(EMAIL_API_URL, {
    method: "POST",
    headers: { accept: "*/*", "Content-Type": "application/json" },
    body: JSON.stringify({
      body: html,
      subject,
      emails: [{ emailAddress: to, name }],
      from: "noreply@stitchesafrica.com",
      replyTo: "support@stitchesafrica.com",
    }),
  });

  if (!response.ok) {
    throw new Error(`Email API error ${response.status}: ${response.statusText}`);
  }
}

// ─── Vendor in-app notification ───────────────────────────────────────────────

export interface VendorPayoutNotifData {
  orderId: string;
  amount: number;
  currency: string;
  reference: string;
  productTitle?: string;
}

/**
 * Writes a payout-success in-app notification to
 * `notifications/{vendorId}/items/{id}`.
 */
export async function sendVendorPayoutNotification(
  db: Firestore,
  vendorId: string,
  data: VendorPayoutNotifData
): Promise<void> {
  const { orderId, amount, currency, reference, productTitle } = data;

  await db
    .collection("notifications")
    .doc(vendorId)
    .collection("items")
    .add({
      type: "payout_success",
      title: "Payment Released",
      body: `${currency} ${amount.toFixed(2)} has been sent for order #${orderId}${productTitle ? ` — ${productTitle}` : ""}`,
      orderId,
      amount,
      currency,
      reference,
      read: false,
      createdAt: Timestamp.now(),
    });
}

// ─── Admin in-app notification ────────────────────────────────────────────────

export interface AdminPayoutNotifData {
  orderId: string;
  vendorId: string;
  status: PayoutStatus;
  amount: number;
  currency: string;
  provider?: PayoutProvider | null;
  reference?: string | null;
  error?: string | null;
  reason?: string | null;
}

/**
 * Writes a payout-event notification to `admin_notifications`.
 */
export async function sendAdminPayoutNotification(
  db: Firestore,
  data: AdminPayoutNotifData
): Promise<void> {
  await db.collection("admin_notifications").add({
    type: "payout_event",
    ...data,
    createdAt: Timestamp.now(),
  });
}

// ─── Vendor payout email ──────────────────────────────────────────────────────

export interface PayoutEmailData {
  orderId: string;
  amount: number;
  currency: string;
  reference: string;
  productTitle?: string;
  vendorName?: string;
  vendorEmail: string;
}

/**
 * Sends a payout-success email directly to the vendor via the Stitches Africa
 * email API (same pattern used across the platform).
 */
export async function logPayoutEmail(
  _db: Firestore,
  to: string,
  data: PayoutEmailData
): Promise<void> {
  const { orderId, amount, currency, reference, productTitle, vendorName } = data;
  const name = vendorName ?? "Vendor";
  const currencySymbol = currency === "NGN" ? "₦" : currency;
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Payout Received - Stitches Africa</title></head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8fafc;margin:0;padding:20px;line-height:1.6;">
  <table style="max-width:600px;margin:0 auto;background:white;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,.1);overflow:hidden;">
    <tr>
      <td style="background:linear-gradient(135deg,#1f2937 0%,#374151 100%);padding:30px;text-align:center;">
        <img src="https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png" width="140" alt="Stitches Africa" style="margin-bottom:10px;"/>
        <h1 style="color:white;margin:0;font-size:24px;font-weight:600;">Payout Received!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 30px;">
        <h2 style="color:#111827;margin:0 0 20px 0;font-size:20px;">Hello ${name},</h2>
        <p style="color:#374151;margin:0 0 25px 0;font-size:16px;">
          Your order <strong>#${orderId}</strong>${productTitle ? ` (${productTitle})` : ""} has been delivered and your payout has been processed.
        </p>
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:25px;border-radius:12px;margin:25px 0;text-align:center;">
          <p style="margin:0;color:rgba(255,255,255,.9);font-size:14px;font-weight:500;">PAYOUT AMOUNT</p>
          <p style="margin:8px 0 0 0;color:white;font-size:32px;font-weight:bold;">${currencySymbol}${amount.toFixed(2)}</p>
        </div>
        <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:25px 0;border-left:4px solid #3b82f6;">
          <h3 style="color:#1f2937;margin:0 0 15px 0;font-size:16px;">Transaction Details</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Order ID:</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">#${orderId}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Reference:</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${reference}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Date:</td><td style="padding:8px 0;color:#111827;font-size:14px;font-weight:600;">${currentDate}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280;font-size:14px;">Status:</td><td style="padding:8px 0;color:#059669;font-size:14px;font-weight:600;">✓ Completed</td></tr>
          </table>
        </div>
        <div style="text-align:center;margin:35px 0;">
          <a href="https://www.stitchesafrica.com/vendor/orders/${orderId}"
             style="display:inline-block;background:#1f2937;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">
            View Order
          </a>
        </div>
        <p style="color:#6b7280;font-size:14px;margin:30px 0 0 0;text-align:center;">
          Thank you for being a valued partner of Stitches Africa.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:20px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#6b7280;margin:5px 0;font-size:14px;">
          📧 <a href="mailto:support@stitchesafrica.com" style="color:#3b82f6;text-decoration:none;">support@stitchesafrica.com</a>
        </p>
        <p style="color:#9ca3af;font-size:12px;margin:10px 0 0 0;">
          © ${new Date().getFullYear()} Stitches Africa. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail(to, name, `Payout Received — Order #${orderId} | Stitches Africa`, html);
}

// ─── Admin payout email ───────────────────────────────────────────────────────

export interface AdminPayoutEmailData {
  orderId: string;
  vendorId: string;
  vendorName?: string;
  status: PayoutStatus;
  amount: number;
  currency: string;
  provider?: PayoutProvider | null;
  reference?: string | null;
  error?: string | null;
  reason?: string | null;
}

/**
 * Sends a payout-event email to all admin addresses.
 * Called for every payout outcome (success, failure, skip).
 */
export async function sendAdminPayoutEmail(data: AdminPayoutEmailData): Promise<void> {
  const { orderId, vendorId, vendorName, status, amount, currency, provider, reference, error, reason } = data;
  const currencySymbol = currency === "NGN" ? "₦" : currency;

  const statusColor = status === "completed" ? "#059669" : status === "failed" ? "#dc2626" : "#d97706";
  const statusLabel = status.toUpperCase();

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Payout Event — Admin</title></head>
<body style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <table style="max-width:600px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,.1);">
    <tr>
      <td style="background:#7c3aed;padding:25px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:22px;">Payout Event — Admin Notification</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:30px;">
        <div style="background:#f8fafc;padding:20px;border-radius:8px;border-left:4px solid ${statusColor};">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Status:</td><td style="padding:6px 0;color:${statusColor};font-size:14px;font-weight:700;">${statusLabel}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Order ID:</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">#${orderId}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Vendor:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${vendorName ?? vendorId}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount:</td><td style="padding:6px 0;color:#111827;font-size:14px;font-weight:600;">${currencySymbol}${amount.toFixed(2)}</td></tr>
            ${provider ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Provider:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${provider}</td></tr>` : ""}
            ${reference ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Reference:</td><td style="padding:6px 0;color:#111827;font-size:14px;">${reference}</td></tr>` : ""}
            ${error ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Error:</td><td style="padding:6px 0;color:#dc2626;font-size:14px;">${error}</td></tr>` : ""}
            ${reason ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Skip Reason:</td><td style="padding:6px 0;color:#d97706;font-size:14px;">${reason}</td></tr>` : ""}
          </table>
        </div>
        <div style="text-align:center;margin:25px 0;">
          <a href="https://www.stitchesafrica.com/admin/vendor"
             style="display:inline-block;background:#7c3aed;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            View in Admin Dashboard
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background:#f8fafc;padding:15px;text-align:center;border-top:1px solid #e5e7eb;">
        <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Stitches Africa — Automated admin notification</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subject = `Payout ${statusLabel} — Order #${orderId} | Stitches Africa`;

  await Promise.allSettled(
    ADMIN_EMAILS.map((email) => sendEmail(email, "Admin", subject, html))
  );
}
