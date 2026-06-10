/**
 * Vendor new-order notification HTML (shop checkout).
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

export interface VendorOrderNotificationParams {
  vendorName: string;
  orderId: string;
  orderDate: string;
  items: OrderItemPreview[];
  subtotal: number;
  currency: string;
  hasBespokeItems?: boolean;
}

export function buildVendorOrderNotificationHtml(params: VendorOrderNotificationParams): string {
  const { vendorName, orderId, orderDate, items, subtotal, currency, hasBespokeItems } = params;
  const curr = currency || 'NGN';
  const fp = (amount: number) => formatPrice(amount, curr);
  const bespoke = hasBespokeItems ?? items.some((i) => i.type === 'bespoke');

  return `${emailDocumentOpen('New Order Notification')}
            <h2 style="color: #111827; margin: 0 0 12px; font-size: 22px; font-weight: 700;">
              <span class="accent" style="color: ${BRAND_ORANGE};">New Order</span> Received
            </h2>
            <p style="margin: 0 0 8px;">Hi ${escapeHtml(vendorName || 'Vendor')},</p>
            <p class="text-muted" style="margin: 0 0 20px; color: #4b5563;">You have received a new order on Stitches Africa. Please review the items below and process the order in your dashboard.</p>

            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Order Information</h3>
              <p style="margin: 6px 0;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
              <p style="margin: 6px 0;"><strong>Order Date:</strong> ${escapeHtml(orderDate || '')}</p>
            </div>

            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Your Items</h3>
              ${renderOrderItemsList(items, fp)}
              <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
                <tr style="border-top: 2px solid #111827; font-weight: bold;">
                  <td style="padding: 12px 0;">Your subtotal</td>
                  <td style="text-align: right; padding: 12px 0;">${fp(subtotal ?? 0)}</td>
                </tr>
              </table>
            </div>

            ${bespoke ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Bespoke items</h3>
              <p style="color: #92400e; margin-bottom: 0;">This order includes bespoke pieces. Measurements and customer specs are available in your vendor dashboard only.</p>
            </div>
            ` : ''}

            <p class="text-muted" style="margin-top: 24px; color: #4b5563;">Log in to your vendor dashboard to view full order details and begin processing.</p>

            ${actionCtaSectionHtml({
              eyebrow: 'Vendor dashboard',
              headline: 'View and process this order',
              orderId,
              buttonLabel: 'View order details →',
              buttonUrl: `https://www.stitchesafrica.com/vendor/orders/${encodeURIComponent(orderId)}`,
            })}

            <p style="margin-top: 28px; margin-bottom: 0;">Best regards,<br><strong>Stitches Africa Team</strong></p>
          ${emailDocumentClose('This is an automated email. Please do not reply to this message.')}`;
}
