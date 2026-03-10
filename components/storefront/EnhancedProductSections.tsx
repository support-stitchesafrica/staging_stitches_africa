"use client";

import React, { useState, useEffect } from "react";
import { ThemeConfiguration } from "@/types/storefront";
import { Product } from "@/types";
import { Price } from "@/components/common/Price";
import { calculateCustomerPrice } from "@/lib/priceUtils";

interface EnhancedProductSectionsProps {
	vendorId: string;
	theme: ThemeConfiguration;
	onAddToCart: (product: Product) => Promise<void>;
}

interface ProductWithMetrics {
	id: string;
	name: string;
	price: number;
	originalCurrency?: string;
	image: string;
	category: string;
	vendorId: string;
	createdAt: Date;
	views?: number;
	sales?: number;
	isPromoted?: boolean;
	promotionId?: string;
}

export default function EnhancedProductSections({
	vendorId,
	theme,
	onAddToCart,
}: EnhancedProductSectionsProps) {
	const [newArrivals, setNewArrivals] = useState<ProductWithMetrics[]>([]);
	const [bestSelling, setBestSelling] = useState<ProductWithMetrics[]>([]);
	const [promotions, setPromotions] = useState<ProductWithMetrics[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchEnhancedProducts = async () => {
			if (!vendorId) {
				console.log("EnhancedProductSections: No vendorId provided");
				return;
			}

			console.log(
				"EnhancedProductSections: Fetching products for vendorId:",
				vendorId,
			);
			setIsLoading(true);
			try {
				// Fetch different product sections
				const [newArrivalsRes, bestSellingRes, promotionsRes] =
					await Promise.all([
						fetch(
							`/api/storefront/enhanced-products?vendorId=${vendorId}&section=new-arrivals&limit=6`,
						),
						fetch(
							`/api/storefront/enhanced-products?vendorId=${vendorId}&section=best-selling&limit=6`,
						),
						fetch(
							`/api/storefront/enhanced-products?vendorId=${vendorId}&section=promotions&limit=4`,
						),
					]);

				console.log("API Response Status:", {
					newArrivals: newArrivalsRes.status,
					bestSelling: bestSellingRes.status,
					promotions: promotionsRes.status,
				});

				if (newArrivalsRes.ok) {
					const data = await newArrivalsRes.json();
					console.log("New Arrivals Response:", data);
					if (data.success) {
						setNewArrivals(data.products);
					}
				}

				if (bestSellingRes.ok) {
					const data = await bestSellingRes.json();
					console.log("Best Selling Response:", data);
					if (data.success) {
						setBestSelling(data.products);
					}
				}

				if (promotionsRes.ok) {
					const data = await promotionsRes.json();
					console.log("Promotions Response:", data);
					if (data.success) {
						setPromotions(data.products);
					}
				}
			} catch (error) {
				console.error("Error fetching enhanced products:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchEnhancedProducts();
	}, [vendorId]);

	const handleProductClick = async (product: ProductWithMetrics) => {
		// Track product view
		try {
			await fetch("/api/storefront/enhanced-products", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ productId: product.id }),
			});
		} catch (error) {
			console.error("Error tracking product view:", error);
		}
	};

	const convertToProduct = (product: ProductWithMetrics): Product =>
		({
			product_id: product.id,
			title: product.name,
			price: {
				base: product.price,
				currency: product.originalCurrency || "NGN",
			},
			images: [product.image],
			category: product.category,
			vendor: { id: product.vendorId, name: "" },
		}) as any;

	const ProductCard = ({
		product,
		badge,
	}: {
		product: ProductWithMetrics;
		badge?: { text: string; color: string };
	}) => (
		<div
			className="group cursor-pointer bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
			onClick={() => handleProductClick(product)}
		>
			<div className="relative aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
				{badge && (
					<div
						className={`absolute top-2 left-2 ${badge.color} text-white px-2 py-1 text-xs font-bold rounded z-10`}
					>
						{badge.text}
					</div>
				)}
				<img
					src={product.image || "/placeholder-product.svg"}
					alt={product.name}
					className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
					onError={(e) => {
						const target = e.target as HTMLImageElement;
						target.src = "/placeholder-product.svg";
					}}
				/>
			</div>
			<div className="p-4">
				<h4
					className="font-semibold text-lg mb-2 line-clamp-2"
					style={{ color: theme.colors.text }}
				>
					{product.name}
				</h4>
				<p className="text-sm mb-2" style={{ color: theme.colors.secondary }}>
					{product.category}
				</p>
				<div className="flex items-center justify-between">
					<Price
						price={calculateCustomerPrice(product.price)}
						originalCurrency={product.originalCurrency || "NGN"}
						size="lg"
						variant="accent"
						className="font-bold"
					/>
					{product.views && (
						<span className="text-xs text-gray-500">{product.views} views</span>
					)}
				</div>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onAddToCart(convertToProduct(product));
					}}
					className="w-full mt-3 py-2 px-4 rounded-lg font-medium text-white transition-colors hover:opacity-90"
					style={{ backgroundColor: theme.colors.primary }}
				>
					Add to Cart
				</button>
			</div>
		</div>
	);

	if (isLoading) {
		return (
			<div className="py-16">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading featured products...</p>
					</div>
				</div>
			</div>
		);
	}

	// If no enhanced sections have products, don't render anything
	if (
		promotions.length === 0 &&
		newArrivals.length === 0 &&
		bestSelling.length === 0
	) {
		console.log(
			"EnhancedProductSections: No products found in any section, not rendering",
		);
		return null;
	}

	console.log("EnhancedProductSections: Rendering sections:", {
		promotions: promotions.length,
		newArrivals: newArrivals.length,
		bestSelling: bestSelling.length,
	});

	return (
		<>
			{/* Promotions Section */}
			{promotions.length > 0 && (
				<section className="py-12 bg-gradient-to-r from-red-50 to-pink-50">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-8">
							<h3
								className="text-3xl font-bold mb-4"
								style={{
									color: theme.colors.text,
									fontFamily: theme.typography.headingFont,
								}}
							>
								🔥 Special Offers
							</h3>
							<p className="text-lg" style={{ color: theme.colors.secondary }}>
								Limited time deals you don't want to miss!
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
							{promotions.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									badge={{ text: "SALE", color: "bg-red-500" }}
								/>
							))}
						</div>
					</div>
				</section>
			)}

			{/* New Arrivals Section */}
			{newArrivals.length > 0 && (
				<section className="py-16 bg-white">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h3
								className="text-3xl font-bold mb-4"
								style={{
									color: theme.colors.text,
									fontFamily: theme.typography.headingFont,
								}}
							>
								✨ New Arrivals
							</h3>
							<p
								className="text-lg max-w-2xl mx-auto"
								style={{ color: theme.colors.secondary }}
							>
								Fresh additions to our collection
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
							{newArrivals.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									badge={{ text: "NEW", color: "bg-green-500" }}
								/>
							))}
						</div>
					</div>
				</section>
			)}

			{/* Best Selling Section */}
			{bestSelling.length > 0 && (
				<section
					className="py-16"
					style={{ backgroundColor: theme.colors.surface || "#F9FAFB" }}
				>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h3
								className="text-3xl font-bold mb-4"
								style={{
									color: theme.colors.text,
									fontFamily: theme.typography.headingFont,
								}}
							>
								🏆 Best Sellers
							</h3>
							<p
								className="text-lg max-w-2xl mx-auto"
								style={{ color: theme.colors.secondary }}
							>
								Customer favorites and top-rated items
							</p>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
							{bestSelling.map((product) => (
								<ProductCard
									key={product.id}
									product={product}
									badge={{ text: "BESTSELLER", color: "bg-yellow-500" }}
								/>
							))}
						</div>
					</div>
				</section>
			)}
		</>
	);
}
