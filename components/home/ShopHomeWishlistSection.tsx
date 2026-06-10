"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { productRepository } from "@/lib/firestore";
import { Product } from "@/types";
import { FarfetchProductCard } from "@/components/home/FarfetchProductCard";
import { ProductCardSkeleton } from "@/components/ui/optimized-loader";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface ShopHomeWishlistSectionProps {
	wishlistItems: Set<string>;
	onWishlistToggle: (id: string) => void;
}

export function ShopHomeWishlistSection({
	wishlistItems,
	onWishlistToggle,
}: ShopHomeWishlistSectionProps)
{
	const { user } = useAuth();
	const { items, loading: wishlistLoading } = useWishlist();
	const { t } = useLanguage();
	const [products, setProducts] = useState<Product[]>([]);
	const [loadingProducts, setLoadingProducts] = useState(false);

	const loadProducts = useCallback(async () =>
	{
		if (items.length === 0)
		{
			setProducts([]);
			return;
		}

		setLoadingProducts(true);
		try
		{
			const results = await Promise.all(
				items.map((item) =>
					productRepository.getByIdWithTailorInfo(item.product_id)
				),
			);
			const byId = new Map<string, Product>();
			results.forEach((p) =>
			{
				if (p) byId.set(p.product_id, p);
			});
			const ordered = items
				.map((item) => byId.get(item.product_id))
				.filter((p): p is Product => p != null);
			setProducts(ordered);
		} catch (e)
		{
			console.error("ShopHomeWishlistSection:", e);
			setProducts([]);
		} finally
		{
			setLoadingProducts(false);
		}
	}, [items]);

	useEffect(() =>
	{
		void loadProducts();
	}, [loadProducts]);

	const showSkeleton = useMemo(
		() => user && (wishlistLoading || loadingProducts),
		[user, wishlistLoading, loadingProducts],
	);

	if (!user)
	{
		return (
			<section className="py-8 pb-4">
				<div className="container mx-auto px-4">
					<div className="text-center mb-8">
						<h2 className="text-2xl font-light mb-2">
							{t.home.sections.wishlistTitle}
						</h2>
						<p className="text-gray-600 text-sm max-w-lg mx-auto">
							{t.home.sections.wishlistSignIn}
						</p>
					</div>
					<div className="flex flex-col items-center justify-center py-10 rounded-lg border border-dashed border-gray-200 bg-gray-50/80">
						<Heart className="h-12 w-12 text-gray-300 mb-3" />
						<Link
							href="/shops/wishlist"
							className="text-sm font-medium text-gray-900 underline underline-offset-4 hover:no-underline"
						>
							{t.header.wishlist}
						</Link>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="py-8 pb-4">
			<div className="container mx-auto px-4">
				<div className="text-center mb-8">
					<h2 className="text-2xl font-light mb-2">
						{t.home.sections.wishlistTitle}
					</h2>
					<p className="text-gray-600">{t.home.sections.wishlistSubtitle}</p>
				</div>

				{showSkeleton ? (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{Array.from({ length: 8 }).map((_, i) => (
							<ProductCardSkeleton key={i} />
						))}
					</div>
				) : items.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<Heart className="h-12 w-12 text-gray-300 mb-4" />
						<p className="text-gray-600 max-w-md mb-6">
							{t.home.sections.wishlistEmpty}
						</p>
						<Link
							href="/shops"
							className="text-sm font-medium text-gray-900 underline underline-offset-4"
						>
							{t.home.hero.shopNow}
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
						{products.map((product) => (
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
	);
}
