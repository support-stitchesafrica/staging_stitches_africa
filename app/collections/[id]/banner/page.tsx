"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { useCollectionsAuth } from "@/contexts/CollectionsAuthContext";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { collectionRepository } from "@/lib/firestore";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function CollectionBannerPage() {
	const params = useParams();
	const router = useRouter();
	const { user } = useCollectionsAuth();
	const collectionId = params.id as string;

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [collection, setCollection] = useState<any>(null);

	// Form state
	const [bannerImage, setBannerImage] = useState<File | null>(null);
	const [bannerPreview, setBannerPreview] = useState<string>("");
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");

	// Load collection data
	useEffect(() => {
		const loadCollection = async () => {
			try {
				setLoading(true);
				const collectionData = await collectionRepository.getById(collectionId);

				if (!collectionData) {
					toast.error("Collection not found");
					router.push("/collections");
					return;
				}

				setCollection(collectionData);

				// If banner exists, load it
				if (collectionData.thumbnail) {
					setBannerPreview(collectionData.thumbnail);
				}
				if (collectionData.title) {
					setTitle(collectionData.title);
				}
				if (collectionData.description) {
					setDescription(collectionData.description);
				}
			} catch (error) {
				console.error("Error loading collection:", error);
				toast.error("Failed to load collection");
			} finally {
				setLoading(false);
			}
		};

		if (collectionId && user) {
			loadCollection();
		}
	}, [collectionId, user, router]);

	// Handle image selection
	const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Please select an image file");
			return;
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			toast.error("Image size must be less than 5MB");
			return;
		}

		setBannerImage(file);

		// Create preview
		const reader = new FileReader();
		reader.onloadend = () => {
			setBannerPreview(reader.result as string);
		};
		reader.readAsDataURL(file);
	};

	// Handle save and publish
	const handleSave = async () => {
		if (!bannerImage && !bannerPreview) {
			toast.error("Please upload a banner image");
			return;
		}

		if (!user) {
			toast.error("You must be logged in to publish");
			return;
		}

		try {
			setSaving(true);

			let thumbnailUrl = bannerPreview;

			// Upload new image if one was selected
			if (bannerImage) {
				const storageRef = ref(
					storage,
					`collections/${user.uid}/${collectionId}/banner-${Date.now()}.jpg`,
				);

				await uploadBytes(storageRef, bannerImage);
				thumbnailUrl = await getDownloadURL(storageRef);
			}

			// Update collection document with banner and publish
			// Update both 'name' and 'title' for consistency
			const collectionTitle =
				title.trim() || collection?.name || "Untitled Collection";
			const updateData = {
				thumbnail: thumbnailUrl,
				name: collectionTitle,
				title: collectionTitle,
				description: description.trim(),
				published: true,
				publishedAt: new Date(),
			};

			await collectionRepository.update(collectionId, updateData);

			toast.success("Collection published successfully!");

			// Navigate to collections dashboard
			router.push("/collections");
		} catch (error) {
			console.error("Error saving banner:", error);
			toast.error("Failed to publish collection");
		} finally {
			setSaving(false);
		}
	};

	// Handle skip - save without banner (unpublished)
	const handleSkip = () => {
		// Skip banner and go to collections dashboard (collection remains unpublished)
		toast.info("Collection saved as draft. Add a banner to publish it.");
		router.push("/collections");
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
					<p className="text-gray-600">Loading collection...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<Link
						href="/collections"
						className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft className="w-4 h-4" />
						Back to Collections
					</Link>

					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Collection Banner
					</h1>
					<p className="text-gray-600">
						Add a banner image and description for your collection
					</p>
				</div>

				{/* Banner Upload Section */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Banner Image
					</h2>

					{/* Image Preview or Upload Area */}
					{bannerPreview ? (
						<div className="space-y-4">
							<div className="relative aspect-[21/9] rounded-lg overflow-hidden border-2 border-gray-200">
								<Image
									src={bannerPreview}
									alt="Banner preview"
									fill
									className="object-cover"
								/>
							</div>
							<button
								onClick={() => {
									setBannerImage(null);
									setBannerPreview("");
								}}
								className="text-sm text-red-600 hover:text-red-700 font-medium"
							>
								Remove Image
							</button>
						</div>
					) : (
						<label className="block">
							<div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer">
								<ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
								<p className="text-sm text-gray-600 mb-2">
									Click to upload or drag and drop
								</p>
								<p className="text-xs text-gray-500">
									PNG, JPG up to 5MB (Recommended: 2100x900px)
								</p>
							</div>
							<input
								type="file"
								accept="image/*"
								onChange={handleImageSelect}
								className="hidden"
							/>
						</label>
					)}
				</div>

				{/* Banner Details Section */}
				<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Banner Details
					</h2>

					<div className="space-y-4">
						{/* Title */}
						<div>
							<label
								htmlFor="title"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Title (Optional)
							</label>
							<input
								type="text"
								id="title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								placeholder="e.g., Summer Collection 2024"
								maxLength={50}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
							/>
							<p className="mt-1 text-xs text-gray-500">
								{title.length}/50 characters
							</p>
						</div>

						{/* Description */}
						<div>
							<label
								htmlFor="description"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								Description (Optional)
							</label>
							<textarea
								id="description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="e.g., Discover our latest summer styles"
								rows={3}
								maxLength={150}
								className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-black"
							/>
							<p className="mt-1 text-xs text-gray-500">
								{description.length}/150 characters
							</p>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex gap-4">
					<button
						onClick={handleSkip}
						disabled={saving}
						className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Skip for Now
					</button>
					<button
						onClick={handleSave}
						disabled={saving || (!bannerImage && !bannerPreview)}
						className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{saving ? (
							<>
								<Loader2 className="w-5 h-5 animate-spin" />
								Publishing...
							</>
						) : (
							<>
								<Save className="w-5 h-5" />
								Publish Collection
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
