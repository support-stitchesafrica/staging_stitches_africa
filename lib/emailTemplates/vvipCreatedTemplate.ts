// lib/emailTemplates/vvipCreatedTemplate.ts

/**
 * Email template for VVIP status creation notification
 * Requirements: 6.1
 */
export function vvipCreatedTemplate({
  customerName,
  email,
  logoUrl = "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  customerName: string;
  email: string;
  logoUrl?: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Welcome to VVIP Program - Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:24px; text-decoration:none; }
    .button:hover { background:#333333; }
    .vvip-badge { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#fff; padding:12px 24px; border-radius:24px; font-size:16px; font-weight:700; display:inline-block; margin:20px 0; }
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
            <td style="padding:32px 28px; text-align:center;">
              <div class="vvip-badge">
                ⭐ VVIP MEMBER ⭐
              </div>
              
              <h1 style="margin:0 0 16px 0; font-size:28px; color:#102a43;">Congratulations, ${customerName}!</h1>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                You've been granted exclusive <strong>VVIP status</strong> on Stitches Africa.
              </p>
              
              <div style="background:#f9fafb; border-left:4px solid #667eea; padding:20px; margin:24px 0; border-radius:4px; text-align:left;">
                <p style="margin:0 0 12px 0; font-size:15px; color:#374151; font-weight:600;">Your Exclusive Benefits:</p>
                <ul style="margin:0; padding-left:20px; color:#4b5563; font-size:15px; line-height:1.8;">
                  <li><strong>Manual Payment Option:</strong> Pay via direct bank transfer at checkout</li>
                  <li><strong>Priority Processing:</strong> Your orders receive expedited handling</li>
                  <li><strong>Dedicated Support:</strong> Direct access to our VVIP support team</li>
                  <li><strong>Flexible Payment Terms:</strong> Convenient payment confirmation process</li>
                </ul>
              </div>

              <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:16px; margin:24px 0; border-radius:4px; text-align:left;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">How It Works:</p>
                <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  When you checkout, you'll see a manual payment option. Simply transfer funds to our bank account, upload your payment proof, and we'll verify and process your order promptly.
                </p>
              </div>

              <a href="https://staging-stitches-africa.vercel.app/shops/products" class="button" target="_blank" rel="noopener noreferrer">
                Start Shopping
              </a>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; line-height:1.6;">
                Questions about your VVIP status? Contact us at <a href="mailto:vvip@stitchesafrica.com" style="color:#000000;">vvip@stitchesafrica.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                This is an exclusive invitation. Your VVIP status is active on: <strong>${email}</strong>
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
