import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/vendors/verify-bank-account?account_number=xxx&bank_code=xxx&provider=paystack|flutterwave
 * Resolves a bank account name using the specified provider.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const account_number = searchParams.get("account_number");
  const bank_code = searchParams.get("bank_code");
  const provider = searchParams.get("provider") ?? "paystack";

  if (!account_number || !bank_code) {
    return NextResponse.json({ success: false, message: "Missing account_number or bank_code" }, { status: 400 });
  }

  try {
    if (provider === "paystack") {
      const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
      if (!PAYSTACK_SECRET_KEY) {
        return NextResponse.json(
          { success: false, message: "Paystack secret key not configured. Add PAYSTACK_SECRET_KEY to .env.local" },
          { status: 503 }
        );
      }
      const res = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
        { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const data = await res.json();
      if (data.status && data.data?.account_name) {
        return NextResponse.json({ success: true, account_name: data.data.account_name });
      }
      return NextResponse.json({ success: false, message: data.message || "Could not resolve account" }, { status: 400 });
    }

    // Flutterwave fallback
    const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
    if (!FLW_SECRET_KEY) {
      return NextResponse.json({ success: false, message: "Flutterwave not configured" }, { status: 500 });
    }
    const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${FLW_SECRET_KEY}` },
      body: JSON.stringify({ account_number, account_bank: bank_code }),
    });
    const data = await res.json();
    if (data.status === "success" && data.data?.account_name) {
      return NextResponse.json({ success: true, account_name: data.data.account_name });
    }
    return NextResponse.json({ success: false, message: data.message || "Could not resolve account" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
