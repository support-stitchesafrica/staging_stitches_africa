export function agentNotificationTemplate({
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
  <title>Welcome to Stiches Africa!</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .stack { display: block !important; width: 100% !important; }
      .hide-mobile { display: none !important; height: 0 !important; overflow: hidden !important; }
      .center-mobile { text-align: center !important; }
      .pad-mobile { padding: 16px !important; }
    }
    a { color: inherit; text-decoration: none; }
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; }
    .button {
      background-color: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      display: inline-block;
      margin-top: 16px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding: 24px 0;">
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
              <h1 style="margin:0 0 12px 0; font-size:24px; color:#102a43;">Hello ${adminName},</h1>
              <p style="margin:0 0 18px 0; color:#4b5563; font-size:16px; line-height:1.5;">
                Welcome to <strong>Stiches Africa!</strong> We’re excited to let you know that your agent account has been successfully created.
              </p>
              <p style="margin:0 0 18px 0; color:#4b5563; font-size:16px; line-height:1.5;">
                You can now log in to your portal to start managing your tailors and products seamlessly.
              </p>
              <a href="https://stitchesAfrica.com/agent" class="button" target="_blank" rel="noopener noreferrer">Go to Agent Portal</a>
              <p style="margin-top:24px; font-size:14px; color:#9aa6b2;">
                If you have any questions or need support, feel free to reply to this email or contact our team.
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
