/**
 * Admin new-order notification HTML (shop checkout).
 */

import {
  BRAND_ORANGE,
  actionCtaSectionHtml,
  emailDocumentClose,
  emailDocumentOpen,
  escapeHtml,
  formatPrice,
  renderOrderItemsList,
  type OrderItemPreview,
} from './order-email-shared';

export interface CouponInfoPreview {
  code: string;
  discountAmount: number;
  currency: string;
}

export interface ReferralInfoPreview {
  code: string;
  freeShippingGranted: boolean;
}

export interface VendorNotifiedPreview {
  vendorName: string;
  email: string;
}

export interface AdminOrderNotificationParams {
  orderId: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: OrderItemPreview[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  coupon?: CouponInfoPreview;
  referral?: ReferralInfoPreview;
  vendorEmails?: VendorNotifiedPreview[];
  hasBespokeItems?: boolean;
}

export function buildAdminOrderNotificationHtml(params: AdminOrderNotificationParams): string {
  const {
    orderId,
    orderDate,
    customerName,
    customerEmail,
    shippingAddress,
    items,
    subtotal,
    shippingCost,
    total,
    currency,
    coupon,
    referral,
    vendorEmails,
    hasBespokeItems,
  } = params;

  const curr = currency || 'NGN';
  const fp = (amount: number, c: string = curr) => formatPrice(amount, c);
  const safeShippingAddress = shippingAddress ?? '';
  const bespoke = hasBespokeItems ?? items.some((i) => i.type === 'bespoke');

  return `${emailDocumentOpen('New Order - Admin Notification')}
            <h2 style="color: #111827; margin: 0 0 12px; font-size: 22px; font-weight: 700;">
              <span class="accent" style="color: ${BRAND_ORANGE};">New Order</span> Placed
            </h2>
            <p class="text-muted" style="margin: 0 0 20px; color: #4b5563;">A new order has been placed on Stitches Africa.</p>

            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Order Details</h3>
              <p style="margin: 6px 0;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
              <p style="margin: 6px 0;"><strong>Order Date:</strong> ${escapeHtml(orderDate || '')}</p>
              <p style="margin: 6px 0;"><strong>Customer:</strong> ${escapeHtml(customerName || '')}</p>
              <p style="margin: 6px 0;"><strong>Customer Email:</strong> ${escapeHtml(customerEmail)}</p>
              <p style="margin: 6px 0;"><strong>Shipping Address:</strong><br>${safeShippingAddress
                .replace(/\n/g, '<br>')
                .split('<br>')
                .map((line) => escapeHtml(line))
                .join('<br>')}</p>
              ${referral ? `<p style="margin: 6px 0;"><strong>Referral Code:</strong> ${escapeHtml(referral.code)} (free shipping: ${referral.freeShippingGranted ? 'yes' : 'no'})</p>` : ''}
            </div>

            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Order Items (${items.length})</h3>
              ${renderOrderItemsList(items, (amount) => fp(amount))}
            </div>

            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Order Summary</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0;">Subtotal:</td>
                  <td style="text-align: right; padding: 8px 0;">${fp(subtotal ?? 0)}</td>
                </tr>
                ${coupon ? `
                <tr style="color: #16a34a;">
                  <td style="padding: 8px 0;">Coupon (${escapeHtml(coupon.code)}):</td>
                  <td style="text-align: right; padding: 8px 0;">-${fp(coupon.discountAmount, coupon.currency || curr)}</td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 8px 0;">Shipping:</td>
                  <td style="text-align: right; padding: 8px 0;">${fp(shippingCost ?? 0)}</td>
                </tr>
                <tr style="border-top: 2px solid #111827; font-weight: bold; font-size: 1.1em;">
                  <td style="padding: 12px 0;">Total:</td>
                  <td style="text-align: right; padding: 12px 0;">${fp(total ?? 0)}</td>
                </tr>
              </table>
            </div>

            ${bespoke ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Bespoke order</h3>
              <p style="color: #92400e; margin-bottom: 0;">This order includes bespoke items with customer measurements.</p>
            </div>
            ` : ''}

            ${vendorEmails && vendorEmails.length > 0 ? `
            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Vendors notified (${vendorEmails.length})</h3>
              ${vendorEmails.map((v) => `<p class="text-muted" style="margin: 6px 0; color: #4b5563;">• ${escapeHtml(v.vendorName)} (${escapeHtml(v.email)})</p>`).join('')}
            </div>
            ` : ''}

            ${actionCtaSectionHtml({
              eyebrow: 'Admin dashboard',
              headline: 'Review this order in Atlas',
              orderId,
              buttonLabel: 'View in admin dashboard →',
              buttonUrl: 'https://www.stitchesafrica.com/atlas',
            })}

            <p style="margin-top: 28px; margin-bottom: 0;">Best regards,<br><strong>Stitches Africa Team</strong></p>
          ${emailDocumentClose('This is an automated admin notification.')}`;
}
