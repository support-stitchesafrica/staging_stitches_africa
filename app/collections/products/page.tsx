"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { CollectionProduct } from "@/types/collections";
import { productRepository, collectionRepository } from "@/lib/firestore";
import { getUserProducts } from "@/lib/collections/product-service";
import
	{
		Loader2,
		Grid3x3,
		List,
		Plus,
		Search,
		X,
		SlidersHorizontal,
	} from "lucide-react";
import { ProductCard } from "@/components/collections/products/ProductCard";
import { ProductListItem } from "@/components/collections/products/ProductListItem";
import { CollectionCreationDialog } from "@/components/collections/CollectionCreationDialog";
import { CreateProductDialog } from "@/components/collections/products/CreateProductDialog";
import { useCollectionsAuth } from "@/contexts/CollectionsAuthContext";
import { toast } from "sonner";

type ProductSource = "marketplace" | "my-products";

// Collection Product Card Component
function CollectionProductCard({
	product,
	isSelected,
	onToggleSelection,
}: {
	product: CollectionProduct;
	isSelected: boolean;
	onToggleSelection: (productId: string) => void;
})
{
	const handleClick = () =>
	{
		onToggleSelection(product.id);
	};

	return (
		<div
			onClick={handleClick}
			className={`relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-2 cursor-pointer ${isSelected
					? "border-primary-600 ring-2 ring-primary-100"
					: "border-gray-200 hover:border-gray-300"
				}`}
		>
			{/* Selection Checkbox */}
			<div className="absolute top-2 left-2 z-10">
				<div
					className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
							? "bg-primary-600 border-primary-600"
							: "bg-white border-gray-300 hover:border-primary-400"
						}`}
				>
					{isSelected && <Plus className="w-3 h-3 text-white rotate-45" />}
				</div>
			</div>

			{/* Product Image */}
			<div className="relative aspect-square overflow-hidden bg-gray-100">
				{product.images && product.images.length > 0 ? (
					<img
						src={product.images[0]}
						alt={product.title}
						className="w-full h-full object-cover"
					/>
				) : (
					<div className="w-full h-full flex items-center justify-center text-gray-400">
						No Image
					</div>
				)}
			</div>

			{/* Product Info - Compact */}
			<div className="p-2">
				<h3 className="text-xs font-semibold text-gray-900 line-clamp-1 mb-0.5">
					{product.title}
				</h3>
				<p className="text-[10px] text-gray-500 line-clamp-1 mb-1">
					{product.brandName}
				</p>

				<div className="flex items-center justify-between">
					<span className="text-xs font-bold text-gray-900">
						${product.price.toFixed(2)}
					</span>
					<span className="text-[10px] text-gray-500">
						Qty: {product.quantity}
					</span>
				</div>
			</div>
		</div>
	);
}

// Collection Product List Item Component
function CollectionProductListItem({
	product,
	isSelected,
	onToggleSelection,
}: {
	product: CollectionProduct;
	isSelected: boolean;
	onToggleSelection: (productId: string) => void;
})
{
	const handleClick = () =>
	{
		onToggleSelection(product.id);
	};

	return (
		<div
			onClick={handleClick}
			className={`relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-2 cursor-pointer p-4 ${isSelected
					? "border-primary-600 ring-2 ring-primary-100"
					: "border-gray-200 hover:border-gray-300"
				}`}
		>
			<div className="flex items-center gap-4">
				{/* Selection Checkbox */}
				<div
					className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${isSelected
							? "bg-primary-600 border-primary-600"
							: "bg-white border-gray-300 hover:border-primary-400"
						}`}
				>
					{isSelected && <Plus className="w-3 h-3 text-white rotate-45" />}
				</div>

				{/* Product Image */}
				<div className="relative w-16 h-16 overflow-hidden bg-gray-100 rounded shrink-0">
					{product.images && product.images.length > 0 ? (
						<img
							src={product.images[0]}
							alt={product.title}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
							No Image
						</div>
					)}
				</div>

				{/* Product Info */}
				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-semibold text-gray-900 truncate">
						{product.title}
					</h3>
					<p className="text-xs text-gray-500 truncate">{product.brandName}</p>
					<p className="text-xs text-gray-400 mt-1">
						{product.size} • {product.color}
					</p>
				</div>

				{/* Price and Quantity */}
				<div className="text-right flex-shrink-0">
					<p className="text-sm font-bold text-gray-900">
						${product.price.toFixed(2)}
					</p>
					<p className="text-xs text-gray-500">Qty: {product.quantity}</p>
				</div>
			</div>
		</div>
	);
}

