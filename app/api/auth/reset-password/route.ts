// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server"
import { adminDb, adminAuth } from "@/lib/firebase-admin" // ✅ server-side SDKs

export async function POST(req: Request) {
  try {
    const { email, otp, newPassword } = await req.json()

    console.log("🔐 Reset password request for:", email)

    if (!email || !otp || !newPassword) {
      console.log("❌ Missing fields:", { email: !!email, otp: !!otp, newPassword: !!newPassword })
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // ✅ Get OTP record from Firestore (Admin SDK)
    console.log("📝 Fetching OTP record from Firestore...")
    const resetRef = adminDb.collection("passwordResets").doc(email)
    const resetSnap = await resetRef.get()
    console.log("📝 OTP record exists:", resetSnap.exists)

    if (!resetSnap.exists) {
      return NextResponse.json({ error: "OTP not found or expired" }, { status: 400 })
    }

    const resetData = resetSnap.data()
    if (!resetData) {
      return NextResponse.json({ error: "Invalid OTP data" }, { status: 400 })
    }

    const { otp: storedOtp, expiresAt } = resetData as {
      otp: string
      expiresAt: number
    }

    // ✅ Check expiry
    if (Date.now() > expiresAt) {
      console.log("❌ OTP expired")
      await resetRef.delete() // Clean up expired OTP
      return NextResponse.json({ error: "OTP expired" }, { status: 400 })
    }

    // ✅ Check match
    if (otp !== storedOtp) {
      console.log("❌ Invalid OTP - provided:", otp, "stored:", storedOtp)
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    // ✅ Reset password using Admin Auth
    console.log("🔑 Fetching user by email...")
    const user = await adminAuth.getUserByEmail(email)
    console.log("🔑 User found:", user.uid)
    console.log("🔑 Updating password...")
    await adminAuth.updateUser(user.uid, { password: newPassword })
    console.log("✅ Password updated successfully")

    // ✅ Delete OTP record so it can't be reused
    await resetRef.delete()

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    })
  } catch (err: any) {
    console.error("❌ Reset Password Error:", err)
    console.error("❌ Error details:", {
      message: err?.message,
      code: err?.code,
      stack: err?.stack
    })
    
    // Return more specific error messages
    if (err?.code === 'auth/user-not-found') {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (err?.code === 'auth/invalid-password') {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Server error", 
      details: err?.message || "Unknown error" 
    }, { status: 500 })
  }
}
