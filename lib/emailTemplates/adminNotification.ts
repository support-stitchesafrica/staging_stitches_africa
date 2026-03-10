export function adminNotificationTemplate({
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
  <title>Admin Notification — Stiches Africa</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .stack { display: block !important; width: 100% !important; }
      .hide-mobile { display: none !important; height: 0 !important; overflow: hidden !important; }
      .center-mobile { text-align: center !important; }
      .pad-mobile { padding: 16px !important; }
    }
    body {
      margin: 0; padding: 0; background: #f4f6f8; font-family: Arial, sans-serif; color: #102a43;
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
    }
    a {
      color: inherit; text-decoration: none;
    }
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
    p {
      font-size: 16px;
      line-height: 1.5;
      color: #4b5563;
      margin-top: 0;
      margin-bottom: 18px;
    }
    h1 {
      font-size: 22px;
      margin-bottom: 12px;
      color: #102a43;
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <tr>
            <td style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stiches Africa" width="140" style="display:block; max-width:140px; height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <h1>Hello ${adminName},</h1>
              <p>
                Here is a summary of recent activity that requires your attention at Stiches Africa.
              </p>
              <p>
                Please log in to your admin dashboard to review details and take necessary actions.
              </p>
              <a href="https://stitchesafrica.com/admin/dashboard" target="_blank" rel="noopener noreferrer" class="button">
                View Dashboard
              </a>
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
