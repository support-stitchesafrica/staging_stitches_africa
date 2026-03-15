import { loginNotificationTemplate } from "@/lib/emailTemplates/loginNotification";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { to, adminName, token } = await req.json();

    if (!to || !adminName || !token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const htmlBody = loginNotificationTemplate({
      adminName,
      logoUrl: "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
    });

    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ attach token
      },
      body: JSON.stringify({
        body: htmlBody,
        subject: "Login Notification — Stiches Africa",
        emails: [
          {
            emailAddress: to,
            name: adminName,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Email API error:", errText);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email send error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
