// lib/zohoMailer.ts
// NOTE: This file should only be used on the server side as it makes external API calls
interface SendZeptoMailParams {
  to: string;
  adminName: string;
  logoUrl: string;
}

export async function sendLoginNotification({ to, adminName, logoUrl }: SendZeptoMailParams) {
  try {
    const response = await fetch(
      "https://api.zeptomail.com/v1.1/email/template",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Zoho-enczapikey ${process.env.ZEPTO_API_KEY}`,
        },
        body: JSON.stringify({
          from: { address: "noreply@stitchesafrica.com" },
          to: [{ email_address: { address: to, name: "Stitches Admin" } }],
          template_key: process.env.ZEPTO_TEMPLATE_KEY, // Your saved ZeptoMail template key
          merge_info: {
            AdminName: adminName,
            LogoUrl: logoUrl,
            CurrentYear: new Date().getFullYear().toString(),
          },
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`ZeptoMail API error: ${response.status} - ${data.message || 'Unknown error'}`);
    }

    return data;
  } catch (error: any) {
    console.error("ZeptoMail send error:", error.message);
    throw new Error("Failed to send email via ZeptoMail");
  }
}
