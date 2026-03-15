// lib/emailTemplates/vvipOrderPlacedTemplate.ts

/**
 * Email template for VVIP order placement notification
 * Requirements: 6.2
 */
export function vvipOrderPlacedTemplate({
  customerName,
  orderId,
  orderDate,
  items,
  total,
  currency = 'USD',
  amountPaid,
  paymentReference,
  paymentDate,
  logoUrl = "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: Array<{ title: string; quantity: number; price: number; image?: string }>;
  total: number;
  currency?: string;
  amountPaid: number;
  paymentReference?: string;
  paymentDate: string;
  logoUrl?: string;
}) {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₦';
  
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
  <title>VVIP Order Received - Stitches Africa</title>
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
                <div style="display:inline-block; background:#f59e0b; color:#fff; padding:8px 16px; border-radius:20px; font-size:14px; font-weight:600;">
                  ⏳ Payment Verification Pending
                </div>
              </div>
              
              <h1 style="margin:0 0 12px 0; font-size:24px; color:#102a43; text-align:center;">Order Received, ${customerName}!</h1>
              <p style="margin:0 0 24px 0; font-size:16px; color:#6b7280; text-align:center;">
                Your VVIP order has been received and is awaiting payment verification.
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

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px; border-top:2px solid #102a43;">
                <tr>
                  <td style="padding:12px 0; font-size:17px; color:#102a43; font-weight:700;">Total:</td>
                  <td style="padding:12px 0; text-align:right; font-size:17px; color:#102a43; font-weight:700;">${currencySymbol}${total.toFixed(2)}</td>
                </tr>
              </table>

              <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#92400e; font-weight:600;">Payment Information Received</p>
                <p style="margin:0 0 12px 0; font-size:14px; color:#b45309; line-height:1.6;">
                  We've received your payment proof and the following details:
                </p>
                <ul style="margin:0; padding-left:20px; color:#b45309; font-size:14px; line-height:1.6;">
                  <li><strong>Amount Paid:</strong> ${currencySymbol}${amountPaid.toFixed(2)}</li>
                  ${paymentReference ? `<li><strong>Reference:</strong> ${paymentReference}</li>` : ''}
                  <li><strong>Payment Date:</strong> ${paymentDate}</li>
                </ul>
              </div>

              <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">What's Next?</p>
                <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  Our team is verifying your payment. You'll receive a confirmation email once your payment is approved and your order moves to processing. This typically takes 1-2 business days.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="https://https://staging-stitches-africa.vercel.app/shops/account/orders" class="button" target="_blank" rel="noopener noreferrer">
                  View Order Status
                </a>
              </div>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; text-align:center;">
                Questions? Contact our VVIP support at <a href="mailto:vvip@stitchesafrica.com" style="color:#000000;">vvip@stitchesafrica.com</a>
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
