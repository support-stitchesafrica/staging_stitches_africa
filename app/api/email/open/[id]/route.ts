import { NextResponse } from "next/server"
import { doc, getDoc, updateDoc, arrayUnion, serverTimestamp, increment } from "firebase/firestore"
import { ensureDB } from "@/lib/firebase/collections"

export async function GET(req: Request, context: any) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const campaignId = context?.params?.id

  // ✅ Create the 1x1 transparent PNG pixel
  const pixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGD4DwABBAEAQf7+8wAAAABJRU5ErkJggg==",
    "base64"
  )

  const pixelResponse = new NextResponse(pixel, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  })

  // ✅ If no campaign ID, return pixel without tracking
  if (!campaignId) {
    console.warn("⚠️ [Tracking] Missing campaign ID, returning pixel without tracking")
    return pixelResponse
  }

  // ✅ Attempt to track the open, but always return pixel even if tracking fails
  try {
    const firestore = ensureDB()
    const ref = doc(firestore, "campaigns", campaignId)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      console.warn(`⚠️ [Tracking] Campaign ${campaignId} not found, returning pixel without tracking`)
      return pixelResponse
    }

    const data = snap.data()
    const openedBy = data?.openedBy || []
    const emailKey = email || "anonymous"

    // ✅ Prevent multiple opens from same user
    if (!openedBy.includes(emailKey)) {
      await updateDoc(ref, {
        openCount: increment(1),
        openedBy: arrayUnion(emailKey),
        updatedAt: serverTimestamp(),
      })
      console.log(`✅ [Tracking] Open tracked for campaign ${campaignId}`)
    } else {
      console.log(`ℹ️ [Tracking] Duplicate open ignored for campaign ${campaignId}`)
    }

    return pixelResponse
  } catch (error: any) {
    // ✅ Log error but still return pixel to user
    console.error("❌ [Tracking] Open tracking failed:", error.message)
    return pixelResponse
  }
}
