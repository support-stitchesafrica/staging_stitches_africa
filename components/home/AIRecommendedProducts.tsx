"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { ProductSearchService } from "@/lib/ai-assistant/product-search-service";
import { formatPrice } from "@/lib/utils";
import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";
import { getImageWithFallback } from "@/lib/utils/image-validator";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Price, DiscountedPrice } from "@/components/common/Price";
import { useCurrency } from "@/contexts/CurrencyContext";

// Use the FormattedProduct type from the service
import type { FormattedProduct as ServiceFormattedProduct } from "@/lib/ai-assistant/product-search-service";

type FormattedProduct = Partial<Product> & {
	product_id: string;
	title: string;
	price:
		| number
		| {
				base: number;
				currency: string;
				discount?: number;
		  };
	images: string[];
	type: "ready-to-wear" | "bespoke";
	availability: string;
	vendor: {
		id: string;
		name: string;
		logo?: string;
	};
};

interface AIRecommendedProductsProps {
	title?: string;
	subtitle?: string;
}

export const AIRecommendedProducts: React.FC<AIRecommendedProductsProps> = ({
	title = "AI Recommended For You",
	subtitle = "Products recommended by our AI shopping assistant based on your preferences",
}) => {
	const [products, setProducts] = useState<FormattedProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { userCountry } = useCurrency();

	// Get unique user identifier for tracking preferences
	const getUniqueUserId = (): string => {
		if (typeof window === "undefined") return "anonymous";

		// Check if we already have a unique user ID from chat widget
		let uniqueUserId = localStorage.getItem("ai-chat-unique-user-id");

		// If not, generate one
		if (!uniqueUserId) {
			uniqueUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			localStorage.setItem("ai-chat-unique-user-id", uniqueUserId);
		}

		return uniqueUserId;
	};

	useEffect(() => {
		loadRecommendedProducts();
	}, []);

	const loadRecommendedProducts = async () => {
		try {
			setLoading(true);
			setError(null);

			// Get user ID for personalized recommendations
			const userId = getUniqueUserId();

			// Try to get personalized recommendations based on user preferences first
			let serviceProducts: ServiceFormattedProduct[] = [];

			try {
				// Use the new personalized recommendation method
				serviceProducts =
					await ProductSearchService.getPersonalizedRecommendations(userId, 10);
			} catch (prefError) {
				console.warn(
					"Could not fetch personalized recommendations, falling back to general recommendations:",
					prefError,
				);

				// Fallback to popular products
				serviceProducts = await ProductSearchService.getPopularProducts(10);
			}

			// Convert ServiceFormattedProduct to our compatible type
			const formattedProducts = serviceProducts.map((fp) => ({
				product_id: fp.id,
				title: fp.title,
				description: fp.description || "",
				price: {
					base: fp.price,
					currency: fp.currency || "USD",
					discount: fp.discount,
				},
				discount: fp.discount,
				images: fp.images,
				category: fp.category || "",
				type: fp.type as "ready-to-wear" | "bespoke",
				availability: fp.availability || "in_stock",
				tailor_id: fp.vendor.id,
				tailor: fp.vendor.name,
				vendor: {
					id: fp.vendor.id,
					name: fp.vendor.name,
					logo: fp.vendor.logo,
				},
				tags: fp.tags || [],
				deliveryTimeline: fp.deliveryTimeline,
			}));

			// Filter out products without images
			const validProducts = formattedProducts.filter(
				(product: any) => product.images && product.images.length > 0,
			);

			setProducts(validProducts as FormattedProduct[]);
		} catch (err) {
			console.error("Error loading AI recommended products:", err);
			setError("Failed to load recommended products");
		} finally {
			setLoading(false);
		}
	};

	const getShopNowLink = (productId: string) => {
		return `/shops/products/${productId}`;
	};

	if (loading) {
		return (
			<section className="py-12 bg-gray-50">
				<div className="container mx-auto px-4">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
						<p className="text-gray-600">{subtitle}</p>
					</div>
					<div className="flex gap-4 overflow-x-auto pb-4">
						{Array.from({ length: 10 }).map((_, index) => (
							<div
								key={index}
								className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md animate-pulse"
							>
								<div className="h-48 bg-gray-200 rounded-t-lg"></div>
								<div className="p-4">
									<div className="h-4 bg-gray-200 rounded mb-2"></div>
									<div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
									<div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
									<div className="h-8 bg-gray-200 rounded"></div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>
		);
	}

	if (error) {
		return (
			<section className="py-12 bg-gray-50">
				<div className="container mx-auto px-4 text-center">
					<div className="text-red-600 mb-4">{error}</div>
					<button
						onClick={loadRecommendedProducts}
						className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						Try Again
					</button>
				</div>
			</section>
		);
	}

	// Don't show section if no products
	if (products.length === 0) {
		return null;
	}

	return (
		<section className="py-12 bg-gray-50">
			<div className="container mx-auto px-4">
				{/* Section Header */}
				<div className="text-center mb-8">
					<h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
					<p className="text-gray-600">{subtitle}</p>
				</div>

				{/* Products Slider */}
				<div className="relative">
					<div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
						{products.map((product) => {
							// Calculate base price with duty (exempt for Nigerian users)
							const rawBasePrice =
								typeof product.price === "number"
									? product.price
									: product.price.base;

							const currency =
								typeof product.price === "object"
									? product.price.currency
									: "USD";
							const discountValue = product.discount || 0;

							// FIX: Use utils to supply commission (20%) + duty where applicable
							const basePrice = calculateCustomerPrice(
								rawBasePrice,
								userCountry,
							);

							// Calculate discounted price using utils
							const discountedPrice =
								discountValue > 0
									? calculateFinalPrice(
											rawBasePrice,
											discountValue,
											userCountry,
										)
									: basePrice;

							const hasDiscount = discountValue > 0;
							const imageUrl = getImageWithFallback(product.images);

							return (
								<div
									key={product.product_id}
									className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden"
								>
									{/* Product Image */}
									<div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
										{imageUrl.includes("firebasestorage.googleapis.com") ||
										imageUrl.includes("storage.googleapis.com") ? (
											<img
												src={imageUrl}
												alt={product.title}
												className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.src = "/placeholder-product.svg";
												}}
												loading="lazy"
												decoding="async"
												crossOrigin="anonymous"
											/>
										) : (
											<Image
												src={imageUrl}
												alt={product.title}
												fill
												className="object-cover hover:scale-105 transition-transform duration-300"
												sizes="(max-width: 768px) 256px, 256px"
												onError={(e) => {
													const target = e.target as HTMLImageElement;
													target.src = "/placeholder-product.svg";
												}}
											/>
										)}
										{hasDiscount && (
											<div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
												-{product.discount}%
											</div>
										)}
										<div className="absolute top-2 right-2">
											<span
												className={`px-2 py-1 rounded-full text-xs font-medium ${
													product.type === "bespoke"
														? "bg-purple-100 text-purple-800"
														: "bg-blue-100 text-blue-800"
												}`}
											>
												{product.type === "bespoke" ? "Bespoke" : "RTW"}
											</span>
										</div>
									</div>

									{/* Product Info */}
									<div className="p-4 min-w-0">
										<h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight line-clamp-2 overflow-hidden">
											{product.title}
										</h3>
										<p className="text-gray-600 text-xs mb-2 truncate">
											by {product.vendor?.name || "Unknown Vendor"}
										</p>

										{/* Price */}
										<div className="flex items-center gap-2 mb-3">
											{hasDiscount ? (
												<DiscountedPrice
													originalPrice={basePrice}
													salePrice={discountedPrice}
													originalCurrency={currency}
													size="sm"
												/>
											) : (
												<Price
													price={basePrice}
													originalCurrency={currency}
													size="sm"
													variant="accent"
												/>
											)}
										</div>

										{/* Shop Now Button */}
										<Link href={getShopNowLink(product.product_id)}>
											<button className="w-full bg-black text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
												Shop Now
											</button>
										</Link>
									</div>
								</div>
							);
						})}
					</div>

					{/* Scroll Indicators */}
					<div className="flex justify-center mt-4">
						<div className="flex items-center gap-2">
							<ChevronLeft className="w-5 h-5 text-gray-400" />
							<span className="text-sm text-gray-500">Scroll to see more</span>
							<ChevronRight className="w-5 h-5 text-gray-400" />
						</div>
					</div>
				</div>

				{/* View All Products Link */}
				<div className="text-center mt-8">
					<Link href="/shops/ai-recommended">
						<button className="px-6 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors mr-4">
							View AI Recommendations
						</button>
					</Link>
					{/* <Link href="/shops/products">
            <button className="px-6 py-3 border-2 border-black text-black font-medium rounded-lg hover:bg-black hover:text-white transition-colors">
              View All Products
            </button>
          </Link> */}
				</div>
			</div>
		</section>
	);
};
