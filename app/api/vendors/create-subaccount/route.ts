import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

// Helper function to handle Firestore quota errors
async function safeFirestoreOperation(operation: () => Promise<any>): Promise<any> {
  try {
    return await operation();
  } catch (error: any) {
    if (error.code === 8 && error.details?.includes('Quota exceeded')) {
      console.log("⚠️ Firestore quota exceeded, continuing without saving to Firestore");
      console.error("Quota exceeded error details:", error.details);
      return { quotaExceeded: true };
    }
    console.error("Firestore operation failed:", error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      business_name,
      bank_code,
      account_number,
      account_name,
      email,
      tailorUID,
      currency,
    } = body;

    if (
      !business_name ||
      !bank_code ||
      !account_number ||
      !account_name ||
      !email ||
      !tailorUID ||
      !currency
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const FLW_SECRET_KEY = process.env.FLW_SECRET_KEY;
    if (!FLW_SECRET_KEY) {
      console.error("❌ FLW_SECRET_KEY is not configured in environment variables");
      return NextResponse.json(
        { success: false, message: "Missing Flutterwave secret key" },
        { status: 500 }
      );
    }
    
    // Log that we have the secret key but mask it for security
    console.log("✅ FLW_SECRET_KEY is configured:", FLW_SECRET_KEY ? "Yes (masked)" : "No");

    // 🌍 Create subaccount (vendor 80%, platform 20%)
    const response = await fetch("https://api.flutterwave.com/v3/subaccounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FLW_SECRET_KEY}`,
      },
      body: JSON.stringify({
        account_bank: bank_code,
        account_number,
        business_name,
        business_email: email,
        business_contact: email,
        split_type: "percentage",
        split_value: 0.8, // vendor gets 80%
        meta: { account_name, tailorUID },
        country: currency === "NGN" ? "NG" : currency === "GHS" ? "GH" : "US",
        currency,
      }),
    });
    
    // Check if the request to Flutterwave was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Flutterwave API request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      return NextResponse.json(
        { 
          success: false,
          message: `Flutterwave API request failed: ${response.status} ${response.statusText}`,
          details: errorText 
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      );
    }

    const data = await response.json();

    if (data.status !== "success") {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Failed to create subaccount",
          flutterwave_response: data,
        },
        { status: 400 }
      );
    }

    // ✅ Store subaccount details in Firestore with quota error handling
    const firestoreResult = await safeFirestoreOperation(async () => {
      await adminDb.collection("staging_tailors").doc(tailorUID).update({
        flutterwaveSubaccount: data.data,
        hasSubaccount: true,
        splitPercentage: 80,
        currency,
      });
    });

    // Check if Firestore operation was affected by quota
    if (firestoreResult && firestoreResult.quotaExceeded) {
      console.log("⚠️ Subaccount created in Flutterwave but not saved to Firestore due to quota limits");
      return NextResponse.json({
        success: true,
        message: "Subaccount created successfully but may not be reflected in the dashboard immediately due to system limits. Please refresh the page.",
        data: data.data,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Subaccount created successfully",
      data: data.data,
    });
  } catch (error: any) {
    console.error("Subaccount creation failed:", error);
    
    // Check if this is a quota exceeded error from Firebase
    if (error.code === 8 && error.details?.includes('Quota exceeded')) {
      console.log("⚠️ Quota exceeded error - returning appropriate response");
      return NextResponse.json({ 
        success: false,
        message: "Service temporarily unavailable due to system limits. Please try again later.",
        quotaExceeded: true
      }, { status: 503 });
    }
    
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
