// services/tailorWorks.ts
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore"
import { db } from "../firebase"
import { addActivityLog } from "./activitylog"



export interface TailorWorkPayload {
  // 🔑 Identity
  product_id: string
  tailor_id: string
  tailor: string

  // 🏷️ Basic Info
  title: string
  description: string
  category: "men" | "women" | "both"
  type: "bespoke" | "rtw"
  availability: "pre_order" | "in_stock" | "out_of_stock"
  status: "pending" | "verified" | "rejected"

  // 💰 Pricing
  price: {
    base: number
    currency: string
  }
  discount: number

  // 🧵 Customisation & Options
  bespokeOptions?: Record<string, any>
  rtwOptions?: Record<string, any>
  customization?: Record<string, any>

  fabricChoices?: any[]
  styleOptions?: any[]
  finishingOptions?: any[]

  // 📏 Sizes & Measurements
  sizes?: any[]
  measurementsRequired?: any[]
  customSizes: boolean
  userCustomSizes: boolean
  userSizes?: any[]

  // 🎨 Attributes
  colors?: any[]
  season?: string
  wear_category?: string
  wear_quantity: number
  is_disabled: boolean

  // 🚚 Shipping
  shipping: {
    lengthCm: number
    widthCm: number
    heightCm: number
    actualWeightKg: number
    tierKey: string
    manualOverride: boolean
  }

  // 🖼️ Media
  images: string[]

  // 🧾 Meta / Policies
  keywords?: string[]
  tags?: string[]
  returnPolicy?: string
  careInstructions?: string
  notesEnabled: boolean
  depositAllowed: boolean

  // ⏱️ Timelines
  productionTime?: string
  deliveryTimeline?: string

  // 🕒 Timestamps
  created_at?: any
  updated_at?: any
  updatedAt?: string
}

export interface Tailor {
  // 🔑 Identity
  uid: string
  email: string
  role: string

  // 🧵 Brand
  brand_name: string
  brandName?: string
  brand_logo?: string
  featured_works?: string[]
  ratings?: number
  wallet?: number
  type?: string[] // ["Bespoke", "RTW"]

  // 👤 Personal Info
  first_name?: string
  last_name?: string
  gender?: string
  nationality?: string
  stateOfOrigin?: string
  languagesSpoken?: string[]
  language_preference?: string
  phoneNumber?: string
  phone_number?: string
  is_disabled: boolean

  // 🏠 Address (flattened + verified)
  address?: string
  streetAddress?: string
  city?: string
  state?: string
  country?: string
  postCode?: string

  // 🏢 Company Verification
  ["company-verification"]?: {
    companyName: string
    registrationNumber: string
    country: string
    documentImageUrl: string
    status: "pending" | "approved" | "rejected"
    verifiedAt?: any
  }

  // 📍 Address Verification
  ["company-address-verification"]?: {
    streetAddress: string
    city: string
    state: string
    country: string
    postCode: string
    proofOfAddress: string
    status: "pending" | "approved" | "rejected"
  }

  // 🪪 Identity Verification
  ["identity-verification"]?: {
    verificationType: "nin" | "passport" | "driver_license"
    countryCode: string
    idNumber: string
    fullName: string
    middleName?: string
    feedbackMessage?: string
    status: "pending" | "review" | "approved" | "rejected"
  }

  // 🧾 Registration Info
  tailor_registered_info?: {
    email: string
    "first-name": string
    "last-name": string
    id: string
  }

  // 🔐 Roles & Flags
  is_tailor: boolean
  is_sub_tailor?: boolean
  is_general_admin?: boolean

  // 🛍️ Preferences
  shopping_preference?: string

  // 💳 Finance
  transactions?: any[]

  // 🕒 Meta
  updatedAt?: string
}


export const getAllTailorWorks = async () => {
  try {
    // 1️⃣ Fetch all works
    const worksSnap = await getDocs(
      query(collection(db, "staging_tailor_works"), where("is_disabled", "==", false))
    );

    // 2️⃣ Fetch all active tailors
    const tailorsSnap = await getDocs(
      query(collection(db, "staging_tailors"), where("is_disabled", "==", false))
    );

    // 3️⃣ Build a set of active tailor IDs
    const activeTailorIds = new Set(tailorsSnap.docs.map(d => d.id));

    // 4️⃣ Map and filter works that belong to active tailors
    const works = worksSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((work: any) => activeTailorIds.has(work.tailor_id)); // ✅ use tailor_id

    return { success: true, data: works };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to fetch tailor works" };
  }
};





export const addTailorWork = async (data: TailorWorkPayload) => {
  try {
    const docRef = await addDoc(collection(db, "staging_tailor_works"), {
      ...data,
      is_disabled: false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    })

    return { success: true, id: docRef.id }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to create tailor work" }
  }
}



// 📥 Get all tailor works for the logged-in agent
export const getTailorWorksByAgent = async (agentId: string) => {
  try {
    const q = query(collection(db, "staging_tailor_works"))
    const snapshot = await getDocs(q)

    const works = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    // ✅ Total number of tailor works
    const totalTailorWorks = works.length

    // ✅ Total number of products
    const totalProducts = works.length

    // ✅ Total quantity (ONLY wearQuantity)
    const totalQuantities = works.reduce((total, work: any) => {
      const wearQty = Number(work.wearQuantity) || 0
      return total + wearQty
    }, 0)

    return {
      success: true,
      data: works,
      meta: {
        totalTailorWorks,
        totalProducts,
        totalQuantities,
      },
    }
  } catch (error) {
    console.error("Failed to fetch tailor works for agent:", error)
    return { success: false, message: "Failed to fetch tailor works" }
  }
}



