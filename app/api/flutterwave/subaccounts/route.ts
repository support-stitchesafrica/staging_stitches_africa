import { type NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK only once
if (!getApps().length) {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    console.error("❌ Missing Firebase admin credentials in env");
    throw new Error("Missing Firebase admin credentials in env");
  }

  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}
const db = getFirestore();

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3";
const SECRET_KEY = process.env.FLW_SECRET_KEY as string;

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

// ================== GET ==================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subaccountId = searchParams.get("subaccountId");
    const email = searchParams.get("email");

    if (subaccountId) {
      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts/${subaccountId}`, {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        return NextResponse.json({ subaccount: result.data });
      }
      
      return NextResponse.json({ error: result.message || "Failed to fetch subaccount" }, { status: 400 });
    }

    if (email) {
      // Fetch all subaccounts and filter by email
      // Note: This might be slow if there are many subaccounts. Pagination should be handled in a robust solution.
      const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts?limit=100`, {
        headers: {
          Authorization: `Bearer ${SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (response.ok && result.status === "success") {
        const subaccounts = result.data.filter((sub: any) => 
          sub.business_email?.toLowerCase() === email.toLowerCase()
        );
        return NextResponse.json({ subaccounts });
      }

      return NextResponse.json({ error: result.message || "Failed to fetch subaccounts" }, { status: 400 });
    }

    return NextResponse.json({ error: "subaccountId or email required" }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================== POST ==================
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id");
    if (!userId) {
      console.log("❌ User ID missing in request headers");
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const body = await request.json();
    const {
      account_bank,
      account_number,
      business_name,
      business_email,
      business_contact,
      business_contact_mobile,
      business_mobile,
      country,
    } = body;

    // Validate required fields
    if (
      !account_bank ||
      !account_number ||
      !business_name ||
      !business_email ||
      !business_contact ||
      !business_contact_mobile ||
      !business_mobile ||
      !country
    ) {
      console.log("❌ Missing required fields:", {
        account_bank: !!account_bank,
        account_number: !!account_number,
        business_name: !!business_name,
        business_email: !!business_email,
        business_contact: !!business_contact,
        business_contact_mobile: !!business_contact_mobile,
        business_mobile: !!business_mobile,
        country: !!country
      });
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate Flutterwave API key
    if (!SECRET_KEY) {
      console.error("❌ FLW_SECRET_KEY is not configured in environment variables");
      return NextResponse.json({ 
        error: "Payment gateway configuration error. Please contact support." 
      }, { status: 500 });
    }
    
    // Log that we have the secret key but mask it for security
    console.log("✅ FLW_SECRET_KEY is configured:", SECRET_KEY ? "Yes (masked)" : "No");

    // Vendor gets 80%, platform keeps 20%
    const split_value = 0.8;

    const payload = {
      account_bank,
      account_number,
      business_name,
      business_email,
      business_contact,
      business_contact_mobile,
      business_mobile,
      country,
      split_type: "percentage",
      split_value,
    };

    console.log("➡️ Sending to Flutterwave:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log("⬅️ Flutterwave response:", JSON.stringify(result, null, 2));

    // Handle "Already Exists" case first, before checking response.ok
    if (result.status === "error" && result.message?.includes("already exists")) {
      console.log("⚠️ Subaccount already exists. Attempting to fetch and sync...");
      try {
        const listResponse = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts?limit=100`, {
          headers: {
            Authorization: `Bearer ${SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        });
        
        const listResult = await listResponse.json();
        if (listResult.status === "success" && Array.isArray(listResult.data)) {
          // Find matching subaccount by account number and bank
          const match = listResult.data.find((sub: any) => 
            sub.account_number === account_number && sub.account_bank === account_bank
          );

          if (match) {
            console.log("✅ Found existing subaccount:", match.subaccount_id);
            // Return success with the existing subaccount data
            const firestoreResult = await safeFirestoreOperation(async () => {
              const userDocRef = db.collection("staging_users").doc(userId);
              const userDoc = await userDocRef.get();

              const existingSubaccount = {
                id: match.id,
                subaccount_id: match.subaccount_id,
                account_number: match.account_number,
                account_bank: match.account_bank,
                business_name: match.business_name || body.business_name,
                business_email: match.business_email || body.business_email,
                business_mobile: match.business_mobile || body.business_mobile,
                business_contact: match.business_contact || body.business_contact,
                full_name: match.full_name,
                bank_name: match.bank_name,
                country: match.country || body.country,
                split_type: match.split_type || "percentage",
                split_value: match.split_value || 0.8,
                account_id: match.account_id,
                split_ratio: match.split_ratio || 1,
                meta: match.meta,
                created_at: new Date().toISOString(),
              };

              // Save to users collection (legacy)
              if (userDoc.exists) {
                const existingSubaccounts = userDoc.data()?.flutterwave_subaccounts || [];
                await userDocRef.update({
                  flutterwave_subaccounts: [...existingSubaccounts, existingSubaccount],
                });
              } else {
                // Create new user doc if it doesn't exist
                await userDocRef.set({
                  flutterwave_subaccounts: [existingSubaccount],
                  created_at: new Date().toISOString(),
                });
              }

              // Also save to tailors collection (primary storage)
              const tailorDocRef = db.collection("staging_tailors").doc(userId);
              await tailorDocRef.update({
                flutterwaveSubaccount: match,
                hasSubaccount: true,
                splitPercentage: 80,
              });
              console.log("✅ Existing subaccount saved to Firestore for user:", userId);
            });

            // Check if Firestore operation was affected by quota
            if (firestoreResult && firestoreResult.quotaExceeded) {
              console.log("⚠️ Existing subaccount found but not saved to Firestore due to quota limits");
              return NextResponse.json({ 
                success: true,
                data: match,
                message: "Subaccount already exists and may not be reflected in the dashboard immediately due to system limits. Please refresh the page."
              });
            }

            return NextResponse.json({ 
              success: true, 
              data: match,
              message: "Subaccount already exists and has been linked to your account."
            });
          } else {
            console.log("❌ Could not find matching subaccount in list.");
            return NextResponse.json(
              { error: "Subaccount already exists but could not be retrieved", details: result.data },
              { status: 400 }
            );
          }
        }
      } catch (fetchError: any) {
        console.error("Error fetching existing subaccounts:", fetchError);
        return NextResponse.json(
          { error: "Failed to verify existing subaccount", details: fetchError.message },
          { status: 500 }
        );
      }
    }

    // Check if the request to Flutterwave was successful for other cases
    if (!response.ok && result.status !== "success") {
      console.error("❌ Flutterwave API request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: JSON.stringify(result)
      });
      
      return NextResponse.json(
        { 
          error: result.message || `Flutterwave API request failed: ${response.status} ${response.statusText}`,
          details: result.data 
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      );
    }

    // Handle successful creation case
    if (result.status === "success" && result.data) {
      const finalData = result.data;
      const firestoreResult = await safeFirestoreOperation(async () => {
        const userDocRef = db.collection("staging_users").doc(userId);
        const userDoc = await userDocRef.get();

        const newSubaccount = {
          id: finalData.id,
          subaccount_id: finalData.subaccount_id,
          account_number: finalData.account_number,
          account_bank: finalData.account_bank,
          business_name: finalData.business_name || body.business_name,
          business_email: finalData.business_email || body.business_email,
          business_mobile: finalData.business_mobile || body.business_mobile,
          business_contact: finalData.business_contact || body.business_contact,
          full_name: finalData.full_name,
          bank_name: finalData.bank_name,
          country: finalData.country || body.country,
          split_type: finalData.split_type || "percentage",
          split_value: finalData.split_value || 0.8,
          account_id: finalData.account_id,
          split_ratio: finalData.split_ratio || 1,
          meta: finalData.meta,
          created_at: new Date().toISOString(),
        };

        // Save to users collection (legacy)
        if (userDoc.exists) {
          const existingSubaccounts = userDoc.data()?.flutterwave_subaccounts || [];
          await userDocRef.update({
            flutterwave_subaccounts: [...existingSubaccounts, newSubaccount],
          });
        } else {
          // Create new user doc if it doesn't exist
          await userDocRef.set({
            flutterwave_subaccounts: [newSubaccount],
            created_at: new Date().toISOString(),
          });
        }

        // Also save to tailors collection (primary storage)
        const tailorDocRef = db.collection("staging_tailors").doc(userId);
        await tailorDocRef.update({
          flutterwaveSubaccount: finalData,
          hasSubaccount: true,
          splitPercentage: 80,
        });
        console.log("✅ Subaccount saved to Firestore for user:", userId);
      });

      // Check if Firestore operation was affected by quota
      if (firestoreResult && firestoreResult.quotaExceeded) {
        console.log("⚠️ Subaccount created in Flutterwave but not saved to Firestore due to quota limits");
        return NextResponse.json({ 
          success: true,
          data: finalData,
          message: "Subaccount created successfully but may not be reflected in the dashboard immediately due to system limits. Please refresh the page."
        });
      }

      return NextResponse.json({ success: true, data: finalData });
    }

    console.log("❌ Flutterwave API returned error:", result);
    return NextResponse.json(
      { error: result.message || "Failed to create subaccount", details: result.data },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("API error:", error);
    console.error("Full error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Check if this is a quota exceeded error from Firebase
    if (error.code === 8 && error.details?.includes('Quota exceeded')) {
      console.log("⚠️ Quota exceeded error - returning appropriate response");
      return NextResponse.json({ 
        error: "Service temporarily unavailable due to system limits. Please try again later.",
        quotaExceeded: true
      }, { status: 503 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Subaccount ID required" }, { status: 400 });
    }

    const body = await request.json();

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts/${id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (response.ok && result.status === "success") {
      return NextResponse.json({ success: true, data: result.data });
    }

    return NextResponse.json({ error: result.message || "Failed to update subaccount" }, { status: 400 });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * ================== DELETE ==================
 * Delete a subaccount
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Subaccount ID required" }, { status: 400 });
    }

    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (response.ok && result.status === "success") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.message || "Failed to delete subaccount" }, { status: 400 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
