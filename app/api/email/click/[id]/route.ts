import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc, arrayUnion, increment, serverTimestamp } from "firebase/firestore"
import { ensureDB } from "@/lib/firebase/collections"

export async function GET(req: Request, context: any) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get("url")
  const email = searchParams.get("email")
  const campaignId = context?.params?.id

  // ✅ If no URL provided, we can't redirect - return error
  if (!url || url.trim() === "") {
    console.error("❌ [Tracking] Missing redirect URL")
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 })
  }

  // ✅ Decode the destination URL
  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(url)
  } catch (error) {
    console.error("❌ [Tracking] Invalid URL encoding:", error)
    // If decoding fails, use the original URL
    decodedUrl = url
  }

  // ✅ Add https:// if the URL doesn't have a protocol
  if (decodedUrl && !decodedUrl.match(/^https?:\/\//i)) {
    decodedUrl = `https://${decodedUrl}`
    console.log(`ℹ️ [Tracking] Added https:// protocol to URL: ${decodedUrl}`)
  }

  // ✅ Validate that we have a proper absolute URL
  try {
    new URL(decodedUrl) // This will throw if URL is invalid
  } catch (error) {
    console.error(`❌ [Tracking] Invalid URL format: ${decodedUrl}`)
    return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
  }

  console.log(`🔗 [Tracking] Redirecting to: ${decodedUrl}`)

  // ✅ If no campaign ID, just redirect without tracking
  if (!campaignId) {
    console.warn("⚠️ [Tracking] Missing campaign ID, redirecting without tracking")
    return NextResponse.redirect(decodedUrl, 307) // Temporary redirect
  }

  // ✅ Attempt to track the click, but always redirect even if tracking fails
  try {
    const firestore = ensureDB()
    const ref = doc(firestore, "campaigns", campaignId)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      console.warn(`⚠️ [Tracking] Campaign ${campaignId} not found, redirecting without tracking`)
      return NextResponse.redirect(decodedUrl, 307) // Temporary redirect
    }

    const data = snap.data()
    const clickedBy = data?.clickedBy || []
    const userKey = `${email || "anonymous"}_${decodedUrl}`

    // ✅ Prevent duplicate clicks per user + per link
    if (!clickedBy.includes(userKey)) {
      await updateDoc(ref, {
        clickCount: increment(1),
        clickedBy: arrayUnion(userKey),
        updatedAt: serverTimestamp(),
      })
      console.log(`✅ [Tracking] Click tracked for campaign ${campaignId}`)
    } else {
      console.log(`ℹ️ [Tracking] Duplicate click ignored for campaign ${campaignId}`)
    }

    return NextResponse.redirect(decodedUrl, 307) // Temporary redirect
  } catch (error: any) {
    // ✅ Log error but still redirect user
    console.error("❌ [Tracking] Click tracking failed:", error.message)
    return NextResponse.redirect(decodedUrl, 307) // Temporary redirect
  }
}