// 📌 Get single tailor work by ID (if it belongs to the agent)
export const getTailorWorkById = async (id: string) => {
  try {
    const docRef = doc(db, "staging_tailor_works", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return { success: false, message: "Tailor work not found" }
    }

    return { success: true, data: { id: docSnap.id, ...docSnap.data() } }
  } catch (error) {
    console.error("Failed to fetch tailor work:", error)
    return { success: false, message: "Failed to fetch tailor work" }
  }
}

export const disableTailorWork = async (id: string) => {
  return updateTailorWork(id, { is_disabled: true })
}

// ✏️ Update tailor work (only if created by agent)
export const updateTailorWork = async (
  id: string,
  updates: Partial<TailorWorkPayload>
) => {
  try {
    await updateDoc(doc(db, "staging_tailor_works", id), {
      ...updates,
      updated_at: Timestamp.now(),
    })

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to update tailor work" }
  }
}



// ❌ Delete tailor work (only if created by agent)
export const deleteTailorWork = async (id: string) => {
  try {
    await deleteDoc(doc(db, "staging_tailor_works", id))
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to delete tailor work" }
  }
}






export const getAllTailors = async (): Promise<{ success: boolean; data?: Tailor[]; message?: string }> => {
  try {
    const snap = await getDocs(
      query(collection(db, "staging_tailors"), where("is_disabled", "==", false))
    )

    const tailors: Tailor[] = snap.docs.map(doc => {
      const data = doc.data()

      return {
        // 🔑 Identity
        uid: doc.id,
        email: data.email || "",
        role: data.role || "tailor",

        // 🧵 Brand
        brand_name: data.brand_name || "",
        brandName: data.brandName || "",
        brand_logo: data.brand_logo || "",
        featured_works: data.featured_works || [],
        ratings: data.ratings ?? 0,
        wallet: data.wallet ?? 0,
        type: data.type || [],

        // 👤 Personal Info
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        gender: data.gender || "",
        nationality: data.nationality || "",
        stateOfOrigin: data.stateOfOrigin || "",
        languagesSpoken: data.languagesSpoken || [],
        language_preference: data.language_preference || "",
        phoneNumber: data.phoneNumber || "",
        phone_number: data.phone_number || "",
        is_disabled: data.is_disabled ?? false,

        // 🏠 Address
        address: data.address || "",
        streetAddress: data.streetAddress || "",
        city: data.city || "",
        state: data.state || "",
        country: data.country || "",
        postCode: data.postCode || "",

        // 🏢 Company Verification
        ["company-verification"]: data["company-verification"] || undefined,

        // 📍 Address Verification
        ["company-address-verification"]: data["company-address-verification"] || undefined,

        // 🪪 Identity Verification
        ["identity-verification"]: data["identity-verification"] || undefined,

        // 🧾 Registration Info
        tailor_registered_info: data.tailor_registered_info || {
          email: "",
          "first-name": "",
          "last-name": "",
          id: "",
        },

        // 🔐 Roles & Flags
        is_tailor: data.is_tailor ?? true,
        is_sub_tailor: data.is_sub_tailor ?? false,
        is_general_admin: data.is_general_admin ?? false,

        // 🛍️ Preferences
        shopping_preference: data.shopping_preference || "",

        // 💳 Finance
        transactions: data.transactions || [],

        // 🕒 Meta
        updatedAt: data.updatedAt || "",
      }
    })

    return { success: true, data: tailors }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to fetch tailors" }
  }
}





export const getTailorById = async (tailorId: string) => {
  try {
    const snap = await getDoc(doc(db, "staging_tailors", tailorId))

    if (!snap.exists()) {
      return { success: false, message: "Tailor not found" }
    }

    const data = snap.data()

    if (data.is_disabled) {
      return { success: false, message: "Tailor is disabled" }
    }

    return { success: true, data: { uid: snap.id, ...data } }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to fetch tailor" }
  }
}


export const updateTailor = async (
  tailorId: string,
  updates: Partial<Tailor>
) => {
  try {
    await updateDoc(doc(db, "staging_tailors", tailorId), {
      ...updates,
      updatedAt: new Date().toISOString(),
    })

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to update tailor" }
  }
}

export const disableTailor = async (tailorId: string) => {
  try {
    await updateDoc(doc(db, "staging_tailors", tailorId), {
      is_disabled: true,
      updatedAt: new Date().toISOString(),
    })

    const worksSnap = await getDocs(
      query(
        collection(db, "staging_tailor_works"),
        where("tailor_id", "==", tailorId)
      )
    )

    for (const work of worksSnap.docs) {
      await updateDoc(work.ref, { is_disabled: true })
    }

    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to disable tailor" }
  }
}

export const deleteTailor = async (tailorId: string) => {
  try {
    await deleteDoc(doc(db, "staging_tailors", tailorId))
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, message: "Failed to delete tailor" }
  }
}
