import { NextResponse } from "next/server"
import { pressInquiryTemplate } from "@/lib/emailTemplates/pressInquiryTemplate"

export async function POST(req: Request) {
  try {
    const { brandName, email, phone, fullName, message } = await req.json()

    if (!brandName || !email || !phone || !fullName || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // ✅ Build email body with template
    const htmlBody = pressInquiryTemplate({
      brandName,
      fullName,
      email,
      phone,
      message,
      logoUrl: "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png", // update with real logo URL
    })

    // ✅ Send email via your API
    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: htmlBody,
        subject: `Press Inquiry — ${brandName}`,
        emails: [{ emailAddress: "support@stitchesafrica.com", name: "Support" }],
      }),
    })

    const raw = await response.text()
    console.log("📩 Email API Raw Response:", raw)

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to send email", details: raw },
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
  } catch (err) {
    console.error("❌ Press Inquiry Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
