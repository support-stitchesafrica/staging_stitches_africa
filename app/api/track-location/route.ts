import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get client IP from headers (works for most deployments)
    const ip =
      process.env.NODE_ENV === "development"
        ? "8.8.8.8"
        : (await fetch("https://api.ipify.org?format=json").then((r) => r.json())).ip;

    const res = await fetch(`https://ipwho.is/${ip}`);
    const data = await res.json();

    if (!data.success) {
      return NextResponse.json(
        { success: false, message: "Failed to get location data" },
        { status: 400 }
      );
    }

    const locationData = {
      ip,
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country || "Unknown",
    };

    return NextResponse.json({ success: true, ...locationData });
  } catch (error: any) {
    console.error("🌍 Location API Error:", error.message);
    return NextResponse.json(
      { success: false, message: "Server error while fetching location" },
      { status: 500 }
    );
  }
}
