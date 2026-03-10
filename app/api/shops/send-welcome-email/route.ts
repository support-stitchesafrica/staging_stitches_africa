// app/api/shops/send-welcome-email/route.ts
import { NextResponse } from "next/server";
import { customerWelcomeTemplate } from "@/lib/emailTemplates/customerWelcomeTemplate";

export async function POST(request: Request) {
  try {
    const { email, customerName } = await request.json();

    if (!email || !customerName) {
      return NextResponse.json(
        { error: "Missing required fields: email, customerName" },
        { status: 400 }
      );
    }

    const html = customerWelcomeTemplate({
      customerName,
      email,
    });

    // Send via staging email API
    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: html,
        subject: "Welcome to Stitches Africa! 🎉",
        emails: [{
          emailAddress: email,
          name: customerName,
        }],
        from: "welcome@stitchesafrica.com",
        replyTo: "support@stitchesafrica.com",
      }),
    });

    const raw = await response.text();
    console.log("📩 Welcome Email API Response:", raw);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to send welcome email", details: raw },
        { status: response.status }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { message: raw };
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error) {
    console.error("Welcome email sending error:", error);
    return NextResponse.json(
      { success: false, error: "Server error while sending welcome email" },
      { status: 500 }
    );
  }
}
