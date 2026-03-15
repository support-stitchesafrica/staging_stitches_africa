// lib/emailTemplates/guestCredentialsTemplate.ts
export function guestCredentialsTemplate({
    customerName,
    email,
    password,
    orderId,
    logoUrl = "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
  }: {
    customerName: string;
    email: string;
    password: string;
    orderId?: string;
    logoUrl?: string;
  }) {
    return `
  <!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Your Stitches Africa Account</title>
    <style>
      body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
      .button { background:#000000; color:#fff !important; padding:14px 28px; border-radius:8px; font-weight:600; display:inline-block; margin-top:24px; text-decoration:none; }
      .button:hover { background:#333333; }
      .credentials-box { background:#f9fafb; border:2px solid #e5e7eb; border-radius:8px; padding:20px; margin:24px 0; }
      .credential-item { background:#ffffff; border-radius:6px; padding:16px; margin-bottom:12px; }
      .credential-item:last-child { margin-bottom:0; }
      .credential-label { font-size:13px; color:#6b7280; margin:0 0 6px 0; font-weight:500; }
      .credential-value { font-size:16px; color:#102a43; margin:0; font-weight:600; word-break:break-all; }
      .password-value { font-family: 'Courier New', monospace; letter-spacing:1px; }
      .warning-box { background:#fef3c7; border-left:4px solid #f59e0b; padding:16px; margin:24px 0; border-radius:4px; }
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
                <h1 style="margin:0 0 16px 0; font-size:24px; color:#102a43;">Welcome to Stitches Africa! 🎉</h1>
                <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                  Hi ${customerName},
                </p>
                <p style="margin:0 0 18px 0; font-size:16px; color:#4b5563; line-height:1.6;">
                  Thank you for shopping with us! We've created an account for you so you can easily track your order and shop with us again in the future.
                </p>
                
                ${orderId ? `
                <div style="background:#ecfdf5; border-left:4px solid #10b981; padding:16px; margin:24px 0; border-radius:4px;">
                  <p style="margin:0; font-size:15px; color:#065f46;">
                    <strong>Order ID:</strong> ${orderId}
                  </p>
                </div>
                ` : ''}
  
                <div class="credentials-box">
                  <h2 style="margin:0 0 16px 0; font-size:18px; color:#102a43; text-align:center;">
                    Your Login Credentials
                  </h2>
                  
                  <div class="credential-item">
                    <p class="credential-label">Email Address</p>
                    <p class="credential-value">${email}</p>
                  </div>
                  
                  <div class="credential-item">
                    <p class="credential-label">Password</p>
                    <p class="credential-value password-value">${password}</p>
                  </div>
                </div>
  
                <div class="warning-box">
                  <p style="margin:0; font-size:14px; color:#92400e; line-height:1.6;">
                    <strong>⚠️ Important:</strong> Please save these credentials in a secure location. We recommend changing your password after your first login for security.
                  </p>
                </div>
  
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://https://staging-stitches-africa.vercel.app'}/shops/auth" class="button" target="_blank" rel="noopener noreferrer">
                  Sign In Now
                </a>
  
                <div style="background:#f9fafb; border-left:4px solid #000000; padding:16px; margin:32px 0 24px 0; border-radius:4px;">
                  <p style="margin:0 0 12px 0; font-size:15px; color:#374151; font-weight:600;">With your account, you can:</p>
                  <ul style="margin:0; padding-left:20px; color:#4b5563; font-size:15px; line-height:1.8;">
                    <li>Track your orders in real-time</li>
                    <li>Save your measurements for faster checkout</li>
                    <li>Access your order history</li>
                    <li>Manage your shipping addresses</li>
                    <li>Receive exclusive offers and updates</li>
                  </ul>
                </div>
  
                <p style="margin-top:32px; font-size:14px; color:#6b7280; line-height:1.6;">
                  If you have any questions, feel free to reach out to our support team at <a href="mailto:support@stitchesafrica.com" style="color:#000000;">support@stitchesafrica.com</a>
                </p>
                
                <p style="margin-top:16px; font-size:16px; color:#4b5563; line-height:1.6;">
                  Happy shopping!<br>
                  <strong>The Stitches Africa Team</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px; background:#f9fafb; border-top:1px solid #eef2f6;">
                <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                  This email was sent because you made a purchase on our website.<br>
                  If you didn't make this purchase, please contact us immediately.
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