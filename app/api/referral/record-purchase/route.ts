import { NextRequest, NextResponse } from "next/server";
import { adminDb, verifyIdToken } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

interface RecordPurchaseBody {
  orderId: string;
  buyerId: string;
  referrerId: string;
  referralCode: string;
  originalAmount: number;
  discountPercentage: number;
  discountAmount: number;
  finalAmount: number;
}

export async function POST(request: NextRequest) {
  // 3.2 Verify buyer's Firebase ID token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let buyerUid: string;
  try {
    const token = authHeader.slice(7);
    const decoded = await verifyIdToken(token);
    buyerUid = decoded.uid;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid token" },
      { status: 401 }
    );
  }

  let body: RecordPurchaseBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const {
    orderId,
    buyerId,
    referrerId,
    referralCode,
    originalAmount,
    discountPercentage,
    discountAmount,
    finalAmount,
  } = body;

  // Basic field validation
  if (
    !orderId || !buyerId || !referrerId || !referralCode ||
    typeof originalAmount !== "number" ||
    typeof discountPercentage !== "number" ||
    typeof discountAmount !== "number" ||
    typeof finalAmount !== "number"
  ) {
    return NextResponse.json(
      { success: false, error: "Missing or invalid fields" },
      { status: 400 }
    );
  }

  // Ensure the token owner matches the buyerId in the request
  if (buyerUid !== buyerId) {
    return NextResponse.json(
      { success: false, error: "Token does not match buyerId" },
      { status: 403 }
    );
  }

  // 3.3 Idempotency check — skip if orderId already exists
  try {
    const existing = await adminDb
      .collection("referralPurchases")
      .where("orderId", "==", orderId)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ success: true, alreadyRecorded: true });
    }
  } catch (error) {
    console.error("[record-purchase] Idempotency check failed:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }

  // 3.4 Re-validate discount amounts server-side
  const expectedDiscount = Math.floor(originalAmount * discountPercentage / 100);
  const expectedFinal = originalAmount - expectedDiscount;

  if (discountAmount !== expectedDiscount || finalAmount !== expectedFinal) {
    return NextResponse.json(
      { success: false, error: "Amount mismatch — discount figures do not match server calculation" },
      { status: 422 }
    );
  }

  // 3.5 Write document to referralPurchases collection
  try {
    await adminDb.collection("referralPurchases").add({
      orderId,
      buyerId,
      referrerId,
      referralCode: referralCode.toUpperCase(),
      originalAmount,
      discountPercentage,
      discountAmount,
      finalAmount,
      paymentStatus: "paid",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, alreadyRecorded: false });
  } catch (error) {
    console.error("[record-purchase] Firestore write failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record purchase" },
      { status: 500 }
    );
  }
}
