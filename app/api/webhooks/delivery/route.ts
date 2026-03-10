import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.event === "delivery.confirmed") {
    const { orderId, vendor, payoutAmount } = body.data;

    // vendor.subaccount_id comes from your DB
    await payVendorSubaccount({
      subaccountId: vendor.subaccount_id,
      amount: payoutAmount,
      currency: "NGN",
      narration: `Payout for Order ${orderId}`,
    });
  }

  return NextResponse.json({ received: true });
}

async function payVendorSubaccount({
  subaccountId,
  amount,
  currency,
  narration,
}: {
  subaccountId: string;
  amount: number;
  currency: string;
  narration: string;
}) {
  const url = "https://api.flutterwave.com/v3/transfers";
  const payload = {
    account_bank: "flutterwave_subaccount",
    account_number: subaccountId, // pay to subaccount ID
    amount,
    currency,
    narration,
  };

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: `Bearer ${FLW_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  console.log("Transfer to subaccount:", res.data);
  return res.data;
}
