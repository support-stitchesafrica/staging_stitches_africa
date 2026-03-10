"use client";

import { useState, useMemo } from "react";
import { Product } from "@/types";
import { CollectionProductCard } from "./CollectionProductCard";
import {
	Search,
	SlidersHorizontal,
	ShoppingCart,
	CheckSquare,
	Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCollectionsTracking } from "@/hooks/useCollectionsTracking";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface CollectionProductsGridProps {
	products: Product[];
	collectionId: string;
	collectionName: string;
	className?: string;
}

type SortOption = "default" | "price-asc" | "price-desc" | "name";

export function CollectionProductsGrid({
	products,
	collectionId,
	collectionName,
	className,
}: CollectionProductsGridProps) {
	const router = useRouter();
	const { addCollectionToCart } = useCart();
	const { user } = useAuth();
	const { t } = useLanguage();
	const { trackAddToCart } = useCollectionsTracking();
	const [searchQuery, setSearchQuery] = useState("");
	const [sortBy, setSortBy] = useState<SortOption>("default");
	const [selectedCategory, setSelectedCategory] = useState<string>("all");
	const [selectedVendor, setSelectedVendor] = useState<string>("all");
	const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
		new Set(),
	);
	const [isAddingAll, setIsAddingAll] = useState(false);
	const [addingProducts, setAddingProducts] = useState<Set<string>>(new Set());

	// Get unique categories
	const categories = useMemo(() => {
		const cats = new Set(products.map((p) => p.category).filter(Boolean));
		return ["all", ...Array.from(cats)];
	}, [products]);

	// Get unique vendors
	const vendors = useMemo(() => {
		const vendorNames = new Set(
			products.map((p) => p.vendor?.name || p.tailor || "").filter(Boolean),
		);
		return ["all", ...Array.from(vendorNames)];
	}, [products]);

	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let filtered = [...products];

		// Search filter
		if (searchQuery) {
			filtered = filtered.filter(
				(product) =>
					product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
					(product.vendor?.name || product.tailor || "")
						.toLowerCase()
						.includes(searchQuery.toLowerCase()),
			);
		}

		// Category filter
		if (selectedCategory !== "all") {
			filtered = filtered.filter(
				(product) => product.category === selectedCategory,
			);
		}

		// Vendor filter
		if (selectedVendor !== "all") {
			filtered = filtered.filter(
				(product) =>
					(product.vendor?.name || product.tailor || "") === selectedVendor,
			);
		}

		// Sort
		switch (sortBy) {
			case "price-asc":
				filtered.sort((a, b) => {
					const priceA = typeof a.price === "number" ? a.price : a.price.base;
					const priceB = typeof b.price === "number" ? b.price : b.price.base;
					return priceA - priceB;
				});
				break;
			case "price-desc":
				filtered.sort((a, b) => {
					const priceA = typeof a.price === "number" ? a.price : a.price.base;
					const priceB = typeof b.price === "number" ? b.price : b.price.base;
					return priceB - priceA;
				});
				break;
			case "name":
				filtered.sort((a, b) => a.title.localeCompare(b.title));
				break;
			default:
				// Keep default order
				break;
		}

		return filtered;
	}, [products, searchQuery, selectedCategory, selectedVendor, sortBy]);

	// Toggle product selection
	const toggleProductSelection = (productId: string) => {
		setSelectedProducts((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(productId)) {
				newSet.delete(productId);
			} else {
				newSet.add(productId);
			}
			return newSet;
		});
	};

	// Select all products
	const selectAll = () => {
		if (selectedProducts.size === filteredProducts.length) {
			setSelectedProducts(new Set());
		} else {
			setSelectedProducts(new Set(filteredProducts.map((p) => p.product_id)));
		}
	};

	// Add selected products to cart
	const handleAddSelected = async () => {
		if (selectedProducts.size === 0) {
			toast.info(t.collectionGrid.selectOne);
			return;
		}

		const productsToAdd = filteredProducts.filter((p) =>
			selectedProducts.has(p.product_id),
		);

		if (productsToAdd.length === 0) {
			toast.error(t.collectionGrid.noProductsSelected);
			return;
		}

		setIsAddingAll(true);
		try {
			// Track bulk add to cart events
			for (const product of productsToAdd) {
				const basePrice =
					typeof product.price === "number"
						? product.price
						: product.price.base;
				const discountedPrice =
					product.discount > 0
						? basePrice * (1 - product.discount / 100)
						: basePrice;

				await trackAddToCart(
					collectionId,
					collectionName,
					product.product_id,
					product.title,
					discountedPrice,
					1,
					{
						bulkAdd: true,
						bulkCount: productsToAdd.length,
						originalPrice: basePrice,
						hasDiscount: product.discount > 0,
						discount: product.discount,
						category: product.category,
						vendor: product.vendor?.name || product.tailor,
					},
				);
			}

			await addCollectionToCart(collectionId, collectionName, productsToAdd);
			toast.success(
				`Added ${productsToAdd.length} ${productsToAdd.length === 1 ? "item" : "items"} to cart`,
			); // Can optimize pluralization later if needed, or use generic message
			setSelectedProducts(new Set());
		} catch (error: any) {
			console.error("Error adding products to cart:", error);
			toast.error(error?.message || t.collectionGrid.failedToAddProducts);
		} finally {
			setIsAddingAll(false);
		}
	};

	// Add all products to cart
	const handleAddAll = async () => {
		if (filteredProducts.length === 0) {
			toast.error(t.collectionGrid.noProductsFound);
			return;
		}

		setIsAddingAll(true);
		try {
			// Track bulk add all to cart events
			for (const product of filteredProducts) {
				const basePrice =
					typeof product.price === "number"
						? product.price
						: product.price.base;
				const discountedPrice =
					product.discount > 0
						? basePrice * (1 - product.discount / 100)
						: basePrice;

				await trackAddToCart(
					collectionId,
					collectionName,
					product.product_id,
					product.title,
					discountedPrice,
					1,
					{
						bulkAddAll: true,
						bulkCount: filteredProducts.length,
						originalPrice: basePrice,
						hasDiscount: product.discount > 0,
						discount: product.discount,
						category: product.category,
						vendor: product.vendor?.name || product.tailor,
					},
				);
			}

			await addCollectionToCart(collectionId, collectionName, filteredProducts);
			toast.success(
				`Added all ${filteredProducts.length} ${filteredProducts.length === 1 ? "item" : "items"} to cart`,
			);
		} catch (error: any) {
			console.error("Error adding all products to cart:", error);
			toast.error(error?.message || t.collectionGrid.failedToAddProducts);
		} finally {
			setIsAddingAll(false);
		}
	};

	// Add individual product to cart
	const handleAddIndividual = async (product: Product) => {
		setAddingProducts((prev) => new Set(prev).add(product.product_id));
		try {
			// Track individual add to cart event
			const basePrice =
				typeof product.price === "number" ? product.price : product.price.base;
			const discountedPrice =
				product.discount > 0
					? basePrice * (1 - product.discount / 100)
					: basePrice;

			await trackAddToCart(
				collectionId,
				collectionName,
				product.product_id,
				product.title,
				discountedPrice,
				1,
				{
					individualAdd: true,
					originalPrice: basePrice,
					hasDiscount: product.discount > 0,
					discount: product.discount,
					category: product.category,
					vendor: product.vendor?.name || product.tailor,
				},
			);

			await addCollectionToCart(collectionId, collectionName, [product]);
			toast.success(t.collectionGrid.addedToCart);
		} catch (error: any) {
			console.error("Error adding product to cart:", error);
			toast.error(error?.message || t.collectionGrid.failedToAddProduct);
		} finally {
			setAddingProducts((prev) => {
				const newSet = new Set(prev);
				newSet.delete(product.product_id);
				return newSet;
			});
		}
	};

	// Add individual item from multiple pricing product to cart
	const handleAddIndividualItem = async (product: Product, item: any) => {
		setAddingProducts((prev) => new Set(prev).add(product.product_id));
		try {
			// Track individual item add to cart event
			await trackAddToCart(
				collectionId,
				collectionName,
				product.product_id,
				`${product.title} - ${item.name}`,
				item.price,
				1,
				{
					individualItemAdd: true,
					originalPrice: item.price,
					hasDiscount: false,
					discount: 0,
					category: product.category,
					vendor: product.vendor?.name || product.tailor,
					itemName: item.name,
				},
			);

			// Create a modified product for the individual item
			const itemProduct = {
				...product,
				title: `${product.title} - ${item.name}`,
				price: item.price,
				product_id: `${product.product_id}_${item.id}`,
			};

			await addCollectionToCart(collectionId, collectionName, [itemProduct]);
			toast.success(`Added ${item.name} to cart`);
		} catch (error: any) {
			console.error("Error adding individual item to cart:", error);
			toast.error(error?.message || t.collectionGrid.failedToAddProduct);
		} finally {
			setAddingProducts((prev) => {
				const newSet = new Set(prev);
				newSet.delete(product.product_id);
				return newSet;
			});
		}
	};

	const allSelected =
		selectedProducts.size === filteredProducts.length &&
		filteredProducts.length > 0;
	const someSelected =
		selectedProducts.size > 0 &&
		selectedProducts.size < filteredProducts.length;

	return (
		<div className={cn("space-y-6", className)}>
			{/* Filters and Search */}
			<div className="flex flex-col sm:flex-row gap-4">
				{/* Search */}
				<div className="flex-1 relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						placeholder={t.collectionGrid.searchPlaceholder}
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-black"
					/>
				</div>

				{/* Vendor Filter Dropdown */}
				{vendors.length > 1 && (
					<div className="sm:w-48">
						<select
							value={selectedVendor}
							onChange={(e) => setSelectedVendor(e.target.value)}
							className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white cursor-pointer text-black"
						>
							<option value="all">{t.collectionGrid.allVendors}</option>
							{vendors
								.filter((v) => v !== "all")
								.map((vendor) => (
									<option key={vendor} value={vendor}>
										{vendor}
									</option>
								))}
						</select>
					</div>
				)}

				{/* Sort */}
				<div className="sm:w-48">
					<div className="relative">
						<SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value as SortOption)}
							className="w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent appearance-none bg-white cursor-pointer text-black"
						>
							<option value="default">{t.collectionGrid.defaultSort}</option>
							<option value="price-asc">{t.collectionGrid.priceAsc}</option>
							<option value="price-desc">{t.collectionGrid.priceDesc}</option>
							<option value="name">{t.collectionGrid.nameAsc}</option>
						</select>
					</div>
				</div>
			</div>

			{/* Category Filter */}
			{categories.length > 2 && (
				<div className="flex flex-wrap gap-2">
					{categories.map((category) => (
						<button
							key={category}
							onClick={() => setSelectedCategory(category)}
							className={cn(
								"px-4 py-2 rounded-lg font-medium text-sm transition-colors",
								selectedCategory === category
									? "bg-black text-white"
									: "bg-gray-100 text-black hover:bg-gray-200",
							)}
						>
							{category === "all"
								? t.collectionGrid.allCategories
								: t.categories[
										category.toLowerCase() as keyof typeof t.categories
									] || category}
						</button>
					))}
				</div>
			)}

			{/* Action Bar */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
				<div className="flex items-center gap-4">
					<button
						onClick={selectAll}
						className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-black transition-colors"
					>
						{allSelected ? (
							<CheckSquare className="w-5 h-5 text-black" />
						) : someSelected ? (
							<div className="w-5 h-5 border-2 border-black rounded" />
						) : (
							<Square className="w-5 h-5 text-gray-400" />
						)}
						<span>
							{allSelected
								? t.collectionGrid.deselectAll
								: t.collectionGrid.selectAll}
						</span>
					</button>
					{selectedProducts.size > 0 && (
						<span className="text-sm text-gray-600">
							{selectedProducts.size}{" "}
							{selectedProducts.size === 1
								? t.collectionGrid.itemSelected
								: t.collectionGrid.itemsSelected}
						</span>
					)}
				</div>

				<div className="flex gap-2">
					{selectedProducts.size > 0 && (
						<button
							onClick={handleAddSelected}
							disabled={isAddingAll}
							className="flex items-center gap-2 px-6 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<ShoppingCart className="w-4 h-4" />
							{isAddingAll
								? t.collectionGrid.adding
								: `${t.collectionGrid.addSelected} (${selectedProducts.size})`}
						</button>
					)}
					<button
						onClick={handleAddAll}
						disabled={isAddingAll}
						className="flex items-center gap-2 px-6 py-2 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<ShoppingCart className="w-4 h-4" />
						{isAddingAll
							? t.collectionGrid.adding
							: t.collectionGrid.addAllToCart}
					</button>
				</div>
			</div>

			{/* Results Count */}
			<div className="flex items-center justify-between">
				<p className="text-sm text-gray-900 font-medium">
					{filteredProducts.length}{" "}
					{filteredProducts.length === 1
						? t.collectionGrid.productFound
						: t.collectionGrid.productsFound}
				</p>
			</div>

			{/* Products Grid */}
			{filteredProducts.length > 0 ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredProducts.map((product) => (
						<CollectionProductCard
							key={product.product_id}
							product={product}
							collectionId={collectionId}
							collectionName={collectionName}
							isSelected={selectedProducts.has(product.product_id)}
							onToggleSelect={() => toggleProductSelection(product.product_id)}
							onAddToCart={() => handleAddIndividual(product)}
							onAddIndividualItem={handleAddIndividualItem}
							isAdding={addingProducts.has(product.product_id)}
						/>
					))}
				</div>
			) : (
				<div className="text-center py-16">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
						<Search className="w-8 h-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						{t.collectionGrid.noProductsFound}
					</h3>
					<p className="text-gray-600">{t.collectionGrid.tryAdjustingFilter}</p>
				</div>
			)}
		</div>
	);
}
