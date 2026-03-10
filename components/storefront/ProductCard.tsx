"use client";

/**
 * Product Card Component for Storefront
 * Displays individual product information in grid/list layouts
 *
 * Validates: Requirements 7.1, 7.2
 */

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Product } from "@/types";
import { ThemeConfiguration } from "@/types/storefront";
import { usePixelTracking } from "./PixelTracker";
import { getActivityTracker } from "@/lib/analytics/activity-tracker";
import { useAuth } from "@/contexts/AuthContext";
import { Price, DiscountedPrice } from "@/components/common/Price";
import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ProductCardProps {
	product: Product;
	layout?: "grid" | "list";
	showAddToCart?: boolean;
	onAddToCart?: (product: Product) => Promise<void>;
	className?: string;
	isMobile?: boolean;
	isLoading?: boolean;
	theme?: ThemeConfiguration;
}

export default function ProductCard({
	product,
	layout = "grid",
	showAddToCart = true,
	onAddToCart,
	className = "",
	isMobile = false,
	isLoading = false,
	theme,
}: ProductCardProps) {
	const pathname = usePathname();
	const storefront = pathname.split("/")[2]; // Extract storefront handle from /store/[handle]
	const { user } = useAuth();
	const { userCountry } = useCurrency();
	const [hasTrackedView, setHasTrackedView] = useState(false);

	const primaryImage =
		product.images?.[0] || product.thumbnail || "/placeholder-product.svg";
	const hasDiscount =
		(product.discount && product.discount > 0) ||
		(product.price?.discount && product.price.discount > 0);
	const vendorBasePrice = product.price?.base || 0;
	const discountPercent = product.discount || product.price?.discount || 0;
	const basePrice = calculateCustomerPrice(vendorBasePrice, userCountry);
	const discountedPrice = hasDiscount
		? calculateFinalPrice(vendorBasePrice, discountPercent, userCountry)
		: basePrice;

	// Pixel tracking hook
	const { trackProductView, trackAddToCart } = usePixelTracking();

	// Track product view when component mounts
	useEffect(() => {
		if (!hasTrackedView) {
			setHasTrackedView(true);

			console.log("🔍 ProductCard tracking view:", {
				productId: product.product_id,
				tailorId: product.tailor_id,
				userId: user?.uid,
				productTitle: product.title,
			});

			// Track with pixel tracker (for external analytics)
			trackProductView(product.product_id, product.title, discountedPrice);

			// Track with activity tracker (for internal analytics)
			if (product.tailor_id) {
				const activityTracker = getActivityTracker();
				activityTracker
					.trackProductView(product.product_id, product.tailor_id, user?.uid)
					.then(() => {
						console.log(
							"✅ Activity tracked successfully for product:",
							product.product_id,
						);
					})
					.catch((err) => {
						console.warn("Could not track product view for analytics:", err);
					});
			} else {
				console.warn(
					"⚠️ No tailor_id found for product:",
					product.product_id,
					"Product data:",
					product,
				);
			}
		}
	}, [
		product.product_id,
		product.title,
		product.tailor_id,
		discountedPrice,
		trackProductView,
		hasTrackedView,
		user?.uid,
	]);

	const handleAddToCart = async (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		console.log("🛒 ProductCard tracking add to cart:", {
			productId: product.product_id,
			tailorId: product.tailor_id,
			userId: user?.uid,
			price: discountedPrice,
		});

		// Track add to cart event with pixel tracker
		trackAddToCart(product.product_id, product.title, discountedPrice, 1);

		// Track with activity tracker (for internal analytics)
		if (product.tailor_id) {
			const activityTracker = getActivityTracker();
			activityTracker
				.trackAddToCart(
					product.product_id,
					product.tailor_id,
					1,
					discountedPrice,
					user?.uid,
				)
				.then(() => {
					console.log(
						"✅ Add to cart tracked successfully for product:",
						product.product_id,
					);
				})
				.catch((err) => {
					console.warn("Could not track add to cart for analytics:", err);
				});
		} else {
			console.warn(
				"⚠️ No tailor_id found for add to cart tracking:",
				product.product_id,
			);
		}

		if (onAddToCart) {
			try {
				// Pass original product — cart service handles pricing consistently
				await onAddToCart(product);
			} catch (error) {
				console.error("Error adding to cart:", error);
				// You could add toast notification here
			}
		}
	};

	if (layout === "list" && !isMobile) {
		return (
			<div
				className={`flex rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 ${className}`}
				style={{
					backgroundColor: theme?.colors.background || "#FFFFFF",
					borderColor: theme?.colors.secondary + "20" || "#E5E7EB",
				}}
			>
				<div className="relative w-32 h-32 flex-shrink-0">
					<Image
						src={primaryImage}
						alt={product.title}
						fill
						className="object-cover rounded-l-lg"
						sizes="128px"
					/>
					{hasDiscount && (
						<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
							-{product.discount || product.price.discount}%
						</div>
					)}
					{product.featured && (
						<div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded">
							Featured
						</div>
					)}
				</div>

				<div className="flex-1 p-4 flex flex-col justify-between">
					<div>
						<h3
							className="font-semibold mb-1 line-clamp-2"
							style={{
								color: theme?.colors.text || "#111827",
								fontFamily: theme?.typography.headingFont || "inherit",
							}}
						>
							{product.title}
						</h3>
						<p
							className="text-sm mb-2 line-clamp-2"
							style={{
								color: theme?.colors.text + "80" || "#6B7280",
								fontFamily: theme?.typography.bodyFont || "inherit",
							}}
						>
							{product.description || "No description available"}
						</p>
						<div className="flex items-center gap-2 mb-2">
							{hasDiscount ? (
								<DiscountedPrice
									originalPrice={basePrice}
									salePrice={discountedPrice}
									originalCurrency={product.price?.currency || "USD"}
									size="lg"
								/>
							) : (
								<Price
									price={discountedPrice}
									originalCurrency={product.price?.currency || "USD"}
									size="lg"
									variant="accent"
								/>
							)}
						</div>
						<div
							className="flex items-center gap-2 text-sm"
							style={{ color: theme?.colors.text + "60" || "#6B7280" }}
						>
							<span className="capitalize">
								{product.category || "General"}
							</span>
							<span>•</span>
							<span className="capitalize">
								{product.availability?.replace("_", " ") || "Available"}
							</span>
						</div>
					</div>

					{showAddToCart && (
						<div className="mt-3">
							<button
								onClick={handleAddToCart}
								disabled={product.availability === "out_of_stock" || isLoading}
								className="w-full text-white py-2 px-4 rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center hover:shadow-lg transform hover:scale-105"
								style={{
									backgroundColor:
										product.availability === "out_of_stock" || isLoading
											? "#D1D5DB"
											: theme?.colors.primary || "#3B82F6",
									fontFamily: theme?.typography.bodyFont || "inherit",
								}}
							>
								{isLoading ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
								) : product.availability === "out_of_stock" ? (
									"Out of Stock"
								) : (
									"Add to Cart"
								)}
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Grid layout (default) - optimized for mobile
	return (
		<div
			className={`rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden ${className}`}
			style={{
				backgroundColor: theme?.colors.background || "#FFFFFF",
				borderColor: theme?.colors.secondary + "20" || "#E5E7EB",
			}}
		>
			<div className="relative aspect-square">
				<Image
					src={primaryImage}
					alt={product.title}
					fill
					className="object-cover"
					sizes={
						isMobile
							? "50vw"
							: "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
					}
				/>
				{hasDiscount && (
					<div
						className={`absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded ${isMobile ? "text-[10px]" : ""}`}
					>
						-{product.discount || product.price.discount}%
					</div>
				)}
				{product.featured && (
					<div
						className={`absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded ${isMobile ? "text-[10px]" : ""}`}
					>
						{isMobile ? "★" : "Featured"}
					</div>
				)}
				{product.isNewArrival && (
					<div
						className={`absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded ${isMobile ? "text-[10px]" : ""}`}
					>
						{isMobile ? "New" : "New"}
					</div>
				)}
				{product.isBestSeller && (
					<div
						className={`absolute bottom-1 right-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded ${isMobile ? "text-[10px]" : ""}`}
					>
						{isMobile ? "🔥" : "Best Seller"}
					</div>
				)}
			</div>

			<div className={`p-3 ${isMobile ? "p-2" : "p-4"}`}>
				<h3
					className={`font-semibold mb-1 line-clamp-2 ${isMobile ? "text-sm" : ""}`}
					style={{
						color: theme?.colors.text || "#111827",
						fontFamily: theme?.typography.headingFont || "inherit",
					}}
				>
					{product.title}
				</h3>
				{!isMobile && (
					<p
						className="text-sm mb-2 line-clamp-2"
						style={{
							color: theme?.colors.text + "80" || "#6B7280",
							fontFamily: theme?.typography.bodyFont || "inherit",
						}}
					>
						{product.description || "No description available"}
					</p>
				)}

				<div
					className={`flex items-center gap-1 mb-2 ${isMobile ? "flex-col items-start gap-0" : "gap-2 mb-3"}`}
				>
					{hasDiscount ? (
						<DiscountedPrice
							originalPrice={basePrice}
							salePrice={discountedPrice}
							originalCurrency={product.price?.currency || "USD"}
							size={isMobile ? "sm" : "lg"}
							className={isMobile ? "flex-col items-start gap-0" : ""}
						/>
					) : (
						<Price
							price={discountedPrice}
							originalCurrency={product.price?.currency || "USD"}
							size={isMobile ? "sm" : "lg"}
							variant="accent"
						/>
					)}
				</div>

				{!isMobile && (
					<div
						className="flex items-center justify-between text-sm mb-3"
						style={{ color: theme?.colors.text + "60" || "#6B7280" }}
					>
						<span className="capitalize">{product.category || "General"}</span>
						<span className="capitalize">
							{product.availability?.replace("_", " ") || "Available"}
						</span>
					</div>
				)}

				{showAddToCart && (
					<div className={`flex gap-2 ${isMobile ? "flex-col gap-1" : ""}`}>
						<Link
							href={`/store/${storefront}/product/${product.product_id}`}
							className={`flex-1 text-center border-2 rounded-md transition-all duration-200 hover:shadow-md flex items-center justify-center ${
								isMobile ? "py-1.5 px-2 text-xs" : "py-2 px-4"
							}`}
							style={{
								borderColor: theme?.colors.primary || "#3B82F6",
								color: theme?.colors.primary || "#3B82F6",
								fontFamily: theme?.typography.bodyFont || "inherit",
							}}
						>
							View Details
						</Link>
						<button
							onClick={handleAddToCart}
							disabled={product.availability === "out_of_stock" || isLoading}
							className={`flex-1 text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center justify-center ${
								isMobile ? "py-1.5 px-2 text-xs" : "py-2 px-4"
							}`}
							style={{
								backgroundColor:
									product.availability === "out_of_stock" || isLoading
										? "#D1D5DB"
										: theme?.colors.primary || "#3B82F6",
								fontFamily: theme?.typography.bodyFont || "inherit",
							}}
						>
							{isLoading ? (
								<div
									className={`border-2 border-white border-t-transparent rounded-full animate-spin ${
										isMobile ? "w-3 h-3" : "w-4 h-4"
									}`}
								></div>
							) : product.availability === "out_of_stock" ? (
								"Out of Stock"
							) : (
								"Add to Cart"
							)}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
