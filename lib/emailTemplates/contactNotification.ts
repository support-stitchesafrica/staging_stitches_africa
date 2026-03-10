export function contactUsNotificationTemplate({
  name,
  email,
  country,
  phoneNumber,
  subject,
  message,
  logoUrl,
}: {
  name: string;
  email: string;
  country: string;
  phoneNumber: string;
  subject: string;
  message: string;
  logoUrl: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Contact Us Submission — Stiches Africa</title>
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
    .info-label {
      font-weight: bold;
      color: #102a43;
    }
    .info-value {
      color: #4b5563;
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
              <h1>New Contact Form Submission</h1>
              <p>You have received a new enquiry from the Contact Us page on Stiches Africa.</p>
              
              <p><span class="info-label">Name:</span> <span class="info-value">${name}</span></p>
              <p><span class="info-label">Email:</span> <span class="info-value">${email}</span></p>
              <p><span class="info-label">Country:</span> <span class="info-value">${country}</span></p>
              <p><span class="info-label">Phone Number:</span> <span class="info-value">${phoneNumber}</span></p>
              <p><span class="info-label">Subject:</span> <span class="info-value">${subject}</span></p>
              <p><span class="info-label">Message:</span></p>
              <p class="info-value" style="white-space: pre-line;">${message}</p>

              <a href="mailto:${email}" target="_blank" rel="noopener noreferrer" class="button">
                Reply to Sender
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
