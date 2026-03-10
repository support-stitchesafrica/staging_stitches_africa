"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Product } from "@/types";
import { TrendingSection } from "@/components/home/TrendingSection";
import { FarfetchProductCard } from "@/components/home/FarfetchProductCard";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Dynamic import for AI Recommended Products to save bundle size
const AIRecommendedProducts = dynamic(
	() =>
		import("@/components/home/AIRecommendedProducts").then((mod) => ({
			default: mod.AIRecommendedProducts,
		})),
	{
		ssr: false,
		loading: () => <div className="h-32 bg-gray-50 animate-pulse" />,
	},
);

// Dynamic import for Collection Waitlists
const CollectionWaitlists = dynamic(
	() =>
		import("@/components/home/CollectionWaitlists").then((mod) => ({
			default: mod.CollectionWaitlists,
		})),
	{
		ssr: false,
		loading: () => <div className="h-64 bg-gray-50 animate-pulse" />,
	},
);

interface ShopSectionTabsProps {
	newArrivals: Product[];
	discountedProducts: Product[];
	wishlistItems: Set<string>;
	onWishlistToggle: (id: string) => void;
	loading: boolean;
}

export const ShopSectionTabs = ({
	newArrivals,
	discountedProducts,
	wishlistItems,
	onWishlistToggle,
	loading,
}: ShopSectionTabsProps) => {
	const { t } = useLanguage();
	const [activeTab, setActiveTab] = useState<
		"trending" | "new-in" | "sale" | "waitlists" | "recommended"
	>("trending");

	const tabs = [
		{ id: "trending", label: t.home.tabs.trending },
		{ id: "new-in", label: t.home.tabs.newIn },
		{ id: "sale", label: t.home.tabs.sale },
		{ id: "waitlists", label: t.home.tabs.waitlists },
		{ id: "recommended", label: t.home.tabs.recommended },
	] as const;

	return (
		<div className="w-full">
			{/* Tabs Header */}
			<div className="sticky top-[60px] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
				<div className="container mx-auto px-4">
					<div className="flex items-center justify-center space-x-6 md:space-x-12 overflow-x-auto no-scrollbar py-4">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`whitespace-nowrap text-sm !border-none !bg-white !text-black font-medium transition-colors relative pb-2 ${
									activeTab === tab.id
										? "!text-black"
										: "text-gray-500 hover:text-black"
								}`}
							>
								{tab.label}
								{activeTab === tab.id && (
									<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
								)}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Tab Content */}
			<div className="min-h-[400px]">
				{activeTab === "trending" && (
					<TrendingSection
						onWishlistToggle={onWishlistToggle}
						wishlistItems={wishlistItems}
					/>
				)}

				{activeTab === "new-in" && (
					<section className="py-8">
						<div className="container mx-auto px-4">
							<div className="text-center mb-8">
								<h2 className="text-2xl font-light mb-2">
									{t.home.sections.newArrivals}
								</h2>
								<p className="text-gray-600">
									{t.home.sections.newArrivalsSubtitle}
								</p>
							</div>

							{loading ? (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
									{Array.from({ length: 8 }).map((_, i) => (
										<ProductCardSkeleton key={i} />
									))}
								</div>
							) : (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
									{newArrivals.slice(0, 12).map((product) => (
										<FarfetchProductCard
											key={product.product_id}
											product={product}
											onWishlistToggle={onWishlistToggle}
											isInWishlist={wishlistItems.has(product.product_id)}
										/>
									))}
								</div>
							)}
						</div>
					</section>
				)}

				{activeTab === "sale" && (
					<section className="py-8">
						<div className="container mx-auto px-4">
							<div className="text-center mb-8">
								<h2 className="text-2xl font-light mb-2">
									{t.home.sections.sale}
								</h2>
								<p className="text-gray-600">{t.home.sections.saleSubtitle}</p>
							</div>

							{loading ? (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
									{Array.from({ length: 8 }).map((_, i) => (
										<ProductCardSkeleton key={i} />
									))}
								</div>
							) : discountedProducts.length > 0 ? (
								<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
									{discountedProducts.map((product) => (
										<FarfetchProductCard
											key={product.product_id}
											product={product}
											onWishlistToggle={onWishlistToggle}
											isInWishlist={wishlistItems.has(product.product_id)}
										/>
									))}
								</div>
							) : (
								<div className="text-center py-12">
									<p className="text-gray-500">{t.home.sections.noSaleItems}</p>
								</div>
							)}
						</div>
					</section>
				)}

				{activeTab === "waitlists" && <CollectionWaitlists />}

				{activeTab === "recommended" && (
					<div className="py-4">
						<AIRecommendedProducts
							title={t.home.sections.aiRecommended}
							subtitle={t.home.sections.aiSubtitle}
						/>
					</div>
				)}
			</div>
		</div>
	);
};
