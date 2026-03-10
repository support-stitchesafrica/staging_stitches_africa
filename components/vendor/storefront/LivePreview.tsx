"use client";

import { useState, useEffect, useCallback } from "react";
import { StorefrontTemplate, ThemeConfiguration } from "@/types/storefront";
import "./storefront-animations.css";

interface LivePreviewProps {
	template: StorefrontTemplate | null;
	theme: ThemeConfiguration;
	isFullscreen?: boolean;
	vendorId?: string;
	heroContent?: {
		title?: string;
		subtitle?: string;
		description?: string;
		ctaText?: string;
		ctaLink?: string;
		backgroundImage?: string;
		backgroundVideo?: string;
	};
	businessInfo?: {
		businessName?: string;
		description?: string;
		handle?: string;
		slogan?: string;
	};
}

// No mock data - only show real vendor products

export function LivePreview({
	template,
	theme,
	isFullscreen = false,
	vendorId,
	heroContent,
	businessInfo,
}: LivePreviewProps) {
	const [realProducts, setRealProducts] = useState<any[]>([]);
	const [newArrivals, setNewArrivals] = useState<any[]>([]);
	const [bestSelling, setBestSelling] = useState<any[]>([]);
	const [promotions, setPromotions] = useState<any[]>([]);
	const [isLoadingProducts, setIsLoadingProducts] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);

	const fetchVendorProducts = useCallback(async () => {
		if (!vendorId) return;

		setIsLoadingProducts(true);
		try {
			console.log("LivePreview: Fetching products for vendor:", vendorId);

			// Try enhanced products API first, fallback to original API
			try {
				const [allProductsRes, newArrivalsRes, bestSellingRes, promotionsRes] =
					await Promise.all([
						fetch(
							`/api/storefront/enhanced-products?vendorId=${vendorId}&section=all&limit=8&page=${currentPage}`
						),
						fetch(
							`/api/storefront/enhanced-products?vendorId=${vendorId}&section=new-arrivals&limit=6`
						),
						fetch(
							`/api/storefront/enhanced-products?vendorId=${vendorId}&section=best-selling&limit=6`
						),
						fetch(
							`/api/storefront/enhanced-products?vendorId=${vendorId}&section=promotions&limit=4`
						),
					]);

				console.log("Enhanced API responses:", {
					allProducts: allProductsRes.status,
					newArrivals: newArrivalsRes.status,
					bestSelling: bestSellingRes.status,
					promotions: promotionsRes.status,
				});

				if (allProductsRes.ok) {
					const data = await allProductsRes.json();
					console.log("All products data:", data);
					if (data.success) {
						setRealProducts(data.products);
					}
				}

				if (newArrivalsRes.ok) {
					const data = await newArrivalsRes.json();
					if (data.success) {
						setNewArrivals(data.products);
					}
				}

				if (bestSellingRes.ok) {
					const data = await bestSellingRes.json();
					if (data.success) {
						setBestSelling(data.products);
					}
				}

				if (promotionsRes.ok) {
					const data = await promotionsRes.json();
					if (data.success) {
						setPromotions(data.products);
					}
				}
			} catch (enhancedError) {
				console.warn(
					"Enhanced API failed, falling back to original API:",
					enhancedError
				);

				// Fallback to original products API
				const response = await fetch(
					`/api/storefront/products?vendorId=${vendorId}&action=products&limit=8`
				);
				console.log("Fallback API response status:", response.status);

				if (response.ok) {
					const data = await response.json();
					console.log("Fallback API response data:", data);

					if (data.success && data.products) {
						console.log(
							"Setting fallback products:",
							data.products.length,
							"products"
						);
						setRealProducts(data.products);
					}
				}
			}
		} catch (error) {
			console.error("Error fetching vendor products:", error);
		} finally {
			setIsLoadingProducts(false);
		}
	}, [vendorId, currentPage]);

	// Fetch real vendor products
	useEffect(() => {
		if (vendorId) {
			fetchVendorProducts();
		}
	}, [vendorId, fetchVendorProducts]);

	if (!template) {
		return (
			<div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
				<div className="text-center">
					<div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
						<svg
							className="w-8 h-8 text-gray-400"
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
					<h3 className="text-lg font-medium text-gray-900 mb-2">
						Select a Template
					</h3>
					<p className="text-gray-600">
						Choose a template from the left to see the live preview
					</p>
				</div>
			</div>
		);
	}

	const containerClass = isFullscreen
		? "fixed inset-0 z-50 bg-white overflow-auto"
		: "w-full h-96 overflow-auto border rounded-lg";

	// Only use real vendor products - no mock data
	const products = realProducts.slice(0, 8);

	return (
		<div className={containerClass}>
			<div
				className="min-h-full"
				style={{
					backgroundColor: theme.colors.background,
					fontFamily: theme.typography.bodyFont,
					color: theme.colors.text,
				}}
			>
				{/* Header */}
				<header className={getHeaderStyle(template.id, theme)}>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<div className="flex items-center space-x-4">
								{getLogoElement(template.id, theme)}
								<h1
									className={getStoreTitleStyle(template.id)}
									style={{
										fontFamily: theme.typography.headingFont,
										color: theme.colors.text,
									}}
								>
									{getStoreName(
										template.id,
										businessInfo?.businessName,
										businessInfo?.handle
									)}
								</h1>
							</div>
							<nav className="hidden md:flex items-center space-x-8">
								{getNavItems(template.id).map((item, index) => (
									<a
										key={index}
										href="#"
										className={getNavItemStyle(template.id)}
										style={{ color: theme.colors.text }}
									>
										{item}
									</a>
								))}
								<button
									className={getCartButtonStyle(template.id)}
									style={{
										backgroundColor:
											template.id === "luxury-jewelry"
												? "transparent"
												: theme.colors.primary,
										color:
											template.id === "luxury-jewelry"
												? theme.colors.primary
												: "white",
										borderColor:
											template.id === "luxury-jewelry"
												? theme.colors.primary
												: "transparent",
									}}
								>
									{template.id === "luxury-jewelry" ? "🛍️" : "🛒"} Cart
								</button>
							</nav>
						</div>
					</div>
				</header>

				{/* Hero Section */}
				<section
					className={`${getHeroSectionStyle(
						template.id,
						theme
					)} relative overflow-hidden`}
				>
					{/* Background Video */}
					{theme.media?.videoUrl && (
						<video
							autoPlay
							muted
							loop
							className="absolute inset-0 w-full h-full object-cover"
						>
							<source src={theme.media.videoUrl} type="video/mp4" />
						</video>
					)}

					{/* Background Image */}
					{!theme.media?.videoUrl && theme.media?.bannerUrl && (
						<div
							className="absolute inset-0 bg-cover bg-center"
							style={{ backgroundImage: `url(${theme.media.bannerUrl})` }}
							key={theme.media.bannerUrl} // Force re-render when banner URL changes
						/>
					)}

					{/* Overlay for better text readability */}
					{(theme.media?.videoUrl || theme.media?.bannerUrl) && (
						<div className="absolute inset-0 bg-black opacity-40" />
					)}

					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
						<div className={getHeroContentStyle(template.id)}>
							{getHeroContent(template.id, theme, heroContent, businessInfo)}
						</div>
					</div>
				</section>

				{/* Promotions Section */}
				{promotions.length > 0 && (
					<section className="py-12 bg-gradient-to-r from-red-50 to-pink-50">
						<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
							<div className="text-center mb-8">
								<h3 className="text-3xl font-bold text-gray-900 mb-4">
									🔥 Special Offers
								</h3>
								<p className="text-lg text-gray-600">
									Limited time deals you don't want to miss!
								</p>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
								{promotions.map((product, index) => (
									<div
										key={product.id}
										className="bg-white rounded-lg shadow-md overflow-hidden relative"
									>
										<div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded z-10">
											SALE
										</div>
										<img
											src={product.image || "/placeholder-product.svg"}
											alt={product.name}
											className="w-full h-48 object-cover"
										/>
										<div className="p-4">
											<h4 className="font-semibold text-gray-900 mb-2">
												{product.name}
											</h4>
											<p className="text-lg font-bold text-red-600">
												${product.price}
											</p>
										</div>
									</div>
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
									className={getProductsTitleStyle(template.id)}
									style={{
										fontFamily: theme.typography.headingFont,
										color: theme.colors.text,
									}}
								>
									✨ New Arrivals
								</h3>
								<p
									className="mt-4 text-lg max-w-2xl mx-auto"
									style={{ color: theme.colors.secondary }}
								>
									Fresh additions to our collection
								</p>
							</div>
							<div className={getProductsGridStyle(template.id)}>
								{newArrivals.map((product, index) => (
									<div
										key={product.id}
										className={`group cursor-pointer ${getProductCardStyle(
											template.id,
											theme
										)}`}
										style={{ animationDelay: `${index * 100}ms` }}
									>
										<div className={getProductImageContainerStyle(template.id)}>
											<div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 text-xs font-bold rounded z-10">
												NEW
											</div>
											<img
												src={product.image || "/placeholder-product.svg"}
												alt={product.name}
												className={getProductImageStyle(template.id)}
											/>
											{getProductOverlay(template.id, theme)}
										</div>
										<div className={getProductInfoStyle(template.id)}>
											<h4
												className={getProductNameStyle(template.id)}
												style={{ color: theme.colors.text }}
											>
												{product.name}
											</h4>
											<p
												className={getProductCategoryStyle(template.id)}
												style={{ color: theme.colors.secondary }}
											>
												{product.category}
											</p>
											<p
												className={getProductPriceStyle(template.id)}
												style={{ color: theme.colors.primary }}
											>
												${product.price}
											</p>
											{getProductActions(template.id, theme)}
										</div>
									</div>
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
									className={getProductsTitleStyle(template.id)}
									style={{
										fontFamily: theme.typography.headingFont,
										color: theme.colors.text,
									}}
								>
									🏆 Best Sellers
								</h3>
								<p
									className="mt-4 text-lg max-w-2xl mx-auto"
									style={{ color: theme.colors.secondary }}
								>
									Customer favorites and top-rated items
								</p>
							</div>
							<div className={getProductsGridStyle(template.id)}>
								{bestSelling.map((product, index) => (
									<div
										key={product.id}
										className={`group cursor-pointer ${getProductCardStyle(
											template.id,
											theme
										)}`}
										style={{ animationDelay: `${index * 100}ms` }}
									>
										<div className={getProductImageContainerStyle(template.id)}>
											<div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded z-10">
												BESTSELLER
											</div>
											<img
												src={product.image || "/placeholder-product.svg"}
												alt={product.name}
												className={getProductImageStyle(template.id)}
											/>
											{getProductOverlay(template.id, theme)}
										</div>
										<div className={getProductInfoStyle(template.id)}>
											<h4
												className={getProductNameStyle(template.id)}
												style={{ color: theme.colors.text }}
											>
												{product.name}
											</h4>
											<p
												className={getProductCategoryStyle(template.id)}
												style={{ color: theme.colors.secondary }}
											>
												{product.category}
											</p>
											<div className="flex items-center gap-2">
												<p
													className={getProductPriceStyle(template.id)}
													style={{ color: theme.colors.primary }}
												>
													${product.price}
												</p>
												{product.views && (
													<span className="text-xs text-gray-500">
														{product.views} views
													</span>
												)}
											</div>
											{getProductActions(template.id, theme)}
										</div>
									</div>
								))}
							</div>
						</div>
					</section>
				)}

				{/* All Products Section with Pagination */}
				<section className={getProductsSectionStyle(template.id)}>
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="text-center mb-12">
							<h3
								className={getProductsTitleStyle(template.id)}
								style={{
									fontFamily: theme.typography.headingFont,
									color: theme.colors.text,
								}}
							>
								{getProductsSectionTitle(template.id)}
							</h3>
							<p
								className="mt-4 text-lg max-w-2xl mx-auto"
								style={{ color: theme.colors.secondary }}
							>
								{getProductsSectionSubtitle(template.id)}
							</p>
						</div>

						{isLoadingProducts ? (
							<div className="text-center py-12">
								<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									Loading Products
								</h3>
								<p className="text-gray-600">Fetching your products...</p>
							</div>
						) : realProducts.length > 0 ? (
							<>
								<div className={getProductsGridStyle(template.id)}>
									{realProducts.map((product, index) => (
										<div
											key={product.id}
											className={`group cursor-pointer ${getProductCardStyle(
												template.id,
												theme
											)}`}
											style={{ animationDelay: `${index * 100}ms` }}
										>
											<div
												className={getProductImageContainerStyle(template.id)}
											>
												<img
													src={
														product.image ||
														product.thumbnail ||
														product.images?.[0] ||
														product.imageUrl ||
														"/placeholder-product.svg"
													}
													alt={product.name || product.title}
													className={getProductImageStyle(template.id)}
													onError={(e) => {
														const target = e.target as HTMLImageElement;
														target.src = "/placeholder-product.svg";
													}}
												/>
												{getProductOverlay(template.id, theme)}
											</div>

											<div className={getProductInfoStyle(template.id)}>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														<h4
															className={getProductNameStyle(template.id)}
															style={{ color: theme.colors.text }}
														>
															{product.name || product.title}
														</h4>
														<p
															className={getProductCategoryStyle(template.id)}
															style={{ color: theme.colors.secondary }}
														>
															{product.category}
														</p>
													</div>
													<div className="text-right">
														<p
															className={getProductPriceStyle(template.id)}
															style={{ color: theme.colors.primary }}
														>
															$
															{typeof product.price === "number"
																? product.price
																: product.price?.base ||
																  product.price?.amount ||
																  0}
														</p>
													</div>
												</div>

												{getProductActions(template.id, theme)}
											</div>
										</div>
									))}
								</div>

								{/* Pagination */}
								<div className="flex justify-center mt-12">
									<div className="flex items-center space-x-2">
										<button
											onClick={() =>
												setCurrentPage((prev) => Math.max(1, prev - 1))
											}
											disabled={currentPage === 1}
											className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
										>
											Previous
										</button>
										<span className="px-3 py-2 text-sm font-medium text-gray-700">
											Page {currentPage}
										</span>
										<button
											onClick={() => setCurrentPage((prev) => prev + 1)}
											className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
										>
											Next
										</button>
									</div>
								</div>
							</>
						) : (
							<div className="text-center py-12">
								<div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-lg flex items-center justify-center">
									<svg
										className="w-8 h-8 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
										/>
									</svg>
								</div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									No Products Available
								</h3>
								<p className="text-gray-600">
									Add products to your store to see them in the preview
								</p>
							</div>
						)}
					</div>
				</section>

				{/* Fullscreen close button */}
				{isFullscreen && (
					<button
						onClick={() => window.history.back()}
						className="fixed top-4 right-4 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-70 transition-colors"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				)}
			</div>
		</div>
	);
}

// Template-specific helper functions for sophisticated layouts

function getHeaderStyle(templateId: string, theme: ThemeConfiguration): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "bg-white border-b border-gray-100 shadow-sm backdrop-blur-md";
		case "modern-fashion":
			return "bg-white border-b border-gray-200";
		case "artisan-craft":
			return "bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-yellow-200";
		case "tech-minimal":
			return "bg-white border-b border-gray-100";
		default:
			return "bg-white border-b";
	}
}

function getLogoElement(templateId: string, theme: ThemeConfiguration) {
	// If a logo is uploaded, use it instead of template defaults
	if (theme.media?.logoUrl) {
		return (
			<img
				src={theme.media.logoUrl}
				alt="Store Logo"
				className="h-10 w-10 object-contain rounded"
				onError={(e) => {
					const target = e.target as HTMLImageElement;
					target.style.display = "none";
				}}
			/>
		);
	}

	// Fallback to template-specific logos
	switch (templateId) {
		case "luxury-jewelry":
			return (
				<div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-lg">
					✨
				</div>
			);
		case "modern-fashion":
			return (
				<div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center text-white font-bold text-sm">
					M
				</div>
			);
		case "artisan-craft":
			return (
				<div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white text-lg">
					🏺
				</div>
			);
		case "tech-minimal":
			return (
				<div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-sm">
					T
				</div>
			);
		default:
			return (
				<div
					className="w-8 h-8 rounded"
					style={{ backgroundColor: theme.colors.primary }}
				></div>
			);
	}
}

function getStoreName(
	templateId: string,
	businessName?: string,
	handle?: string
): string {
	if (businessName) return businessName;
	if (handle) return handle;

	switch (templateId) {
		case "luxury-jewelry":
			return "Lumière Jewelry";
		case "modern-fashion":
			return "MODERN";
		case "artisan-craft":
			return "Artisan Collective";
		case "tech-minimal":
			return "TECH";
		default:
			return "Your Store";
	}
}

function getStoreTitleStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "text-xl font-light tracking-wide";
		case "modern-fashion":
			return "text-xl font-bold tracking-widest";
		case "artisan-craft":
			return "text-xl font-medium";
		case "tech-minimal":
			return "text-xl font-black tracking-tight";
		default:
			return "text-xl font-bold";
	}
}

function getNavItems(templateId: string): string[] {
	switch (templateId) {
		case "luxury-jewelry":
			return ["Collections", "Engagement", "Wedding", "Fine Jewelry"];
		case "modern-fashion":
			return ["New", "Women", "Men", "Accessories"];
		case "artisan-craft":
			return ["Pottery", "Textiles", "Woodwork", "Custom"];
		case "tech-minimal":
			return ["Phones", "Laptops", "Audio", "Accessories"];
		default:
			return ["Home", "Shop", "About", "Contact"];
	}
}

function getNavItemStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "text-sm font-light hover:text-yellow-600 transition-colors tracking-wide";
		case "modern-fashion":
			return "text-sm font-bold uppercase hover:underline transition-all tracking-wider";
		case "artisan-craft":
			return "text-sm font-medium hover:text-orange-600 transition-colors";
		case "tech-minimal":
			return "text-sm font-medium hover:text-blue-500 transition-colors";
		default:
			return "text-sm font-medium hover:text-gray-600 transition-colors";
	}
}

function getCartButtonStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "px-4 py-2 border rounded-full hover:bg-yellow-50 transition-colors text-sm font-light tracking-wide";
		case "modern-fashion":
			return "px-4 py-2 bg-black text-white text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors";
		case "artisan-craft":
			return "px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors shadow-sm";
		case "tech-minimal":
			return "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors";
		default:
			return "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors";
	}
}

function getHeroSectionStyle(
	templateId: string,
	theme: ThemeConfiguration
): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "h-[600px] flex items-center justify-center text-center";
		case "modern-fashion":
			return "h-[700px] flex items-center";
		case "artisan-craft":
			return "h-[500px] flex items-center justify-center bg-orange-50";
		case "tech-minimal":
			return "h-[450px] flex items-center bg-gray-50";
		default:
			return "h-96 flex items-center justify-center bg-gray-100";
	}
}

function getHeroContentStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "h-full flex items-center justify-center";
		case "modern-fashion":
			return "h-full flex items-center";
		case "artisan-craft":
			return "h-full flex items-center justify-center";
		case "tech-minimal":
			return "h-full flex items-center px-8";
		default:
			return "h-full flex items-center justify-center";
	}
}

function getHeroContent(
	templateId: string,
	theme: ThemeConfiguration,
	heroContent?: {
		title?: string;
		subtitle?: string;
		ctaText?: string;
	},
	businessInfo?: {
		businessName?: string;
		slogan?: string;
	}
) {
	const title = heroContent?.title || businessInfo?.businessName;
	const subtitle = heroContent?.subtitle || businessInfo?.slogan;
	const ctaText = heroContent?.ctaText || "Shop Now";

	switch (templateId) {
		case "luxury-jewelry":
			return (
				<div className="max-w-3xl mx-auto text-white">
					<h2 className="text-5xl md:text-7xl font-light mb-6 tracking-wider">
						{title || "ELEGANCE DEFINED"}
					</h2>
					<p className="text-xl md:text-2xl mb-10 font-light opacity-90 tracking-wide">
						{subtitle || "Timeless pieces for your most precious moments"}
					</p>
					<button className="px-10 py-4 bg-white text-gray-900 text-sm font-medium tracking-[0.2em] hover:bg-gray-100 transition-colors uppercase">
						{ctaText}
					</button>
				</div>
			);
		case "modern-fashion":
			return (
				<div className="max-w-2xl text-white pl-8 md:pl-20 border-l-4 border-white pl-8">
					<span className="block text-sm font-bold uppercase tracking-[0.3em] mb-4">
						Summer Collection 2024
					</span>
					<h2 className="text-6xl md:text-8xl font-black mb-6 leading-tight">
						{title || "URBAN\nSTYLE"}
					</h2>
					<p className="text-xl mb-8 opacity-90 max-w-lg">
						{subtitle || "Redefine your wardrobe with our latest drops."}
					</p>
					<button className="px-8 py-4 bg-white text-black font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors">
						{ctaText}
					</button>
				</div>
			);
		case "artisan-craft":
			return (
				<div className="text-center bg-white/90 p-12 rounded-lg shadow-xl backdrop-blur-sm max-w-2xl mx-auto border border-orange-100">
					<div className="mb-4 text-orange-600">★★★★★</div>
					<h2 className="text-4xl md:text-5xl font-serif font-medium text-gray-900 mb-6">
						{title || "Handcrafted with Love"}
					</h2>
					<p className="text-lg text-gray-600 mb-8 italic">
						{subtitle ||
							"Unique pieces made by skilled artisans using traditional techniques."}
					</p>
					<button className="px-8 py-3 bg-orange-600 text-white rounded-md font-medium hover:bg-orange-700 transition-colors shadow-lg">
						{ctaText}
					</button>
				</div>
			);
		case "tech-minimal":
			return (
				<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
					<div className="text-left">
						<h2 className="text-5xl font-bold text-gray-900 mb-6 tracking-tight">
							{title || "Future Ready"}
						</h2>
						<p className="text-xl text-gray-600 mb-8 max-w-md">
							{subtitle ||
								"Experience the next generation of technology today."}
						</p>
						<div className="flex space-x-4">
							<button className="px-6 py-3 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors">
								{ctaText}
							</button>
							<button className="px-6 py-3 border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors">
								Learn More
							</button>
						</div>
					</div>
					<div className="hidden md:block">
						{/* Tech illustration placeholder */}
					</div>
				</div>
			);
		default:
			return (
				<div className="text-center max-w-3xl mx-auto">
					<h2 className="text-4xl font-bold text-gray-900 mb-4">
						{title || "Welcome to Our Store"}
					</h2>
					<p className="text-xl text-gray-600 mb-8">
						{subtitle || "Discover our amazing collection of products."}
					</p>
					<button
						className="px-8 py-3 rounded-md text-white font-medium hover:opacity-90 transition-opacity"
						style={{ backgroundColor: theme.colors.primary }}
					>
						{ctaText}
					</button>
				</div>
			);
	}
}

function getProductsSectionStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "py-24 bg-gray-50";
		case "modern-fashion":
			return "py-20 bg-white";
		case "artisan-craft":
			return "py-16 bg-orange-50/30";
		case "tech-minimal":
			return "py-16 bg-white";
		default:
			return "py-12 bg-white";
	}
}

function getProductsTitleStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "text-3xl font-light tracking-widest text-gray-900 uppercase";
		case "modern-fashion":
			return "text-4xl font-black text-gray-900 uppercase tracking-tighter transform -rotate-1 inline-block";
		case "artisan-craft":
			return "text-3xl font-serif text-gray-800 italic";
		case "tech-minimal":
			return "text-2xl font-bold text-gray-900 tracking-tight";
		default:
			return "text-2xl font-bold text-gray-900";
	}
}

function getProductsSectionTitle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "EXQUISITE COLLECTION";
		case "modern-fashion":
			return "TRENDING NOW";
		case "artisan-craft":
			return "From Our Hands to Yours";
		case "tech-minimal":
			return "Latest Devices";
		default:
			return "All Products";
	}
}

function getProductsSectionSubtitle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "Discover the finest pieces selected just for you";
		case "modern-fashion":
			return "The hottest styles of the season";
		case "artisan-craft":
			return "Each piece tells a unique story";
		case "tech-minimal":
			return "Engineered for performance and design";
		default:
			return "Browse our complete catalog";
	}
}

function getProductsGridStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16";
		case "modern-fashion":
			return "grid grid-cols-1 md:grid-cols-3 gap-0 border-t border-l border-black";
		case "artisan-craft":
			return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8";
		case "tech-minimal":
			return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6";
		default:
			return "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8";
	}
}

function getProductCardStyle(
	templateId: string,
	theme: ThemeConfiguration
): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "bg-transparent transition-all duration-500 hover:-translate-y-2";
		case "modern-fashion":
			return "bg-white border-b border-r border-black p-6 relative overflow-hidden";
		case "artisan-craft":
			return "bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 border border-orange-100";
		case "tech-minimal":
			return "bg-gray-50 rounded-lg hover:bg-white transition-colors duration-200 border border-transparent hover:border-gray-200 p-4";
		default:
			return "bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300";
	}
}

function getProductImageContainerStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "aspect-square overflow-hidden mb-6 bg-gray-100 relative";
		case "modern-fashion":
			return "aspect-[3/4] overflow-hidden mb-4 relative grayscale hover:grayscale-0 transition-all duration-500";
		case "artisan-craft":
			return "aspect-square overflow-hidden relative";
		case "tech-minimal":
			return "aspect-square overflow-hidden mb-4 bg-white rounded flex items-center justify-center p-4 relative";
		default:
			return "aspect-square overflow-hidden bg-gray-200 relative";
	}
}

function getProductImageStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "w-full h-full object-cover transform hover:scale-110 transition-transform duration-1000";
		case "modern-fashion":
			return "w-full h-full object-cover";
		case "artisan-craft":
			return "w-full h-full object-cover hover:scale-105 transition-transform duration-500";
		case "tech-minimal":
			return "w-full h-full object-contain hover:scale-105 transition-transform duration-300";
		default:
			return "w-full h-full object-cover hover:scale-105 transition-transform duration-300";
	}
}

function getProductOverlay(
	templateId: string,
	theme: ThemeConfiguration
): React.ReactNode {
	switch (templateId) {
		case "luxury-jewelry":
			return null;
		case "modern-fashion":
			return (
				<div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
					<button className="px-6 py-2 bg-white text-black font-bold uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
						Quick View
					</button>
				</div>
			);
		case "artisan-craft":
			return (
				<div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
					<div className="text-white text-xs font-medium">
						Click to view details
					</div>
				</div>
			);
		default:
			return null;
	}
}

function getProductInfoStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "text-center space-y-2";
		case "modern-fashion":
			return "text-left";
		case "artisan-craft":
			return "p-6 space-y-2";
		case "tech-minimal":
			return "space-y-1";
		default:
			return "p-4 space-y-2";
	}
}

function getProductNameStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "text-lg font-light tracking-wide truncate";
		case "modern-fashion":
			return "text-xl font-bold uppercase tracking-wide mb-1";
		case "artisan-craft":
			return "text-lg font-serif font-medium text-gray-900";
		case "tech-minimal":
			return "text-base font-medium text-gray-900";
		default:
			return "text-lg font-medium text-gray-900 truncate";
	}
}

function getProductCategoryStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "text-xs font-medium text-gray-400 uppercase tracking-[0.2em]";
		case "modern-fashion":
			return "text-xs font-bold text-gray-500 uppercase mb-2";
		case "artisan-craft":
			return "text-sm text-orange-600 italic";
		case "tech-minimal":
			return "text-xs text-blue-500 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded";
		default:
			return "text-sm text-gray-500";
	}
}

function getProductPriceStyle(templateId: string): string {
	switch (templateId) {
		case "luxury-jewelry":
			return "text-base font-normal tracking-wider";
		case "modern-fashion":
			return "text-lg font-black";
		case "artisan-craft":
			return "text-lg font-medium text-gray-900";
		case "tech-minimal":
			return "text-sm font-bold";
		default:
			return "text-lg font-bold";
	}
}

function getProductActions(
	templateId: string,
	theme: ThemeConfiguration
): React.ReactNode {
	switch (templateId) {
		case "luxury-jewelry":
			return (
				<button className="text-xs uppercase tracking-[0.15em] border-b border-transparent hover:border-gray-900 transition-colors pb-0.5 mt-2">
					Add to Cart
				</button>
			);
		case "modern-fashion":
			return (
				<div className="flex justify-between items-center mt-4">
					<button className="text-sm font-bold uppercase underline">
						Shop
					</button>
					<div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
						→
					</div>
				</div>
			);
		case "artisan-craft":
			return (
				<div className="pt-4 border-t border-orange-50 mt-4 flex justify-between items-center">
					<button className="text-orange-700 font-medium hover:text-orange-800 text-sm">
						View Details
					</button>
					<div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200 transition-colors cursor-pointer">
						<span className="text-xl">+</span>
					</div>
				</div>
			);
		case "tech-minimal":
			return (
				<button className="w-full mt-3 py-1.5 rounded text-sm font-medium bg-white border border-gray-200 hover:border-blue-500 hover:text-blue-500 transition-colors">
					Add
				</button>
			);
		default:
			return (
				<button
					className="w-full mt-2 py-2 rounded text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
					style={{ backgroundColor: theme.colors.primary }}
				>
					Add to Cart
				</button>
			);
	}
}
