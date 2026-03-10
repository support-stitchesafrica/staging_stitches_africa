"use client";

import { memo } from "react";
// components/VendorWishlist.tsx

import { useVendorWishlist } from "@/hooks/useVendorWishlist";

interface VendorWishlistProps {
  tailorId: string;
}

function VendorWishlist({ tailorId }: VendorWishlistProps) {
  const { wishlist, loading, error } = useVendorWishlist(tailorId);

  if (loading) return <p className="text-center py-4">Loading wishlist...</p>;
  if (error) return <p className="text-red-500 text-center">{error}</p>;
  if (wishlist.length === 0)
    return <p className="text-center py-4">No wishlist items yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {wishlist.map((item) => (
        <div
          key={item.id}
          className="border rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition"
        >
          <img
            src={item.images?.[0]}
            alt={item.title}
            className="w-full h-56 object-cover"
          />
          <div className="p-4 space-y-2">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {item.description}
            </p>
            <p className="font-bold">${item.price}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(VendorWishlist);
