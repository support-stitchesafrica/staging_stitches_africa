import { NextResponse } from "next/server";
// Remove client-side Firebase import
import { adminDb } from '@/lib/firebase-admin';

const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH!;

export async function POST(req: Request) {
  try {
    // ✅ Verify signature (recommended)
    const signature = req.headers.get("verif-hash");
    if (!signature || signature !== FLW_SECRET_HASH) {
      return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
    }

    const body = await req.json();
    const { status, id, reference } = body.data || {};

    console.log("Payout callback received:", body);

    // Reference example: PAYOUT_orderId_timestamp
    if (!reference) {
      return NextResponse.json({ message: "Missing reference" }, { status: 400 });
    }

    const orderId = reference.split("_")[1]; // Extract the orderId part
    const payoutRef = adminDb.collection("staging_payouts").doc(`payout_${orderId}`);

    // ✅ Update payout record based on Flutterwave response
    await payoutRef.update({
      status: status === "SUCCESSFUL" ? "success" : "failed",
      flutterwaveTransferId: id,
      updatedAt: new Date().toISOString(),
      flutterwaveCallbackData: body,
    });

    return NextResponse.json({ message: "Callback processed successfully" });
  } catch (error: any) {
    console.error("Payout callback error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}