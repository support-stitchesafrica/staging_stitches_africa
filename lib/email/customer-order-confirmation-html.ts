/**
 * Customer-facing order confirmation HTML (shop checkout).
 * Kept in one module so previews and the API route stay in sync.
 */

import {
  BRAND_ORANGE,
  EMAIL_LOGO_URL,
  actionCtaSectionHtml,
  emailDocumentClose,
  emailDocumentOpen,
  escapeHtml,
  formatPrice,
  renderOrderItemsList,
  type OrderItemPreview,
} from './order-email-shared';

/** @deprecated Use EMAIL_LOGO_URL from order-email-shared */
export const CUSTOMER_EMAIL_LOGO_URL = EMAIL_LOGO_URL;

export type { OrderItemPreview };

export interface CouponInfoPreview {
  code: string;
  discountAmount: number;
  currency: string;
}

export interface ReferralInfoPreview {
  code: string;
  referrerName?: string;
  freeShippingGranted: boolean;
  freeShippingReason?: string;
}

export function buildCustomerOrderConfirmationHtml(params: {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: OrderItemPreview[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  shippingAddress: string;
  coupon?: CouponInfoPreview;
  referral?: ReferralInfoPreview;
  measurements?: unknown;
}): string {
  const {
    customerName,
    orderId,
    orderDate,
    items,
    subtotal,
    shippingCost,
    total,
    currency,
    shippingAddress,
    coupon,
    referral,
    measurements,
  } = params;

  const curr = currency || 'NGN';
  const fp = (amount: number, c: string = curr) => formatPrice(amount, c);
  const safeShippingAddress = shippingAddress ?? '';

  return `${emailDocumentOpen('Order Confirmation')}
            <h2 style="color: #111827; margin: 0 0 12px; font-size: 22px; font-weight: 700;">
              <span class="thank-you" style="color: ${BRAND_ORANGE};">Thank You</span> for Your Order!
            </h2>
            <p style="margin: 0 0 8px;">Hi ${escapeHtml(customerName || 'Customer')},</p>
            <p class="text-muted" style="margin: 0 0 20px; color: #4b5563;">We've received your order and will process it shortly. Here are your order details:</p>
            
            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Order Details</h3>
              <p style="margin: 6px 0;"><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
              <p style="margin: 6px 0;"><strong>Order Date:</strong> ${escapeHtml(orderDate || '')}</p>
              <p style="margin: 6px 0;"><strong>Shipping Address:</strong><br>${safeShippingAddress.replace(/\n/g, '<br>').split('<br>').map((line) => escapeHtml(line)).join('<br>')}</p>
            </div>

            <div class="email-card" style="background-color: #fff; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; color: #111827;">Items Ordered</h3>
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
                ${referral ? `
                <tr>
                  <td colspan="2" style="padding: 4px 0;">
                    ${referral.freeShippingGranted
                      ? `<div style="background-color: #dcfce7; border-left: 4px solid #16a34a; padding: 8px 12px; border-radius: 4px; color: #15803d;">🎉 Free shipping applied via referral code ${escapeHtml(referral.code)}</div>`
                      : `<div style="padding: 4px 0; color: #6b7280;">Referral code applied: ${escapeHtml(referral.code)}</div>`
                    }
                  </td>
                </tr>
                ` : ''}
                <tr style="border-top: 2px solid #111827; font-weight: bold; font-size: 1.1em;">
                  <td style="padding: 12px 0;">Total:</td>
                  <td style="text-align: right; padding: 12px 0;">${fp(total ?? 0)}</td>
                </tr>
              </table>
            </div>

            ${measurements ? `
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="margin-top: 0; color: #92400e;">Bespoke Items — Measurements Included</h3>
              <p style="color: #92400e; margin-bottom: 0;">Your custom measurements have been included with this order for bespoke items.</p>
            </div>
            ` : ''}

            <p class="text-muted" style="margin-top: 24px; color: #4b5563;">We'll send you another email when your order ships.</p>
            <p class="text-muted" style="color: #4b5563;">If you have any questions, please don't hesitate to contact us.</p>
            
            ${actionCtaSectionHtml({
              eyebrow: 'Shipment tracking',
              headline: 'Your order is on its way — track it anytime',
              orderId,
              buttonLabel: 'Track my order →',
              buttonUrl: `https://www.stitchesafrica.com/track-order/${encodeURIComponent(orderId)}`,
            })}
            
            <p style="margin-top: 28px; margin-bottom: 0;">Best regards,<br><strong>Stitches Africa Team</strong></p>
          ${emailDocumentClose()}`;
}
