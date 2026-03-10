// services/getTailorWorks.ts
import { collection, getDocs, query, where, doc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "../firebase"
import type { TailorWork, TailorWorksResponse } from "./types"

export const getTailorWorks = async (): Promise<TailorWorksResponse> => {
  try {
    const uid = localStorage.getItem("tailorUID")
    if (!uid) throw new Error("Tailor UID not found in localStorage")

    // Step 1: Fetch user profile from `users/userId`
    const userRef = doc(db, "staging_users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) throw new Error("User not found.")

    const userData = userSnap.data()

    // Step 2: Determine the correct tailor UID to use for fetching works
    const targetTailorId = userData.is_sub_tailor ? userData.tailorId : uid

    if (!targetTailorId) throw new Error("No valid tailorId found.")

    // Step 3: Query works using the resolved tailorId
    const worksRef = collection(db, "staging_tailor_works")
    const q = query(worksRef, where("tailor_id", "==", targetTailorId))

    const querySnapshot = await getDocs(q)

    const works: TailorWork[] = querySnapshot.docs.map((doc) => {
      const data = doc.data()

      const createdAt = data.created_at instanceof Timestamp ? data.created_at.toDate() : data.created_at

      const updatedAt = data.updated_at instanceof Timestamp ? data.updated_at.toDate() : data.updated_at

      return {
        id: doc.id,
        ...data,
        images: Array.isArray(data.images) ? data.images : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        sizes: Array.isArray(data.sizes) ? data.sizes : [],
        userCustomSizes: Array.isArray(data.userCustomSizes) ? data.userCustomSizes : [],
        userSizes: Array.isArray(data.userSizes) ? data.userSizes : [],
        keywords: Array.isArray(data.keywords) ? data.keywords : [],
        created_at: createdAt,
        updated_at: updatedAt,
        rtwOptions: data.rtwOptions || null,
        bespokeOptions: data.bespokeOptions || null,
        price: data.price || { base: 0, currency: "USD" },
      } as TailorWork
    })

    return { success: true, data: works }
  } catch (error: any) {
    console.error("[v0] Error fetching tailor works:", error)
    return {
      success: false,
      message: error.message || "Failed to fetch tailor works",
    }
  }
}
