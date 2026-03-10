"use client";

/**
 * Product Detail View Component
 * Shows detailed product information with image gallery, description, and add to cart
 */

import React, { useState, useEffect } from "react";
import { StorefrontConfig } from "@/types/storefront";
import { Product } from "@/types";
import { useStorefrontCart } from "@/contexts/StorefrontCartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { LanguageSelector } from "@/components/common/LanguageSelector";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { showSuccess, showError } from "@/lib/storefront/notifications";
import { calculateCustomerPrice, calculateFinalPrice } from "@/lib/priceUtils";

interface ProductDetailViewProps {
	storefront: StorefrontConfig;
	productId: string;
}

export default function ProductDetailView({
	storefront,
	productId,
}: ProductDetailViewProps) {
	const [product, setProduct] = useState<Product | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [quantity, setQuantity] = useState(1);
	const [addingToCart, setAddingToCart] = useState(false);
	const router = useRouter();

	// Currency formatting
	const { formatPrice, userCountry } = useCurrency();

	// Use storefront cart context with error handling
	let addItem: any = null;
	let setStorefrontContext: any = null;
	try {
		const cartContext = useStorefrontCart();
		addItem = cartContext.addItem;
		setStorefrontContext = cartContext.setStorefrontContext;
	} catch (error) {
		console.warn(
			"ProductDetailView: StorefrontCartProvider not available, cart functionality disabled",
		);
	}

	// Set storefront context when component mounts
	useEffect(() => {
		if (setStorefrontContext) {
			setStorefrontContext({
				storefrontId: storefront.id,
				storefrontHandle: storefront.handle,
			});
		}
	}, [storefront.id, storefront.handle, setStorefrontContext]);

	// Fetch product details
	useEffect(() => {
		const fetchProduct = async () => {
			try {
				setLoading(true);
				const response = await fetch(
					`/api/storefront/product/${productId}?vendorId=${storefront.vendorId}`,
				);
				const data = await response.json();

				if (data.success) {
					setProduct(data.product);
				} else {
					setError(data.error || "Product not found");
				}
			} catch (err) {
				console.error("Error fetching product:", err);
				setError("Failed to load product");
			} finally {
				setLoading(false);
			}
		};

		fetchProduct();
	}, [storefront.vendorId, productId]);

	const handleAddToCart = async () => {
		if (!product) return;

		try {
			setAddingToCart(true);

			if (addItem) {
				// Pass original product — cart service handles pricing consistently
				await addItem(product, quantity);
				// Show success notification
				showSuccess(
					"Added to cart!",
					`${quantity}x ${product.title} added to your cart`,
				);
			} else {
				showError(
					"Cart unavailable",
					"Cart functionality is not available in preview mode",
				);
			}
		} catch (error) {
			console.error("Error adding to cart:", error);
			showError("Failed to add item", "Please try again");
		} finally {
			setAddingToCart(false);
		}
	};

	const handleBuyNow = async () => {
		if (!product) return;

		try {
			// Add to cart and redirect to storefront checkout
			await handleAddToCart();
			// Redirect to storefront checkout
			window.location.href = `/store/${storefront.handle}/checkout`;
		} catch (error) {
			console.error("Error with buy now:", error);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Loading product details...</p>
				</div>
			</div>
		);
	}

	if (error || !product) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-red-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Product Not Found
					</h2>
					<p className="text-gray-600 mb-4">
						{error || "The requested product could not be found."}
					</p>
					<Link
						href={`/store/${storefront.handle}`}
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
					>
						<svg
							className="w-4 h-4 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
						Back to Store
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen"
			style={{
				backgroundColor: storefront.theme.colors.background,
				color: storefront.theme.colors.text,
				fontFamily: storefront.theme.typography.bodyFont,
			}}
		>
			{/* Header */}
			<header
				className="shadow-sm border-b sticky top-0 z-10"
				style={{
					backgroundColor: storefront.theme.colors.background,
					borderColor: storefront.theme.colors.secondary + "20",
				}}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<Link
							href={`/store/${storefront.handle}`}
							className="flex items-center gap-3 hover:opacity-80 transition-opacity"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								/>
							</svg>
							<span className="font-medium">Back to Store</span>
						</Link>

						{/* Language & Currency Selector */}
						<LanguageSelector />

						<Link
							href={`/store/${storefront.handle}/cart`}
							className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
							style={{ backgroundColor: storefront.theme.colors.primary }}
						>
							View Cart
						</Link>
					</div>
				</div>
			</header>

			{/* Product Detail */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
					{/* Product Images */}
					<div className="space-y-4">
						{/* Main Image */}
						<div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
							{product.images && product.images.length > 0 ? (
								<img
									src={product.images[selectedImageIndex]}
									alt={product.title}
									className="w-full h-full object-cover"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<svg
										className="w-16 h-16 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
								</div>
							)}
						</div>

						{/* Thumbnail Images */}
						{product.images && product.images.length > 1 && (
							<div className="flex gap-2 overflow-x-auto">
								{product.images.map((image, index) => (
									<button
										key={index}
										onClick={() => setSelectedImageIndex(index)}
										className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
											selectedImageIndex === index
												? "border-blue-500 ring-2 ring-blue-200"
												: "border-gray-200 hover:border-gray-300"
										}`}
									>
										<img
											src={image}
											alt={`${product.title} ${index + 1}`}
											className="w-full h-full object-cover"
										/>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Product Info */}
					<div className="space-y-6">
						{/* Title and Price */}
						<div>
							<h1
								className="text-3xl font-bold mb-2"
								style={{
									color: storefront.theme.colors.primary,
									fontFamily: storefront.theme.typography.headingFont,
								}}
							>
								{product.title}
							</h1>
							<div className="flex items-center gap-4">
                                                                <span className="text-3xl font-bold text-gray-900">
                                                                        {formatPrice(
                                                                                product.discount > 0
                                                                                        ? calculateFinalPrice(product.price.base, product.discount, userCountry)
                                                                                        : calculateCustomerPrice(product.price.base, userCountry),
                                                                        )}
                                                                </span>								{product.discount > 0 && (
									<span className="text-lg text-gray-500 line-through">
										{formatPrice(
											calculateCustomerPrice(product.price.base, userCountry),
										)}
									</span>
								)}
							</div>
							{product.discount > 0 && (
								<span className="inline-block mt-2 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
									{product.discount}% OFF
								</span>
							)}
						</div>

						{/* Category and Availability */}
						<div className="flex items-center gap-4 text-sm">
							<span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
								{product.category}
							</span>
							<span
								className={`px-3 py-1 rounded-full ${
									product.availability === "in_stock"
										? "bg-green-100 text-green-800"
										: "bg-red-100 text-red-800"
								}`}
							>
								{product.availability === "in_stock"
									? "✅ In Stock"
									: "❌ Out of Stock"}
							</span>
							{product.type && (
								<span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
									{product.type
										.replace("-", " ")
										.replace(/\b\w/g, (l) => l.toUpperCase())}
								</span>
							)}
						</div>

						{/* Product Features */}
						<div className="grid grid-cols-2 gap-4 text-sm">
							{product.featured && (
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
									<span>Featured Product</span>
								</div>
							)}
							{product.isNewArrival && (
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-green-500 rounded-full"></span>
									<span>New Arrival</span>
								</div>
							)}
							{product.isBestSeller && (
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-purple-500 rounded-full"></span>
									<span>Best Seller</span>
								</div>
							)}
							{product.vendor?.name && (
								<div className="flex items-center gap-2">
									<span className="w-2 h-2 bg-blue-500 rounded-full"></span>
									<span>By {product.vendor.name}</span>
								</div>
							)}
						</div>

						{/* Description */}
						<div>
							<h3 className="text-lg font-semibold mb-3">Description</h3>
							<p className="text-gray-700 leading-relaxed">
								{product.description ||
									"No description available for this product."}
							</p>
						</div>

						{/* Tags */}
						{product.tags && product.tags.length > 0 && (
							<div>
								<h3 className="text-lg font-semibold mb-3">Tags</h3>
								<div className="flex flex-wrap gap-2">
									{product.tags.map((tag, index) => (
										<span
											key={index}
											className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
										>
											#{tag}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Product Details */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
							<div>
								<h3 className="text-lg font-semibold mb-3">Product Details</h3>
								<dl className="space-y-2 text-sm">
									<div className="flex justify-between">
										<dt className="text-gray-600">Product ID:</dt>
										<dd className="font-medium">{product.product_id}</dd>
									</div>
									{product.category && (
										<div className="flex justify-between">
											<dt className="text-gray-600">Category:</dt>
											<dd className="font-medium capitalize">
												{product.category}
											</dd>
										</div>
									)}
									{product.type && (
										<div className="flex justify-between">
											<dt className="text-gray-600">Type:</dt>
											<dd className="font-medium capitalize">
												{product.type.replace("-", " ")}
											</dd>
										</div>
									)}
									{product.price?.currency && (
										<div className="flex justify-between">
											<dt className="text-gray-600">Currency:</dt>
											<dd className="font-medium">{product.price.currency}</dd>
										</div>
									)}
								</dl>
							</div>

							<div>
								<h3 className="text-lg font-semibold mb-3">
									Shipping & Returns
								</h3>
								<div className="space-y-3 text-sm">
									<div className="flex items-start gap-2">
										<svg
											className="w-4 h-4 text-green-600 mt-0.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Free shipping on orders over $100</span>
									</div>
									<div className="flex items-start gap-2">
										<svg
											className="w-4 h-4 text-green-600 mt-0.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>30-day return policy</span>
									</div>
									<div className="flex items-start gap-2">
										<svg
											className="w-4 h-4 text-green-600 mt-0.5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Secure payment processing</span>
									</div>
								</div>
							</div>
						</div>

						{/* Product Options and Quantity */}
						<div className="space-y-4 pt-6 border-t border-gray-200">
							{/* Size Selection */}
							{product.rtwOptions?.sizes &&
								Array.isArray(product.rtwOptions.sizes) &&
								product.rtwOptions.sizes.length > 0 && (
									<div>
										<label className="font-medium mb-2 block">Size:</label>
										<div className="flex flex-wrap gap-2">
											{product.rtwOptions.sizes.map(
												(
													size: string | { label: string; quantity: number },
												) => {
													const sizeLabel =
														typeof size === "string" ? size : size.label;
													return (
														<button
															key={sizeLabel}
															className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
															style={{
																backgroundColor:
																	storefront.theme.colors.background,
																borderColor:
																	storefront.theme.colors.primary + "40",
															}}
														>
															{sizeLabel}
														</button>
													);
												},
											)}
										</div>
									</div>
								)}

							{/* Color Selection */}
							{product.rtwOptions?.colors &&
								Array.isArray(product.rtwOptions.colors) &&
								product.rtwOptions.colors.length > 0 && (
									<div>
										<label className="font-medium mb-2 block">Color:</label>
										<div className="flex flex-wrap gap-2">
											{product.rtwOptions.colors.map((color: string) => (
												<button
													key={color}
													className="px-4 py-2 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors capitalize"
													style={{
														backgroundColor: storefront.theme.colors.background,
														borderColor: storefront.theme.colors.primary + "40",
													}}
												>
													{color}
												</button>
											))}
										</div>
									</div>
								)}

							{/* Quantity */}
							<div className="flex items-center gap-4">
								<label className="font-medium">Quantity:</label>
								<div className="flex items-center border border-gray-300 rounded-lg">
									<button
										onClick={() => setQuantity(Math.max(1, quantity - 1))}
										className="px-3 py-2 hover:bg-gray-100 transition-colors"
										disabled={quantity <= 1}
									>
										-
									</button>
									<span className="px-4 py-2 border-x border-gray-300">
										{quantity}
									</span>
									<button
										onClick={() => setQuantity(quantity + 1)}
										className="px-3 py-2 hover:bg-gray-100 transition-colors"
									>
										+
									</button>
								</div>
							</div>

							<div className="flex gap-3">
								<button
									onClick={handleAddToCart}
									disabled={addingToCart || product.availability !== "in_stock"}
									className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{addingToCart ? "Adding..." : "Add to Cart"}
								</button>
								<button
									onClick={handleBuyNow}
									disabled={addingToCart || product.availability !== "in_stock"}
									className="flex-1 px-6 py-3 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
									style={{ backgroundColor: storefront.theme.colors.primary }}
								>
									Buy Now
								</button>
							</div>

							<p className="text-sm text-gray-600 text-center">
								🔒 Secure checkout powered by Stitches Africa
							</p>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
