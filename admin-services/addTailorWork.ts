import { addDoc, collection, serverTimestamp } from "firebase/firestore"
import { auth, db } from "../firebase";

export interface ProductFormData {
  type: string
  title: string
  price: string
  discount: string
  description: string
  category: string
  keywords: string
  images: string[]
  sizes: string[]
  customSizes: boolean
}

export const addTailorWork = async (tailorId: string, formData: ProductFormData) => {
  try {
    const docRef = await addDoc(collection(db, "staging_tailor_works"), {
      tailor_id: tailorId,
      type: formData.type,
      title: formData.title,
      price: Number(formData.price),
      discount: Number(formData.discount),
      description: formData.description,
      category: formData.category,
      keywords: formData.keywords.split(",").map(k => k.trim()),
      images: formData.images,
      sizes: formData.sizes,
      customSizes: formData.customSizes,
      created_at: serverTimestamp(),
    })
    console.log("Product added with ID:", docRef.id)
    return docRef.id
  } catch (error) {
    console.error("Error adding product:", error)
    throw error
  }
}
