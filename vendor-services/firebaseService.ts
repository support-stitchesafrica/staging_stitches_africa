// services/firebaseService.ts
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  DocumentData,
  DocumentSnapshot,
  onSnapshot,
  FieldValue,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/firebase"

// ✅ Create tailor data
export async function createTailorData(
  userId: string,
  brandName: string,
  email: string,
  brand_logo: string
): Promise<void> {
  try {
    const tailorRef = doc(db, "staging_tailors", userId)

    const tailorData = {
      tailor_registered_info: {
        
        email: email,
        id: userId,
        
      },
      "company-verification": { status: null },
      "identity-verification": { status: null },
      "company-address-verification": { status: null },
      featured_works: [],
      ratings: 0.0,
      wallet: 0.0,
      transactions: [],
      brand_logo: brand_logo,
      brand_name: brandName,
    }

    await setDoc(tailorRef, tailorData)

    console.log("Tailor data created successfully")

    // 🟢 Duplicate to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", userId)
      await setDoc(localTailorRef, tailorData)
      console.log("Tailor data duplicated to tailors_local:", userId)
    } catch (localError) {
      console.error("Error duplicating to tailors_local:", localError)
      // Don't throw error here - main operation succeeded
    }
  } catch (error) {
    console.error("Failed to create tailor data:", error)
    throw error
  }
}


// ✅ Update tailor
export async function updateTailor(userId: string, data: Record<string, any>) {
  try {
    await updateDoc(doc(db, "staging_tailors", userId), data)
    console.log("Tailor updated successfully")

    // 🟢 Duplicate update to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", userId)
      const localDocSnap = await getDoc(localTailorRef)
      
      if (localDocSnap.exists()) {
        await updateDoc(localTailorRef, data)
        console.log("Tailor updated in tailors_local:", userId)
      } else {
        console.log("Tailor not found in tailors_local, skipping update")
      }
    } catch (localError) {
      console.error("Error updating tailors_local:", localError)
      // Don't throw error here - main operation succeeded
    }
  } catch (error) {
    console.error("Failed to update tailor:", error)
  }
}

// ✅ Update tailor work
export async function updateTailorWork(
  productId: string,
  data: Record<string, any>
) {
  try {
    await updateDoc(doc(db, "staging_tailor_works", productId), data)
    console.log("Tailor work updated successfully")
  } catch (error) {
    console.error("Failed to update tailor work:", error)
  }
}


// ✅ Save Business Verification
export async function saveBusinessVerification(
  userId: string,
  registrationNumber: string,
  companyName: string,
  country: string,
  imageUrl: string,
  data: any // define proper type later
) {
  try {
    if (!data) throw new Error("Invalid business data")

    // Build the businessInfo object, only include defined fields
    const businessInfo: Record<string, any> = {
      status: "approved",
      documentImageUrl: imageUrl,
      verifiedAt: serverTimestamp(),
      registrationNumber: registrationNumber,
      companyName: companyName,
      country: country,
    }

    if (data.name) businessInfo.businessName = data.name
    if (data.registrationNumber) businessInfo.registrationNumber = data.registrationNumber
    if (data.address) businessInfo.address = data.address
    if (data.city) businessInfo.city = data.city
    if (data.state) businessInfo.state = data.state
    if (data.typeOfEntity) businessInfo.typeOfEntity = data.typeOfEntity
    if (data.status) businessInfo.companyStatus = data.status
    if (data.keyPersonnel && Array.isArray(data.keyPersonnel)) {
      businessInfo.keyPersonnel = data.keyPersonnel.map((p: any) => {
        const personnel: Record<string, any> = {}
        if (p.name) personnel.name = p.name
        if (p.designation) personnel.designation = p.designation
        if (p.nationality) personnel.nationality = p.nationality
        if (p.countryOfResidence) personnel.countryOfResidence = p.countryOfResidence
        if (p.gender) personnel.gender = p.gender
        if (typeof p.isCorporate === "boolean") personnel.isCorporate = p.isCorporate
        return personnel
      })
    }

    const updateData = {
      "company-verification": businessInfo,
    }

    await updateDoc(doc(db, "staging_tailors", userId), updateData)

    console.log("Business verification saved")

    // 🟢 Duplicate update to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", userId)
      const localDocSnap = await getDoc(localTailorRef)
      
      if (localDocSnap.exists()) {
        await updateDoc(localTailorRef, updateData)
        console.log("Business verification updated in tailors_local:", userId)
      } else {
        console.log("Tailor not found in tailors_local, skipping update")
      }
    } catch (localError) {
      console.error("Error updating tailors_local:", localError)
      // Don't throw error here - main operation succeeded
    }
  } catch (error) {
    console.error("Error saving business verification:", error)
    throw error
  }
}

