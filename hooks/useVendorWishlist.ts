// hooks/useVendorWishlist.ts
"use client";

import { useEffect, useState } from "react";
import { fetchWishlistItemsByTailor, WishlistItem } from "@/vendor-services/wishlistService";

export function useVendorWishlist(tailorId: string) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tailorId) return;

    const loadWishlist = async () => {
      try {
        setLoading(true);
        const data = await fetchWishlistItemsByTailor(tailorId);
        setWishlist(data);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
        setError("Failed to fetch wishlist items.");
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, [tailorId]);

  return { wishlist, loading, error };
}
