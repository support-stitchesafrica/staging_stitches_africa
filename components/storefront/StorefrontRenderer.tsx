"use client";

/**
 * Storefront Renderer Component
 * Main component that renders a complete storefront with products
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StorefrontConfig } from "@/types/storefront";
import { Product } from "@/types";
import ProductCatalog from "./ProductCatalog";
import EditableHeroSection from "./EditableHeroSection";
import EnhancedProductSections from "./EnhancedProductSections";
import { AnalyticsTracker, useStorefrontAnalytics } from "./AnalyticsTracker";
import PixelTracker from "./PixelTracker";
import { AnalyticsDebugger } from "./AnalyticsDebugger";
import { useStorefrontCart } from "@/contexts/StorefrontCartContext";
import StorefrontCartBadge from "./StorefrontCartBadge";
import { ModernGridTemplate } from "./templates/ModernGridTemplate";
import { LanguageSelector } from "@/components/common/LanguageSelector";

interface StorefrontRendererProps {
	storefront: StorefrontConfig;
	onAddToCart?: (product: Product) => Promise<void>;
	className?: string;
	isEditable?: boolean;
	products?: Product[];
	onToggleWishlist?: (productId: string) => void;
	wishlistItems?: Set<string>;
}

export default function StorefrontRenderer({
	storefront,
	onAddToCart,
	className = "",
	isEditable = false,
	products = [],
	onToggleWishlist = () => {},
	wishlistItems = new Set(),
}: StorefrontRendererProps) {
	const [mounted, setMounted] = useState(false);

	// Cart context - handle safely without violating hook rules
	const [cartAvailable, setCartAvailable] = useState(false);
	const [cartContext, setCartContext] = useState<any>(null);

	// Check cart availability after mount
	useEffect(() => {
		try {
			// This will be handled by the StorefrontClientWrapper if needed
			setCartAvailable(false);
		} catch (error) {
			console.warn(
				"StorefrontRenderer: StorefrontCartProvider not available, cart functionality disabled",
			);
			setCartAvailable(false);
		}
	}, []);

	const { setStorefrontContext, addItem } = cartContext || {
		setStorefrontContext: null,
		addItem: null,
	};

	// Set mounted state
	useEffect(() => {
		setMounted(true);
	}, []);

	// Set storefront context when component mounts
	useEffect(() => {
		if (mounted && setStorefrontContext) {
			setStorefrontContext({
				storefrontId: storefront.id,
				storefrontHandle: storefront.handle,
			});
		}
	}, [storefront.id, storefront.handle, setStorefrontContext, mounted]);

	// Analytics tracking
	const { trackAddToCart } = useStorefrontAnalytics(storefront.vendorId);

	// Enhanced add to cart handler with analytics
	const handleAddToCart =
		onAddToCart ||
		(async (product: Product) => {
			try {
				// Track the add to cart event
				trackAddToCart(product.product_id, product.title, product.price.base);

				// Add to storefront cart if available
				if (addItem) {
					await addItem(product, 1);
					console.log("Product added to storefront cart:", product.title);
				} else {
					console.warn(
						"Cart functionality not available - StorefrontCartProvider not found",
					);
					alert("Cart functionality is not available in preview mode.");
				}
			} catch (error) {
				console.error("Error adding product to cart:", error);
				// Show error message
				alert("Failed to add item to cart. Please try again.");
			}
		});
	const homePage = storefront.pages.find((page) => page.type === "home");
	const productDisplay = homePage?.productDisplay || {
		layout: "grid" as const,
		productsPerPage: 12,
		showFilters: true,
		showSorting: true,
		cartIntegration: {
			enabled: true,
			redirectToStitchesAfrica: true,
		},
		promotionalDisplay: {
			showBadges: true,
			showBanners: true,
			highlightPromotions: true,
		},
	};

	// Apply theme styles
	const themeStyles = {
		"--primary-color": storefront.theme.colors.primary,
		"--secondary-color": storefront.theme.colors.secondary,
		"--accent-color": storefront.theme.colors.accent,
		"--background-color": storefront.theme.colors.background,
		"--text-color": storefront.theme.colors.text,
		"--heading-font": storefront.theme.typography.headingFont,
		"--body-font": storefront.theme.typography.bodyFont,
	} as React.CSSProperties;

	// Check if using Modern Grid template
	const templateId = storefront.template?.id || storefront.templateId;
	const isModernGridTemplate = templateId === "modern-grid";

	// If using Modern Grid template, render it directly
	if (isModernGridTemplate && products.length > 0) {
		return (
			<>
				{/* Analytics Tracker */}
				<AnalyticsTracker storefrontId={storefront.vendorId} />

				{/* Social Media Pixel Tracker */}
				<PixelTracker
					config={storefront.socialPixels || {}}
					vendorId={storefront.vendorId}
					storefrontHandle={storefront.handle}
				/>

				{/* Analytics Debugger (for testing) */}
				<AnalyticsDebugger
					vendorId={storefront.vendorId}
					enabled={process.env.NODE_ENV === "development"}
				/>

				<ModernGridTemplate
					config={storefront}
					products={products}
					onAddToCart={handleAddToCart}
					onToggleWishlist={onToggleWishlist}
					wishlistItems={wishlistItems}
				/>
			</>
		);
	}

	return (
		<div
			className={`min-h-screen ${className}`}
			style={{
				backgroundColor: storefront.theme.colors.background,
				color: storefront.theme.colors.text,
				fontFamily: storefront.theme.typography.bodyFont,
				...themeStyles,
			}}
		>
			{/* Analytics Tracker */}
			<AnalyticsTracker storefrontId={storefront.vendorId} />

			{/* Social Media Pixel Tracker */}
			<PixelTracker
				config={storefront.socialPixels || {}}
				vendorId={storefront.vendorId}
				storefrontHandle={storefront.handle}
			/>

			{/* Analytics Debugger (for testing) */}
			<AnalyticsDebugger
				vendorId={storefront.vendorId}
				enabled={process.env.NODE_ENV === "development"}
			/>
			{/* Header */}
			<header
				className="shadow-sm border-b"
				style={{
					backgroundColor: storefront.theme.colors.background,
					borderColor: storefront.theme.colors.secondary + "20",
				}}
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<div className="flex items-center">
							{storefront.theme.media.logoUrl ? (
								<img
									src={storefront.theme.media.logoUrl}
									alt="Store Logo"
									className="h-10 w-auto"
								/>
							) : (
								<div
									className="text-2xl font-bold"
									style={{
										color: storefront.theme.colors.primary,
										fontFamily: storefront.theme.typography.headingFont,
									}}
								>
									{storefront.handle}
								</div>
							)}
						</div>

						{/* Right Side: Language Selector & Cart Button */}
						<div className="flex items-center gap-4">
							{/* Language & Currency Selector */}
							<LanguageSelector />

							{/* Cart Button */}
							<Link
								href={`/store/${storefront.handle}/cart`}
								className="relative px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105 flex items-center gap-2"
								style={{
									backgroundColor: storefront.theme.colors.primary,
									fontFamily: storefront.theme.typography.bodyFont,
								}}
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
										d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
									/>
								</svg>
								<span>Cart</span>
								<StorefrontCartBadge />
							</Link>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<EditableHeroSection
				storefront={storefront}
				isEditable={isEditable}
				heroContent={storefront.heroContent}
				businessInfo={storefront.businessInfo}
				onSave={async (content) => {
					// TODO: Implement hero content saving
					console.log("Saving hero content:", content);
				}}
			/>

			{/* Main Content */}
			<main>
				{/* Enhanced Product Sections */}
				<EnhancedProductSections
					vendorId={storefront.vendorId}
					theme={storefront.theme}
					onAddToCart={handleAddToCart}
				/>

				{/* Original Products Section */}
				<section
					id="products"
					className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
				>
					{/* Page Title - Refactored for better aesthetics */}
					<div className="mb-6 flex flex-col items-center text-center">
						<h2
							className="text-3xl md:text-4xl font-bold mb-3 tracking-tight"
							style={{
								color: storefront.theme.colors.primary,
								fontFamily: storefront.theme.typography.headingFont,
							}}
						>
							{homePage?.title || "All Products"}
						</h2>
						<div
							className="w-16 h-1 rounded-full mb-4"
							style={{ backgroundColor: storefront.theme.colors.accent }}
						></div>
						<p
							className="text-lg max-w-2xl mx-auto"
							style={{
								color: storefront.theme.colors.text + "99", // Slightly transparent
								fontFamily: storefront.theme.typography.bodyFont,
							}}
						>
							Browse our complete collection of products
						</p>
					</div>

					<ProductCatalog
						vendorId={storefront.vendorId}
						config={productDisplay}
						onAddToCart={handleAddToCart}
						theme={storefront.theme}
					/>
				</section>
			</main>
		</div>
	);
}
