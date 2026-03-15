// lib/emailTemplates/atlasDeactivationTemplate.ts
export function atlasDeactivationTemplate({
  fullName,
  email,
  logoUrl = "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  fullName: string;
  email: string;
  logoUrl?: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Your Atlas Access Has Been Deactivated</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .button { background:#000000; color:#fff !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:24px; text-decoration:none; }
    .button:hover { background:#333333; }
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
              <h1 style="margin:0 0 16px 0; font-size:24px; color:#102a43;">Your Atlas Access Has Been Deactivated</h1>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Hi ${fullName},
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Your access to the <strong>Stitches Africa Atlas</strong> platform has been deactivated by a Super Admin.
              </p>
              
              <div style="background:#fef2f2; border-left:4px solid #dc2626; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 12px 0; font-size:15px; color:#991b1b; font-weight:600;">Access Status</p>
                <table style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="padding:6px 0; font-size:15px; color:#6b7280;">Email:</td>
                    <td style="padding:6px 0; font-size:15px; color:#102a43; font-weight:600;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:15px; color:#6b7280;">Status:</td>
                    <td style="padding:6px 0; font-size:15px; color:#dc2626; font-weight:600;">Deactivated</td>
                  </tr>
                </table>
              </div>

              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                You will no longer be able to access any Atlas dashboards or features. If you are currently logged in, you will be signed out automatically.
              </p>

              <div style="background:#f9fafb; border-left:4px solid #6b7280; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0; font-size:15px; color:#374151; line-height:1.6;">
                  <strong>What this means:</strong><br/>
                  • You can no longer log in to Atlas<br/>
                  • All dashboard access has been revoked<br/>
                  • Your account data is preserved but inactive
                </p>
              </div>

              <p style="margin-top:32px; font-size:14px; color:#6b7280; line-height:1.6;">
                If you believe this was done in error or have questions about this change, please contact your administrator or reach out to <a href="mailto:support@stitchesafrica.com" style="color:#000000;">support@stitchesafrica.com</a>
              </p>

              <p style="margin-top:16px; font-size:13px; color:#9aa6b2; line-height:1.6;">
                Thank you for your contributions to the Stitches Africa team.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                This is an automated message from Stitches Africa Atlas
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
