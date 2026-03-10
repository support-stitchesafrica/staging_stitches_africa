"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	ArrowLeft,
	Package,
	Calendar,
	Shirt,
	Layers,
	Trash2,
	Edit,
	Clock,
	CheckCircle,
	XCircle,
	Ruler,
	Weight,
	Truck,
	Heart,
	Eye,
} from "lucide-react";
import Image from "next/image";
import { getTailorWorkById } from "@/vendor-services/getTailorWorkById";
import { TailorWork } from "@/vendor-services/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Navbar } from "@/components/navbar";
import {
	verifyTailorWorks,
	deleteTailorWork,
} from "@/vendor-services/addTailorWork";
import { getProductWishlistCount } from "@/vendor-services/getWishlistCounts";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useStrictVendorAuth } from "@/hooks/useStrictVendorAuth";

export default function ProductDetail() {
	const params = useParams();
	const router = useRouter();
	const { isAuthenticated, isLoading: authLoading } = useStrictVendorAuth(); // Use the strict auth hook
	const [product, setProduct] = useState<TailorWork | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string>("");
	const [previewImage, setPreviewImage] = useState<string>("");
	const [user, setUser] = useState<any>(null);
	const [showVerifyModal, setShowVerifyModal] = useState(false);
	const [showDeleteModal, setShowDeleteModal] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [wishlistCount, setWishlistCount] = useState<number>(0);
	const [loadingWishlist, setLoadingWishlist] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [selectedItems, setSelectedItems] = useState<string[]>([]);

	const formatDate = (value: any) => {
		if (!value) return "N/A";
		let date: Date;

		if (value instanceof Date) {
			date = value;
		} else if (typeof value === "number") {
			date = new Date(value);
		} else if (typeof value === "string") {
			const normalized = value.includes("T") ? value : value.replace(" ", "T");
			date = new Date(normalized);
		} else if (typeof value === "object" && "seconds" in value) {
			date = new Date(value.seconds * 1000); // Firestore timestamp
		} else {
			return "N/A";
		}

		return isNaN(date.getTime())
			? "N/A"
			: date.toLocaleDateString("en-US", {
					day: "numeric",
					month: "long",
					year: "numeric",
				});
	};

	const handleVerify = async () => {
		if (!product?.id || !user?.id) return;
		setVerifying(true);
		try {
			const res = await verifyTailorWorks(user.id, product.id);
			if (res.success) {
				toast.success("Product verified successfully");
				setProduct((prev) =>
					prev ? { ...prev, is_verified: true, status: "verified" } : prev,
				);
			} else {
				toast.error(res.message || "Verification failed");
			}
		} catch {
			toast.error("Something went wrong verifying product");
		} finally {
			setVerifying(false);
		}
	};

	const handleDelete = async () => {
		if (!product?.id || !product?.tailor_id) return;
		setDeleting(true);
		try {
			const res = await deleteTailorWork(product.tailor_id, product.id);
			if (res.success) {
				toast.success("Product deleted successfully");
				router.push("/vendor/products");
			} else {
				toast.error(res.message || "Failed to delete product");
			}
		} catch (error) {
			toast.error("Something went wrong deleting product");
		} finally {
			setDeleting(false);
			setShowDeleteModal(false);
		}
	};

	const handleUpdate = () => {
		if (product?.id) {
			try {
				router.push(`/vendor/products/${product.id}/edit`);
			} catch (error) {
				console.error("Navigation error:", error);
				toast.error("Failed to navigate to edit page");
			}
		}
	};

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		// Check initial state
		setIsOnline(navigator.onLine);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	// Fetch product logic...
	// Fetch product logic...
	useEffect(() => {
		if (authLoading || !isAuthenticated) return;

		const fetchData = async () => {
			setLoading(true);
			setError("");
			try {
				// Try to get user from localStorage first, then fallback to auth.currentUser
				const storedUserStr = localStorage.getItem("user");
				const storedUser = storedUserStr ? JSON.parse(storedUserStr) : null;

				setUser(storedUser);

				// Robust ID retrieval: check stored user ID, then Firebase Auth ID
				import("@/firebase").then(async ({ auth }) => {
					const userId =
						storedUser?.id || storedUser?.uid || auth.currentUser?.uid;

					if (!userId) {
						console.error(
							"❌ No user ID found in localStorage or Firebase Auth",
						);
						setError("User verification failed. Please try logging in again.");
						setLoading(false);
						return;
					}

					console.log(`🔍 Fetching product ${params.id} for user ${userId}`);

					const res = await getTailorWorkById(params.id as string, userId);

					if (res.success && res.data) {
						setProduct(res.data);

						if (res.data.images && res.data.images.length > 0) {
							setPreviewImage(res.data.images[0]);
						}

						// Fetch wishlist count
						if (res.data.product_id && res.data.tailor_id && isOnline) {
							setLoadingWishlist(true);
							try {
								const count = await getProductWishlistCount(
									res.data.product_id,
									res.data.tailor_id,
								);
								setWishlistCount(count);
							} catch (err: any) {
								console.error("❌ Error fetching wishlist count:", err);
								if (!err?.message?.includes("ERR_INTERNET_DISCONNECTED")) {
									console.warn("Network error fetching wishlist count");
								}
							} finally {
								setLoadingWishlist(false);
							}
						}
					} else {
						// Product fetch failed
						console.error("❌ Product fetch failed:", res.message);
						setError(res.message || `Product ${params.id} not found`);
					}
					setLoading(false);
				});
			} catch (err: any) {
				console.error("❌ Exception fetching product:", err);
				setError(err.message || "Failed to fetch product");
				setLoading(false);
			}
		};
		if (params.id) fetchData();
	}, [params.id, isOnline, authLoading, isAuthenticated]);

	// Calculate total price for selected items
	const calculateSelectedTotal = () => {
		if (!product?.individualItems || selectedItems.length === 0) {
			return product?.price?.base || 0;
		}
		
		return product.individualItems
			.filter(item => selectedItems.includes(item.id))
			.reduce((sum, item) => sum + item.price, 0);
	};

	// Handle checkbox change for individual items
	const handleItemSelection = (itemId: string, checked: boolean) => {
		if (checked) {
			setSelectedItems(prev => [...prev, itemId]);
		} else {
			setSelectedItems(prev => prev.filter(id => id !== itemId));
		}
	};

	// ✅ Availability Filter - Only hide if explicitly unavailable or out of stock
	if (
		product &&
		(product.availability === "unavailable" ||
			product.availability === "out_of_stock")
	) {
		return (
			<ErrorBoundary>
				<div className="min-h-screen bg-white">
					<ModernNavbar />
					<div className="container mx-auto px-4 py-16 text-center">
						<XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
						<h2 className="text-2xl font-bold mb-2">
							This item is not available
						</h2>
						<p className="text-gray-600 mb-6">
							Please check back later or explore other available products.
						</p>
						<Button
							onClick={() => router.push("/vendor/products")}
							variant="outline"
						>
							<ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
						</Button>
					</div>
				</div>
			</ErrorBoundary>
		);
	}

	// Loading State
	if (loading || authLoading) {
		return (
			<div className="min-h-screen bg-white">
				<ModernNavbar />
				<div className="container mx-auto px-4 py-8">
					<div className="mb-4">
						<Skeleton className="h-10 w-32" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div>
							<Skeleton className="w-full h-[500px] rounded-xl" />
							<div className="flex gap-3 mt-4">
								<Skeleton className="w-20 h-20 rounded-lg" />
								<Skeleton className="w-20 h-20 rounded-lg" />
								<Skeleton className="w-20 h-20 rounded-lg" />
							</div>
						</div>
						<div className="space-y-6">
							<div>
								<Skeleton className="h-10 w-3/4 mb-2" />
								<div className="flex gap-2">
									<Skeleton className="h-6 w-20" />
									<Skeleton className="h-6 w-20" />
								</div>
							</div>
							<Skeleton className="h-8 w-1/3" />
							<div className="space-y-2">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-2/3" />
							</div>
							<div className="grid grid-cols-2 gap-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Error or No Product
	if (error || !product) {
		return (
			<ErrorBoundary>
				<div className="min-h-screen bg-white">
					<ModernNavbar />
					<div className="container mx-auto px-4 py-8 text-center">
						<Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							{error ? "Error loading product" : "Product Not Found"}
						</h2>
						<p className="text-gray-600 mb-4">
							{error || "We couldn't find the product you're looking for."}
						</p>
						<Button
							onClick={() => router.push("/vendor/products")}
							variant="outline"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Products
						</Button>
					</div>
				</div>
			</ErrorBoundary>
		);
	}

	const safeImages = product.images ?? [];
	const safeTags = product.tags ?? [];
	const safeSizes = product.sizes ?? [];
	const safeUserCustomSizes = product.userCustomSizes ?? [];
	const safeUserSizes = (product as any).userSizes ?? [];

	return (
		<ErrorBoundary>
			<div className="min-h-screen bg-white">
				<ModernNavbar />
				{!isOnline && (
					<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
						<div className="flex">
							<div className="ml-3">
								<p className="text-sm">
									You're currently offline. Some features may not work properly.
								</p>
							</div>
						</div>
					</div>
				)}
				<div className="container mx-auto px-4 py-8">
					<div>
						<Button
							variant="outline"
							onClick={() => router.push("/vendor/products")}
							className="mb-4 text-gray-600 hover:text-gray-900"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Products
						</Button>
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{/* Main Image */}
						<div>
							<div className="w-full h-[500px] relative rounded-xl overflow-hidden border shadow-md">
								{previewImage?.endsWith(".mp4") ||
								previewImage?.includes("video") ? (
									<video
										src={previewImage}
										controls
										autoPlay
										className="w-full h-full object-contain"
									/>
								) : (
									<img
										src={previewImage || "/placeholder.jpg"}
										alt="preview media"
										className="w-full h-full object-cover"
									/>
								)}
							</div>
							{safeImages.length > 1 && (
								<div className="flex gap-3 mt-4 overflow-x-auto pb-2">
									{safeImages.map((media, index) => (
										<div
											key={index}
											onClick={() => setPreviewImage(media)}
											className={`w-20 h-20 border rounded-lg cursor-pointer overflow-hidden flex-shrink-0 transition ${
												previewImage === media
													? "ring-2 ring-black"
													: "hover:ring-1"
											}`}
										>
											<img
												src={media || "/placeholder.jpg"}
												alt={`Thumbnail ${index + 1}`}
												width={80}
												height={80}
												className="object-cover w-full h-full"
											/>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Product Details */}
						<div className="space-y-6">
							{/* Title + Category */}
							<div>
								<h1 className="text-3xl font-bold capitalize">
									{product?.title}
								</h1>
								<div className="flex flex-wrap items-center gap-2 mt-2">
									{product.category && <Badge>{product.category}</Badge>}
									{product.type && <Badge>{product.type}</Badge>}
									<Badge variant="outline">
										Stock: {product.wear_quantity ?? 0}
									</Badge>
									{loadingWishlist ? (
										<Badge
											variant="outline"
											className="flex items-center gap-1"
										>
											<Heart className="w-3 h-3 text-gray-400 animate-pulse" />
											Loading...
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="flex items-center gap-1"
										>
											<Heart className="w-3 h-3 fill-current text-red-400" />
											{wishlistCount} wishlisted
										</Badge>
									)}
									{product.is_verified && (
										<Badge
											variant="secondary"
											className="flex items-center gap-1"
										>
											<CheckCircle className="w-4 h-4 text-green-600" />{" "}
											Verified
										</Badge>
									)}
								</div>
							</div>

							{/* Price */}
							<div className="text-2xl font-semibold text-green-600">
								{product.price ? (
									<>
										{product.enableMultiplePricing && product.individualItems && product.individualItems.length > 0 ? (
											// Multiple pricing enabled - show individual item prices
											<div className="space-y-2">
												<div className="pt-2  border-gray-300 mt-2">
													<div className="flex justify-between items-center font-bold text-xl">
														<span>
															{new Intl.NumberFormat("en-US", {
																style: "currency",
																currency: product.price?.currency || "USD",
															}).format(calculateSelectedTotal())}
														</span>
													</div>
												</div>
												<div className="space-y-2">
													{product.individualItems.map((item, index) => (
														<button 
															key={item.id} 
															className={`flex items-center justify-between p-3  rounded-lg w-full text-left transition-all duration-200 transform ${selectedItems.includes(item.id) ? "bg-black text-white border-black shadow-lg scale-105" : "hover:bg-gray-100 bg-gray-200! text-black! hover:scale-102 border-gray-200"}`}
															onClick={() => handleItemSelection(item.id, !selectedItems.includes(item.id))}
														>
															<div className="flex items-center">
																<span className={`mr-3 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.includes(item.id) ? "bg-white border-white shadow-inner" : "border-gray-300 hover:border-gray-500"}`}>
																	{selectedItems.includes(item.id) && (
																		<svg className="h-3 w-3 text-black" fill="currentColor" viewBox="0 0 20 20">
																			<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																		</svg>
																	)}
																</span>
																<span className={selectedItems.includes(item.id) ? "font-semibold" : "font-medium"}>
																	{item.name || `Item ${index + 1}`}
																</span>
															</div>
															<span className={`font-medium ${selectedItems.includes(item.id) ? "text-white" : "text-gray-700"}`}>
																{new Intl.NumberFormat("en-US", {
																	style: "currency",
																	currency: product.price?.currency || "USD",
																}).format(item.price)}
															</span>
														</button>
													))}
												</div>
												
											</div>
										) : (
											// Single pricing - show original price display
											<>
												{/* Show discounted price if discount exists */}
												{product.price.discount ? (
													<>
														{new Intl.NumberFormat("en-US", {
															style: "currency",
															currency: product.price.currency || "USD",
														}).format(
															product.price.base *
																(1 - product.price.discount / 100),
														)}
														<span className="ml-2 text-sm text-gray-500 line-through">
															{new Intl.NumberFormat("en-US", {
																style: "currency",
																currency: product.price.currency || "USD",
															}).format(product.price.base)}
														</span>
													</>
												) : (
													/* Show original price if no discount */
													new Intl.NumberFormat("en-US", {
														style: "currency",
														currency: product.price.currency || "USD",
													}).format(product.price.base)
												)}
											</>
										)}
									</>
								) : (
									"$0.00"
								)}
							</div>

							{/* Tags */}
							{safeTags.length > 0 && (
								<div className="flex flex-wrap gap-2">
									{safeTags.map((tag, i) => (
										<Badge key={i} variant="outline">
											{tag}
										</Badge>
									))}
								</div>
							)}
							{safeSizes.length > 0 && (
								<div>
									<Label className="text-sm font-medium">Available Sizes</Label>
									<div className="flex flex-wrap gap-2 mt-2">
										{safeSizes.map((s: any, i: number) => (
											<Badge key={i} variant="outline">
												{typeof s === "string"
													? s
													: `${s?.label ?? s?.size ?? "N/A"} (${
															s?.quantity ?? 0
														})`}
											</Badge>
										))}
									</div>
								</div>
							)}

							{safeUserCustomSizes.length > 0 && (
								<div>
									<Label className="text-sm font-medium">Available Sizes</Label>
									<div className="flex flex-wrap gap-2 mt-2">
										{safeUserCustomSizes.map((s: any, i: number) => (
											<Badge key={i} variant="outline">
												{typeof s === "string"
													? s
													: `${s?.label ?? s?.size ?? "N/A"} (${
															s?.quantity ?? 0
														})`}
											</Badge>
										))}
									</div>
								</div>
							)}

							{safeUserSizes.length > 0 && (
								<div>
									<Label className="text-sm font-medium">Custom Sizes</Label>
									<div className="flex flex-wrap gap-2 mt-2">
										{safeUserSizes.map((s: any, i: number) => (
											<Badge key={i} variant="outline">
												{typeof s === "string"
													? s
													: `${s?.label ?? s?.size ?? "N/A"} (${
															s?.quantity ?? 0
														})`}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* Description */}
							<span className="text-sm font-medium mb-0">Description:</span>
							<p className="text-gray-700">{product.description}</p>

							{/* Extra Info */}
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
								<div className="p-4 border rounded-lg bg-gray-50 flex items-center gap-2">
									<Calendar className="h-4 w-4 text-gray-500" />
									<span>Added on: {formatDate(product.created_at)}</span>
								</div>
								<div className="p-4 border rounded-lg bg-gray-50 flex items-center gap-2">
									<Clock className="h-4 w-4 text-gray-500" />
									<span>Delivery: {product.deliveryTimeline ?? "N/A"}</span>
								</div>
								<div className="p-4 border rounded-lg bg-gray-50 flex items-center gap-2">
									<Shirt className="h-4 w-4 text-gray-500" />
									<span>
										Custom Sizes: {product.customSizes ? "Yes" : "No"}
									</span>
								</div>
								<div className="p-4 border rounded-lg bg-gray-50 flex items-center gap-2">
									<Layers className="h-4 w-4 text-gray-500" />
									<span>Status: {product.status ?? "N/A"}</span>
								</div>
							</div>

							{/* Return Policy */}
							{product.returnPolicy && (
								<div className="p-4 border rounded-lg bg-gray-50 text-sm">
									<strong>Return Policy:</strong> {product.returnPolicy}
								</div>
							)}

							{/* Options */}
							{product.type === "ready-to-wear" && product.rtwOptions && (
								<div className="p-6 border rounded-xl bg-white shadow-sm space-y-4">
									<h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
										👕 Read to wear options
									</h3>

									{/* ✅ Color Swatches */}
									<div className="flex items-center gap-3">
										<span className="font-medium text-gray-600">Colors:</span>
										{product.rtwOptions.colors &&
										product.rtwOptions.colors.length > 0 ? (
											<div className="flex gap-2 flex-wrap">
												{product.rtwOptions.colors.map((color, idx) => (
													<div
														key={idx}
														className="w-7 h-7 rounded-full gap-2 border shadow-sm ring-2 ring-offset-2 hover:scale-110 transition-transform"
														style={{ backgroundColor: color }}
														title={color}
													/>
												))}
											</div>
										) : (
											<span className="text-gray-400 italic">
												Not available
											</span>
										)}
									</div>

									{/* ✅ Fabric */}
									<div className="flex items-center gap-2">
										<span className="font-medium text-gray-600">Fabric:</span>
										<span className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 text-sm">
											{product.rtwOptions.fabric || "N/A"}
										</span>
									</div>

									{/* ✅ Season */}
									<div className="flex items-center gap-2">
										<span className="font-medium text-gray-600">Season:</span>
										<span className="px-2 py-1 bg-gray-100 rounded-md text-gray-700 text-sm">
											{product.rtwOptions.season || "N/A"}
										</span>
									</div>
								</div>
							)}

							{product.type === "bespoke" && product.bespokeOptions && (
								<div className="p-6 border rounded-xl bg-white shadow-sm space-y-4">
									<h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
										✂ Bespoke Options
									</h3>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
										<div>
											<span className="font-medium text-gray-600">
												Fabric Choices:
											</span>
											<p className="mt-1 text-gray-700">
												{product.bespokeOptions.customization?.fabricChoices?.join(
													", ",
												) || "N/A"}
											</p>
										</div>

										<div>
											<span className="font-medium text-gray-600">
												Style Options:
											</span>
											<p className="mt-1 text-gray-700">
												{product.bespokeOptions.customization?.styleOptions?.join(
													", ",
												) || "N/A"}
											</p>
										</div>

										<div>
											<span className="font-medium text-gray-600">
												Finishing Options:
											</span>
											<p className="mt-1 text-gray-700">
												{product.bespokeOptions.customization?.finishingOptions?.join(
													", ",
												) || "N/A"}
											</p>
										</div>

										<div>
											<span className="font-medium text-gray-600">
												Measurements Required:
											</span>
											<p className="mt-1 text-gray-700">
												{product.bespokeOptions.measurementsRequired?.join(
													", ",
												) || "N/A"}
											</p>
										</div>

										<div className="sm:col-span-2">
											<span className="font-medium text-gray-600">
												Production Time:
											</span>
											<p className="mt-1 text-gray-700">
												{product.bespokeOptions.productionTime ||
													product.deliveryTimeline ||
													"N/A"}
											</p>
										</div>
									</div>
								</div>
							)}

							{/* ✅ Shipping Info Section */}
							{product.shipping && (
								<div className="p-6 border rounded-xl bg-gray-50 shadow-sm">
									<h3 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
										<Truck className="h-5 w-5 text-gray-600" /> Weight &
										Dimensions Details
									</h3>
									<div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
										<div className="flex items-center gap-2">
											<Badge variant="outline">
												Tier: {product.shipping.tierKey || "N/A"}
											</Badge>
										</div>
										<div className="flex items-center gap-2">
											<Weight className="h-4 w-4 text-gray-600" />
											<span>
												Weight: {product.shipping.actualWeightKg ?? "N/A"} kg
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Ruler className="h-4 w-4 text-gray-600" />
											<span>
												Dimensions:{" "}
												{product.shipping.lengthCm
													? `${product.shipping.lengthCm} x ${product.shipping.widthCm} x ${product.shipping.heightCm} cm`
													: "N/A"}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span>
												Manual Override:{" "}
												{product.shipping.manualOverride ? "Yes" : "No"}
											</span>
										</div>
									</div>
								</div>
							)}

							{/* Actions - Show for vendors (check if we're in vendor context) */}
							{(user?.is_tailor ||
								(typeof window !== "undefined" &&
									localStorage.getItem("tailorUID"))) && (
								<div className="flex flex-col sm:flex-row gap-3">
									<Button
										variant="outline"
										className="flex items-center gap-2 flex-1"
										onClick={() =>
											router.push(
												`/vendor/products/${product.product_id}/analytics`,
											)
										}
									>
										<Eye className="h-4 w-4" /> View Analytics
									</Button>
									<Button
										variant="outline"
										className="flex items-center gap-2 flex-1"
										onClick={handleUpdate}
									>
										<Edit className="h-4 w-4" /> Update
									</Button>
									<Button
										variant="destructive"
										className="flex items-center gap-2 flex-1"
										onClick={() => setShowDeleteModal(true)}
									>
										<Trash2 className="h-4 w-4" /> Delete
									</Button>
								</div>
							)}

							{/* Delete Confirmation */}
							<Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
								<DialogContent className="max-w-md">
									<DialogHeader>
										<DialogTitle>Confirm Delete</DialogTitle>
									</DialogHeader>
									<p className="mb-4">
										This action cannot be undone. Are you sure you want to
										delete this product?
									</p>
									<DialogFooter className="flex justify-end gap-2">
										<Button
											variant="outline"
											onClick={() => setShowDeleteModal(false)}
										>
											Cancel
										</Button>
										<Button
											variant="destructive"
											onClick={handleDelete}
											disabled={deleting}
										>
											{deleting ? "Deleting..." : "Yes, Delete"}
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</div>
					</div>
				</div>
			</div>
		</ErrorBoundary>
	);
}