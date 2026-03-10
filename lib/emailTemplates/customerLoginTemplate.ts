// lib/emailTemplates/customerLoginTemplate.ts
export function customerLoginTemplate({
  customerName,
  loginTime,
  ipAddress,
  device,
  logoUrl = "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
}: {
  customerName: string;
  loginTime: string;
  ipAddress?: string;
  device?: string;
  logoUrl?: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Login Notification - Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:12px 24px; border-radius:8px; font-weight:600; display:inline-block; margin-top:20px; text-decoration:none; }
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
            <td style="padding:28px;">
              <h1 style="margin:0 0 16px 0; font-size:22px; color:#102a43;">Welcome Back, ${customerName}! 👋</h1>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                You've successfully logged into your Stitches Africa account.
              </p>
              
              <div style="background:#f9fafb; padding:16px; margin:20px 0; border-radius:8px;">
                <p style="margin:0 0 8px 0; font-size:14px; color:#6b7280;"><strong>Login Details:</strong></p>
                <p style="margin:0 0 6px 0; font-size:14px; color:#4b5563;">
                  <strong>Time:</strong> ${loginTime}
                </p>
                ${device ? `<p style="margin:0 0 6px 0; font-size:14px; color:#4b5563;"><strong>Device:</strong> ${device}</p>` : ''}
                ${ipAddress ? `<p style="margin:0; font-size:14px; color:#4b5563;"><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
              </div>

              <div style="background:#fef3c7; border-left:4px solid:#f59e0b; padding:14px; margin:20px 0; border-radius:4px;">
                <p style="margin:0; font-size:14px; color:#92400e;">
                  <strong>⚠️ Didn't log in?</strong> If this wasn't you, please secure your account immediately by changing your password.
                </p>
              </div>

              <a href="https://www.stitchesafrica.com/shops/account" class="button" target="_blank" rel="noopener noreferrer">
                View My Account
              </a>

              <p style="margin-top:24px; font-size:14px; color:#6b7280;">
                If you have any concerns, contact us at <a href="mailto:support@stitchesafrica.com" style="color:#000000;">support@stitchesafrica.com</a>
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
