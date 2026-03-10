export function productCreationTemplate({
  adminName,
  logoUrl,
  actionUrl,
  creatorName,
  creatorRole, // e.g., "Agent" or "Tailor"
  productName,
  productImage,
  category,
  price,
  createdDate,
}: {
  adminName: string;
  logoUrl: string;
  actionUrl: string;
  creatorName: string;
  creatorRole: "Agent" | "Tailor";
  productName: string;
  productImage: string;
  category: string;
  price: string;
  createdDate: string;
}) {
  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>New Product Created — Stiches Africa</title>
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
      -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
      color: #102a43;
    }
    a {
      color: inherit; text-decoration: none;
    }
    .button {
      background: #5e2e91;
      color: #ffffff !important;
      padding: 12px 24px;
      font-size: 14px;
      font-weight: 600;
      border-radius: 8px;
      display: inline-block;
      margin-top: 20px;
      text-align: center;
    }
    .product-image {
      width: 100%; max-height: 300px; object-fit: cover; border-radius: 6px 6px 0 0;
      display: block;
    }
    .product-details {
      padding: 16px;
      background: #f8fafc;
      border-radius: 0 0 8px 8px;
    }
    .product-details p {
      margin: 6px 0;
      font-size: 14px;
      color: #4b5563;
    }
    .product-details p.title {
      font-weight: 600;
      color: #111827;
      font-size: 16px;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f4f6f8; padding: 24px 0;">
    <tr>
      <td align="center">
        <table class="container" width="640" style="max-width:640px; background:#ffffff; border-radius:12px; box-shadow:0 8px 30px rgba(22,28,37,0.08);">
          <!-- Logo -->
          <tr>
            <!-- ✅ Centered Logo -->
            <td align="center" style="padding:20px 28px; border-bottom:1px solid #eef2f6;">
              <img src="${logoUrl}" alt="Stitches Africa" width="140" style="display:block; max-width:140px; height:auto; margin:0 auto;" />
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:28px;">
              <h1 style="margin:0 0 12px 0; font-size:22px; color:#102a43;">Hello ${adminName},</h1>
              <p style="margin:0 0 20px 0; font-size:16px; color:#4b5563; line-height:1.5;">
                A new product has been created on Stiches Africa by a <strong>${creatorRole}</strong>. Here are the details:
              </p>

              <!-- Product Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:8px; overflow:hidden; background:#f8fafc;">
                <tr>
                  <td style="padding:0;">
                    <img src="${productImage}" alt="${productName}" class="product-image" />
                  </td>
                </tr>
                <tr>
                  <td class="product-details">
                    <p class="title">${productName}</p>
                    <p><strong>Category:</strong> ${category}</p>
                    <p><strong>Price:</strong> ${price}</p>
                    <p><strong>Created By:</strong> ${creatorName} (${creatorRole})</p>
                    <p><strong>Date:</strong> ${createdDate}</p>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <a href="${actionUrl}" target="_blank" rel="noopener noreferrer" class="button">
                View Product in Dashboard
              </a>
            </td>
          </tr>
        </table>

        <!-- Footer -->
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
