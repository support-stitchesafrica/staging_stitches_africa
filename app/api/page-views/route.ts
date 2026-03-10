import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await adminDb.collection("pageViews").get();
    const totalViews = snapshot.size;

    const regionCounts: Record<string, number> = {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.page === "waiting-list") {
        const region = data.region || "Unknown";
        regionCounts[region] = (regionCounts[region] || 0) + 1;
      }
    });

    return NextResponse.json({
      totalViews,
      regions: regionCounts,
    });
  } catch (error) {
    console.error("❌ Error fetching page views:", error);
    return NextResponse.json(
      { error: "Failed to fetch page view data" },
      { status: 500 }
    );
  }
}