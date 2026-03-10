import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { account_number, bank_code } = await req.json();

  try {
    const res = await fetch("https://api.flutterwave.com/v3/accounts/resolve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
      body: JSON.stringify({ account_number, account_bank: bank_code }),
    });

    const data = await res.json();

    if (data.status === "success") {
      return NextResponse.json({
        success: true,
        account_name: data.data.account_name,
      });
    } else {
      return NextResponse.json({ success: false, message: data.message });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Account verification failed" },
      { status: 500 }
    );
  }
}
