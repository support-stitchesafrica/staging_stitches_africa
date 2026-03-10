export function waitingListTemplate({
  userEmail,
  logoUrl,
}: {
  userEmail: string;
  logoUrl: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>New Waiting List Signup — Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family:Arial,sans-serif; color:#102a43; }
    p { font-size:16px; line-height:1.5; color:#4b5563; }
    h1 { font-size:22px; margin-bottom:12px; color:#102a43; }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding:24px 0;">
    <tr>
      <td align="center">
        <table width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <tr>
            <td style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stitches Africa" width="140" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1>New Waiting List Signup</h1>
              <p>A new user has joined the waiting list:</p>
              <p><b>Email:</b> ${userEmail}</p>
              <p>Please reach out to this user when the product is live.</p>
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
