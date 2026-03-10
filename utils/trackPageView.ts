"use client";

import { db } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export const trackPageView = async (page: string) => {
  try {
    // ✅ Only run in the browser
    if (typeof window === "undefined") return;

    console.log(`📄 Tracking page view for: ${page}`);

    const locationData = await getUserLocation();

    await addDoc(collection(db, "pageViews"), {
      page,
      ...locationData,
      timestamp: serverTimestamp(),
    });

    console.log(
      `✅ Logged page view for "${page}" from ${locationData.city}, ${locationData.region}, ${locationData.country}`
    );
  } catch (error) {
    console.error("❌ Failed to track page view:", error);
  }
};

// ============================================================
// ✅ Enhanced getUserLocation (borrowed from your waitlist method)
// ============================================================
const getUserLocation = async () => {
  const fallback = {
    ip: "0.0.0.0",
    city: "Unknown",
    region: "Unknown",
    country: "Unknown",
  };

  try {
    const res = await fetch("/api/track-location");
    const data = await res.json();

    if (data.success) {
      console.log("📍 Location data:", data);
      return {
        ip: data.ip,
        city: data.city,
        region: data.region,
        country: data.country,
      };
    } else {
      console.warn("⚠️ Could not get location data:", data.message);
    }
  } catch (error: any) {
    console.warn("🌍 Location lookup failed:", error.message);
  }

  return fallback;
};

