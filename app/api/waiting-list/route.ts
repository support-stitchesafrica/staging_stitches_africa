import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";
import { waitingListTemplate } from "@/lib/emailTemplates/waitingListTemplate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log("📩 Received email:", email);

    // ✅ Check for duplicates
    const snapshot = await adminDb.collection("staging_waiting_list")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();
      
    if (!snapshot.empty) {
      return NextResponse.json(
        { error: "This email is already on the waitlist." },
        { status: 409 }
      );
    }

    // ✅ Get real client IP
    let ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    if (!ip || ip === "::1" || ip === "127.0.0.1") {
      try {
        console.log("🌍 Local environment detected, fetching public IP...");
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        ip = data.ip;
      } catch (err) {
        console.warn("⚠️ Could not fetch public IP:", err);
        ip = "0.0.0.0";
      }
    }

    console.log("🌐 IP Address:", ip);

    // ✅ Use ipwho.is for accurate geolocation
    let locationData = {
      ip,
      country: "Unknown",
      region: "Unknown",
      city: "Unknown",
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const geoRes = await fetch(`https://ipwho.is/${ip}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (geoRes.ok) {
        const geo = await geoRes.json();
        if (geo.success) {
          locationData = {
            ip,
            country: geo.country || "Unknown",
            region: geo.region || "Unknown",
            city: geo.city || "Unknown",
          };
        } else {
          console.warn("⚠️ ipwho.is returned:", geo.message);
        }
      } else {
        console.warn("⚠️ Geo lookup failed:", geoRes.statusText);
      }
    } catch (err: any) {
      console.warn("🌍 Location lookup error:", err.message);
    }

    console.log("📍 Location Data:", locationData);

    // ✅ Save user data
    await adminDb.collection("staging_waiting_list").add({
      email: email.toLowerCase(),
      createdAt: Timestamp.now(),
      ...locationData,
    });

    console.log("✅ User saved to Firestore.");

    // ✅ Send confirmation email
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const htmlBody = waitingListTemplate({
        userEmail: email,
        logoUrl: "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
      });

      const response = await fetch(
        "https://stitchesafricamobile-backend.onrender.com/api/Email/Send",
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            body: htmlBody,
            subject: "Welcome to Stitches Africa 🎉",
            emails: [{ emailAddress: email, name: email.split("@")[0] }],
            ccEmails: [
              { emailAddress: "Sales@stitchesafrica.com", name: "Support" },
            ],
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timeout);

      if (!response.ok) {
        const errText = await response.text();
        console.error("❌ Email API error:", errText);
      }
    } catch (err: any) {
      console.warn("📧 Email send skipped:", err.message);
    }

    return NextResponse.json({
      success: true,
      message: "You’ve been successfully added to the waitlist!",
    });
  } catch (error: any) {
    console.error("❌ Waiting-list route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}