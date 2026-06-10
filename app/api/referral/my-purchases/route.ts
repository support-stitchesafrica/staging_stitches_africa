import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import type { ReferralPurchase } from "@/types/referral-discount";

export async function GET(request: NextRequest) {
  // 9.2 Verify the logged-in user's Firebase ID token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let uid: string;
  try {
    const token = authHeader.slice(7);
    const decoded = await verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }

  // 9.3 Look up the user's referralCode — check referralUsers first (source of truth), fall back to users
  let userReferralCode = '';
  try {
    // Primary: referralUsers collection (where codes are always stored)
    const referralUserDoc = await adminDb.collection("referralUsers").doc(uid).get();
    if (referralUserDoc.exists) {
      userReferralCode = referralUserDoc.data()?.referralCode ?? '';
    }

    // Fallback: users collection
    if (!userReferralCode) {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      userReferralCode = userDoc.data()?.referralCode ?? '';
    }

    if (!userReferralCode) {
      return NextResponse.json(
        { success: false, error: "No referral code found for this user" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("[my-purchases] Failed to fetch user referral code:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }

  // 9.4 Query referralPurchases where referralCode == userReferralCode
  // Note: no orderBy to avoid requiring a composite index — sorted in memory below
  let purchasesSnap;
  try {
    purchasesSnap = await adminDb
      .collection("referralPurchases")
      .where("referralCode", "==", userReferralCode)
      .get();
  } catch (error) {
    console.error("[my-purchases] Firestore query failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }

  // 9.5 Build purchases array and compute aggregate stats
  const purchases: (ReferralPurchase & { id: string })[] = purchasesSnap.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        orderId: data.orderId ?? "",
        buyerId: data.buyerId ?? "",
        referrerId: data.referrerId ?? "",
        referralCode: data.referralCode ?? "",
        originalAmount: data.originalAmount ?? 0,
        discountPercentage: data.discountPercentage ?? 0,
        discountAmount: data.discountAmount ?? 0,
        finalAmount: data.finalAmount ?? 0,
        paymentStatus: "paid" as const,
        createdAt: data.createdAt ?? null,
      };
    })
    .sort((a, b) => {
      // Sort newest first in memory — avoids needing a composite Firestore index
      const aTime = (a.createdAt as any)?.toMillis?.() ?? (a.createdAt ? new Date(a.createdAt as any).getTime() : 0);
      const bTime = (b.createdAt as any)?.toMillis?.() ?? (b.createdAt ? new Date(b.createdAt as any).getTime() : 0);
      return bTime - aTime;
    });

  const totalUsage = purchases.length;
  const totalDiscountGiven = purchases.reduce(
    (sum, p) => sum + (p.discountAmount ?? 0),
    0
  );
  const totalSales = purchases.reduce(
    (sum, p) => sum + (p.finalAmount ?? 0),
    0
  );

  return NextResponse.json({
    success: true,
    referralCode: userReferralCode,
    purchases,
    stats: {
      totalUsage,
      totalDiscountGiven,
      totalSales,
    },
  });
}
