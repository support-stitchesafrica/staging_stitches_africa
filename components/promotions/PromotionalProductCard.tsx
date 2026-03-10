"use client";

import { useState, useEffect, useRef } from "react";
import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { ProductWithDiscount } from "@/types/promotionals";
import { PromotionalBadge } from "./PromotionalBadge";
import { PromotionalEventBadge } from "../promotionals/PromotionalEventBadge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Product } from "@/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Price } from '@/components/common/Price';

interface PromotionalProductCardProps {
	product: ProductWithDiscount;
	eventId: string;
	eventName?: string; // Event name for badge display
	eventEndDate?: Date; // Event end date for cart
	className?: string;
}

export const PromotionalProductCard = memo(function PromotionalProductCard({
	product,
	eventId,
	eventName,
	eventEndDate,
	className,
}: PromotionalProductCardProps) {
	const router = useRouter();
	const { addPromotionalProduct } = useCart();
	const [isAdding, setIsAdding] = useState(false);

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(price);
	};

	// Round total discount to nearest integer (standard rounding: 11.8 → 12, 11.2 → 11, 11.5 → 12)
	const getRoundedTotalDiscount = (percentage: number) => {
		return Math.round(percentage);
	};

	const handleAddToCart = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (isAdding) return;

		setIsAdding(true);

		try {
			// Convert ProductWithDiscount to Product format
			const productForCart: Product = {
				product_id: product.productId,
				title: product.title,
				description: product.description,
				type: "ready-to-wear",
				price: {
					base: product.originalPrice,
					currency: "USD",
				},
				discount: 0,
				images: product.images || [],
				tailor_id: product.vendor.id,
				tailor: product.vendor.name,
				vendor: product.vendor,
				category: product.category || "",
				availability:
					(product.availability as "in_stock" | "pre_order" | "out_of_stock") ||
					"in_stock",
				status: "verified",
				deliveryTimeline: "",
				returnPolicy: "",
				tags: [],
			};

			await addPromotionalProduct(
				productForCart,
				1,
				eventId,
				eventName || "Promotional Event",
				product.promotionalDiscountPercentage || 0,
				eventEndDate || new Date()
			);

			toast.success("Added to cart!");
		} catch (error: any) {
			console.error("Error adding to cart:", error);

			// More specific error messages
			if (
				error?.message?.includes("permission") ||
				error?.message?.includes("auth")
			) {
				toast.error("Authentication error. Please try logging in again.");
			} else if (
				error?.message?.includes("network") ||
				error?.code === "unavailable"
			) {
				toast.error(
					"Network error. Please check your connection and try again."
				);
			} else {
				toast.error("Failed to add item to cart. Please try again.");
			}
		} finally {
			setIsAdding(false);
		}
	};

	return (
		<div
			className={cn(
				"group bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-red-300",
				className
			)}
		>
			{/* Image Container */}
			<div className="relative aspect-square overflow-hidden bg-gray-100">
				{product.images && product.images.length > 0 ? (
					<Image
						src={product.images[0]}
						alt={product.title}
						fill
						loading="lazy"
						className="object-cover group-hover:scale-105 transition-transform duration-300"
						sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400">
						No Image
					</div>
				)}

				{/* Event Badge - Top Left (Shows promotional discount only, e.g., 2%) */}
				{eventName && (
					<div className="absolute top-3 left-3 z-10">
						<PromotionalEventBadge
							eventName={eventName}
							discount={product.promotionalDiscountPercentage || 0}
							size="sm"
							showDiscount={true}
						/>
					</div>
				)}

				{/* Discount Badge - Top Right (Shows total discount rounded to nearest integer, e.g., 12%) */}
				<div className="absolute top-3 right-3 z-10">
					<PromotionalBadge
						discountPercentage={getRoundedTotalDiscount(
							product.discountPercentage
						)}
						variant="compact"
						size="sm"
					/>
				</div>
			</div>

			{/* Content */}
			<div className="p-4 space-y-3">
				{/* Title */}
				<Link
					href={`/promotions/${eventId}/products/${product.productId}`}
					className="block"
				>
					<h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
						{product.title}
					</h3>
				</Link>

				{/* Vendor */}
				{product.vendor?.name && (
					<p className="text-sm text-gray-700 font-medium">
						by {product.vendor.name}
					</p>
				)}

				{/* Prices */}
				<div className="space-y-1">
					{/* Original Price */}
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-500 line-through">
							<Price price={product.originalPrice} originalCurrency="USD" size="sm" variant="muted" showTooltip={false} />
						</span>
						<span className="text-xs text-red-600 font-semibold">
							Save <Price price={product.savings} originalCurrency="USD" size="sm" showTooltip={false} />
						</span>
					</div>

					{/* Discounted Price */}
					<div className="flex items-baseline gap-2">
						<Price price={product.discountedPrice} originalCurrency="USD" size="lg" variant="accent" />
					</div>
				</div>

				{/* Add to Cart Button */}
				<button
					onClick={handleAddToCart}
					disabled={isAdding}
					className={cn(
						"w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
						product.availability === "out_of_stock" &&
						"opacity-50 cursor-not-allowed"
					)}
				>
					<ShoppingCart className="w-4 h-4" />
					{isAdding ? "Adding..." : product.availability === "pre_order" ? "Pre Order" : "Add to Cart"}
				</button>

				{/* Category & Availability */}
				<div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
					{product.category && (
						<span className="capitalize">{product.category}</span>
					)}
					{product.availability && (
						<span
							className={cn(
								"px-2 py-0.5 rounded-full font-medium",
								product.availability === "in_stock"
									? "bg-green-100 text-green-700"
									: product.availability === "pre_order"
										? "bg-blue-100 text-blue-700"
										: "bg-gray-100 text-gray-700"
							)}
						>
							{product.availability === "in_stock"
								? "In Stock"
								: product.availability === "pre_order"
									? "Pre-Order"
									: "Out of Stock"}
						</span>
					)}
				</div>
			</div>
		</div>
	);
});
