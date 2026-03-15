// lib/emailTemplates/customerOrderConfirmationTemplate.ts

// Type definition for measurements data
interface MeasurementsData {
  userId: string;
  volume_params: Record<string, number>;
  updatedAt: string;
  hasBespokeItems: boolean;
}

export function customerOrderConfirmationTemplate({
  customerName,
  orderId,
  orderDate,
  items,
  subtotal,
  shippingCost,
  total,
  currency = 'USD',
  shippingAddress,
  measurements,
  logoUrl = "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
  shippingCost: number;
  total: number;
  currency?: string;
  shippingAddress: string;
  measurements?: MeasurementsData;
  logoUrl?: string;
}) {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '$';
  
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #eef2f6;">
        <div style="display:flex; align-items:center;">
          ${item.image ? `<img src="${item.image}" alt="${item.title}" width="60" style="border-radius:8px; margin-right:12px;" />` : ''}
          <div>
            <p style="margin:0 0 4px 0; font-size:15px; color:#102a43; font-weight:600;">${item.title}</p>
            <p style="margin:0; font-size:14px; color:#6b7280;">Quantity: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 0; border-bottom:1px solid #eef2f6; text-align:right;">
        <p style="margin:0; font-size:15px; color:#102a43; font-weight:600;">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</p>
      </td>
    </tr>
  `).join('');

  return `
<!doctype html>
<html lang="en"></html>meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Order Confirmation - Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:20px; text-decoration:none; }
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
                <div style="display:inline-block; background:#10b981; color:#fff; padding:8px 16px; border-radius:20px; font-size:14px; font-weight:600;">
                  ✓ Order Confirmed
                </div>
              </div>
              
              <h1 style="margin:0 0 12px 0; font-size:24px; color:#102a43; text-align:center;">Thank You, ${customerName}!</h1>
              <p style="margin:0 0 24px 0; font-size:16px; color:#6b7280; text-align:center;">
                Your order has been received and is being processed.
              </p>

              <div style="background:#f9fafb; padding:20px; margin:24px 0; border-radius:8px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;"><strong>Order Details:</strong></p>
                <p style="margin:0 0 6px 0; font-size:15px; color:#102a43;">
                  <strong>Order ID:</strong> ${orderId}
                </p>
                <p style="margin:0; font-size:15px; color:#102a43;">
                  <strong>Order Date:</strong> ${orderDate}
                </p>
              </div>

              <h2 style="margin:24px 0 16px 0; font-size:18px; color:#102a43;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr>
                  <td style="padding:8px 0; font-size:15px; color:#6b7280;">Subtotal:</td>
                  <td style="padding:8px 0; text-align:right; font-size:15px; color:#102a43;">${currencySymbol}${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0; font-size:15px; color:#6b7280;">Shipping:</td>
                  <td style="padding:8px 0; text-align:right; font-size:15px; color:#102a43;">${currencySymbol}${shippingCost.toFixed(2)}</td>
                </tr>
                <tr style="border-top:2px solid #102a43;">
                  <td style="padding:12px 0; font-size:17px; color:#102a43; font-weight:700;">Total:</td>
                  <td style="padding:12px 0; text-align:right; font-size:17px; color:#102a43; font-weight:700;">${currencySymbol}${total.toFixed(2)}</td>
                </tr>
              </table>

              <div style="background:#f9fafb; padding:16px; margin:24px 0; border-radius:8px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;"><strong>Shipping Address:</strong></p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6;">${shippingAddress}</p>
              </div>

              ${measurements && measurements.hasBespokeItems ? `
              <div style="background:#f0fdf4; border-left:4px solid:#10b981; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#065f46; font-weight:600;">✓ Custom Measurements Included</p>
                <p style="margin:0 0 12px 0; font-size:14px; color:#047857; line-height:1.6;">
                  Your body measurements have been included with this order for custom fitting. Our vendors will use these measurements to create your bespoke items.
                </p>
                <p style="margin:0; font-size:13px; color:#059669;">
                  <strong>Last updated:</strong> ${new Date(measurements.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              ` : ''}

              <div style="background:#dbeafe; border-left:4px solid:#3b82f6; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">What's Next?</p>
                <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  We'll send you another email when your order ships. You can track your order status anytime from your account dashboard.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="https://staging-stitches-africa.vercel.app/shops/account/orders" class="button" target="_blank" rel="noopener noreferrer">
                  Track Your Order
                </a>
              </div>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; text-align:center;">
                Questions? Contact us at <a href="mailto:support@stitchesafrica.com" style="color:#000000;">support@stitchesafrica.com</a>
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
