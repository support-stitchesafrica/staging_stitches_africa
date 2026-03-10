import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "./config" // your initialized Firestore instance

/**
 * Fetches open and click stats for a campaign
 */
export async function getCampaignStats(campaignId: string) {
  try {
    const openQuery = query(
      collection(db, "emailEvents"),
      where("campaignId", "==", campaignId),
      where("type", "==", "open")
    )
    const clickQuery = query(
      collection(db, "emailEvents"),
      where("campaignId", "==", campaignId),
      where("type", "==", "click")
    )

    const [openSnap, clickSnap] = await Promise.all([
      getDocs(openQuery),
      getDocs(clickQuery),
    ])

    // count unique emails
    const openCount = new Set(openSnap.docs.map((d) => d.data().email)).size
    const clickCount = new Set(clickSnap.docs.map((d) => d.data().email)).size

    return { openCount, clickCount }
  } catch (error) {
    console.error("Error fetching campaign stats:", error)
    return { openCount: 0, clickCount: 0 }
  }
}
