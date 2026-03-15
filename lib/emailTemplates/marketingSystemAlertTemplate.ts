// lib/emailTemplates/marketingSystemAlertTemplate.ts
export function marketingSystemAlertTemplate({
  recipientName,
  alertTitle,
  alertMessage,
  alertType = 'info',
  actionLink,
  actionText = 'View Dashboard',
  logoUrl = "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
}: {
  recipientName: string;
  alertTitle: string;
  alertMessage: string;
  alertType?: 'info' | 'warning' | 'error' | 'success';
  actionLink?: string;
  actionText?: string;
  logoUrl?: string;
}) {
  // Determine alert color based on type
  const alertColors = {
    info: '#3b82f6',
    warning: '#f59e0b',
    error: '#ef4444',
    success: '#059669'
  };

  const alertIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅'
  };

  const borderColor = alertColors[alertType];
  const icon = alertIcons[alertType];

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Marketing Dashboard System Alert</title>
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
              <h1 style="margin:0 0 16px 0; font-size:24px; color:#102a43;">System Alert ${icon}</h1>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Hi ${recipientName},
              </p>
              
              <div style="background:#f9fafb; border-left:4px solid ${borderColor}; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 12px 0; font-size:17px; color:#374151; font-weight:600;">${alertTitle}</p>
                <p style="margin:0; font-size:15px; color:#4b5563; line-height:1.6;">
                  ${alertMessage}
                </p>
              </div>

              ${actionLink ? `
              <a href="${actionLink}" class="button" target="_blank" rel="noopener noreferrer">
                ${actionText}
              </a>
              ` : ''}

              <p style="margin-top:32px; font-size:14px; color:#6b7280; line-height:1.6;">
                If you have any questions or concerns, please contact our support team at <a href="mailto:support@stitchesafrica.com" style="color:#000000;">support@stitchesafrica.com</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                This is an automated system alert from Stitches Africa Marketing Dashboard
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
