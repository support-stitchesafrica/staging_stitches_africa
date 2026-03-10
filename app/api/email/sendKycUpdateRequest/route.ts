// app/api/email/sendKycUpdateRequest/route.ts
import { kycUpdateRequestTemplate } from "@/lib/emailTemplates/kycUpdateRequestTemplate"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { to,  brandName, logo, reason, token } = await req.json()

    if (!to  || !brandName || logo ||  !reason || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // generate HTML body using the template
    const htmlBody = kycUpdateRequestTemplate({
        logo,
      brandName,
      reason,
    })

    // call your email API
    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ attach token
      },
      body: JSON.stringify({
        body: htmlBody,
        subject: "KYC Update Request — Stitches Africa",
        emails: [
          {
            emailAddress: to, // receiver (admin, support, etc.)
            name: name,       // sender’s name shown in email
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("Email API error:", errText)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
