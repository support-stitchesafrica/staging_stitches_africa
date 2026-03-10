"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Search,
	User,
	CheckCircle,
	Loader2,
	Info,
	Grid,
	List,
} from "lucide-react";
import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { uploadFile } from "@/lib/upload";
import Image from "next/image";
import { toast } from "sonner";
import MarketingAuthGuard from "@/components/marketing/MarketingAuthGuard";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import { VendorAssignmentService } from "@/lib/marketing/vendor-assignment-service"; // Or similar for getting vendors
import { tailorRepository, productRepository } from "@/lib/firestore";
import { TailorStoryboardService } from "@/lib/marketing/tailor-storyboard-service";
import { Tailor, Product } from "@/types";

// Step types
type Step = "select-tailor" | "configure-storyboard";

export default function CreateStoryboardPage() {
	return (
		<MarketingAuthGuard>
			<CreateStoryboardContent />
		</MarketingAuthGuard>
	);
}

function CreateStoryboardContent() {
	const router = useRouter();
	const { marketingUser } = useMarketingAuth();

	// State
	const [step, setStep] = useState<Step>("select-tailor");
	const [loading, setLoading] = useState(false);
	const [vendors, setVendors] = useState<Tailor[]>([]);
	const [selectedVendor, setSelectedVendor] = useState<Tailor | null>(null);
	const [vendorProducts, setVendorProducts] = useState<Product[]>([]);

	// Form State
	const [title, setTitle] = useState("");
	const [tailorBio, setTailorBio] = useState(""); // Editable bio
	const [previewFile, setPreviewFile] = useState<File | null>(null);
	const [bannerFile, setBannerFile] = useState<File | null>(null);
	const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(
		new Set()
	);
	const [searchVendor, setSearchVendor] = useState("");

	// Load Vendors
	useEffect(() => {
		const loadVendors = async () => {
			if (!marketingUser) return;

			try {
				setLoading(true);
				// We can use the assignment service to get vendors assigned to this user (or all if admin)
				// Adapt this based on your actual service method signatures
				// For now, I'll assume we can fetch all tailors if super_admin/team_lead,
				// Since getAssignableVendors returns MarketingAssignment[], we might need to map to Tailors.
				// Simpler approach: Fetch all tailors for now and filter optionally.
				// But to be precise, let's fetch from tailorRepository directly for now to unblock.
				const allTailors = await tailorRepository.getAll();
				setVendors(allTailors);
			} catch (error) {
				console.error("Error loading vendors:", error);
				toast.error("Failed to load vendors");
			} finally {
				setLoading(false);
			}
		};
		loadVendors();
	}, [marketingUser]);

	// Filter vendors
	const filteredVendors = useMemo(() => {
		if (!searchVendor) return vendors;
		const query = searchVendor.toLowerCase();
		return vendors.filter(
			(v) =>
				v.brandName?.toLowerCase().includes(query) ||
				v.first_name?.toLowerCase().includes(query) ||
				v.last_name?.toLowerCase().includes(query)
		);
	}, [vendors, searchVendor]);

	// Handle Vendor Selection
	const handleSelectVendor = async (vendor: Tailor) => {
		try {
			setLoading(true);
			setSelectedVendor(vendor);

			// Initialize Bio
			const initialBio =
				(vendor as any).description ||
				(vendor as any).bio ||
				`A curated collection by ${vendor.brandName}.`;
			setTailorBio(initialBio);

			// Load vendor products
			const products = await productRepository.getByVendor(vendor.id);
			setVendorProducts(products);

			setStep("configure-storyboard");
		} catch (error) {
			console.error("Error loading vendor products:", error);
			toast.error("Failed to load products for this tailor");
		} finally {
			setLoading(false);
		}
	};

	// Save Storyboard
	const handleSave = async () => {
		if (!marketingUser || !selectedVendor) return;

		if (!title.trim()) {
			toast.error("Please enter a title for the storyboard");
			return;
		}

		if (!tailorBio.trim()) {
			toast.error("Please enter a description/bio regarding the tailor");
			return;
		}

		if (!previewFile) {
			toast.error("Please upload a preview image");
			return;
		}
		// Banner is optional or required? User said "need to be a preview image and second image". Let's assume required.
		if (!bannerFile) {
			toast.error("Please upload a banner image");
			return;
		}

		if (vendorProducts.length === 0) {
			toast.error("This vendor has no products to feature");
			return;
		}

		try {
			setLoading(true);

			// Upload Images
			const timestamp = Date.now();
			const previewUrl = await uploadFile(
				previewFile,
				`tailor-storyboards/${selectedVendor.id}/${timestamp}_preview`
			);
			const bannerUrl = await uploadFile(
				bannerFile,
				`tailor-storyboards/${selectedVendor.id}/${timestamp}_banner`
			);

			await TailorStoryboardService.createStoryboard(
				{
					title: title.trim(),
					tailorId: selectedVendor.id,
					tailorName:
						selectedVendor.brandName ||
						`${selectedVendor.first_name} ${selectedVendor.last_name}`,
					tailorDescription: tailorBio.trim(),
					tailorLogo: selectedVendor.brand_logo,
					// Force all products to be included
					productIds: vendorProducts.map((p) => p.product_id),
					active: true,
					previewImage: previewUrl,
					bannerImage: bannerUrl,
				},
				marketingUser.uid
			);

			toast.success("Storyboard created successfully!");
			router.push("/marketing/tailor-storyboards");
		} catch (error) {
			console.error("Error creating storyboard:", error);
			toast.error("Failed to create storyboard");
		} finally {
			setLoading(false);
		}
	};

	// Render Select Tailor Step
	if (step === "select-tailor") {
		return (
			<div className="p-6 max-w-7xl mx-auto">
				<div className="flex items-center gap-4 mb-8">
					<button
						onClick={() => router.back()}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Select Tailor</h1>
						<p className="text-gray-600">
							Choose a tailor to create a storyboard for.
						</p>
					</div>
				</div>

				<div className="relative mb-6 max-w-md">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
					<input
						type="text"
						placeholder="Search vendors..."
						className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-all"
						value={searchVendor}
						onChange={(e) => setSearchVendor(e.target.value)}
					/>
				</div>

				{loading ? (
					<div className="flex justify-center py-12">
						<Loader2 className="w-8 h-8 animate-spin text-gray-400" />
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredVendors.map((vendor) => (
							<div
								key={vendor.id}
								onClick={() => handleSelectVendor(vendor)}
								className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-black hover:shadow-md cursor-pointer transition-all"
							>
								<div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
									{vendor.brand_logo ? (
										<Image
											src={vendor.brand_logo}
											alt={vendor.brandName}
											fill
											className="object-cover"
										/>
									) : (
										<div className="flex items-center justify-center h-full">
											<User className="w-6 h-6 text-gray-400" />
										</div>
									)}
								</div>
								<div>
									<h3 className="font-semibold text-gray-900 line-clamp-1">
										{vendor.brandName || "Unnamed Vendor"}
									</h3>
									<p className="text-sm text-gray-500 line-clamp-1">
										{vendor.city}, {vendor.country}
									</p>
								</div>
							</div>
						))}
						{filteredVendors.length === 0 && (
							<div className="col-span-full py-12 text-center text-gray-500">
								No vendors found matching your search.
							</div>
						)}
					</div>
				)}
			</div>
		);
	}

	// Render Configure Step
	return (
		<div className="p-6 max-w-7xl mx-auto pb-24">
			{/* Top Bar */}
			<div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 z-20 py-4 -mx-6 px-6 border-b border-gray-200 shadow-sm">
				<div className="flex items-center gap-4">
					<button
						onClick={() => setStep("select-tailor")}
						className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white border border-gray-200"
					>
						<ArrowLeft className="w-5 h-5" />
					</button>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">New Storyboard</h1>
						<p className="text-sm text-gray-600">
							for{" "}
							<span className="font-semibold">{selectedVendor?.brandName}</span>
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-gray-600">
						{vendorProducts.length} Products Included
					</span>
					<button
						onClick={handleSave}
						disabled={
							loading || !title || !tailorBio || vendorProducts.length === 0
						}
						className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
					>
						{loading && <Loader2 className="w-4 h-4 animate-spin" />}
						Save Storyboard
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* Settings Sidebar */}
				<div className="lg:col-span-1 space-y-6">
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
						{/* Title Input */}
						<div>
							<label className="block text-sm font-semibold text-gray-900 mb-2">
								Storyboard Title
							</label>
							<input
								type="text"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g. Summer Collection Showcase"
								className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-shadow"
							/>
							<p className="mt-2 text-xs text-gray-500">
								Give this promotion a catchy name for display.
							</p>
						</div>

						{/* Preview Image Input */}
						<div>
							<SingleImageUpload
								label="Preview Image"
								onChange={(file) => setPreviewFile(file)}
								helperText="Main front-facing image (3:4 ratio recommended)"
							/>
						</div>

						{/* Banner Image Input */}
						<div>
							<SingleImageUpload
								label="Banner Image"
								onChange={(file) => setBannerFile(file)}
								helperText="Wide banner image for details page"
							/>
						</div>
					</div>

					{/* Tailor Info Card (Editable) */}
					<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
						<h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
							<Info className="w-4 h-4" />
							About the Tailor
						</h3>

						<div className="flex items-center gap-4 mb-6">
							<div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
								{selectedVendor?.brand_logo ? (
									<Image
										src={selectedVendor.brand_logo}
										alt={selectedVendor.brandName}
										fill
										className="object-cover"
									/>
								) : (
									<div className="flex items-center justify-center h-full">
										<User className="w-8 h-8 text-gray-400" />
									</div>
								)}
							</div>
							<div>
								<div className="font-bold text-gray-900 text-lg">
									{selectedVendor?.brandName}
								</div>
								<div className="text-sm text-gray-500">
									{selectedVendor?.city}, {selectedVendor?.country}
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
								Bio / Description
							</label>
							<textarea
								value={tailorBio}
								onChange={(e) => setTailorBio(e.target.value)}
								rows={6}
								placeholder="Curate a description about this tailor and their collection..."
								className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-shadow resize-none text-sm leading-relaxed"
							/>
							<p className="text-xs text-gray-500">
								You can curate or edit the tailor's story here.
							</p>
						</div>
					</div>
				</div>

				{/* Products Grid */}
				<div className="lg:col-span-2">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-bold text-gray-900">
							Featured Products
						</h2>
						<p className="text-sm text-gray-500">
							All products for this tailor will be displayed.
						</p>
					</div>

					{vendorProducts.length === 0 ? (
						<div className="bg-white p-12 text-center rounded-xl border border-dashed border-gray-300">
							<p className="text-gray-500">
								This tailor has no products listed.
							</p>
						</div>
					) : (
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{vendorProducts.map((product) => {
								return (
									<div
										key={product.product_id}
										className="group relative rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
									>
										{/* Image */}
										<div className="relative aspect-[3/4] bg-gray-100">
											{product.images && product.images[0] ? (
												<Image
													src={product.images[0]}
													alt={product.title}
													fill
													className="object-cover transition-transform duration-500 group-hover:scale-105"
													sizes="(max-width: 640px) 50vw, 33vw"
												/>
											) : (
												<div className="flex items-center justify-center h-full text-gray-300">
													<Grid className="w-8 h-8" />
												</div>
											)}
										</div>

										{/* Info */}
										<div className="p-3 bg-white">
											<h4 className="font-medium text-sm text-gray-900 truncate">
												{product.title}
											</h4>
											<p className="text-xs text-gray-500 mt-1 font-medium">
												{product.price.currency}{" "}
												{product.price.base.toLocaleString()}
											</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
