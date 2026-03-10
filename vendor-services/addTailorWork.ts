import { 
  addDoc, 
  collection, 
  deleteDoc, 
  doc, 
  getDoc, 
  serverTimestamp, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../firebase";

export interface ProductFormData {
  product_id?: string;
  title: string;
  description: string;
  price?: {
    base: number;
    discount?: number;
    currency: string;
  };
  discount?: number;
  wear_quantity: number;
  wear_category: string;
  category: string;
  tags?: string[];
  availability?: string;
  deliveryTimeline?: string;
  careInstructions?: string;
  rtwOptions?: {
    colors?: string[];
    fabric?: string;
    season?: string;
    sizes?: string[];
  };
  bespokeOptions?: {
    customization?: {
      fabricChoices?: string[];
      styleOptions?: string[];
      finishingOptions?: string[];
    };
    measurementsRequired?: string[];
    productionTime?: string;
    depositAllowed?: boolean;
    notesEnabled?: boolean;
  };
  sizes: any[];
  userCustomSizes?: any;
  userSizes?: any[];
  images: string[];
  is_verified?: boolean;
  tailor: string;
  tailor_id?: string;
  type: string;
  keywords: string | string[];
  customSizes: boolean;

  shipping?: {
    tierKey: string;               // e.g., 'tier_medium'
    manualOverride: boolean;       // true if vendor provided custom values
    actualWeightKg?: number;
    lengthCm?: number;
    widthCm?: number;
    heightCm?: number;
  };
  approvalStatus?: "pending" | "approved" | "rejected";
  
  // Multiple pricing support
  enableMultiplePricing?: boolean;
  individualItems?: {
    id: string;
    name: string;
    price: number;
  }[];
  metric_size_guide?: any;
}

// === CREATE ===
export const addTailorWork = async (tailorId: string, formData: ProductFormData) => {
  try {
    let effectiveTailorId = tailorId;
    let isSubTailor = false;

    // 🔍 Check if this user is a sub-tailor
    const userRef = doc(db, "staging_users", tailorId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (userData.is_sub_tailor && userData.tailorId) {
        effectiveTailorId = userData.tailorId;
        isSubTailor = true;
      }
    }

    const status = isSubTailor ? "initiated" : "verified";

    // Prepare the product data
    const productData = {
      tailor_id: effectiveTailorId,
      type: formData.type,
      title: formData.title,
      price: {
        base: formData.price?.base || 0,
        discount: formData.price?.discount || null,
        currency: formData.price?.currency || "USD",
      },
      discount: formData.discount || 0,
      description: formData.description,
      category: formData.category,
      wear_category: formData.wear_category,
      wear_quantity: formData.wear_quantity,
      tags: formData.tags ?? [],
      keywords: Array.isArray(formData.keywords)
        ? formData.keywords
        : formData.keywords.split(",").map((k) => k.trim()),
      images: formData.images ?? [],
      sizes: formData.sizes ?? [],
      customSizes: formData.customSizes ?? false,
      userCustomSizes: formData.userCustomSizes ?? [],
      userSizes: formData.userSizes ?? [],
      tailor: formData.tailor,
      status,
      created_at: serverTimestamp(),
      availability: formData.availability || "in_stock",
      deliveryTimeline: formData.deliveryTimeline || "",
      createdAt: new Date().toISOString(),
      approvalStatus: formData.approvalStatus || "pending",
      metric_size_guide: formData.metric_size_guide || null,

      // RTW-specific
      rtwOptions:
        formData.type === "ready-to-wear"
          ? {
              colors: formData.rtwOptions?.colors || [],
              fabric: formData.rtwOptions?.fabric || "",
              season: formData.rtwOptions?.season || null,
              sizes: formData.rtwOptions?.sizes || [], // Array of size strings
            }
          : null,

      // Bespoke-specific
      bespokeOptions:
        formData.type === "bespoke"
          ? {
              customization: {
                fabricChoices: formData.bespokeOptions?.customization?.fabricChoices || [],
                styleOptions: formData.bespokeOptions?.customization?.styleOptions || [],
                finishingOptions: formData.bespokeOptions?.customization?.finishingOptions || [],
              },
              measurementsRequired: formData.bespokeOptions?.measurementsRequired || [],
              productionTime: formData.bespokeOptions?.productionTime || "",
            }
          : null,

      // 🟢 Shipping Information
      shipping: {
        tierKey: formData.shipping?.tierKey || "tier_medium",
        manualOverride: formData.shipping?.manualOverride || false,
        actualWeightKg: formData.shipping?.actualWeightKg || null,
        lengthCm: formData.shipping?.lengthCm || null,
        widthCm: formData.shipping?.widthCm || null,
        heightCm: formData.shipping?.heightCm || null,
      },
      
      // Multiple pricing support
      enableMultiplePricing: formData.enableMultiplePricing,
      individualItems: formData.individualItems,
    };

    // Add to tailor_works collection
    const docRef = await addDoc(collection(db, "staging_tailor_works"), productData);

    await updateDoc(docRef, {
      product_id: docRef.id,
    });

    // 🟢 Duplicate to tailor_works_local collection
    try {
      const localDocRef = await addDoc(collection(db, "staging_tailor_works_local"), {
        ...productData,
        product_id: docRef.id,
      });
      console.log("Product duplicated to tailor_works_local:", localDocRef.id);
    } catch (localError) {
      console.error("Error duplicating to tailor_works_local:", localError);
      // Don't throw error here - main operation succeeded
    }

    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

// === UPDATE ===
export const updateTailorWork = async (productId: string, updates: Partial<ProductFormData>) => {
  try {
    const updateWorkRef = doc(db, "staging_tailor_works", productId);

    let normalizedKeywords: string[] | undefined;

    if (updates.keywords) {
      if (typeof updates.keywords === "string") {
        normalizedKeywords = updates.keywords.split(",").map((k) => k.trim());
      } else if (Array.isArray(updates.keywords)) {
        normalizedKeywords = updates.keywords.map((k) => k.trim());
      }
    }

    // 🧩 Prepare update data
    const updateData: any = {
      title: updates.title,
      description: updates.description,
      wear_quantity: updates.wear_quantity,
      category: updates.category,
      wear_category: updates.wear_category,
      tags: updates.tags,
      keywords: normalizedKeywords ?? updates.keywords,
      images: updates.images,
      sizes: updates.sizes,
      customSizes: updates.customSizes,
      userCustomSizes: updates.userCustomSizes,
      userSizes: updates.userSizes,
      type: updates.type,
      availability: updates.availability,
      deliveryTimeline: updates.deliveryTimeline,
      careInstructions: updates.careInstructions,
      updatedAt: new Date().toISOString(),
      updated_at: serverTimestamp(),
      approvalStatus: "pending", // Reset approval status on every update
    };

    // 💰 Handle price object
    if (updates.price) {
      updateData.price = {
        base: updates.price.base || 0,
        currency: updates.price.currency || "USD",
      };
      if (updates.price.discount !== undefined) {
        updateData.price.discount = updates.price.discount;
      }
    }

    // 🏷️ Handle discount
    if (updates.discount !== undefined) {
      updateData.discount = updates.discount;
    }

    // 👕 Handle Ready-to-Wear options
    if (updates.rtwOptions !== undefined) {
      updateData.rtwOptions = updates.rtwOptions;
    }

    // ✂️ Handle Bespoke options
    if (updates.bespokeOptions !== undefined) {
      updateData.bespokeOptions = updates.bespokeOptions;
    }

    // 🚚 Handle Shipping Data (Tiered Shipping System)
    if (updates.shipping !== undefined) {
      updateData.shipping = {
        tierKey: updates.shipping.tierKey || "tier_medium",
        manualOverride: updates.shipping.manualOverride || false,
        actualWeightKg: updates.shipping.actualWeightKg || null,
        lengthCm: updates.shipping.lengthCm || null,
        widthCm: updates.shipping.widthCm || null,
        heightCm: updates.shipping.heightCm || null,
      };
    }
    
    // 🧾 Handle Multiple Pricing Data
    if (updates.enableMultiplePricing !== undefined) {
      updateData.enableMultiplePricing = updates.enableMultiplePricing;
    }
    if (updates.individualItems !== undefined) {
      updateData.individualItems = updates.individualItems;
    }
    

    // 📏 Handle Size Guide
    if (updates.metric_size_guide !== undefined) {
      updateData.metric_size_guide = updates.metric_size_guide;
    }

    // 🧹 Clean undefined fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    console.log("Updating product with data:", updateData);

    // ✅ Firestore update
    await updateDoc(updateWorkRef, updateData);

    // 🟢 Duplicate update to tailor_works_local collection
    try {
      const localWorkRef = doc(db, "staging_tailor_works_local", productId);
      const localDocSnap = await getDoc(localWorkRef);
      
      if (localDocSnap.exists()) {
        await updateDoc(localWorkRef, updateData);
        console.log("Product updated in tailor_works_local:", productId);
      } else {
        console.log("Product not found in tailor_works_local, skipping update");
      }
    } catch (localError) {
      console.error("Error updating tailor_works_local:", localError);
      // Don't throw error here - main operation succeeded
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error updating product:", error);
    return { success: false, message: error.message };
  }
};


// === DELETE ===
export const deleteTailorWork = async (userId: string, productId: string) => {
  try {
    // First check if the product exists and if the user is the owner
    const deleteWorkRef = doc(db, "staging_tailor_works", productId)
    const workSnap = await getDoc(deleteWorkRef)

    if (!workSnap.exists()) {
      return { success: false, message: "Product not found" }
    }

    const workData = workSnap.data()
    
    // Check if the current user is the owner of this tailor work
    if (workData.tailor_id !== userId) {
      // Try to check if user is a sub-tailor with access
      try {
        const userRef = doc(db, "staging_users", userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()
          const isSubTailorWithAccess = userData?.is_sub_tailor && userData?.tailorId === workData.tailor_id

          if (!isSubTailorWithAccess) {
            return { success: false, message: "You do not have permission to delete this product" }
          }
        } else {
          return { success: false, message: "You do not have permission to delete this product" }
        }
      } catch (userError: any) {
        console.warn("Could not verify user permissions:", userError.message)
        return { success: false, message: "You do not have permission to delete this product" }
      }
    }

    // Delete the product from tailor_works
    await deleteDoc(deleteWorkRef)

    // 🟢 Duplicate delete to tailor_works_local collection
    try {
      const localWorkRef = doc(db, "staging_tailor_works_local", productId)
      const localDocSnap = await getDoc(localWorkRef)
      
      if (localDocSnap.exists()) {
        await deleteDoc(localWorkRef)
        console.log("Product deleted from tailor_works_local:", productId)
      } else {
        console.log("Product not found in tailor_works_local, skipping delete")
      }
    } catch (localError) {
      console.error("Error deleting from tailor_works_local:", localError)
      // Don't throw error here - main operation succeeded
    }

    return { success: true }
  } catch (err: any) {
    console.error("Error deleting tailor work:", err)
    
    if (err.code === 'permission-denied') {
      return { 
        success: false, 
        message: "Permission denied. Please ensure you're logged in and have access to delete this product." 
      }
    }
    
    return { success: false, message: err.message || "Failed to delete product" }
  }
}

// === VERIFY ===
export const verifyTailorWorks = async (userId: string, productId: string) => {
  try {
    // First check if the product exists and if the user is the owner
    const checkWorkRef = doc(db, "staging_tailor_works", productId)
    const workSnap = await getDoc(checkWorkRef)

    if (!workSnap.exists()) {
      return { success: false, message: "Product not found" }
    }

    const workData = workSnap.data()
    
    // Check if the current user is the owner of this tailor work
    if (workData.tailor_id !== userId) {
      // Try to check if user is a sub-tailor with access
      try {
        const userRef = doc(db, "staging_users", userId)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()
          const isSubTailorWithAccess = userData?.is_sub_tailor && userData?.tailorId === workData.tailor_id

          if (!isSubTailorWithAccess) {
            return { success: false, message: "You do not have permission to verify this product" }
          }
        } else {
          return { success: false, message: "You do not have permission to verify this product" }
        }
      } catch (userError: any) {
        console.warn("Could not verify user permissions:", userError.message)
        return { success: false, message: "You do not have permission to verify this product" }
      }
    }

    const verifyWorkRef = doc(db, "staging_tailor_works", productId);
    await updateDoc(verifyWorkRef, {
      status: "verified",
    });

    // 🟢 Duplicate verify to tailor_works_local collection
    try {
      const localWorkRef = doc(db, "staging_tailor_works_local", productId);
      const localDocSnap = await getDoc(localWorkRef);
      
      if (localDocSnap.exists()) {
        await updateDoc(localWorkRef, {
          status: "verified",
        });
        console.log("Product verified in tailor_works_local:", productId);
      } else {
        console.log("Product not found in tailor_works_local, skipping verify");
      }
    } catch (localError) {
      console.error("Error verifying in tailor_works_local:", localError);
      // Don't throw error here - main operation succeeded
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