// ✅ Save Identity Verification
export async function saveIdentityVerification(params: {
  userId: string
  idNumber: string
  fullName: string
  verificationType: string
  countryCode: string
  middleName?: string
}) {
  try {
    const updateData = {
      "identity-verification": {
        status: "pending",
        idNumber: params.idNumber,
        fullName: params.fullName,
        verificationType: params.verificationType,
        countryCode: params.countryCode,
        middleName: params.middleName || null,
      },
    }

    await updateDoc(doc(db, "staging_tailors", params.userId), updateData)
    console.log("Identity verification saved")

    // 🟢 Duplicate update to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", params.userId)
      const localDocSnap = await getDoc(localTailorRef)
      
      if (localDocSnap.exists()) {
        await updateDoc(localTailorRef, updateData)
        console.log("Identity verification updated in tailors_local:", params.userId)
      } else {
        console.log("Tailor not found in tailors_local, skipping update")
      }
    } catch (localError) {
      console.error("Error updating tailors_local:", localError)
      // Don't throw error here - main operation succeeded
    }
  } catch (error) {
    console.error("Error saving identity verification:", error)
    throw error
  }
}

// ✅ Save Company Address
export async function saveCompanyAddress(params: {
  userId: string
  streetAddress: string
  city: string
  state: string
  postCode: string
  country: string
  proofOfAddress: string
}) {
  try {
    const updateData = {
      "company-address-verification": {
        status: "pending",
        streetAddress: params.streetAddress,
        city: params.city,
        state: params.state,
        postCode: params.postCode,
        country: params.country,
        proofOfAddress: params.proofOfAddress,
      },
    }

    await updateDoc(doc(db, "staging_tailors", params.userId), updateData)
    console.log("Address saved")

    // 🟢 Duplicate update to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", params.userId)
      const localDocSnap = await getDoc(localTailorRef)
      
      if (localDocSnap.exists()) {
        await updateDoc(localTailorRef, updateData)
        console.log("Address updated in tailors_local:", params.userId)
      } else {
        console.log("Tailor not found in tailors_local, skipping update")
      }
    } catch (localError) {
      console.error("Error updating tailors_local:", localError)
      // Don't throw error here - main operation succeeded
    }
  } catch (error) {
    console.error("Error saving address:", error)
    throw error
  }
}

// ✅ Get Tailor Verification Status
export async function getTailorVerificationStatus(userId: string) {
  try {
    const docSnap = await getDoc(doc(db, "staging_tailors", userId))
    if (!docSnap.exists()) return "pending"

    const data = docSnap.data() as any
    const statuses = [
      data["company-verification"]?.status,
      data["identity-verification"]?.status,
      data["company-address-verification"]?.status,
    ]

    if (statuses.includes(null)) return "null"
    if (statuses.includes("failed")) return "failed"
    if (statuses.includes("pending")) return "pending"
    if (statuses.every((s: string) => s === "approved")) return "approved"
    return "unknown"
  } catch (error) {
    console.error("Error fetching verification status:", error)
    return "pending"
  }
}

// ✅ Stream a specific verification status
export function streamTailorSpecificVerificationStatus(
  verificationType: "company" | "identity" | "address",
  userId: string,
  callback: (status: string | null) => void
) {
  const unsub = onSnapshot(doc(db, "staging_tailors", userId), (docSnap) => {
    if (!docSnap.exists()) return callback("pending")
    const data = docSnap.data() as any

    switch (verificationType) {
      case "company":
        return callback(data["company-verification"]?.status || "pending")
      case "identity":
        return callback(data["identity-verification"]?.status || "pending")
      case "address":
        return callback(data["company-address-verification"]?.status || "pending")
      default:
        return callback("pending")
    }
  })
  return unsub
}


