import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

function messageFromPaystackErrorBody(errorText: string): string
{
  const trimmed = errorText?.trim() ?? "";
  if (!trimmed) return "Paystack rejected this request.";
  try
  {
    const parsed = JSON.parse(trimmed) as { message?: string };
    if (typeof parsed?.message === "string" && parsed.message.trim())
    {
      return parsed.message.trim();
    }
  } catch
  {
    /* not JSON */
  }
  return trimmed.length > 400 ? `${trimmed.slice(0, 400)}…` : trimmed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_name, bank_code, account_number, percentage_charge, tailorUID, description } = body;

    if (!business_name || !bank_code || !account_number || !tailorUID) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json(
        { success: false, message: "Paystack secret key not configured" },
        { status: 500 }
      );
    }

    // Create Paystack subaccount — vendor keeps 80%
    const response = await fetch("https://api.paystack.co/subaccount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        business_name,
        bank_code,
        account_number,
        percentage_charge: percentage_charge ?? 20, // platform takes 20%
        description: description || `Vendor subaccount for ${business_name}`,
        primary_contact_email: body.email,
        primary_contact_name: business_name,
        metadata: { tailorUID },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const userMessage = messageFromPaystackErrorBody(errorText);
      return NextResponse.json(
        { success: false, message: userMessage, details: errorText },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      );
    }

    const data = await response.json();

    if (!data.status) {
      return NextResponse.json(
        { success: false, message: data.message || "Failed to create Paystack subaccount" },
        { status: 400 }
      );
    }

    const subaccountCode = data.data?.subaccount_code;

    // Add the new subaccount to the stitches-africa-80-20 split group
    const SPLIT_CODE = process.env.PAYSTACK_SPLIT_CODE;
    let splitAdded = false;
    if (SPLIT_CODE && subaccountCode) {
      try {
        // First fetch the split group to get its numeric ID
        const splitListRes = await fetch(`https://api.paystack.co/split`, {
          headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
        });
        const splitListData = await splitListRes.json();
        const splitGroup = splitListData?.data?.find((s: any) => s.split_code === SPLIT_CODE);
        const splitId = splitGroup?.id;

        if (!splitId) {
          console.error(`[Paystack Split] Could not find split group with code ${SPLIT_CODE}. Available:`, splitListData?.data?.map((s: any) => s.split_code));
        } else {
          const splitRes = await fetch(`https://api.paystack.co/split/${splitId}/subaccount/add`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            },
            body: JSON.stringify({
              subaccount: subaccountCode,
              share: 80, // vendor gets 80%
            }),
          });
          const splitData = await splitRes.json();
          console.log('[Paystack Split] Add response:', JSON.stringify(splitData));
          if (splitRes.ok && splitData.status) {
            splitAdded = true;
            console.log(`✅ Subaccount ${subaccountCode} added to split group ${SPLIT_CODE} (id: ${splitId})`);
          } else {
            console.error("Failed to add subaccount to split group:", splitData.message, splitData);
          }
        }
      } catch (splitErr: any) {
        console.error("Split group update failed (non-fatal):", splitErr.message);
      }
    }

    // Save to Firestore
    try {
      await adminDb.collection("tailors").doc(tailorUID).update({
        paystackSubaccount: data.data,
        hasPaystackSubaccount: true,
        paystackSplitCode: SPLIT_CODE ?? null,
        paystackSplitAdded: splitAdded,
        splitPercentage: 80,
      });
    } catch (err: any) {
      console.error("Firestore save failed:", err);
    }

    return NextResponse.json({
      success: true,
      message: "Paystack subaccount created" + (splitAdded ? " and added to split group" : ""),
      data: data.data,
      splitAdded,
    });
  } catch (error: any) {
    console.error("Paystack subaccount creation failed:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
