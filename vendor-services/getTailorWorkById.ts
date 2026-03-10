import { doc, getDoc, Timestamp } from "firebase/firestore"
import { db } from "../firebase"
import type { TailorWork, TailorWorkResponse } from "./types"

export const getTailorWorkById = async (workId: string, userId: string): Promise<TailorWorkResponse> => {
  try {
    const docRef = doc(db, "staging_tailor_works", workId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return { success: false, message: "Tailor work not found" }
    }

    const workData = docSnap.data() || {}

    const createdAt = workData.created_at instanceof Timestamp ? workData.created_at.toDate() : workData.created_at

    const updatedAt = workData.updated_at instanceof Timestamp ? workData.updated_at.toDate() : workData.updated_at

    const shipping = workData.shipping
      ? {
          tierKey: workData.shipping.tierKey || "",
          manualOverride: !!workData.shipping.manualOverride,
          actualWeightKg:
            typeof workData.shipping.actualWeightKg === "number"
              ? workData.shipping.actualWeightKg
              : undefined,
          lengthCm:
            typeof workData.shipping.lengthCm === "number"
              ? workData.shipping.lengthCm
              : undefined,
          widthCm:
            typeof workData.shipping.widthCm === "number"
              ? workData.shipping.widthCm
              : undefined,
          heightCm:
            typeof workData.shipping.heightCm === "number"
              ? workData.shipping.heightCm
              : undefined,
        }
      : undefined;

    const tailorWork: TailorWork = {
      ...workData,
      id: docSnap.id,
      created_at: createdAt,
      updated_at: updatedAt,
      images: Array.isArray(workData.images) ? workData.images : [],
      tags: Array.isArray(workData.tags) ? workData.tags : [],
      sizes: Array.isArray(workData.sizes) ? workData.sizes : [],
      userCustomSizes: Array.isArray(workData.userCustomSizes) ? workData.userCustomSizes : [],
      userSizes: Array.isArray(workData.userSizes) ? workData.userSizes : [],
      keywords: Array.isArray(workData.keywords) ? workData.keywords : [],
      shipping,
      rtwOptions: workData.rtwOptions
        ? {
            colors: Array.isArray(workData.rtwOptions.colors) ? workData.rtwOptions.colors : [],
            fabric: workData.rtwOptions.fabric || "",
            season: workData.rtwOptions.season || undefined,
          }
        : undefined,
      bespokeOptions: workData.bespokeOptions
        ? {
            customization: workData.bespokeOptions.customization
              ? {
                  fabricChoices: Array.isArray(workData.bespokeOptions.customization.fabricChoices)
                    ? workData.bespokeOptions.customization.fabricChoices
                    : [],
                  styleOptions: Array.isArray(workData.bespokeOptions.customization.styleOptions)
                    ? workData.bespokeOptions.customization.styleOptions
                    : [],
                  finishingOptions: Array.isArray(workData.bespokeOptions.customization.finishingOptions)
                    ? workData.bespokeOptions.customization.finishingOptions
                    : [],
                }
              : undefined,
            measurementsRequired: Array.isArray(workData.bespokeOptions.measurementsRequired)
              ? workData.bespokeOptions.measurementsRequired
              : [],
            productionTime: workData.bespokeOptions.productionTime || "",
          }
        : undefined,
      price: workData.price
        ? {
            base: workData.price.base || 0,
            discount: workData.price.discount || undefined,
            currency: workData.price.currency || "USD",
          }
        : { base: workData.price || 0, currency: "USD" },
    }

    // Check if the current user is the owner of this tailor work
    const isMainTailor = userId === tailorWork.tailor_id

    if (isMainTailor) {
      // User is the main tailor, allow access
      return { success: true, data: tailorWork }
    }

    // For sub-tailors, we need to check their user document
    // But only try to read the current user's own document to avoid permission issues
    try {
      const userRef = doc(db, "staging_users", userId)
      const userSnap = await getDoc(userRef)

      if (userSnap.exists()) {
        const userData = userSnap.data()
        const isSubTailorAccessingOwnMain = userData?.is_sub_tailor && userData?.tailorId === tailorWork.tailor_id

        if (isSubTailorAccessingOwnMain) {
          return { success: true, data: tailorWork }
        }
      }
    } catch (userError: any) {
      console.warn("[v0] Could not verify sub-tailor permissions:", userError.message)
      // If we can't read the user document due to permissions, 
      // fall back to checking if they're the main tailor (already done above)
    }

    // If we reach here, user doesn't have permission
    return {
      success: false,
      message: "You do not have permission to view this tailor work",
    }
  } catch (error: any) {
    console.error("[v0] Error fetching tailor work by ID:", error)
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      return { 
        success: false, 
        message: "Permission denied. Please ensure you're logged in and have access to this product." 
      }
    }
    
    if (error.code === 'unavailable') {
      return { 
        success: false, 
        message: "Service temporarily unavailable. Please try again later." 
      }
    }
    
    return { success: false, message: error.message || "Failed to fetch tailor work" }
  }
}
