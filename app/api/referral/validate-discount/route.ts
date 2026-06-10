import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ReferralService } from "@/lib/referral/referral-service";
import type { ValidateDiscountResponse } from "@/types/referral-discount";

export async function POST(request: NextRequest) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ValidateDiscountResponse>(
      { valid: false, discountPercentage: null, referrerId: null, error: { code: "INVALID_BODY", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const code = body.code?.trim().toUpperCase();
  if (!code) {
    return NextResponse.json<ValidateDiscountResponse>(
      { valid: false, discountPercentage: null, referrerId: null, error: { code: "MISSING_CODE", message: "Referral code is required" } },
      { status: 400 }
    );
  }

  // 2.2 Validate code via existing ReferralService
  const isValid = await ReferralService.validateReferralCode(code);
  if (!isValid) {
    return NextResponse.json<ValidateDiscountResponse>(
      { valid: false, discountPercentage: null, referrerId: null, error: { code: "INVALID_CODE", message: "Invalid or inactive referral code" } }
    );
  }

  const referrer = await ReferralService.getReferrerByCode(code);
  if (!referrer) {
    return NextResponse.json<ValidateDiscountResponse>(
      { valid: false, discountPercentage: null, referrerId: null, error: { code: "REFERRER_NOT_FOUND", message: "Referrer not found" } }
    );
  }

  // 2.3 Query referralDiscounts collection for active discount on that code
  let discountPercentage: number | null = null;
  try {
    const discountSnap = await adminDb
      .collection("referralDiscounts")
      .where("referralCode", "==", code)
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!discountSnap.empty) {
      discountPercentage = discountSnap.docs[0].data().percentage ?? null;
    }
  } catch (error) {
    console.error("[validate-discount] Firestore error:", error);
    return NextResponse.json<ValidateDiscountResponse>(
      { valid: false, discountPercentage: null, referrerId: null, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      { status: 500 }
    );
  }

  // 2.4 Return { valid, referrer, discountPercentage, referrerId }
  return NextResponse.json<ValidateDiscountResponse>({
    valid: true,
    referrer: { name: referrer.fullName, code: referrer.referralCode },
    discountPercentage,
    referrerId: referrer.userId,
  });
}
