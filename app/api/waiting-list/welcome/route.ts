import { welcomeEmailTemplate } from "@/lib/emailTemplates/WaitlistWelcomeTemplate";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Missing required field: email" }, { status: 400 });
    }

    // ✅ Build the welcome email HTML
    const htmlBody = welcomeEmailTemplate({
      userEmail: email,
      logoUrl: "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
    });

    // ✅ Send welcome email to the user
    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: htmlBody,
        subject: "Welcome to the Future of African Fashion!",
        emails: [
          {
            emailAddress: email,
            name: email,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Welcome Email API Error:", errText);
      return NextResponse.json({ error: "Failed to send welcome email" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Welcome email sent successfully!",
    });
  } catch (error) {
    console.error("❌ Welcome Email Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
