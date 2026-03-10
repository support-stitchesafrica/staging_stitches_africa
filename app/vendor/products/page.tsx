"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { ProductAnalyticsCard } from "@/components/vendor/products/ProductAnalyticsCard";
import {
	Search,
	Plus,
	Filter,
	Grid3X3,
	List,
	Eye,
	MoreHorizontal,
	Package,
	Star,
	TrendingUp,
	Edit,
	Trash2,
	Copy,
	ExternalLink,
	Heart,
	BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { getTailorWorks } from "@/vendor-services/getTailorWorks";
import { TailorWork } from "@/vendor-services/types";
import { toast } from "sonner";
import { getBatchProductWishlistCounts } from "@/vendor-services/getWishlistCounts";
import { debugWishlistStructure } from "@/vendor-services/debugWishlist";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ProductAnalytics } from "@/types/vendor-analytics";

const ITEMS_PER_PAGE = 12;

const getStatusColor = (status: boolean) =>
	status
		? "bg-emerald-50 text-emerald-700 border-emerald-200"
		: "bg-amber-50 text-amber-700 border-amber-200";

export default function ModernProducts() {
	const [products, setProducts] = useState<TailorWork[]>([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState("newest");
	const [filterCategory, setFilterCategory] = useState("all");
	const [loading, setLoading] = useState(true);
	const [wishlistCounts, setWishlistCounts] = useState<Map<string, number>>(
		new Map()
	);
	const [activeTab, setActiveTab] = useState<"products" | "analytics">(
		"products"
	);
	const [productAnalytics, setProductAnalytics] = useState<ProductAnalytics[]>(
		[]
	);
	const [analyticsCache, setAnalyticsCache] = useState<
		Map<string, ProductAnalytics>
	>(new Map());
	const [visibleAnalyticsCount, setVisibleAnalyticsCount] =
		useState(ITEMS_PER_PAGE);
	const observerTarget = useRef<HTMLDivElement>(null);

	const router = useRouter();

	// Make debug function available in browser console
	useEffect(() => {
		if (typeof window !== "undefined") {
			(window as any).debugWishlist = debugWishlistStructure;
			console.log(
				"🐛 Debug function loaded! Run 'debugWishlist()' in console to inspect wishlist data"
			);
		}
	}, []);

	useEffect(() => {
		const fetchWorks = async () => {
			setLoading(true);
			const result = await getTailorWorks();
			if (result.success) {
				const productsData = result.data || [];
				setProducts(productsData);

				// Fetch wishlist counts for all products
				if (productsData.length > 0) {
					console.log("📦 Fetching wishlist counts for products...");
					const productRefs = productsData
						.filter((p) => p.product_id && p.tailor_id)
						.map((p) => ({
							product_id: p.product_id!,
							tailor_id: p.tailor_id!,
						}));
					console.log("📦 Product refs:", productRefs);
					const counts = await getBatchProductWishlistCounts(productRefs);
					console.log("📊 Received wishlist counts:", counts);
					setWishlistCounts(counts);
				}
			} else {
				toast.error(result.message);
			}
			setLoading(false);
		};

		// Restore view mode
		const savedView = localStorage.getItem("viewMode");
		if (savedView === "grid" || savedView === "list") {
			setViewMode(savedView);
		}

		fetchWorks();
	}, []);

	const handleViewModeChange = (mode: "grid" | "list") => {
		setViewMode(mode);
		localStorage.setItem("viewMode", mode);
	};

	// Filter and sort products
	const filteredProducts = products
		.filter((product) => {
			const title = product?.title ?? "";
			const category = product?.category ?? "";
			const matchesSearch =
				title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				category.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCategory =
				filterCategory === "all" || category === filterCategory;
			return matchesSearch && matchesCategory;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case "price-high":
					return (b.price?.base || 0) - (a.price?.base || 0);
				case "price-low":
					return (a.price?.base || 0) - (b.price?.base || 0);
				case "name":
					return (a.title || "").localeCompare(b.title || "");
				case "newest":
				default:
					return (
						new Date(b.created_at || 0).getTime() -
						new Date(a.created_at || 0).getTime()
					);
			}
		});

	const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
	const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
	const paginatedProducts = filteredProducts.slice(
		startIdx,
		startIdx + ITEMS_PER_PAGE
	);

	// Analytics Infinite Scroll Logic
	const paginatedAnalyticsProducts = filteredProducts.slice(
		0,
		visibleAnalyticsCount
	);

	// Fetch product analytics when analytics tab is active
	useEffect(() => {
		const fetchProductAnalytics = async () => {
			const tailorUID =
				typeof window !== "undefined"
					? localStorage.getItem("tailorUID")
					: null;
			if (
				!tailorUID ||
				activeTab !== "analytics" ||
				paginatedAnalyticsProducts.length === 0
			)
				return;

			// Identify products that need fetching (not in cache)
			const productsToFetch = paginatedAnalyticsProducts.filter(
				(p) => p.product_id && !analyticsCache.has(p.product_id)
			);

			if (productsToFetch.length === 0) {
				setLoading(false);
				return;
			}

			// Only show loading if we are fetching new data
			setLoading(true);
			try {
				// Set date range for last 30 days
				const endDate = new Date();
				const startDate = new Date();
				startDate.setDate(startDate.getDate() - 30);

				const analyticsPromises = productsToFetch.map(async (product) => {
					if (!product.product_id) return null;

					try {
						const response = await fetch("/api/vendor/product-analytics", {
							method: "POST",
							headers: {
								"Content-Type": "application/json",
							},
							body: JSON.stringify({
								productId: product.product_id,
								vendorId: tailorUID,
								dateRange: {
									start: startDate.toISOString(),
									end: endDate.toISOString(),
								},
							}),
						});

						if (!response.ok) return null;
						return await response.json();
					} catch (err) {
						console.error(
							`Failed to fetch analytics for product ${product.product_id}`,
							err
						);
						return null;
					}
				});

				const analyticsResults = await Promise.all(analyticsPromises);
				const validAnalytics = analyticsResults.filter(
					(item): item is ProductAnalytics => item !== null
				);

				setAnalyticsCache((prev) => {
					const newCache = new Map(prev);
					validAnalytics.forEach((item) => {
						newCache.set(item.productId, item);
					});
					return newCache;
				});
			} catch (error) {
				console.error("Failed to fetch product analytics:", error);
				toast.error("Failed to load analytics data");
			} finally {
				setLoading(false);
			}
		};

		fetchProductAnalytics();
	}, [activeTab, paginatedAnalyticsProducts, analyticsCache]);

	// Intersection Observer for Infinite Scroll
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && activeTab === "analytics") {
					setVisibleAnalyticsCount((prev) =>
						Math.min(prev + ITEMS_PER_PAGE, filteredProducts.length)
					);
				}
			},
			{ threshold: 1.0 }
		);

		if (observerTarget.current) {
			observer.observe(observerTarget.current);
		}

		return () => {
			if (observerTarget.current) {
				observer.unobserve(observerTarget.current);
			}
		};
	}, [activeTab, filteredProducts.length]);

	// Get unique categories

	// Get unique categories
	const categories = Array.from(
		new Set(products.map((p) => p.category).filter(Boolean))
	) as string[];

	const renderProductCard = (product: TailorWork) => (
		<Card
			key={product.id}
			className="group border-gray-200 hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden"
		>
			<div className="relative">
				<div className="aspect-square bg-gray-50 overflow-hidden">
					{product?.images && product.images.length > 0 ? (
						<img
							src={product.images[0]}
							alt={product.title}
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gray-100">
							<Package className="h-12 w-12 text-gray-400" />
						</div>
					)}
				</div>

				{/* Overlay Actions */}
				<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
					<div className="flex space-x-2">
						<Button
							size="sm"
							variant="secondary"
							onClick={() =>
								router.push(`/vendor/products/${product.product_id}`)
							}
							className="bg-white/90 hover:bg-white text-gray-900"
						>
							<Eye className="h-4 w-4 mr-1" />
							View
						</Button>
						<Button
							size="sm"
							variant="secondary"
							onClick={() =>
								router.push(`/vendor/products/${product.product_id}/edit`)
							}
							className="bg-white/90 hover:bg-white text-gray-900"
						>
							<Edit className="h-4 w-4 mr-1" />
							Edit
						</Button>
					</div>
				</div>

				{/* Status Badge */}
				{/* <div className="absolute top-3 left-3">
					<Badge className={getStatusColor(product?.is_verified ?? false)}>
						{product?.is_verified ? "Live" : "Draft"}
					</Badge>
				</div> */}

				{/* Actions Menu */}
				<div className="absolute top-3 right-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 bg-white/80 hover:bg-white text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
							>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuLabel>Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() =>
									router.push(`/vendor/products/${product.product_id}`)
								}
							>
								<Eye className="mr-2 h-4 w-4" />
								View Details
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() =>
									router.push(`/vendor/products/${product.product_id}/edit`)
								}
							>
								<Edit className="mr-2 h-4 w-4" />
								Edit Product
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Copy className="mr-2 h-4 w-4" />
								Duplicate
							</DropdownMenuItem>
							<DropdownMenuItem>
								<ExternalLink className="mr-2 h-4 w-4" />
								View in Store
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-red-600">
								<Trash2 className="mr-2 h-4 w-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>

			<CardContent className="p-4">
				<div className="space-y-2">
					<div className="flex items-start justify-between">
						<h3 className="font-semibold text-gray-900 line-clamp-1 text-sm">
							{product?.title}
						</h3>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								router.push(`/vendor/products/${product.product_id}`)
							}
							className="h-8 w-8 p-0"
						>
							<Eye className="h-4 w-4" />
						</Button>
					</div>

					<p className="text-xs text-gray-600 line-clamp-1">
						{product?.category || "Uncategorized"}
					</p>

					<div className="flex items-center justify-between">
						<div className="space-y-1">
							<p className="text-lg font-bold text-gray-900">
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: product?.price?.currency || "USD",
								}).format(product?.price?.base || 0)}
							</p>
							<p className="text-xs text-gray-500">
								Stock: {product?.wear_quantity || 0}
							</p>
						</div>

						<div className="flex items-center space-x-1 text-xs text-gray-500">
							<Heart className="h-3 w-3 fill-current text-red-400" />
							<span>{wishlistCounts.get(product.product_id || "") || 0}</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	const renderProductList = (product: TailorWork) => (
		<Card
			key={product.id}
			className="border-gray-200 hover:shadow-lg transition-all duration-200"
		>
			<CardContent className="p-6">
				<div className="flex items-center space-x-6">
					<div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
						{product?.images && product.images.length > 0 ? (
							<img
								src={product.images[0]}
								alt={product.title}
								className="w-full h-full object-cover"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<Package className="h-8 w-8 text-gray-400" />
							</div>
						)}
					</div>

					<div className="flex-1 min-w-0">
						<div className="flex items-center space-x-3 mb-2">
							<h3 className="font-semibold text-gray-900 truncate">
								{product?.title}
							</h3>
							<Badge className={getStatusColor(product?.is_verified ?? false)}>
								{product?.is_verified ? "Live" : "Draft"}
							</Badge>
						</div>

						<div className="flex items-center space-x-6 text-sm text-gray-600 mb-2">
							<span>Category: {product?.category || "Uncategorized"}</span>
							<span>Stock: {product?.wear_quantity || 0}</span>
							<div className="flex items-center space-x-1">
								<Heart className="h-3 w-3 fill-current text-red-400" />
								<span>
									{wishlistCounts.get(product.product_id || "") || 0} wishlisted
								</span>
							</div>

							<div className="flex items-center space-x-4 text-xs text-gray-500">
								<span>
									Created:{" "}
									{new Date(product.created_at || 0).toLocaleDateString()}
								</span>
								<div className="flex items-center space-x-1 text-emerald-600">
									<TrendingUp className="h-3 w-3" />
									<span>+12% this month</span>
								</div>
							</div>
						</div>

						{/* Desktop Layout - hidden on mobile */}
						<div className="hidden sm:flex sm:flex-1 sm:min-w-0">
							<div className="flex-1">
								<div className="flex items-center space-x-3 mb-2">
									<h3 className="font-semibold text-gray-900 truncate">
										{product?.title}
									</h3>
									<Badge
										className={getStatusColor(product?.is_verified ?? false)}
									>
										{product?.is_verified ? "Live" : "Draft"}
									</Badge>
								</div>

								<div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600 mb-2">
									<span>Category: {product?.category || "Uncategorized"}</span>
									<span>Stock: {product?.wear_quantity || 0}</span>
									<div className="flex items-center space-x-1">
										<Star className="h-3 w-3 fill-current text-amber-400" />
										<span>4.8 (24 reviews)</span>
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
									<span>
										Created:{" "}
										{new Date(product.created_at || 0).toLocaleDateString()}
									</span>
									<div className="flex items-center space-x-1 text-emerald-600">
										<TrendingUp className="h-3 w-3" />
										<span>+12% this month</span>
									</div>
								</div>
							</div>
						</div>

						{/* Desktop price and actions - hidden on mobile */}
						<div className="hidden sm:flex sm:items-center sm:space-x-4">
							<div className="text-right">
								<p className="text-xl font-bold text-gray-900">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: product?.price?.currency || "USD",
									}).format(product?.price?.base || 0)}
								</p>
								<p className="text-sm text-gray-500">Base price</p>
							</div>

							<div className="flex items-center space-x-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										router.push(`/vendor/products/${product.product_id}`)
									}
								>
									<Eye className="h-4 w-4 mr-1" />
									View
								</Button>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
											<MoreHorizontal className="h-4 w-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem
											onClick={() =>
												router.push(`/vendor/products/${product.product_id}/edit`)
											}
										>
											<Edit className="mr-2 h-4 w-4" />
											Edit
										</DropdownMenuItem>
										<DropdownMenuItem>
											<Copy className="mr-2 h-4 w-4" />
											Duplicate
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem className="text-red-600">
											<Trash2 className="mr-2 h-4 w-4" />
											Delete
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			<ModernNavbar />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
						<div className="mb-6 lg:mb-0">
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								Products
							</h1>
							<p className="text-gray-600 text-lg">
								Manage your product catalog and track performance
							</p>
						</div>
						<div className="flex gap-3">
							<Button
								onClick={() => router.push("/vendor/products/bundling")}
								variant="outline"
								className="border-purple-200 hover:bg-purple-50 text-purple-700"
							>
								<Package className="h-4 w-4 mr-2" />
								Bundling Insights
							</Button>
							<Button
								onClick={() => router.push("/vendor/products/create")}
								className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Product
							</Button>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<Tabs
					value={activeTab}
					onValueChange={(v) => setActiveTab(v as "products" | "analytics")}
				>
					<TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
						<TabsTrigger value="products" className="flex items-center gap-2">
							<Package className="h-4 w-4" />
							Products
						</TabsTrigger>
						<TabsTrigger value="analytics" className="flex items-center gap-2">
							<BarChart3 className="h-4 w-4" />
							Analytics
						</TabsTrigger>
					</TabsList>

					<TabsContent value="products" className="mt-0">
						{/* Filters and Controls */}
						<Card className="border-gray-200 shadow-sm mb-8">
							<CardContent className="p-6">
								<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
									{/* Search */}
									<div className="flex-1 max-w-md">
										<div className="relative">
											<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
											<Input
												placeholder="Search products..."
												value={searchTerm}
												onChange={(e) => {
													setSearchTerm(e.target.value);
													setCurrentPage(1);
												}}
												className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-gray-200"
											/>
										</div>
									</div>

									{/* Filters and View Controls */}
									<div className="flex items-center space-x-4">
										{/* Category Filter */}
										<Select
											value={filterCategory}
											onValueChange={setFilterCategory}
										>
											<SelectTrigger className="w-40">
												<SelectValue placeholder="Category" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">All Categories</SelectItem>
												{categories.map((category) => (
													<SelectItem key={category} value={category}>
														{category}
													</SelectItem>
												))}
											</SelectContent>
										</Select>

										{/* Sort */}
										<Select value={sortBy} onValueChange={setSortBy}>
											<SelectTrigger className="w-40">
												<SelectValue placeholder="Sort by" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="newest">Newest</SelectItem>
												<SelectItem value="name">Name</SelectItem>
												<SelectItem value="price-high">
													Price: High to Low
												</SelectItem>
												<SelectItem value="price-low">
													Price: Low to High
												</SelectItem>
											</SelectContent>
										</Select>

										{/* View Mode Toggle */}
										<div className="flex border border-gray-200 rounded-lg">
											<Button
												variant={viewMode === "grid" ? "default" : "ghost"}
												size="sm"
												onClick={() => handleViewModeChange("grid")}
												className="rounded-r-none"
											>
												<Grid3X3 className="h-4 w-4" />
											</Button>
											<Button
												variant={viewMode === "list" ? "default" : "ghost"}
												size="sm"
												onClick={() => handleViewModeChange("list")}
												className="rounded-l-none"
											>
												<List className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Products Display */}
						{loading ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
								{Array.from({ length: 8 }).map((_, i) => (
									<Card key={i} className="animate-pulse">
										<div className="aspect-square bg-gray-200" />
										<CardContent className="p-4">
											<div className="space-y-2">
												<div className="h-4 bg-gray-200 rounded" />
												<div className="h-3 bg-gray-200 rounded w-2/3" />
												<div className="h-5 bg-gray-200 rounded w-1/2" />
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : (
							<>
								{viewMode === "grid" ? (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
										{paginatedProducts.map(renderProductCard)}
									</div>
								) : (
									<div className="space-y-4">
										{paginatedProducts.map(renderProductList)}
									</div>
								)}

								{/* Empty State */}
								{filteredProducts.length === 0 && !loading && (
									<Card className="border-gray-200">
										<CardContent className="p-12 text-center">
											<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
												<Package className="h-8 w-8 text-gray-400" />
											</div>
											<h3 className="text-lg font-medium text-gray-900 mb-2">
												No products found
											</h3>
											<p className="text-gray-600 mb-6">
												{searchTerm || filterCategory !== "all"
													? "Try adjusting your search or filters"
													: "Start by creating your first product"}
											</p>
											<Button
												onClick={() => router.push("/vendor/products/create")}
												className="bg-gradient-to-r from-gray-900 to-gray-700 text-white"
											>
												<Plus className="h-4 w-4 mr-2" />
												Create Product
											</Button>
										</CardContent>
									</Card>
								)}

								{/* Pagination */}
								{filteredProducts.length > 0 && totalPages > 1 && (
									<div className="flex justify-center items-center mt-8 space-x-4">
										<Button
											variant="outline"
											disabled={currentPage === 1}
											onClick={() => setCurrentPage((prev) => prev - 1)}
										>
											Previous
										</Button>
										<span className="text-sm text-gray-700">
											Page {currentPage} of {totalPages}
										</span>
										<Button
											variant="outline"
											disabled={currentPage === totalPages}
											onClick={() => setCurrentPage((prev) => prev + 1)}
										>
											Next
										</Button>
									</div>
								)}
							</>
						)}
					</TabsContent>

					<TabsContent value="analytics" className="mt-0">
						{loading ? (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{Array.from({ length: 6 }).map((_, i) => (
									<Card key={i} className="animate-pulse">
										<CardHeader>
											<div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
											<div className="h-3 bg-gray-200 rounded w-1/2" />
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												<div className="h-20 bg-gray-200 rounded" />
												<div className="h-16 bg-gray-200 rounded" />
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						) : paginatedAnalyticsProducts.length > 0 ? (
							<>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
									{paginatedAnalyticsProducts.map((product) => {
										const analytics = product.product_id
											? analyticsCache.get(product.product_id)
											: null;
										if (!analytics)
											return (
												<Card key={product.id} className="animate-pulse">
													<CardHeader>
														<div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
														<div className="h-3 bg-gray-200 rounded w-1/2" />
													</CardHeader>
													<CardContent>
														<div className="space-y-3">
															<div className="h-20 bg-gray-200 rounded" />
															<div className="h-16 bg-gray-200 rounded" />
														</div>
													</CardContent>
												</Card>
											);
										return (
											<ProductAnalyticsCard
												key={analytics.productId}
												product={analytics}
											/>
										);
									})}
								</div>

								{/* Sentinel for Infinite Scroll */}
								{visibleAnalyticsCount < filteredProducts.length && (
									<div
										ref={observerTarget}
										className="py-8 flex justify-center"
									>
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
									</div>
								)}
							</>
						) : (
							<Card className="border-gray-200">
								<CardContent className="p-12 text-center">
									<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
										<BarChart3 className="h-8 w-8 text-gray-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-900 mb-2">
										No analytics data available
									</h3>
									<p className="text-gray-600 mb-6">
										Analytics data will appear here once your products start
										receiving views and sales
									</p>
								</CardContent>
							</Card>
						)}
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
