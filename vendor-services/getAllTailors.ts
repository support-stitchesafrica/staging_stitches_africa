// services/getAllTailors.ts
import { collection, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export interface TailorBrand {
  id: string
  brandName: string
  brand_logo: string
  type: ("Bespoke" | "Ready to Wear")[] // ✅ now array
}

export const getAllTailors = async (filterType?: "Bespoke" | "Ready to Wear") => {
  try {
    const tailorsRef = collection(db, "staging_tailors")
    const querySnapshot = await getDocs(tailorsRef)

    let tailors: TailorBrand[] = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        brandName: data?.brandName || "",
        brand_logo: data?.brand_logo || "",
        type: (data?.type as ("Bespoke" | "Ready to Wear")[]) || [],
      }
    })

    // ✅ Filter if a type is passed
    if (filterType) {
      tailors = tailors.filter((t) => t.type.includes(filterType))
    }

    return { success: true, data: tailors }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