// ------------------
// Existing functions here (createTailorData, saveIdentityVerification, etc.)
// ------------------

// ✅ Verify and Update Identity
export async function verifyAndUpdateIdentity(userId: string) {
  try {
    const tailorDoc = await getDoc(doc(db, "staging_tailors", userId));

    if (!tailorDoc.exists()) {
      throw new Error("Tailor document not found.");
    }

    const data = tailorDoc.data() as any;
    const businessVerification = data["company-verification"] ?? {};
    const identityVerification = data["identity-verification"] ?? {};

    // Use empty array if keyPersonnel is missing
    const keyPersonnelList: any[] = Array.isArray(businessVerification["keyPersonnel"])
      ? businessVerification["keyPersonnel"]
      : [];

    const identityFullName: string = identityVerification["fullName"] || "";
    if (!identityFullName.trim()) {
      throw new Error("Identity full name is missing.");
    }

    const identityNameParts = normalizeName(identityFullName);

    let isApproved = false;
    let needsReview = false;

    for (const person of keyPersonnelList) {
      const personnelName: string | null = person?.name || null;
      if (!personnelName) continue;

      const personnelNameParts = normalizeName(personnelName);

      if (isNameMatch(identityNameParts, personnelNameParts)) {
        isApproved = true;
        break;
      }

      if (isPartialNameMatch(identityNameParts, personnelNameParts)) {
        needsReview = true;
      }
    }

    // If no key personnel exist, mark for review instead of failing
    if (keyPersonnelList.length === 0) {
      needsReview = true;
    }

    let status: string;
    let feedbackMessage: string;

    if (isApproved) {
      status = "approved";
      feedbackMessage = "Identity verification approved successfully.";
    } else if (needsReview) {
      status = "review";
      feedbackMessage =
        "Identity verification requires manual review (key personnel missing or partial match).";
    } else {
      status = "failed";
      feedbackMessage =
        "Identity verification failed. No matching name found in key personnel records.";
    }

    const updateData = {
      "identity-verification.status": status,
      "identity-verification.feedbackMessage": feedbackMessage,
    };

    await updateDoc(doc(db, "staging_tailors", userId), updateData);

    console.log(`Identity verification updated: ${status} - ${feedbackMessage}`);

    // 🟢 Duplicate update to tailors_local collection
    try {
      const localTailorRef = doc(db, "staging_tailors_local", userId)
      const localDocSnap = await getDoc(localTailorRef)
      
      if (localDocSnap.exists()) {
        await updateDoc(localTailorRef, updateData)
        console.log("Identity verification updated in tailors_local:", userId)
      } else {
        console.log("Tailor not found in tailors_local, skipping update")
      }
    } catch (localError) {
      console.error("Error updating tailors_local:", localError)
      // Don't throw error here - main operation succeeded
    }
  } catch (e: any) {
    console.error("Error verifying identity:", e);
    throw new Error("Failed to verify identity");
  }
}


// ------------------
// 🔹 Helper functions
// ------------------

function normalizeName(name: string): string[] {
  return name
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(" ")
    .filter((part) => part.trim().length > 0)
}

function isNameMatch(identityParts: string[], personnelParts: string[]): boolean {
  if (identityParts.length === 0 || personnelParts.length === 0) return false
  return (
    identityParts.length === personnelParts.length &&
    identityParts.every((part) => personnelParts.includes(part))
  )
}

function isPartialNameMatch(identityParts: string[], personnelParts: string[]): boolean {
  if (identityParts.length === 0 || personnelParts.length === 0) return false
  let matches = 0
  identityParts.forEach((part) => {
    if (personnelParts.includes(part)) matches++
  })
  return matches >= Math.min(identityParts.length, personnelParts.length) - 1
}

// ✅ Check if key exists
export async function doesKeyExist(userId: string, key: string) {
  try {
    const docSnap = await getDoc(doc(db, "staging_tailors", userId))
    if (!docSnap.exists()) return false
    return docSnap.data()?.hasOwnProperty(key)
  } catch (error) {
    console.error("Error checking key:", error)
    return false
  }
}
