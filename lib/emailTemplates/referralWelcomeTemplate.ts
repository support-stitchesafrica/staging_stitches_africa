// lib/emailTemplates/referralWelcomeTemplate.ts
export function referralWelcomeTemplate({
  referrerName,
  referralCode,
  logoUrl = "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
}: {
  referrerName: string;
  referralCode: string;
  logoUrl?: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Welcome to the Stitches Africa Referral Program</title>
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
              <h1 style="margin:0 0 16px 0; font-size:24px; color:#102a43;">Welcome to the Stitches Africa Referral Program</h1>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Hi ${referrerName},
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Welcome aboard!
              </p>
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Your referral account is now active, and you are all set to start earning rewards and commissions when your community shops through your referral link or code.
              </p>
              
              <div style="background:#f9fafb; border-left:4px solid #000000; padding:16px; margin:24px 0; border-radius:4px;">
                <p style="margin:0 0 12px 0; font-size:17px; color:#374151; font-weight:600;">Here's how it works:</p>
                <ol style="margin:0; padding-left:20px; color:#4b5563; font-size:15px; line-height:1.8;">
                  <li><strong>Share Your Code:</strong> Post it anywhere: WhatsApp, Instagram bio, Twitter, or group chats.</li>
                  <li><strong>Earn Points:</strong> You get 1 point for every sign-up or app download through your link.</li>
                  <li><strong>Earn Commissions:</strong> Each purchase made through your referral link or code adds to your referral earnings.</li>
                  <li><strong>Unlock Perks:</strong> Upon attaining 1,000 points, you'll begin unlocking gifts and special rewards.</li>
                </ol>
              </div>
              
              <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:20px; margin:24px 0;">
                <p style="margin:0 0 12px 0; font-size:16px; color:#0c4a6e; font-weight:600;">Your Referral Code:</p>
                <p style="margin:0 0 16px 0; font-size:20px; color:#0369a1; font-weight:bold; font-family:monospace;">${referralCode}</p>
                <p style="margin:0; font-size:14px; color:#0c4a6e;">
                  <a href="https://www.stitchesafrica.com/referral/dashboard" style="color:#0369a1; text-decoration:underline;">Check your Referral Dashboard</a> to track your points, referrals, and earnings in real time.
                </p>
              </div>
              
              <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                Start sharing now and grow your rewards!
              </p>
              
              <a href="https://www.stitchesafrica.com/referral/dashboard" class="button" target="_blank" rel="noopener noreferrer">
                Go to Referral Dashboard
              </a>
              
              <p style="margin-top:32px; font-size:14px; color:#6b7280; line-height:1.6;">
                Best regards,<br/>
                The Stitches Africa Team
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                &copy; ${new Date().getFullYear()} Stitches Africa Referral Program. All rights reserved.
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