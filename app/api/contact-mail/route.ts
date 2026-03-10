import { contactTemplate } from "@/lib/emailTemplates/contactTemplate"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, country, phoneNumber, subject, message } = body

    // ✅ token from localStorage (frontend should send in headers or body)
    const token = body.token || null
    if (!token) {
      return NextResponse.json({ message: "Token is required" }, { status: 401 })
    }

    // Build email HTML
    const html = contactTemplate({
      name,
      email,
      country,
      phoneNumber,
      subject,
      message,
      logoUrl: "https://yourcdn.com/logo.png",
    })

    // Call Stitches Africa Email API
    const res = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: "support@stitchesafrica.com", // recipient (admin/support inbox)
        subject: `Contact Form: ${subject}`,
        body: html,
        isHtml: true,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json({ message: "Email failed", error: errText }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 })
  }
}
