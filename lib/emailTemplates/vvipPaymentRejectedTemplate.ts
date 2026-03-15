// lib/emailTemplates/vvipPaymentRejectedTemplate.ts

/**
 * Email template for VVIP payment rejection notification
 * Requirements: 6.4, 6.7
 */
export function vvipPaymentRejectedTemplate({
  customerName,
  orderId,
  amountPaid,
  currency = 'USD',
  paymentReference,
  rejectionReason,
  adminNote,
  logoUrl = "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  customerName: string;
  orderId: string;
  amountPaid: number;
  currency?: string;
  paymentReference?: string;
  rejectionReason: string;
  adminNote?: string;
  logoUrl?: string;
}) {
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₦';

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Payment Issue - Stitches Africa</title>
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
                <div style="display:inline-block; background:#ef4444; color:#fff; padding:8px 16px; border-radius:20px; font-size:14px; font-weight:600;">
                  ⚠ Payment Issue
                </div>
              </div>
              
              <h1 style="margin:0 0 12px 0; font-size:24px; color:#102a43; text-align:center;">Payment Verification Issue</h1>
              <p style="margin:0 0 24px 0; font-size:16px; color:#6b7280; text-align:center;">
                Hi ${customerName}, we encountered an issue verifying your payment for order ${orderId}.
              </p>

              <div style="background:#fef2f2; border-left:4px solid #ef4444; padding:20px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 12px 0; font-size:15px; color:#991b1b; font-weight:600;">Payment Details:</p>
                <ul style="margin:0; padding-left:20px; color:#b91c1c; font-size:14px; line-height:1.6;">
                  <li><strong>Order ID:</strong> ${orderId}</li>
                  <li><strong>Amount Submitted:</strong> ${currencySymbol}${amountPaid.toFixed(2)}</li>
                  ${paymentReference ? `<li><strong>Reference:</strong> ${paymentReference}</li>` : ''}
                </ul>
              </div>

              <div style="background:#fff7ed; border-left:4px solid #f59e0b; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#92400e; font-weight:600;">Reason:</p>
                <p style="margin:0; font-size:14px; color:#b45309; line-height:1.6;">
                  ${rejectionReason}
                </p>
              </div>

              ${adminNote ? `
              <div style="background:#f9fafb; border-left:4px solid #667eea; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#374151; font-weight:600;">Additional Information:</p>
                <p style="margin:0; font-size:14px; color:#4b5563; line-height:1.6; font-style:italic;">
                  "${adminNote}"
                </p>
              </div>
              ` : ''}

              <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">What You Need to Do:</p>
                <p style="margin:0 0 12px 0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  Please review the reason above and take the necessary action. You can:
                </p>
                <ul style="margin:0; padding-left:20px; color:#1e3a8a; font-size:14px; line-height:1.6;">
                  <li>Resubmit your payment with the correct information</li>
                  <li>Contact our VVIP support team for assistance</li>
                  <li>Upload a clearer payment proof if needed</li>
                </ul>
              </div>

              <div style="text-align:center;">
                <a href="https://https://staging-stitches-africa.vercel.app/shops/account/orders" class="button" target="_blank" rel="noopener noreferrer">
                  View Order Details
                </a>
              </div>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; text-align:center;">
                Need help? Our VVIP support team is here for you at <a href="mailto:vvip@stitchesafrica.com" style="color:#000000;">vvip@stitchesafrica.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                We're here to help resolve this quickly
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
