// lib/emailTemplates/otpTemplate.ts
export function otpTemplate({
  adminName,
  otp,
  logoUrl,
}: {
  adminName: string;
  otp: string;
  logoUrl: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Password Reset — Stitches Africa</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f8; font-family: Arial, sans-serif; color: #102a43; }
    .button {
      background: #5e2e91;
      color: #fff !important;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
      margin-top: 20px;
      text-align: center;
    }
    p { font-size: 16px; line-height: 1.5; color: #4b5563; }
    h1 { font-size: 22px; margin-bottom: 12px; color: #102a43; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <tr>
            <td style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stiches Africa" width="140" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1>Hello ${adminName},</h1>
              <p>You requested to reset your password. Use the OTP below:</p>
              <h2 style="font-size:28px; letter-spacing:4px; text-align:center; margin:20px 0;">${otp}</h2>
              <p>This code is valid for <b>10 minutes</b>.</p>
              <p>If you didn’t request this, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
        <table width="640" style="max-width:640px; margin-top:12px;">
          <tr>
            <td align="center" style="font-size:12px; color:#9aa6b2;">
              © ${new Date().getFullYear()} Stiches Africa. All rights reserved.
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
