"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
	CheckCircle,
	XCircle,
	AlertCircle,
	Package,
	Eye,
	Search,
	LayoutGrid,
	List as ListIcon,
	Calendar,
	Shirt,
	Layers,
	Clock,
	Ruler,
	Weight,
	Truck,
	Heart,
} from "lucide-react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	useMarketingAuth,
	withMarketingAuth,
} from "@/contexts/MarketingAuthContext";
import {
	getPendingProducts,
	approveProduct,
	rejectProduct,
	triggerManualBackfill,
} from "@/vendor-services/marketingService";
import { TailorWork } from "@/vendor-services/types";
import Image from "next/image";

function ProductApprovalsPage() {
	const { marketingUser } = useMarketingAuth();
	const router = useRouter();
	const [products, setProducts] = useState<TailorWork[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedProduct, setSelectedProduct] = useState<TailorWork | null>(
		null
	);
	const [viewProduct, setViewProduct] = useState<TailorWork | null>(null);
	const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
	const [rejectionReason, setRejectionReason] = useState("");
	const [processing, setProcessing] = useState(false);
	const [backfilling, setBackfilling] = useState(false);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [previewImage, setPreviewImage] = useState<string>("");

	useEffect(() => {
		fetchProducts();
	}, []);

	// Update preview image when viewing a new product
	useEffect(() => {
		if (viewProduct && viewProduct.images && viewProduct.images.length > 0) {
			setPreviewImage(viewProduct.images[0]);
		} else {
			setPreviewImage("");
		}
	}, [viewProduct]);

	const handleBackfill = async () => {
		if (!confirm("Are you sure you want to trigger the manual brand backfill?"))
			return;

		setBackfilling(true);
		try {
			const res = await triggerManualBackfill();
			if (res.success) {
				toast.success(res.message);
				fetchProducts(); // Refresh list as data might have changed
			} else {
				toast.error("Backfill failed: " + res.message);
			}
		} catch (error) {
			toast.error("An error occurred during backfill");
		} finally {
			setBackfilling(false);
		}
	};

	const fetchProducts = async () => {
		setLoading(true);
		try {
			const res = await getPendingProducts();
			if (res.success && res.data) {
				setProducts(res.data);
			} else {
				toast.error(res.message || "Failed to load pending products");
			}
		} catch (error) {
			console.error("Error loading products:", error);
			toast.error("An error occurred while loading products");
		} finally {
			setLoading(false);
		}
	};

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

	const handleApprove = async (product: TailorWork) => {
		if (!marketingUser) return;

		if (!confirm(`Are you sure you want to approve "${product.title}"?`))
			return;

		setProcessing(true);
		try {
			const res = await approveProduct(product.id, marketingUser.uid);
			if (res.success) {
				toast.success(`Approved "${product.title}" successfully`);
				setProducts((prev) => prev.filter((p) => p.id !== product.id));
				if (viewProduct?.id === product.id) setViewProduct(null);
			} else {
				toast.error(res.message || "Failed to approve product");
			}
		} catch (error) {
			toast.error("Process failed");
		} finally {
			setProcessing(false);
		}
	};

	const openRejectDialog = (product: TailorWork) => {
		setSelectedProduct(product);
		setRejectionReason("");
		setIsRejectDialogOpen(true);
	};

	const handleReject = async () => {
		if (!selectedProduct || !marketingUser) return;

		if (!rejectionReason.trim()) {
			toast.error("Please provide a reason for rejection");
			return;
		}

		setProcessing(true);
		try {
			const res = await rejectProduct(
				selectedProduct.id,
				rejectionReason,
				marketingUser.uid
			);
			if (res.success) {
				toast.success(`Rejected "${selectedProduct.title}"`);
				setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
				setIsRejectDialogOpen(false);
				setSelectedProduct(null);
				if (viewProduct?.id === selectedProduct.id) setViewProduct(null);
			} else {
				toast.error(res.message || "Failed to reject product");
			}
		} catch (error) {
			toast.error("Process failed");
		} finally {
			setProcessing(false);
		}
	};

	const filteredProducts = products.filter(
		(p) =>
			p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			p.tailor?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const ProductGridView = () => (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{filteredProducts.map((product) => (
				<Card
					key={product.id}
					className="overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
				>
					<div
						className="relative h-48 bg-gray-100 group cursor-pointer"
						onClick={() => setViewProduct(product)}
					>
						{product.images && product.images.length > 0 ? (
							<Image
								src={product.images[0]}
								alt={product.title}
								fill
								className="object-cover transition-transform duration-300 group-hover:scale-105"
							/>
						) : (
							<div className="flex items-center justify-center h-full text-gray-400">
								<Package className="h-12 w-12" />
							</div>
						)}
						<div className="absolute top-2 right-2">
							<Badge
								variant="secondary"
								className="bg-white/90 text-gray-700 backdrop-blur-sm shadow-sm"
							>
								{product.category}
							</Badge>
						</div>
						<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
							<div className="bg-white/90 rounded-full p-2 text-gray-900 flex items-center gap-2">
								<Eye className="h-4 w-4" />
								<span className="text-sm font-medium">View Details</span>
							</div>
						</div>
					</div>

					<CardHeader className="pb-3">
						<div className="flex justify-between items-start">
							<div>
								<CardTitle
									className="text-lg font-semibold line-clamp-1"
									title={product.title}
								>
									{product.title}
								</CardTitle>
								<CardDescription className="flex items-center gap-1 mt-1">
									By{" "}
									<span className="font-medium text-gray-900">
										{product.tailor || "Unknown Vendor"}
									</span>
								</CardDescription>
							</div>
							<Badge
								variant="outline"
								className="border-yellow-200 bg-yellow-50 text-yellow-700"
							>
								Pending
							</Badge>
						</div>
					</CardHeader>

					<CardContent className="pb-3 flex-1">
						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-gray-500">Price:</span>
								<span className="font-medium">
									{new Intl.NumberFormat("en-NG", {
										style: "currency",
										currency: product.price?.currency || "NGN",
									}).format(product.price?.base || 0)}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-gray-500">Type:</span>
								<span className="capitalize">{product.type || "N/A"}</span>
							</div>
							<p className="text-gray-600 line-clamp-2 text-xs mt-2 bg-gray-50 p-2 rounded">
								{product.description}
							</p>
						</div>
					</CardContent>

					<CardFooter className="pt-3 border-t bg-gray-50/50 flex gap-2 mt-auto">
						<Button
							variant="outline"
							className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
							onClick={() => openRejectDialog(product)}
							disabled={processing}
						>
							<XCircle className="h-4 w-4 mr-2" />
							Reject
						</Button>
						<Button
							className="flex-1 bg-green-600 hover:bg-green-700 text-white"
							onClick={() => handleApprove(product)}
							disabled={processing}
						>
							<CheckCircle className="h-4 w-4 mr-2" />
							Approve
						</Button>
					</CardFooter>
				</Card>
			))}
		</div>
	);

	const ProductListView = () => (
		<div className="border rounded-lg overflow-hidden bg-white">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-[80px]">Image</TableHead>
						<TableHead>Product Info</TableHead>
						<TableHead className="hidden md:table-cell">Vendor</TableHead>
						<TableHead className="hidden md:table-cell">Category</TableHead>
						<TableHead>Price</TableHead>
						<TableHead className="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{filteredProducts.map((product) => (
						<TableRow key={product.id}>
							<TableCell>
								<div
									className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 cursor-pointer"
									onClick={() => setViewProduct(product)}
								>
									{product.images && product.images.length > 0 ? (
										<Image
											src={product.images[0]}
											alt={product.title}
											fill
											className="object-cover"
										/>
									) : (
										<div className="flex items-center justify-center h-full text-gray-400">
											<Package className="h-4 w-4" />
										</div>
									)}
								</div>
							</TableCell>
							<TableCell>
								<div
									className="cursor-pointer"
									onClick={() => setViewProduct(product)}
								>
									<div className="font-medium text-gray-900 group-hover:text-primary">
										{product.title}
									</div>
									<div className="text-xs text-gray-500 line-clamp-1">
										{product.description}
									</div>
								</div>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								<div className="text-sm">
									{product.tailor || "Unknown Vendor"}
								</div>
							</TableCell>
							<TableCell className="hidden md:table-cell">
								<Badge variant="secondary">{product.category}</Badge>
							</TableCell>
							<TableCell>
								<div className="font-medium">
									{new Intl.NumberFormat("en-NG", {
										style: "currency",
										currency: product.price?.currency || "NGN",
									}).format(product.price?.base || 0)}
								</div>
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									<Button
										size="sm"
										variant="ghost"
										onClick={() => setViewProduct(product)}
										title="View Details"
									>
										<Eye className="h-4 w-4 text-gray-500" />
									</Button>
									<Button
										size="sm"
										variant="outline"
										className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
										onClick={() => openRejectDialog(product)}
										disabled={processing}
										title="Reject"
									>
										<XCircle className="h-4 w-4" />
										<span className="sr-only">Reject</span>
									</Button>
									<Button
										size="sm"
										className="bg-green-600 hover:bg-green-700 text-white"
										onClick={() => handleApprove(product)}
										disabled={processing}
										title="Approve"
									>
										<CheckCircle className="h-4 w-4" />
										<span className="sr-only">Approve</span>
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);

	const safeImages = viewProduct?.images ?? [];
	const safeTags = viewProduct?.tags ?? [];
	const safeSizes = viewProduct?.sizes ?? [];
	const safeUserCustomSizes = viewProduct?.userCustomSizes ?? [];
	const safeUserSizes = (viewProduct as any)?.userSizes ?? [];

	return (
		<div className="p-6 max-w-7xl mx-auto space-y-6">
			{/* Component Content Preserved */}
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">
						Product Approvals
					</h1>
					<p className="text-gray-500">
						Review and manage pending vendor products
					</p>
				</div>
				<div className="flex items-center gap-2 w-full md:w-auto">
					<div className="relative flex-1 md:w-64">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
						<Input
							placeholder="Search products..."
							className="pl-9 bg-white"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<div className="flex bg-white rounded-lg border shadow-sm p-1">
						<Button
							variant="ghost"
							size="sm"
							className={`h-8 px-2 ${
								viewMode === "grid"
									? "bg-gray-100 text-gray-900"
									: "text-gray-500"
							}`}
							onClick={() => setViewMode("grid")}
						>
							<LayoutGrid className="h-4 w-4" />
							<span className="sr-only">Grid View</span>
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={`h-8 px-2 ${
								viewMode === "list"
									? "bg-gray-100 text-gray-900"
									: "text-gray-500"
							}`}
							onClick={() => setViewMode("list")}
						>
							<ListIcon className="h-4 w-4" />
							<span className="sr-only">List View</span>
						</Button>
					</div>
					{/* Temporary Backfill Button */}
					<Button
						variant="outline"
						size="sm"
						onClick={handleBackfill}
						disabled={backfilling}
						className="hidden md:flex bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
					>
						{backfilling ? (
							<Clock className="mr-2 h-4 w-4 animate-spin" />
						) : (
							<Layers className="mr-2 h-4 w-4" />
						)}
						{backfilling ? "Backfilling..." : "Backfill Brands"}
					</Button>
				</div>
			</div>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{[1, 2, 3].map((i) => (
						<Card key={i} className="animate-pulse">
							<div className="h-48 bg-gray-200 rounded-t-xl" />
							<CardHeader>
								<div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
								<div className="h-4 bg-gray-200 rounded w-1/2" />
							</CardHeader>
							<CardContent>
								<div className="h-20 bg-gray-100 rounded" />
							</CardContent>
						</Card>
					))}
				</div>
			) : filteredProducts.length === 0 ? (
				<div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
					<CheckCircle className="h-16 w-16 text-green-100 mx-auto bg-green-50 rounded-full p-4 mb-4" />
					<h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
					<p className="text-gray-500">
						No pending products to review at the moment.
					</p>
				</div>
			) : (
				<>{viewMode === "grid" ? <ProductGridView /> : <ProductListView />}</>
			)}

			<Dialog
				open={!!viewProduct}
				onOpenChange={(open) => !open && setViewProduct(null)}
			>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Product Details</DialogTitle>
						<DialogDescription>Full details for validation</DialogDescription>
					</DialogHeader>

					{viewProduct && (
						<div className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								{/* Main Image */}
								<div>
									<div className="w-full h-[400px] relative rounded-xl overflow-hidden border shadow-md bg-gray-100">
										{previewImage?.endsWith(".mp4") ||
										previewImage?.includes("video") ? (
											<video
												src={previewImage}
												controls
												autoPlay
												muted
												className="w-full h-full object-contain"
											/>
										) : (
											<Image
												src={previewImage || "/placeholder.jpg"}
												alt="preview media"
												fill
												className="object-cover"
											/>
										)}
									</div>
									{safeImages.length > 1 && (
										<div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
											{safeImages.map((media, index) => (
												<div
													key={index}
													onClick={() => setPreviewImage(media)}
													className={`w-16 h-16 border rounded-lg cursor-pointer overflow-hidden flex-shrink-0 transition relative ${
														previewImage === media
															? "ring-2 ring-primary"
															: "hover:ring-1 hover:ring-gray-300"
													}`}
												>
													<Image
														src={media || "/placeholder.jpg"}
														alt={`Thumbnail ${index + 1}`}
														fill
														className="object-cover"
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
										<h1 className="text-2xl font-bold capitalize">
											{viewProduct.title}
										</h1>
										<div className="flex flex-wrap items-center gap-2 mt-2">
											<Badge>{viewProduct.category}</Badge>
											{viewProduct.type && (
												<Badge variant="secondary">{viewProduct.type}</Badge>
											)}
											<Badge variant="outline">
												Stock: {viewProduct.wear_quantity ?? 0}
											</Badge>
										</div>
									</div>

									{/* Price */}
									<div className="text-2xl font-semibold text-green-600">
										{new Intl.NumberFormat("en-NG", {
											style: "currency",
											currency: viewProduct.price?.currency || "NGN",
										}).format(viewProduct.price?.base || 0)}
									</div>

									{/* Description */}
									<div>
										<span className="text-sm font-medium mb-1 block text-gray-600">
											Description
										</span>
										<div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 max-h-40 overflow-y-auto">
											{viewProduct.description}
										</div>
									</div>

									{/* Quick Stats */}
									<div className="grid grid-cols-2 gap-3 text-sm">
										<div className="flex items-center gap-2 text-gray-600">
											<Calendar className="h-4 w-4" />
											<span>Added: {formatDate(viewProduct.created_at)}</span>
										</div>
										<div className="flex items-center gap-2 text-gray-600">
											<Clock className="h-4 w-4" />
											<span>
												Timeline: {viewProduct.deliveryTimeline ?? "N/A"}
											</span>
										</div>
										<div className="flex items-center gap-2 text-gray-600">
											<Shirt className="h-4 w-4" />
											<span>
												Custom Sizes: {viewProduct.customSizes ? "Yes" : "No"}
											</span>
										</div>
									</div>

									{/* Tags, Sizes */}
									<div className="space-y-3">
										{safeTags.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{safeTags.map((tag, i) => (
													<Badge key={i} variant="outline" className="text-xs">
														{tag}
													</Badge>
												))}
											</div>
										)}

										{(safeSizes.length > 0 || safeUserSizes.length > 0) && (
											<div>
												<span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
													Sizes
												</span>
												<div className="flex flex-wrap gap-1 mt-1">
													{[...safeSizes, ...safeUserSizes].map(
														(s: any, i: number) => (
															<Badge
																key={i}
																variant="secondary"
																className="text-xs"
															>
																{typeof s === "string"
																	? s
																	: `${s.label || s.size} (${s.quantity})`}
															</Badge>
														)
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</div>

							{/* Extended Details Section */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
								{/* Options */}
								<div className="space-y-4">
									<h3 className="font-semibold flex items-center gap-2">
										<Layers className="h-4 w-4" /> Product Options
									</h3>

									{/* RTW Options */}
									{viewProduct.type === "ready-to-wear" &&
										viewProduct.rtwOptions && (
											<div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
												<div className="grid grid-cols-3 gap-2">
													<span className="text-gray-500">Fabric:</span>
													<span className="col-span-2 font-medium">
														{viewProduct.rtwOptions.fabric || "N/A"}
													</span>

													<span className="text-gray-500">Season:</span>
													<span className="col-span-2">
														{viewProduct.rtwOptions.season || "N/A"}
													</span>

													<span className="text-gray-500">Colors:</span>
													<div className="col-span-2 flex gap-1 flex-wrap">
														{viewProduct.rtwOptions.colors?.map((c, i) => (
															<span
																key={i}
																className="w-4 h-4 rounded-full border shadow-sm"
																style={{ backgroundColor: c }}
																title={c}
															/>
														)) || "N/A"}
													</div>
												</div>
											</div>
										)}

									{/* Bespoke Options */}
									{viewProduct.type === "bespoke" &&
										viewProduct.bespokeOptions && (
											<div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
												<div className="grid grid-cols-1 gap-2">
													<div>
														<span className="text-gray-500 block text-xs">
															Fabrics:
														</span>
														<p>
															{viewProduct.bespokeOptions.customization?.fabricChoices?.join(
																", "
															) || "N/A"}
														</p>
													</div>
													<div>
														<span className="text-gray-500 block text-xs">
															Styles:
														</span>
														<p>
															{viewProduct.bespokeOptions.customization?.styleOptions?.join(
																", "
															) || "N/A"}
														</p>
													</div>
													<div>
														<span className="text-gray-500 block text-xs">
															Measurements:
														</span>
														<p>
															{viewProduct.bespokeOptions.measurementsRequired?.join(
																", "
															) || "N/A"}
														</p>
													</div>
												</div>
											</div>
										)}
								</div>

								{/* Shipping */}
								<div className="space-y-4">
									<h3 className="font-semibold flex items-center gap-2">
										<Truck className="h-4 w-4" /> Shipping & Details
									</h3>
									{viewProduct.shipping && (
										<div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
											<div className="grid grid-cols-2 gap-2">
												<div className="flex items-center gap-2">
													<Weight className="h-3 w-3 text-gray-500" />
													<span>{viewProduct.shipping.actualWeightKg} kg</span>
												</div>
												<div className="flex items-center gap-2">
													<Ruler className="h-3 w-3 text-gray-500" />
													<span>
														{viewProduct.shipping.lengthCm}x
														{viewProduct.shipping.widthCm}x
														{viewProduct.shipping.heightCm} cm
													</span>
												</div>
												<div className="col-span-2">
													<span className="text-gray-500">Tier: </span>
													<Badge variant="outline" className="text-xs">
														{viewProduct.shipping.tierKey}
													</Badge>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}

					<DialogFooter className="mt-8 pt-4 border-t flex flex-row gap-4 sm:justify-end">
						<Button
							variant="outline"
							className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
							onClick={() => openRejectDialog(viewProduct!)}
						>
							<XCircle className="h-4 w-4 mr-2" />
							Reject
						</Button>
						<Button
							className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"
							onClick={() => handleApprove(viewProduct!)}
						>
							<CheckCircle className="h-4 w-4 mr-2" />
							Approve
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Rejection Dialog */}
			<Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reject Product</DialogTitle>
						<DialogDescription>
							Please provide a reason for rejecting{" "}
							<span className="font-medium text-gray-900">
								{selectedProduct?.title}
							</span>
							. This will be visible to the vendor.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4">
						<Textarea
							placeholder="Enter rejection reason..."
							value={rejectionReason}
							onChange={(e) => setRejectionReason(e.target.value)}
							rows={4}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsRejectDialogOpen(false)}
							disabled={processing}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleReject}
							disabled={processing || !rejectionReason.trim()}
						>
							{processing ? "Rejecting..." : "Confirm Rejection"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

export default withMarketingAuth(ProductApprovalsPage, {
	requiredRole: ["super_admin", "team_lead", "bdm"],
});
