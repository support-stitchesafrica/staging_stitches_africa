/**
 * Coupon Email Template
 * 
 * Email sent to customers with their exclusive coupon code
 */

import { DiscountType } from '@/types/coupon';

export interface CouponEmailData {
  couponCode: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate?: Date;
  minOrderAmount?: number;
  recipientName?: string;
  logoUrl?: string;
}

export function couponEmailTemplate({
  couponCode,
  discountType,
  discountValue,
  expiryDate,
  minOrderAmount,
  recipientName = 'Valued Customer',
  logoUrl = 'https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png',
}: CouponEmailData): string {
  // Format discount display
  const discountDisplay = discountType === 'PERCENTAGE' 
    ? `${discountValue}% OFF` 
    : `₦${discountValue.toLocaleString()} OFF`;

  // Format expiry date
  const expiryDisplay = expiryDate 
    ? new Date(expiryDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    : null;

  // Format minimum order
  const minOrderDisplay = minOrderAmount 
    ? `₦${minOrderAmount.toLocaleString()}` 
    : null;

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Exclusive Coupon - Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:16px 32px; border-radius:8px; font-weight:600; display:inline-block; margin-top:20px; text-decoration:none; font-size:16px; }
    .coupon-code { background:#000000; color:#fff; padding:20px 32px; border-radius:12px; font-size:32px; font-weight:700; letter-spacing:2px; display:inline-block; margin:24px 0; font-family: 'Courier New', monospace; border:3px dashed #fff; box-shadow:0 8px 24px rgba(0,0,0,0.15); }
    .discount-badge { background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:#fff; padding:12px 24px; border-radius:24px; font-size:24px; font-weight:700; display:inline-block; margin-bottom:16px; box-shadow:0 4px 12px rgba(16,185,129,0.3); }
    @media only screen and (max-width:600px) { 
      .container { width:100% !important; }
      .coupon-code { font-size:24px; padding:16px 24px; }
      .discount-badge { font-size:20px; padding:10px 20px; }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stitches Africa" width="140" style="display:block; max-width:140px; height:auto; margin:0 auto;" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding:40px 28px;">
              <!-- Greeting -->
              <p style="margin:0 0 8px 0; font-size:16px; color:#6b7280; text-align:center;">
                Hello ${recipientName},
              </p>
              
              <h1 style="margin:0 0 16px 0; font-size:28px; color:#102a43; text-align:center; line-height:1.3;">
                🎉 You've Got an Exclusive Coupon!
              </h1>
              
              <p style="margin:0 0 32px 0; font-size:16px; color:#6b7280; text-align:center; line-height:1.6;">
                We're excited to offer you this special discount on your next purchase at Stitches Africa.
              </p>

              <!-- Discount Badge -->
              <div style="text-align:center; margin:32px 0;">
                <div class="discount-badge">
                  ${discountDisplay}
                </div>
              </div>

              <!-- Coupon Code -->
              <div style="text-align:center; margin:32px 0;">
                <p style="margin:0 0 12px 0; font-size:14px; color:#6b7280; text-transform:uppercase; letter-spacing:1px; font-weight:600;">
                  Your Coupon Code
                </p>
                <div class="coupon-code">
                  ${couponCode}
                </div>
                <p style="margin:12px 0 0 0; font-size:13px; color:#9ca3af; font-style:italic;">
                  Click to copy or enter at checkout
                </p>
              </div>

              <!-- Coupon Details -->
              <div style="background:#f9fafb; padding:24px; margin:32px 0; border-radius:12px; border:1px solid #e5e7eb;">
                <h2 style="margin:0 0 16px 0; font-size:18px; color:#102a43; text-align:center;">
                  Coupon Details
                </h2>
                
                <table width="100%" cellpadding="8" cellspacing="0">
                  <tr>
                    <td style="font-size:14px; color:#6b7280; padding:8px 0;">
                      <strong>Discount:</strong>
                    </td>
                    <td style="font-size:14px; color:#102a43; text-align:right; padding:8px 0;">
                      ${discountDisplay}
                    </td>
                  </tr>
                  ${minOrderDisplay ? `
                  <tr>
                    <td style="font-size:14px; color:#6b7280; padding:8px 0; border-top:1px solid #e5e7eb;">
                      <strong>Minimum Order:</strong>
                    </td>
                    <td style="font-size:14px; color:#102a43; text-align:right; padding:8px 0; border-top:1px solid #e5e7eb;">
                      ${minOrderDisplay}
                    </td>
                  </tr>
                  ` : ''}
                  ${expiryDisplay ? `
                  <tr>
                    <td style="font-size:14px; color:#6b7280; padding:8px 0; border-top:1px solid #e5e7eb;">
                      <strong>Valid Until:</strong>
                    </td>
                    <td style="font-size:14px; color:#102a43; text-align:right; padding:8px 0; border-top:1px solid #e5e7eb;">
                      ${expiryDisplay}
                    </td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="font-size:14px; color:#6b7280; padding:8px 0; border-top:1px solid #e5e7eb;">
                      <strong>Usage Limit:</strong>
                    </td>
                    <td style="font-size:14px; color:#102a43; text-align:right; padding:8px 0; border-top:1px solid #e5e7eb;">
                      One-time use
                    </td>
                  </tr>
                </table>
              </div>

              <!-- How to Use -->
              <div style="background:#dbeafe; border-left:4px solid #3b82f6; padding:20px; margin:32px 0; border-radius:8px;">
                <h3 style="margin:0 0 12px 0; font-size:16px; color:#1e40af; font-weight:600;">
                  📝 How to Use Your Coupon
                </h3>
                <ol style="margin:0; padding-left:20px; color:#1e3a8a; font-size:14px; line-height:1.8;">
                  <li>Browse our collection and add items to your cart</li>
                  <li>Proceed to checkout</li>
                  <li>Enter coupon code <strong>${couponCode}</strong> in the coupon field</li>
                  <li>Click "Apply" to see your discount</li>
                  <li>Complete your purchase and enjoy your savings!</li>
                </ol>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center; margin:32px 0;">
                <a href="https://staging-stitches-africa.vercel.app/shops/products" class="button" target="_blank" rel="noopener noreferrer">
                  Start Shopping Now
                </a>
              </div>

              <!-- Important Notes -->
              <div style="background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:32px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#92400e; font-weight:600;">
                  ⚠️ Important Notes
                </p>
                <ul style="margin:0; padding-left:20px; color:#b45309; font-size:13px; line-height:1.6;">
                  <li>This coupon is exclusively for your account</li>
                  <li>Cannot be combined with other offers</li>
                  <li>Cannot be transferred or sold</li>
                  ${expiryDisplay ? `<li>Must be used before ${expiryDisplay}</li>` : ''}
                  ${minOrderDisplay ? `<li>Minimum order value: ${minOrderDisplay}</li>` : ''}
                </ul>
              </div>

              <!-- Footer Message -->
              <p style="margin:32px 0 0 0; font-size:14px; color:#6b7280; text-align:center; line-height:1.6;">
                Thank you for being a valued customer!<br />
                We look forward to serving you.
              </p>

              <p style="margin-top:24px; font-size:13px; color:#9ca3af; text-align:center;">
                Questions? Contact us at <a href="mailto:support@stitchesafrica.com" style="color:#000000; text-decoration:none;">support@stitchesafrica.com</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="640" style="max-width:640px; margin-top:12px;">
          <tr>
            <td align="center" style="font-size:12px; color:#9aa6b2; padding:0 20px;">
              © ${new Date().getFullYear()} Stitches Africa. All rights reserved.
              <br />
              <a href="https://staging-stitches-africa.vercel.app/privacy-policy" style="color:#9aa6b2; text-decoration:none;">Privacy Policy</a> | 
              <a href="https://staging-stitches-africa.vercel.app/contact" style="color:#9aa6b2; text-decoration:none;">Contact Us</a>
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
