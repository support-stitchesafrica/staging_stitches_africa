// services/wishlistService.ts
import { db } from "@/firebase";
import { collection, getDocs, query, where, collectionGroup } from "firebase/firestore";

export interface WishlistItem {
  id: string;
  product_id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  tailor_id: string;
  is_saved: boolean;
}

export async function fetchWishlistItemsByTailor(tailorId: string): Promise<WishlistItem[]> {
  if (!tailorId) return [];

  const wishlistRef = collectionGroup(db, "user_wishlist_items");
  const q = query(wishlistRef, where("tailor_id", "==", tailorId));
  const snapshot = await getDocs(q);

  const items: WishlistItem[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<WishlistItem, "id">),
  }));

  return items;
}
