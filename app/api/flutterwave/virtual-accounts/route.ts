import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

const FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"
const SECRET_KEY = process.env.FLW_SECRET_KEY || "FLWSECK_TEST-02ee0b7df96592af7212f85824bd2db0-X"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Get user's virtual accounts from Firestore
    const userDoc = await adminDb.collection("staging_users").doc(userId).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userData = userDoc.data()
    const virtualAccounts = userData?.virtual_accounts || []

    return NextResponse.json({ virtualAccounts })
  } catch (error) {
    console.error("Error fetching virtual accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const body = await request.json()

    // Create virtual account with Flutterwave
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/virtual-account-numbers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    if (response.ok && result.status === "success") {
      // Save virtual account to Firestore
      const userDocRef = adminDb.collection("staging_users").doc(userId)
      const userDoc = await userDocRef.get()

      if (userDoc.exists) {
        const userData = userDoc.data()
        const existingAccounts = userData?.virtual_accounts || []

        const newAccount = {
          id: result.data.response_code,
          account_number: result.data.account_number,
          account_reference: result.data.account_reference,
          bank_name: result.data.bank_name,
          created_at: new Date().toISOString(),
          currency: result.data.currency || "NGN",
          order_ref: result.data.order_ref,
          type: result.data.type || "nuban",
        }

        await userDocRef.update({
          virtual_accounts: [...existingAccounts, newAccount],
        })
      }

      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json({ error: result.message || "Failed to create virtual account" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error creating virtual account:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ================== DELETE ==================
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get("user-id")
    const subaccountId = request.headers.get("subaccount-id") // subaccount ID to delete

    if (!userId || !subaccountId) {
      return NextResponse.json({ error: "User ID and Subaccount ID are required" }, { status: 400 })
    }

    // Call Flutterwave DELETE endpoint
    const response = await fetch(`${FLUTTERWAVE_BASE_URL}/subaccounts/${subaccountId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const result = await response.json()

    if (response.ok && result.status === "success") {
      // Remove subaccount from Firestore
      const userDocRef = adminDb.collection("staging_users").doc(userId)
      const userDoc = await userDocRef.get()
      if (userDoc.exists) {
        const userData = userDoc.data()
        const existingSubaccounts = userData?.flutterwave_subaccounts || []
        const updatedSubaccounts = existingSubaccounts.filter(
          (s: any) => s.subaccount_id !== subaccountId
        )

        await userDocRef.update({ flutterwave_subaccounts: updatedSubaccounts })
      }

      return NextResponse.json({ success: true, data: result.data })
    } else {
      return NextResponse.json(
        { error: result.message || "Failed to delete subaccount" },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error("Error deleting subaccount:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}