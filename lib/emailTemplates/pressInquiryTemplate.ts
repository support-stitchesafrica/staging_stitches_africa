export function pressInquiryTemplate({
  brandName,
  fullName,
  email,
  phone,
  message,
  logoUrl,
}: {
  brandName: string
  fullName: string
  email: string
  phone: string
  message: string
  logoUrl: string
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Press Inquiry — Stitches Africa</title>
  <style>
    body { margin: 0; padding: 0; background: #f4f6f8; font-family: Arial, sans-serif; color: #102a43; }
    p { font-size: 16px; line-height: 1.5; color: #4b5563; margin: 8px 0; }
    h1 { font-size: 22px; margin-bottom: 12px; color: #102a43; }
    .info-box { background:#f9fafb; padding:12px 16px; border-radius:8px; margin-bottom:12px; }
    .label { font-weight:600; color:#111827; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <tr>
            <td style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stitches Africa" width="140" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1>New Press Inquiry</h1>
              <div class="info-box">
                <p><span class="label">Brand:</span> ${brandName}</p>
                <p><span class="label">Full Name:</span> ${fullName}</p>
                <p><span class="label">Email:</span> ${email}</p>
                <p><span class="label">Phone:</span> ${phone}</p>
              </div>
              <p><span class="label">Message:</span></p>
              <p style="white-space:pre-line;">${message}</p>
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
  `
}
