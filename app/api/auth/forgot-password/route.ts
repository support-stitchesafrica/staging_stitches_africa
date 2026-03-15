// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server"
import { otpTemplate } from "@/lib/emailTemplates/otpTemplate"
import { adminDb } from "@/lib/firebase-admin" // ✅ server-side Firestore

export async function POST(req: Request) {
  try {
    const { email, adminName } = await req.json()

    if (!email || !adminName) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // ✅ Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000 // 10 mins

    // ✅ Store with Admin SDK (email as doc ID is fine)
    await adminDb.collection("passwordResets").doc(email).set({
      otp,
      expiresAt,
      createdAt: new Date(),
    })

    // ✅ Build email
    const htmlBody = otpTemplate({
      adminName,
      otp,
      logoUrl: "https://https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
    })

    // ✅ Send email
    const response = await fetch("https://stitchesafricamobile-backend.onrender.com/api/Email/Send", {
  method: "POST",
  headers: {
    accept: "*/*",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    body: htmlBody,
    subject: "Password Reset OTP — Stitches Africa",
    emails: [{ emailAddress: email, name: adminName }],
  }),
});

const raw = await response.text();
console.log("📩 Email API Raw Response:", raw);

if (!response.ok) {
  return NextResponse.json(
    { error: `Failed to send email`, details: raw },
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
  } catch (err) {
    console.error("❌ Forgot Password Error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
