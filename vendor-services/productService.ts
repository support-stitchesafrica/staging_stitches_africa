import { db, storage } from "@/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Upload images to Firebase Storage and return URLs
 * @param {FileList|File[]} files
 * @param {string} vendorId
 * @returns {Promise<string[]>} image URLs
 */
const uploadImages = async (files: FileList | File[], vendorId: string) => {
  const uploadPromises = Array.from(files).map(async (file) => {
    const storageRef = ref(storage, `tailor_works/${vendorId}/${Date.now()}-${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  });

  return Promise.all(uploadPromises);
};

/**
 * Product data interface for addProduct
 */
interface ProductData {
  vendorId?: string;
  title: string;
  category: string;
  subcategory: string;
  description?: string;
  price?: {
    base?: number;
    discount?: number | null;
    currency?: string;
  };
  images?: string[];
  imageFiles?: FileList | File[];
  videoUrl?: string | null;
  tags?: string[];
  availability?: string;
  deliveryTimeline?: string;
  returnPolicy?: string;
  type: "bespoke" | "ready_to_wear";
  rtwOptions?: {
    sizes?: string[];
    stock?: Record<string, number>;
    colors?: string[];
    fabric?: string;
    season?: string | null;
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
  lookbook?: string[];
  fabricSwatches?: string[];
  careInstructions?: string;
  occasionTags?: string[];
}

/**
 * Add a new product (bespoke or RTW) to tailor_works collection
 * @param {ProductData} productData - product details based on schema
 * @returns {Promise<string>} - document ID of the added product
 */
export const addProduct = async (productData: ProductData): Promise<string> => {
  try {
    const productRef = collection(db, "staging_tailor_works");

    // Upload images if files were passed
    let imageUrls: string[] = [];
    if (productData.imageFiles && productData.imageFiles.length > 0) {
      imageUrls = await uploadImages(productData.imageFiles, productData.vendorId || "unknown_vendor");
    }

    const newProduct = {
      vendorId: productData.vendorId || null,
      title: productData.title,
      category: productData.category,
      subcategory: productData.subcategory,
      description: productData.description || "",
      price: {
        base: productData.price?.base || 0,
        discount: productData.price?.discount || null,
        currency: productData.price?.currency || "NGN",
      },
      images: imageUrls.length > 0 ? imageUrls : productData.images || [],
      videoUrl: productData.videoUrl || null,
      tags: productData.tags || [],
      availability: productData.availability || "in_stock",
      deliveryTimeline: productData.deliveryTimeline || "",
      returnPolicy: productData.returnPolicy || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      type: productData.type, // "bespoke" | "ready_to_wear"

      // RTW-specific
      rtwOptions: productData.type === "ready_to_wear"
        ? {
            sizes: productData.rtwOptions?.sizes || [],
            stock: productData.rtwOptions?.stock || {},
            colors: productData.rtwOptions?.colors || [],
            fabric: productData.rtwOptions?.fabric || "",
            season: productData.rtwOptions?.season || null,
          }
        : null,

      // Bespoke-specific
      bespokeOptions: productData.type === "bespoke"
        ? {
            customization: {
              fabricChoices: productData.bespokeOptions?.customization?.fabricChoices || [],
              styleOptions: productData.bespokeOptions?.customization?.styleOptions || [],
              finishingOptions: productData.bespokeOptions?.customization?.finishingOptions || [],
            },
            measurementsRequired: productData.bespokeOptions?.measurementsRequired || [],
            productionTime: productData.bespokeOptions?.productionTime || "",
            depositAllowed: productData.bespokeOptions?.depositAllowed || false,
            notesEnabled: productData.bespokeOptions?.notesEnabled || false,
          }
        : null,

      // Optional extras
      lookbook: productData.lookbook || [],
      fabricSwatches: productData.fabricSwatches || [],
      careInstructions: productData.careInstructions || "",
      occasionTags: productData.occasionTags || [],
    };

    const docRef = await addDoc(productRef, newProduct);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};
