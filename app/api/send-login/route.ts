// app/api/send-login-notification/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { loginNotificationTemplate } from "@/lib/emailTemplates/loginNotification";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, adminName } = body;

    // Validate required parameters
    if (!to || !adminName) {
      return NextResponse.json(
        { message: "Missing required parameters: to, adminName" },
        { status: 400 }
      );
    }

    // Create HTML email
    const html = loginNotificationTemplate({
      adminName,
      logoUrl: "/stiches-africa-logo.png", // adjust path or use full URL
    });

    // Nodemailer transporter
    // Nodemailer transporter
        const transporter = nodemailer.createTransport({
          host: "smtp.office365.com",
          port: 587,
          secure: false,
          auth: {
            user: process.env.MICROSOFT_EMAIL,
            pass: process.env.MICROSOFT_PASSWORD,
          },
          tls: { ciphers: "SSLv3" },
        });

    // Send email
    await transporter.sendMail({
      from: `"Stiches Africa" <${process.env.MICROSOFT_EMAIL}>`,
      to,
      subject: "Stiches Africa — Admin Notification",
      html,
    });

    return NextResponse.json({ message: `Email sent to ${to}` });
  } catch (error: any) {
    console.error("Email send error:", error);
    return NextResponse.json(
      { message: "Failed to send email", error: error.message },
      { status: 500 }
    );
  }
}
