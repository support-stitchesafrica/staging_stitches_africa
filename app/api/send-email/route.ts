import { NextResponse } from "next/server"


import { getFinalHtmlFromContent } from "@/utils/email";

export async function POST(request: Request) {
  try {
    const { to, subject, html, from, replyTo, campaignId  } = await request.json()

    if (!to?.length || !subject || !html) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
  const trackedHtml = getFinalHtmlFromContent(html, campaignId, to[0]);
    // ✅ Ensure HTML is properly formatted for email clients
    const htmlEmail = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${subject}</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #f5f5f5;
              font-family: Arial, sans-serif;
              -webkit-text-size-adjust: none;
              -ms-text-size-adjust: none;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              padding: 24px;
              border-radius: 8px;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 10px;
              display: block;
              margin: 0 auto;
            }
            a.button {
              display: inline-block;
              background-color: #111827;
              color: #ffffff !important;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 6px;
              font-size: 15px;
              font-weight: 600;
              margin-top: 24px;
            }
            h1, h2, h3 {
              color: #111827;
              font-weight: 600;
              margin-bottom: 8px;
            }
            p {
              color: #4B5563;
              line-height: 1.6;
              margin: 0 0 16px;
            }
            .divider {
              border-top: 1px solid #E5E7EB;
              margin: 16px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${trackedHtml}
          </div>
        </body>
      </html>
    `

    // ✅ Send via your staging email API
    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: htmlEmail,
        subject,
        emails: to.map((emailAddress: string) => ({
          emailAddress,
          name: emailAddress.split("@")[0],
        })),
        from: from || "newsletter@stitchesafrica.com",
        replyTo,
      }),
    })

    const raw = await response.text()
    console.log("📩 Email API Raw Response:", raw)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to send email", details: raw },
        { status: response.status }
      )
    }

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { message: raw }
    }

    return NextResponse.json({ success: true, data: parsed })
  } catch (error) {
    console.error("Email sending error:", error)
    return NextResponse.json(
      { success: false, error: "Server error while sending email" },
      { status: 500 }
    )
  }
}
