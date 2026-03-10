// services/getTailorWorks.ts
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export interface TailorWork {
  product_id: string;
  title: string;
  description: string;
  category: string;
  wear_category: string;
  price: number;
  discount: number;
  images: string[];
  sizes: string[];
  tags?: string[];
  tailor: string;
  tailor_id: string;
  is_verified: boolean;
  wear_quantity: number;
}

export async function getTailorWorks(): Promise<TailorWork[]> {
  const worksRef = collection(db, "staging_tailor_works");
  const snapshot = await getDocs(worksRef);

  const works: TailorWork[] = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      product_id: data.product_id,
      title: data.title,
      description: data.description,
      category: data.category,
      wear_category: data.wear_category,
      price: data.price,
      discount: data.discount,
      images: data.images || [],
      sizes: data.sizes || [],
      tags: data.tags || [],
      tailor: data.tailor,
      tailor_id: data.tailor_id,
      is_verified: data.is_verified,
      wear_quantity: data.wear_quantity
    };
  });

  return works;
}

export async function getActiveTailorWorksCount(): Promise<number> {
  const allWorks = await getTailorWorks();
  // const activeWorks = allWorks.filter(work => work.wear_quantity > 0);
  return allWorks.length;
}