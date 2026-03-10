// lib/email-templates/contactTemplate.ts
export function contactTemplate({
  name,
  email,
  country,
  phoneNumber,
  subject,
  message,
  logoUrl,
}: {
  name: string
  email: string
  country: string
  phoneNumber: string
  subject: string
  message: string
  logoUrl: string
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Contact Message — Stitches Africa</title>
  <style>
    body { margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif; color:#102a43; }
    .container { max-width:640px; margin:0 auto; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08); overflow:hidden; }
    .header { text-align:center; padding:20px; border-bottom:1px solid #eef2f6; }
    .header img { max-width:140px; height:auto; }
    .content { padding:28px; }
    .content h1 { margin:0 0 12px 0; font-size:22px; color:#102a43; }
    .content p { margin:0 0 16px 0; font-size:16px; color:#4b5563; line-height:1.5; }
    .footer { text-align:center; font-size:12px; color:#9aa6b2; padding:12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${logoUrl}" alt="Stitches Africa" />
    </div>
    <div class="content">
      <h1>New Contact Message</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Country:</strong> ${country}</p>
      <p><strong>Phone:</strong> ${phoneNumber}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong><br/> ${message}</p>
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} Stitches Africa. All rights reserved.
    </div>
  </div>
</body>
</html>
  `
}
