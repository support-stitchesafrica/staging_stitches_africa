export function loginNotificationTemplate({
  adminName,
  logoUrl,
}: {
  adminName: string;
  logoUrl: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Login Notification — Stiches Africa</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .stack { display: block !important; width: 100% !important; }
      .hide-mobile { display: none !important; height: 0 !important; overflow: hidden !important; }
      .center-mobile { text-align: center !important; }
      .pad-mobile { padding: 16px !important; }
    }
    body {
      margin: 0; padding: 0; background: #f4f6f8; font-family: Arial, sans-serif;
      color: #102a43;
    }
    a {
      color: inherit; text-decoration: none;
    }
    .button {
      background: #5e2e91;
      color: #fff !important;
      padding: 12px 24px;
      border-radius: 8px;
      display: inline-block;
      font-weight: 600;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <tr>
            <!-- ✅ Centered Logo -->
            <td align="center" style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stitches Africa" width="140" style="display:block; max-width:140px; height:auto; margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px 0; font-size:22px; color:#102a43;">Hello ${adminName},</h1>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.5;">
                We noticed a successful login to your Stiches Africa admin account.
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.5;">
                If this was you, no further action is needed. If you did not log in recently, please reset your password immediately or contact support.
              </p>
              <a href="https://www.stitchesafrica.com/vendor/dashboard" style="color: white; background-color: black;" class="button" target="_blank" rel="noopener noreferrer">
                Access Your Account
              </a>
              <p style="margin-top:24px; font-size:14px; color:#9aa6b2;">
                Thank you for being part of Stiches Africa.
              </p>
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
