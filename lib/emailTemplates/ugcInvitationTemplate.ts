/**
 * UGC Invitation Email Template
 * 
 * Post-purchase email inviting customers to upload photos
 * for reward points
 */

export function ugcInvitationTemplate({
  customerName,
  productName,
  productImage,
  productId,
  orderId,
  rewardPoints = 50,
  uploadUrl,
  logoUrl = "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  customerName: string;
  productName: string;
  productImage?: string;
  productId: string;
  orderId: string;
  rewardPoints?: number;
  uploadUrl: string;
  logoUrl?: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Share Your Style - Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:20px; text-decoration:none; }
    .button-secondary { background:#ffffff; color:#000000 !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:12px; text-decoration:none; border:2px solid #000000; }
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
                  🎁 Earn ${rewardPoints} Points
                </div>
              </div>
              
              <h1 style="margin:0 0 12px 0; font-size:24px; color:#102a43; text-align:center;">Love Your Purchase?</h1>
              <p style="margin:0 0 24px 0; font-size:16px; color:#6b7280; text-align:center;">
                Share a photo and help other shoppers find their perfect fit!
              </p>

              ${productImage ? `
              <div style="text-align:center; margin:24px 0;">
                <img src="${productImage}" alt="${productName}" width="200" style="border-radius:12px; box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
              </div>
              ` : ''}

              <div style="background:#f9fafb; padding:20px; margin:24px 0; border-radius:8px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;"><strong>Product:</strong></p>
                <p style="margin:0 0 12px 0; font-size:15px; color:#102a43;">${productName}</p>
                <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;"><strong>Order ID:</strong></p>
                <p style="margin:0; font-size:15px; color:#102a43;">${orderId}</p>
              </div>

              <h2 style="margin:24px 0 16px 0; font-size:18px; color:#102a43; text-align:center;">Why Share Your Photo?</h2>
              
              <div style="margin:24px 0;">
                <div style="display:flex; align-items:start; margin-bottom:16px;">
                  <div style="background:#10b981; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; margin-right:12px; flex-shrink:0;">1</div>
                  <div>
                    <p style="margin:0 0 4px 0; font-size:15px; color:#102a43; font-weight:600;">Earn Reward Points</p>
                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">Get ${rewardPoints} points to use on your next purchase</p>
                  </div>
                </div>
                
                <div style="display:flex; align-items:start; margin-bottom:16px;">
                  <div style="background:#3b82f6; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; margin-right:12px; flex-shrink:0;">2</div>
                  <div>
                    <p style="margin:0 0 4px 0; font-size:15px; color:#102a43; font-weight:600;">Help Other Shoppers</p>
                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">Show how the product looks on your body type and size</p>
                  </div>
                </div>
                
                <div style="display:flex; align-items:start;">
                  <div style="background:#f59e0b; color:#fff; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; margin-right:12px; flex-shrink:0;">3</div>
                  <div>
                    <p style="margin:0 0 4px 0; font-size:15px; color:#102a43; font-weight:600;">Build Community</p>
                    <p style="margin:0; font-size:14px; color:#6b7280; line-height:1.6;">Join our community of fashion-forward shoppers</p>
                  </div>
                </div>
              </div>

              <div style="background:#fef3c7; border-left:4px solid:#f59e0b; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#92400e; font-weight:600;">📸 Quick & Easy</p>
                <p style="margin:0; font-size:14px; color:#b45309; line-height:1.6;">
                  Takes less than 2 minutes! Just snap a photo, rate the fit, and share your thoughts.
                </p>
              </div>

              <div style="text-align:center;">
                <a href="${uploadUrl}" class="button" target="_blank" rel="noopener noreferrer">
                  Upload Your Photo
                </a>
                <br />
                <a href="https://https://staging-stitches-africa.vercel.app/shops/products/${productId}" class="button-secondary" target="_blank" rel="noopener noreferrer">
                  View Product Page
                </a>
              </div>

              <div style="background:#dbeafe; border-left:4px solid:#3b82f6; padding:16px; margin:32px 0 24px 0; border-radius:4px;">
                <p style="margin:0 0 8px 0; font-size:15px; color:#1e40af; font-weight:600;">Your Privacy Matters</p>
                <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.6;">
                  Your photo will only be published with your consent. We review all submissions to ensure quality and appropriateness.
                </p>
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
              <br />
              <a href="https://https://staging-stitches-africa.vercel.app/privacy-policy" style="color:#9aa6b2; text-decoration:none;">Privacy Policy</a>
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
