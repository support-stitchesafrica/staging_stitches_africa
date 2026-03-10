// services/tailorProfile.ts

import { db } from "../firebase"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore"

export interface TailorProfile {
  uid: string
  email: string
  displayName?: string
  first_name?: string
  last_name?: string
  role?: string

  phoneNumber?: string
  address?: string
  is_tailor?: boolean
  is_sub_tailor?: boolean

  // Additional profile fields
  imageUrl?: string
  dateOfBirth?: string  // Format: YYYY-MM-DD
  stateOfOrigin?: string
  brandName?: string
  brand_name?: string
  brand_logo?: string
  gender?: "male" | "female" | "other"
  nationality?: string
  localGovernmentArea?: string
  languagesSpoken?: string[]
  yearsOfExperience?: number
  skillSpecialties?: string[]  // e.g. ["agbada", "senator", "bridal gown"]
  type?: string[] | string     // e.g. ["Bespoke", "Ready to Wear"] or "Bespoke" (legacy support)
  rating?: number              // 0 - 5
  bio?: string
  wallet?: number              // Wallet balance in USD

  // New fields for KYC upload permission
  requestKycUpload?: boolean   // if true, user can re-upload/update KYC
  kycUpdateReason?: string     // reason for requesting KYC change
  adminApprovedKycUpload?: boolean  // admin approval status
  kycApprovalStatus?: string   // "approved" | "declined"
  adminNote?: string           // admin's note/reason
  kycApprovedAt?: string       // when approved/declined

  // Timestamps
  createdAt?: string
  updatedAt?: string
}

export const getTailorProfile = async (uid: string) => {
  try {
    const userRef = doc(db, "staging_users", uid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      throw new Error("User not found")
    }

    return {
      success: true,
      data: userSnap.data() as TailorProfile,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to get profile",
    }
  }
}

export const updateTailorProfile = async (
  uid: string,
  updatedData: Partial<TailorProfile>
) => {
  // Sync brand_name and brandName
  if (updatedData.brand_name && !updatedData.brandName) {
    updatedData.brandName = updatedData.brand_name
  } else if (updatedData.brandName && !updatedData.brand_name) {
    updatedData.brand_name = updatedData.brandName
  }

  try {
    const userRef = doc(db, "staging_users", uid)
    const tailorRef = doc(db, "staging_tailors", uid) // tailor doc uses same uid

    // update users collection
    await updateDoc(userRef, {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    })

    // upsert (update or create) tailor profile
    await setDoc(
      tailorRef,
      {
        uid,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )

    return {
      success: true,
      message: "Profile updated successfully in both users and tailors",
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update profile",
    }
  }
}

/**
 * Request KYC upload permission.
 * This will set `requestKycUpload` and `kycUpdateReason` in both users and tailors collections.
 */
export const  requestKycUpload = async (uid: string, allow: boolean, reason: string) => {
  try {
    const userRef = doc(db, "staging_users", uid)
    const tailorRef = doc(db, "staging_tailors", uid)

    const payload = {
      requestKycUpload: allow,
      adminApprovedKycUpload: false,
      kycUpdateReason: reason,
      updatedAt: new Date().toISOString(),
    }

    // update in both collections
    await Promise.all([
      updateDoc(userRef, payload),
      setDoc(tailorRef, { uid, ...payload }, { merge: true }),
    ])

    return {
      success: true,
      message: `KYC update request submitted (reason: ${reason})`,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update KYC permission",
    }
  }
}
