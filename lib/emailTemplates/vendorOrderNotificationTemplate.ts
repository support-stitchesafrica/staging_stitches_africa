// lib/emailTemplates/vendorOrderNotificationTemplate.ts

// Type definition for measurements data
interface MeasurementsData {
  userId: string;
  volume_params: Record<string, number>;
  updatedAt: string;
  hasBespokeItems: boolean;
}

export function vendorOrderNotificationTemplate({
  vendorName,
  orderId,
  orderDate,
  customerName,
  items,
  subtotal,
  currency = 'USD',
  shippingAddress,
  measurements,
  logoUrl = "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  vendorName: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
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
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Order Received - Stitches Africa</title>
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
                <div style="display:inline-block; background:#3b82f6; color:#fff; padding:8px 16px; border-radius:20px; font-size:14px; font-weight:600;">
                  🔔 New Order
                </div>
              </div>
              
              <h1 style="margin:0 0 12px 0; font-size:24px; color:#102a43; text-align:center;">New Order Received!</h1>
              <p style="margin:0 0 24px 0; font-size:16px; color:#6b7280; text-align:center;">
                Hi ${vendorName}, you have a new order to fulfill.
              </p>

              <div style="background:#f9fafb; padding:20px; margin:24px 0; border-radius:8px;">
                <p style="margin:0 0 12px 0; font-size:14px; color:#6b7280;"><strong>Order Information:</strong></p>
                <p style="margin:0 0 8px 0; font-size:15px; color:#102a43;">
                  <strong>Order ID:</strong> ${orderId}
                </p>
                <p style="margin:0 0 8px 0; font-size:15px; color:#102a43;">
                  <strong>Order Date:</strong> ${orderDate}
                </p>
                <p style="margin:0; font-size:15px; color:#102a43;">
                  <strong>Customer:</strong> ${customerName}
                </p>
              </div>

              <h2 style="margin:24px 0 16px 0; font-size:18px; color:#102a43;">Order Items</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${itemsHtml}
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr style="border-top:2px solid #102a43;">
                  <td style="padding:12px 0; font-size:17px; color:#102a43; font-weight:700;">Order Total:</td>
                  <td style="padding:12px 0; text-align:right; font-size:17px; color:#102a43; font-weight:700;">${currencySymbol}${subtotal.toFixed(2)}</td>
                </tr>
              </table>

              <div style="background:#f9fafb; padding:16px; margin:24px 0; border-radius:8px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;"><strong>Shipping Address:</strong></p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6;">${shippingAddress}</p>
              </div>

              ${measurements && measurements.hasBespokeItems ? `
              <div style="background:#fff3cd; border:2px solid #ffc107; padding:20px; margin:24px 0; border-radius:8px;">
                <h3 style="margin:0 0 12px 0; font-size:18px; color:#856404; display:flex; align-items:center;">
                  📏 Customer Measurements
                </h3>
                <p style="margin:0 0 16px 0; font-size:14px; color:#856404; line-height:1.6;">
                  This order contains bespoke items. Customer measurements are included below for accurate custom fitting:
                </p>
                <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:16px;">
                  ${Object.entries(measurements.volume_params)
                    .filter(([_, value]) => value > 0)
                    .map(([key, value]) => `
                      <div style="background:#ffffff; padding:12px; border-radius:6px; border:1px solid #ffc107;">
                        <div style="font-size:12px; color:#856404; text-transform:capitalize; margin-bottom:4px; font-weight:600;">
                          ${key.replace(/_/g, ' ')}
                        </div>
                        <div style="font-size:18px; font-weight:700; color:#333333;">
                          ${value}"
                        </div>
                      </div>
                    `).join('')}
                </div>
                <p style="margin:0; font-size:13px; color:#856404; font-style:italic;">
                  📅 Measurements last updated: ${new Date(measurements.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              ` : ''}

              <div style="background:#fef3c7; border-left:4px solid:#f59e0b; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#92400e; font-weight:600;">⚡ Action Required</p>
                <p style="margin:0; font-size:14px; color:#92400e; line-height:1.6;">
                  Please log in to your vendor dashboard to view the full order details and begin processing this order.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="https://https://staging-stitches-africa.vercel.app/vendor/orders/${orderId}" class="button" target="_blank" rel="noopener noreferrer">
                  View Order Details
                </a>
              </div>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; text-align:center;">
                Questions? Contact support at <a href="mailto:support@stitchesafrica.com" style="color:#000000;">support@stitchesafrica.com</a>
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
