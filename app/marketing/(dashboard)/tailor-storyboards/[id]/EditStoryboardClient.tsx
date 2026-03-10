"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Loader2,
	User,
	Tag,
	Calendar,
	Save,
	Trash,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { format } from "date-fns";
import MarketingAuthGuard from "@/components/marketing/MarketingAuthGuard";
import { useMarketingAuth } from "@/contexts/MarketingAuthContext";
import { TailorStoryboardService } from "@/lib/marketing/tailor-storyboard-service";
import { productRepository } from "@/lib/firestore";
import { TailorStoryboard } from "@/types/tailor-storyboard";
import { Product } from "@/types";
import { SingleImageUpload } from "@/components/common/SingleImageUpload";
import { uploadFile } from "@/lib/upload";

export function EditStoryboardClient({ id }: { id: string }) {
	const router = useRouter();
	const { marketingUser } = useMarketingAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [storyboard, setStoryboard] = useState<TailorStoryboard | null>(null);
	const [vendorProducts, setVendorProducts] = useState<Product[]>([]);

	// Form State
	const [title, setTitle] = useState("");
	const [tailorBio, setTailorBio] = useState("");
	const [previewImage, setPreviewImage] = useState("");
	const [bannerImage, setBannerImage] = useState("");
	const [previewFile, setPreviewFile] = useState<File | null>(null);
	const [bannerFile, setBannerFile] = useState<File | null>(null);

	// Load Storyboard and Products
	useEffect(() => {
		const fetchData = async () => {
			if (!id) return;

			try {
				setLoading(true);
				// Fetch Storyboard
				const data = await TailorStoryboardService.getStoryboardById(id);

				if (!data) {
					toast.error("Storyboard not found");
					router.push("/marketing/tailor-storyboards");
					return;
				}

				setStoryboard(data);
				setTitle(data.title);
				setTailorBio(data.tailorDescription);
				setPreviewImage(data.previewImage || "");
				setBannerImage(data.bannerImage || "");

				// Fetch Products for the tailor attached to this storyboard
				const products = await productRepository.getByVendor(data.tailorId);
				setVendorProducts(products);
			} catch (err) {
				console.error("Error fetching storyboard details:", err);
				toast.error("Failed to load details");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [id, router]);

	const handleUpdate = async () => {
		if (!storyboard) return;

		if (!title.trim() || !tailorBio.trim()) {
			toast.error("Please fill in all required fields");
			return;
		}

		if (vendorProducts.length === 0) {
			toast.error("This vendor has no products to feature");
			return;
		}

		try {
			setSaving(true);

			let finalPreviewUrl = previewImage;
			let finalBannerUrl = bannerImage;
			const timestamp = Date.now();

			if (previewFile) {
				finalPreviewUrl = await uploadFile(
					previewFile,
					`tailor-storyboards/${storyboard.tailorId}/${timestamp}_preview`
				);
			}

			if (bannerFile) {
				finalBannerUrl = await uploadFile(
					bannerFile,
					`tailor-storyboards/${storyboard.tailorId}/${timestamp}_banner`
				);
			}

			await TailorStoryboardService.updateStoryboard(storyboard.id, {
				title: title.trim(),
				tailorDescription: tailorBio.trim(),
				productIds: vendorProducts.map((p) => p.product_id), // Force update to all current vendor products
				tailorId: storyboard.tailorId, // Required by type, but unchanged
				tailorName: storyboard.tailorName, // Unchanged
				tailorLogo: storyboard.tailorLogo, // Unchanged
				previewImage: finalPreviewUrl,
				bannerImage: finalBannerUrl,
			});

			toast.success("Storyboard updated successfully");
			router.push("/marketing/tailor-storyboards");
		} catch (error) {
			console.error("Error updating storyboard:", error);
			toast.error("Failed to update storyboard");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (
			!storyboard ||
			!confirm("Are you sure you want to delete this storyboard?")
		)
			return;

		try {
			setSaving(true);
			await TailorStoryboardService.deleteStoryboard(storyboard.id);
			toast.success("Storyboard deleted");
			router.push("/marketing/tailor-storyboards");
		} catch (error) {
			console.error("Error deleting storyboard:", error);
			toast.error("Failed to delete storyboard");
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-8 h-8 animate-spin text-gray-500" />
			</div>
		);
	}

	if (!storyboard) return null;

	return (
		<MarketingAuthGuard>
			<div className="p-6 max-w-7xl mx-auto pb-24">
				{/* Header */}
				<div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 z-20 py-4 -mx-6 px-6 border-b border-gray-200 shadow-sm">
					<div className="flex items-center gap-4">
						<button
							onClick={() => router.back()}
							className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white border border-gray-200"
						>
							<ArrowLeft className="w-5 h-5" />
						</button>
						<div>
							<h1 className="text-2xl font-bold text-gray-900">
								Edit Storyboard
							</h1>
							<p className="text-sm text-gray-600">{storyboard.tailorName}</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<button
							onClick={handleDelete}
							disabled={saving}
							className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
							title="Delete Storyboard"
						>
							<Trash className="w-5 h-5" />
						</button>
						<button
							onClick={handleUpdate}
							disabled={saving}
							className="px-6 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
						>
							{saving && <Loader2 className="w-4 h-4 animate-spin" />}
							<Save className="w-4 h-4" />
							Save Changes
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Sidebar */}
					<div className="lg:col-span-1 space-y-6">
						{/* Metadata Card */}
						<div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Title
								</label>
								<input
									type="text"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none"
								/>
							</div>

							<div>
								<SingleImageUpload
									label="Preview Image"
									value={previewImage}
									onChange={(file) => {
										setPreviewFile(file);
										if (!file) setPreviewImage("");
									}}
									helperText="Main front-facing image"
								/>
							</div>

							<div>
								<SingleImageUpload
									label="Banner Image"
									value={bannerImage}
									onChange={(file) => {
										setBannerFile(file);
										if (!file) setBannerImage("");
									}}
									helperText="Wide banner image"
								/>
							</div>

							<div className="space-y-2">
								<label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
									Bio / Description{" "}
									<span className="text-gray-400 font-normal normal-case ml-1">
										(Editable)
									</span>
								</label>
								<textarea
									value={tailorBio}
									onChange={(e) => setTailorBio(e.target.value)}
									rows={8}
									className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black outline-none transition-shadow resize-none text-sm leading-relaxed"
								/>
							</div>

							<div className="pt-4 border-t border-gray-100 flex flex-col gap-2 text-sm text-gray-500">
								<div className="flex items-center gap-2">
									<User className="w-4 h-4" />
									<span>Created by: {storyboard.createdBy || "Unknown"}</span>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="w-4 h-4" />
									<span>
										Created: {format(storyboard.createdAt.toDate(), "PPP")}
									</span>
								</div>
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
								Includes all {vendorProducts.length} products from this tailor.
							</p>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
							{vendorProducts.map((product) => (
								<div
									key={product.product_id}
									className="group relative rounded-xl border border-gray-200 overflow-hidden bg-white hover:shadow-md transition-shadow"
								>
									<div className="relative aspect-[3/4] bg-gray-100">
										{product.images?.[0] ? (
											<Image
												src={product.images[0]}
												alt={product.title}
												fill
												className="object-cover transition-transform duration-500 group-hover:scale-105"
												sizes="(max-width: 640px) 50vw, 33vw"
											/>
										) : (
											<div className="flex items-center justify-center h-full text-gray-300">
												<Tag className="w-8 h-8" />
											</div>
										)}
									</div>

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
							))}
						</div>
					</div>
				</div>
			</div>
		</MarketingAuthGuard>
	);
}
