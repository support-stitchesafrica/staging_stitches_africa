// lib/emailTemplates/vvipOrderShippedTemplate.ts

/**
 * Email template for VVIP order shipment notification
 * Requirements: 6.5
 */
export function vvipOrderShippedTemplate({
  customerName,
  orderId,
  trackingNumber,
  carrier,
  estimatedDelivery,
  trackingUrl,
  logoUrl = "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  customerName: string;
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
  logoUrl?: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Order Shipped - Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:20px; text-decoration:none; }
    .vvip-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:6px 12px; border-radius:12px; font-size:12px; font-weight:700; display:inline-block; }
    @media only screen and (max-width:600px) { .container { width:100% !important; } }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <tr>
            <td align="center" style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stitches Africa" width="140" style="display:block; max-width:140px; height:auto; margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;">
              <div style="text-align:center; margin-bottom:24px;">
                <div class="vvip-badge" style="margin-right:8px;">
                  ⭐ VVIP ORDER
                </div>
                <div style="display:inline-block; background:#8b5cf6; color:#fff; padding:8px 16px; border-radius:20px; font-size:14px; font-weight:600;">
                  🚚 Shipped
                </div>
              </div>
              
              <h1 style="margin:0 0 12px 0; font-size:24px; color:#102a43; text-align:center;">Your Order is On Its Way!</h1>
              <p style="margin:0 0 24px 0; font-size:16px; color:#6b7280; text-align:center;">
                Great news, ${customerName}! Your order has been shipped and is heading your way.
              </p>

              <div style="background:#f0fdf4; border-left:4px solid #10b981; padding:20px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 12px 0; font-size:15px; color:#065f46; font-weight:600;">Shipping Details:</p>
                <ul style="margin:0; padding-left:20px; color:#047857; font-size:14px; line-height:1.6;">
                  <li><strong>Order ID:</strong> ${orderId}</li>
                  ${trackingNumber ? `<li><strong>Tracking Number:</strong> ${trackingNumber}</li>` : ''}
                  ${carrier ? `<li><strong>Carrier:</strong> ${carrier}</li>` : ''}
                  ${estimatedDelivery ? `<li><strong>Estimated Delivery:</strong> ${estimatedDelivery}</li>` : ''}
                </ul>
              </div>

              ${trackingUrl ? `
              <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">Track Your Package:</p>
                <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  You can track your shipment in real-time using the tracking number above or by clicking the button below.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="${trackingUrl}" class="button" target="_blank" rel="noopener noreferrer">
                  Track Shipment
                </a>
              </div>
              ` : `
              <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">Delivery Information:</p>
                <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  Your order is being prepared for delivery. We'll update you with tracking information as soon as it's available.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="https://staging-stitches-africa.vercel.app/shops/account/orders" class="button" target="_blank" rel="noopener noreferrer">
                  View Order Details
                </a>
              </div>
              `}

              <div style="background:#f9fafb; border-left:4px solid #667eea; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#374151; font-weight:600;">💜 VVIP Priority Shipping</p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6;">
                  As a VVIP member, your order has been given priority handling and expedited processing. Thank you for your continued support!
                </p>
              </div>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; text-align:center;">
                Questions about your delivery? Contact our VVIP support at <a href="mailto:vvip@stitchesafrica.com" style="color:#000000;">vvip@stitchesafrica.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                We hope you love your purchase!
              </p>
            </td>
          </tr>
        </table>
        <table width="640" style="max-width:640px; margin-top:12px;">
          <tr>
            <td align="center" style="font-size:12px; color:#9aa6b2;">
              © ${new Date().getFullYear()} Stitches Africa. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
