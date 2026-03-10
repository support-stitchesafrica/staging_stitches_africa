export function welcomeEmailTemplate({
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
  <title>Welcome to Stitches Africa</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
    }
    h1 {
      font-size: 24px;
      color: #111827;
      margin-bottom: 16px;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4b5563;
      margin: 12px 0;
    }
    a {
      color: #1a73e8;
      text-decoration: none;
    }
    .button {
      background-color: #111827;
      color: #ffffff !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      margin-top: 20px;
      font-weight: bold;
    }
    .social-icons img {
      width: 28px;
      height: 28px;
      margin: 0 6px;
      vertical-align: middle;
      border-radius: 50%;
    }
    @media only screen and (max-width: 600px) {
      .container {
        width: 100% !important;
      }
      .hero-text h1 {
        font-size: 20px !important;
      }
    }
  </style>
</head>

<body>
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f6f8">
    <tr>
      <td align="center">
        <!-- Outer Container -->
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.05); margin:24px auto;">
          
          <!-- Hero Section -->
          <tr>
            <td align="center" style="background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://www.jamilakyari.com/wp-content/uploads/2022/03/Art-of-African-Fashion-and-Style.jpg') center/cover no-repeat; padding:60px 20px;">
              <img src="${logoUrl}" alt="Stitches Africa" width="160" style="display:block;  border-radius: 50%; margin-bottom:20px;" />
              <div class="hero-text">
                <h1 style="color:#ffffff; margin:0;">Welcome to Stitches Africa</h1>
                <p style="color:#f3f4f6; margin-top:12px; font-size:17px;">Celebrating African fashion, culture & creativity</p>
              </div>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:36px 28px;">
              <h1>Hi ${userEmail.split("@")[0]}, you’re officially in! 🎉</h1>
              <p>We’re thrilled to welcome you to the <b>Stitches Africa Waitlist</b> — where culture meets couture. You’re now part of a movement connecting the world to authentic African fashion.</p>

              <p><b>Here’s what’s coming your way:</b></p>
              <ul style="color:#374151; line-height:1.7; padding-left:18px;">
                <li>✨ Early access to our exclusive launch</li>
                <li>💎 Special offers for our earliest supporters</li>
                <li>🎨 Sneak peeks of featured designers & trends</li>
              </ul>

              <p>We’re blending technology, craftsmanship, and storytelling to empower African designers and redefine fashion globally.</p>

              <a href="https://wwww.stitchesafrica.com" class="button" target="_blank">Explore More</a>

              <p style="margin-top:36px;">With love,</p>
              <p><b>The Stitches Africa Team</b></p>
            </td>
          </tr>

          <!-- Social Section -->
          <tr>
            <td align="center" style="background:#f9fafb; padding:24px;">
              <p style="font-size:16px; font-weight:bold; color:#111827;">Let’s stay connected</p>
              <div class="social-icons">
                <a href="https://www.instagram.com/mystitchesafrica" target="_blank">
                  <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" />
                </a>
                <a href="https://www.tiktok.com/@stitchesafrica" target="_blank">
                  <img src="https://cdn-icons-png.flaticon.com/512/3046/3046120.png" alt="TikTok" />
                </a>
                <a href="https://x.com/stitchesafrica" target="_blank">
                  <img src="https://cdn-icons-png.flaticon.com/512/5968/5968958.png" alt="X" />
                </a>
                <a href="https://www.pinterest.com/mystitchesafrica" target="_blank">
                  <img src="https://cdn-icons-png.flaticon.com/512/145/145808.png" alt="Pinterest" />
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="font-size:13px; color:#9ca3af; padding:16px 0; background:#ffffff;">
              © ${new Date().getFullYear()} Stitches Africa — All Rights Reserved.
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