export default function ProductSelectionPage()
{
	const router = useRouter();
	const { user } = useCollectionsAuth();
	const [products, setProducts] = useState<Product[]>([]);
	const [collectionProducts, setCollectionProducts] = useState<
		CollectionProduct[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
		new Set()
	);
	const [activeTab, setActiveTab] = useState<ProductSource>("marketplace");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isCreateProductDialogOpen, setIsCreateProductDialogOpen] =
		useState(false);
	const [isCreating, setIsCreating] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [itemsPerPage] = useState(20);

	// Search and filter states
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedVendors, setSelectedVendors] = useState<Set<string>>(
		new Set()
	);
	const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
		min: 0,
		max: Infinity,
	});
	const [showFilters, setShowFilters] = useState(false);

	useEffect(() =>
	{
		loadProducts();
	}, []);

	useEffect(() =>
	{
		if (activeTab === "my-products" && user?.uid)
		{
			loadCollectionProducts();
		}
	}, [activeTab, user?.uid]);

	const loadProducts = async () =>
	{
		try
		{
			setLoading(true);
			setError(null);
			const fetchedProducts = await productRepository.getAllWithTailorInfo();
			setProducts(fetchedProducts);
		} catch (err)
		{
			console.error("Error loading products:", err);
			setError("Failed to load products. Please try again.");
		} finally
		{
			setLoading(false);
		}
	};

	const loadCollectionProducts = async () =>
	{
		if (!user?.uid) return;

		try
		{
			setLoading(true);
			setError(null);
			const fetchedCollectionProducts = await getUserProducts(user.uid);
			setCollectionProducts(fetchedCollectionProducts);
		} catch (err)
		{
			console.error("Error loading collection products:", err);
			setError("Failed to load your products. Please try again.");
		} finally
		{
			setLoading(false);
		}
	};

	const toggleProductSelection = (productId: string) =>
	{
		setSelectedProducts((prev) =>
		{
			const newSet = new Set(prev);
			if (newSet.has(productId))
			{
				newSet.delete(productId);
			} else
			{
				newSet.add(productId);
			}
			return newSet;
		});
	};

	const selectAll = () =>
	{
		setSelectedProducts(new Set(products.map((p) => p.product_id)));
	};

	const clearSelection = () =>
	{
		setSelectedProducts(new Set());
	};

	// Get unique vendors for filter dropdown (marketplace only)
	const vendors = useMemo(() =>
	{
		const vendorSet = new Set<string>();
		products.forEach((product) =>
		{
			// Check multiple possible fields for vendor name
			const vendorName =
				product.vendor?.name ||
				product.tailor ||
				(product as any).tailor_name ||
				(product as any).vendor_name;

			if (vendorName && vendorName.trim() !== "")
			{
				vendorSet.add(vendorName.trim());
			}
		});
		return Array.from(vendorSet).sort();
	}, [products]);

	// Get unique brands for filter dropdown (collection products only)
	const brands = useMemo(() =>
	{
		const brandSet = new Set<string>();
		collectionProducts.forEach((product) =>
		{
			if (product.brandName)
			{
				brandSet.add(product.brandName);
			}
		});
		return Array.from(brandSet).sort();
	}, [collectionProducts]);

	// Filter and search marketplace products
	const filteredMarketplaceProducts = useMemo(() =>
	{
		return products.filter((product) =>
		{
			const searchLower = searchQuery.toLowerCase();
			// Get vendor name from multiple possible fields
			const vendorName =
				product.vendor?.name ||
				product.tailor ||
				(product as any).tailor_name ||
				(product as any).vendor_name ||
				"";
			const productDescription = product.description || "";
			const productCategory = product.category || "";

			// Enhanced search - search across multiple fields
			const matchesSearch =
				searchQuery === "" ||
				product.title.toLowerCase().includes(searchLower) ||
				vendorName.toLowerCase().includes(searchLower) ||
				productDescription.toLowerCase().includes(searchLower) ||
				productCategory.toLowerCase().includes(searchLower) ||
				product.product_id.toLowerCase().includes(searchLower);

			// Filter by vendor (support multiple selections)
			const matchesVendor =
				selectedVendors.size === 0 ||
				(vendorName && selectedVendors.has(vendorName));

			// Filter by price
			const price = product.price.base || 0;
			const matchesPrice = price >= priceRange.min && price <= priceRange.max;

			return matchesSearch && matchesVendor && matchesPrice;
		});
	}, [products, searchQuery, selectedVendors, priceRange]);

	// Filter and search collection products
	const filteredCollectionProducts = useMemo(() =>
	{
		return collectionProducts.filter((product) =>
		{
			const searchLower = searchQuery.toLowerCase();

			// Enhanced search - search across multiple fields
			const matchesSearch =
				searchQuery === "" ||
				product.title.toLowerCase().includes(searchLower) ||
				product.brandName.toLowerCase().includes(searchLower) ||
				product.description.toLowerCase().includes(searchLower) ||
				product.color.toLowerCase().includes(searchLower) ||
				product.size.toLowerCase().includes(searchLower);

			// Filter by brand (using selectedVendors state for consistency)
			const matchesBrand =
				selectedVendors.size === 0 || selectedVendors.has(product.brandName);

			// Filter by price
			const matchesPrice =
				product.price >= priceRange.min && product.price <= priceRange.max;

			return matchesSearch && matchesBrand && matchesPrice;
		});
	}, [collectionProducts, searchQuery, selectedVendors, priceRange]);

	// Get current filtered products based on active tab
	const filteredProducts =
		activeTab === "marketplace"
			? filteredMarketplaceProducts
			: filteredCollectionProducts;
	const totalProducts =
		activeTab === "marketplace" ? products.length : collectionProducts.length;

	// Reset to first page when filters change
	useEffect(() =>
	{
		setCurrentPage(1);
	}, [searchQuery, selectedVendors, priceRange]);

	const handleCreateCollection = async (name: string) =>
	{
		try
		{
			setIsCreating(true);

			// Validate user is authenticated
			if (!user)
			{
				toast.error("Authentication required", {
					description: "You must be logged in to create a collection.",
				});
				setIsDialogOpen(false);
				return;
			}

			// Create initial canvas state with products
			const canvasState = {
				elements: [],
				backgroundColor: "#ffffff",
				dimensions: { width: 1200, height: 800 },
			};

			// Prepare product IDs with source information
			// Store as "source:id" format to distinguish between marketplace and collection products
			const productIdsWithSource = Array.from(selectedProducts).map((id) =>
			{
				// Check if this ID belongs to a collection product
				const isCollectionProduct = collectionProducts.some((p) => p.id === id);
				return isCollectionProduct ? `collection:${id}` : `marketplace:${id}`;
			});

			// Create collection
			const collectionId = await collectionRepository.create({
				name,
				productIds: productIdsWithSource,
				canvasState,
				thumbnail: "",
				createdBy: user.uid,
			});

			// Show success message
			toast.success("Collection created!", {
				description: `"${name}" has been created successfully.`,
			});

			// Close dialog and redirect to banner configuration
			setIsDialogOpen(false);
			router.push(`/collections/${collectionId}/banner`);
		} catch (err)
		{
			console.error("Error creating collection:", err);
			const errorMessage = "Failed to create collection. Please try again.";
			setError(errorMessage);
			toast.error("Creation failed", {
				description: errorMessage,
			});
		} finally
		{
			setIsCreating(false);
		}
	};

	if (loading)
	{
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
					<p className="text-gray-600">Loading products...</p>
				</div>
			</div>
		);
	}

	if (error)
	{
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center max-w-md">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<p className="text-red-800 mb-4">{error}</p>
						<button
							onClick={loadProducts}
							className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">
					Select Products
				</h1>
				<p className="text-gray-600">
					Choose products to add to your collection
				</p>
			</div>

			{/* Product Source Tabs */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
				<div className="flex border-b border-gray-200">
					<button
						onClick={() =>
						{
							setActiveTab("marketplace");
							setCurrentPage(1);
						}}
						className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === "marketplace"
								? "text-primary-700 border-b-2 border-primary-700 bg-primary-50"
								: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
							}`}
					>
						Marketplace Products
						<span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
							{products.length}
						</span>
					</button>
					<button
						onClick={() =>
						{
							setActiveTab("my-products");
							setCurrentPage(1);
						}}
						className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${activeTab === "my-products"
								? "text-primary-700 border-b-2 border-primary-700 bg-primary-50"
								: "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
							}`}
					>
						My Products
						<span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
							{collectionProducts.length}
						</span>
					</button>
				</div>
			</div>

			{/* Search and Filters */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
				<div className="flex flex-col md:flex-row gap-4">
					{/* Search */}
					<div className="flex-1 relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
						<input
							type="text"
							placeholder="Search by name, vendor, category, or description..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
						/>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							>
								<X className="w-5 h-5" />
							</button>
						)}
					</div>

					{/* Filter Toggle Button */}
					<button
						onClick={() => setShowFilters(!showFilters)}
						className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters
								? "bg-primary-50 border-primary-500 text-primary-700"
								: "border-gray-300 text-gray-700 hover:bg-gray-50"
							}`}
					>
						<SlidersHorizontal className="w-5 h-5" />
						Filters
						{(selectedVendors.size > 0 ||
							priceRange.min > 0 ||
							priceRange.max < Infinity) && (
								<span className="ml-1 px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
									{
										[
											selectedVendors.size > 0,
											priceRange.min > 0,
											priceRange.max < Infinity,
										].filter(Boolean).length
									}
								</span>
							)}
					</button>
				</div>

				{/* Filter Panel */}
				{showFilters && (
					<div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Vendor/Brand Filter - Multi-select with checkboxes */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								{activeTab === "marketplace" ? "Vendors" : "Brands"}
								{selectedVendors.size > 0 && (
									<span className="ml-2 text-xs text-gray-500">
										({selectedVendors.size} selected)
									</span>
								)}
							</label>
							<div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-white">
								{(activeTab === "marketplace" ? vendors : brands).length ===
									0 ? (
									<p className="text-sm text-gray-500 py-2 text-center">
										No {activeTab === "marketplace" ? "vendors" : "brands"}{" "}
										available
									</p>
								) : (
									<>
										{/* Select All / Deselect All */}
										<div className="mb-2 pb-2 border-b border-gray-200">
											<label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
												<input
													type="checkbox"
													checked={
														selectedVendors.size ===
														(activeTab === "marketplace"
															? vendors.length
															: brands.length) &&
														(activeTab === "marketplace"
															? vendors.length
															: brands.length) > 0
													}
													onChange={(e) =>
													{
														if (e.target.checked)
														{
															setSelectedVendors(
																new Set(
																	activeTab === "marketplace" ? vendors : brands
																)
															);
														} else
														{
															setSelectedVendors(new Set());
														}
													}}
													className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
												/>
												<span className="text-sm font-medium text-gray-700">
													{selectedVendors.size ===
														(activeTab === "marketplace"
															? vendors.length
															: brands.length) &&
														(activeTab === "marketplace"
															? vendors.length
															: brands.length) > 0
														? "Deselect All"
														: "Select All"}
												</span>
											</label>
										</div>
										{/* Vendor/Brand Checkboxes */}
										{(activeTab === "marketplace" ? vendors : brands).map(
											(item) => (
												<label
													key={item}
													className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
												>
													<input
														type="checkbox"
														checked={selectedVendors.has(item)}
														onChange={(e) =>
														{
															const newSet = new Set(selectedVendors);
															if (e.target.checked)
															{
																newSet.add(item);
															} else
															{
																newSet.delete(item);
															}
															setSelectedVendors(newSet);
														}}
														className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
													/>
													<span className="text-sm text-gray-700">{item}</span>
												</label>
											)
										)}
									</>
								)}
							</div>
						</div>

						{/* Price Range Filter */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Price Range
							</label>
							<div className="flex items-center gap-2">
								<input
									type="number"
									placeholder="Min"
									value={priceRange.min === 0 ? "" : priceRange.min}
									onChange={(e) =>
										setPriceRange((prev) => ({
											...prev,
											min: parseFloat(e.target.value) || 0,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
								<span className="text-gray-500">-</span>
								<input
									type="number"
									placeholder="Max"
									value={priceRange.max === Infinity ? "" : priceRange.max}
									onChange={(e) =>
										setPriceRange((prev) => ({
											...prev,
											max: parseFloat(e.target.value) || Infinity,
										}))
									}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
								/>
							</div>
						</div>

						{/* Clear Filters */}
						{(selectedVendors.size > 0 ||
							priceRange.min > 0 ||
							priceRange.max < Infinity) && (
								<div className="md:col-span-2">
									<button
										onClick={() =>
										{
											setSelectedVendors(new Set());
											setPriceRange({ min: 0, max: Infinity });
										}}
										className="text-sm text-primary-600 hover:text-primary-700 font-medium"
									>
										Clear all filters
									</button>
								</div>
							)}
					</div>
				)}
			</div>

			{/* Toolbar */}
			<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
				<div className="flex items-center justify-between flex-wrap gap-4">
					{/* Selection Info */}
					<div className="flex items-center gap-4">
						<span className="text-sm font-medium text-gray-700">
							{selectedProducts.size} of {filteredProducts.length} selected
							{filteredProducts.length !== totalProducts && (
								<span className="text-gray-500"> ({totalProducts} total)</span>
							)}
						</span>
						<div className="flex gap-2">
							<button
								onClick={() =>
								{
									const ids =
										activeTab === "marketplace"
											? filteredProducts.map((p: any) => p.product_id)
											: filteredProducts.map((p: any) => p.id);
									setSelectedProducts(new Set(ids));
								}}
								className="text-sm text-primary-600 hover:text-primary-700 font-medium"
							>
								Select All
							</button>
							<span className="text-gray-300">|</span>
							<button
								onClick={clearSelection}
								className="text-sm text-gray-600 hover:text-gray-700 font-medium"
								disabled={selectedProducts.size === 0}
							>
								Clear Selection
							</button>
						</div>
					</div>

					{/* Actions */}
					<div className="flex items-center gap-2">
						{/* Create Product Button */}
						<button
							onClick={() => setIsCreateProductDialogOpen(true)}
							className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
						>
							<Plus className="w-4 h-4" />
							Create Product
						</button>

						{/* View Toggle */}
						<div className="flex items-center gap-2 ml-2">
							<button
								onClick={() => setViewMode("grid")}
								className={`p-2 rounded-lg transition-colors ${viewMode === "grid"
										? "bg-primary-100 text-primary-700"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								title="Grid View"
							>
								<Grid3x3 className="w-5 h-5" />
							</button>
							<button
								onClick={() => setViewMode("list")}
								className={`p-2 rounded-lg transition-colors ${viewMode === "list"
										? "bg-primary-100 text-primary-700"
										: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								title="List View"
							>
								<List className="w-5 h-5" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* No Results Message */}
			{filteredProducts.length === 0 && (
				<div className="text-center py-12">
					<p className="text-gray-500 mb-4">
						No products found matching your criteria
					</p>
					<button
						onClick={() =>
						{
							setSearchQuery("");
							setSelectedVendors(new Set());
							setPriceRange({ min: 0, max: Infinity });
						}}
						className="text-primary-600 hover:text-primary-700 font-medium"
					>
						Clear all filters
					</button>
				</div>
			)}

			{/* Products Grid/List */}
			{filteredProducts.length > 0 && (
				<>
					{activeTab === "marketplace" ? (
						viewMode === "grid" ? (
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
								{(filteredProducts as Product[])
									.slice(
										(currentPage - 1) * itemsPerPage,
										currentPage * itemsPerPage
									)
									.map((product) => (
										<ProductCard
											key={product.product_id}
											product={product}
											isSelected={selectedProducts.has(product.product_id)}
											onToggleSelection={toggleProductSelection}
										/>
									))}
							</div>
						) : (
							<div className="space-y-2">
								{(filteredProducts as Product[])
									.slice(
										(currentPage - 1) * itemsPerPage,
										currentPage * itemsPerPage
									)
									.map((product) => (
										<ProductListItem
											key={product.product_id}
											product={product}
											isSelected={selectedProducts.has(product.product_id)}
											onToggleSelection={toggleProductSelection}
										/>
									))}
							</div>
						)
					) : viewMode === "grid" ? (
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
							{(filteredProducts as CollectionProduct[])
								.slice(
									(currentPage - 1) * itemsPerPage,
									currentPage * itemsPerPage
								)
								.map((product) => (
									<CollectionProductCard
										key={product.id}
										product={product}
										isSelected={selectedProducts.has(product.id)}
										onToggleSelection={toggleProductSelection}
									/>
								))}
						</div>
					) : (
						<div className="space-y-2">
							{(filteredProducts as CollectionProduct[])
								.slice(
									(currentPage - 1) * itemsPerPage,
									currentPage * itemsPerPage
								)
								.map((product) => (
									<CollectionProductListItem
										key={product.id}
										product={product}
										isSelected={selectedProducts.has(product.id)}
										onToggleSelection={toggleProductSelection}
									/>
								))}
						</div>
					)}

					{/* Pagination */}
					{filteredProducts.length > itemsPerPage && (
						<div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
							<button
								onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
								disabled={currentPage === 1}
								className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
							>
								Previous
							</button>

							<div className="flex items-center gap-2">
								{Array.from(
									{ length: Math.ceil(filteredProducts.length / itemsPerPage) },
									(_, i) => i + 1
								)
									.filter((page) =>
									{
										// Show first page, last page, current page, and pages around current
										const totalPages = Math.ceil(
											filteredProducts.length / itemsPerPage
										);
										return (
											page === 1 ||
											page === totalPages ||
											Math.abs(page - currentPage) <= 1
										);
									})
									.map((page, index, array) => (
										<React.Fragment key={page}>
											{index > 0 && array[index - 1] !== page - 1 && (
												<span className="px-2 text-gray-600 font-bold">
													...
												</span>
											)}
											<button
												onClick={() => setCurrentPage(page)}
												className={`min-w-[44px] px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm ${currentPage === page
														? "bg-black text-white shadow-md"
														: "bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
													}`}
											>
												{page}
											</button>
										</React.Fragment>
									))}
							</div>

							<button
								onClick={() =>
									setCurrentPage((p) =>
										Math.min(
											Math.ceil(filteredProducts.length / itemsPerPage),
											p + 1
										)
									)
								}
								disabled={
									currentPage ===
									Math.ceil(filteredProducts.length / itemsPerPage)
								}
								className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
							>
								Next
							</button>
						</div>
					)}
				</>
			)}

			{/* Add to Collection Button */}
			{selectedProducts.size > 0 && (
				<div className="fixed bottom-8 right-8 z-50">
					<button
						onClick={() => setIsDialogOpen(true)}
						disabled={isCreating}
						className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg shadow-2xl hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
					>
						{isCreating ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Creating...
							</>
						) : (
							<>
								<Plus className="w-5 h-5" />
								Add to Collection ({selectedProducts.size})
							</>
						)}
					</button>
				</div>
			)}

			{/* Collection Creation Dialog */}
			<CollectionCreationDialog
				isOpen={isDialogOpen}
				onClose={() => setIsDialogOpen(false)}
				onSubmit={handleCreateCollection}
				selectedCount={selectedProducts.size}
			/>

			{/* Create Product Dialog */}
			<CreateProductDialog
				isOpen={isCreateProductDialogOpen}
				onClose={() => setIsCreateProductDialogOpen(false)}
				onSuccess={(productIds) =>
				{
					toast.success("Products created successfully!", {
						description: `${productIds.length} product${productIds.length > 1 ? "s" : ""
							} created`,
					});
					// Refresh collection products
					if (user?.uid)
					{
						loadCollectionProducts();
					}
					// Switch to My Products tab
					setActiveTab("my-products");
				}}
			/>
		</div>
	);
}
