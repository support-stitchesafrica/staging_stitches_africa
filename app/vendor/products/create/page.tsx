"use client";
import { useEffect, useRef, useState } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ShippingSection, {
	cleanShippingData,
	validateShippingData,
} from "@/components/ShippingSection";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
	ArrowLeft,
	ArrowRight,
	Upload,
	X,
	Package,
	ImageIcon,
	Ruler,
	Plus,
	Eye,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { addTailorWork } from "@/vendor-services/addTailorWork";
import { toast } from "sonner";
import {
	processImagesForPreview,
	uploadProcessedImages,
	type ProcessedImageData,
} from "@/vendor-services/uploadImages";
import { auth } from "@/firebase";
import { ImageComparisonSlider } from "@/components/ui/image-comparison-slider";
import { getTailorKyc } from "@/vendor-services/tailorService";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

export interface ProductFormData {
	product_id?: string; // generated automatically in addTailorWork
	type: "bespoke" | "ready-to-wear" | "";
	title: string;
	price?: {
		base: number;
		discount?: number;
		currency: string;
	}; // string for form input, convert to number before Firestore
	discount: number; // string for form input, convert to number before Firestore
	description: string;
	category: "men" | "women" | "kids" | "unisex" | "";
	wear_quantity: number; // string for form input, convert to number before Firestore
	wear_category: string;
	tags: string[]; // comma-separated string in form, split to string[] before Firestore
	keywords: string | string[]; // allow both string and string[] for form handling
	images: string[]; // image URLs after upload
	sizes: { size: string; quantity: number }[];
	customSizes: boolean;
	tailor: string; // tailor name
	tailor_id?: string; // set automatically from localStorage/auth
	shipping?: { tierKey: string; manualOverride: boolean }; // optional shipping data added to match payload
	userCustomSizes?: { size: string; quantity: number }[];
	userSizes?: { size: string; quantity: number }[];
	availability?: string;
	deliveryTimeline?: string;
	careInstructions?: string;
	rtwOptions?: {
		colors?: string[];
		fabric?: string;
		season?: string;
		sizes?: string[];
	};
	bespokeOptions?: {
		customization?: {
			fabricChoices?: string[];
			styleOptions?: string[];
			finishingOptions?: string[];
		};
		measurementsRequired?: string[];
		productionTime?: string;
		depositAllowed?: boolean;
		notesEnabled?: boolean;
	};
	approvalStatus?: "pending" | "approved" | "rejected";
	// Multiple pricing support
	enableMultiplePricing?: boolean;
	individualItems?: {
		id: string;
		name: string;
		price: number;
	}[];
	metric_size_guide?: SizeGuide;
}

const availableSizes = {
	men: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"],
	women: ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"],
	kids: [
		"2T",
		"3T",
		"4T",
		"5T",
		"6",
		"7",
		"8",
		"10",
		"12",
		"14",
		"16",
		"Free Size",
	],
	unisex: [
		"XS",
		"S",
		"M",
		"L",
		"XL",
		"XXL",
		"XXXL",
		"2T",
		"3T",
		"4T",
		"5T",
		"6",
		"7",
		"8",
		"10",
		"12",
		"14",
		"16",
		"Free Size",
	],
};

import { SizeGuideInput } from "@/components/vendor/SizeGuideInput";
import { SizeGuide } from "@/types";

export default function CreateProduct() {
	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const router = useRouter();
	const [newTag, setNewTag] = useState("");
	const [newSize, setNewSize] = useState("");
	const [newColor, setNewColor] = useState("");
	const [shipping, setShipping] = useState({
		tierKey: "",
		manualOverride: false,
	});

	// Helper function to count words
	const countWords = (text: string): number => {
		return text
			.trim()
			.split(/\s+/)
			.filter((word) => word.length > 0).length;
	};

	const [formData, setFormData] = useState<ProductFormData>({
		title: "",
		description: "",
		price: {
			base: 0,
			currency: "USD",
		},
		discount: 0,
		wear_quantity: 0,
		wear_category: "",
		category: "",
		tags: [],
		sizes: [],
		images: [], // will hold File[] until upload
		tailor: "",
		tailor_id: "",
		type: "", // "bespoke" | "ready-to-wear"
		userCustomSizes: undefined, // Start undefined so checkbox is unchecked
		userSizes: [] as { size: string; quantity: number }[],
		keywords: "", // initialize as string for input
		customSizes: false,
		availability: "",
		deliveryTimeline: "",
		careInstructions: "",
		rtwOptions: {
			colors: [],
			fabric: "",
			season: "",
			sizes: [],
		},
		bespokeOptions: {
			customization: {
				fabricChoices: [],
				styleOptions: [],
				finishingOptions: [],
			},
			measurementsRequired: [],
			productionTime: "",
		},
		enableMultiplePricing: false,
		individualItems: [],
		metric_size_guide: { columns: [], rows: [] },
	});

	const activeStepRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (activeStepRef.current) {
			activeStepRef.current.scrollIntoView({
				behavior: "smooth",
				inline: "center", // keeps it centered horizontally
				block: "nearest",
			});
		}
	}, [currentStep]);

	useEffect(() => {
		const fetchTailorDetails = async () => {
			const tailorId = localStorage.getItem("tailorUID");
			if (tailorId) {
				try {
					const kyc = await getTailorKyc(tailorId);
					if (kyc?.brandName) {
						setFormData((prev) => ({
							...prev,
							tailor: kyc.brandName || "",
							tailor_id: tailorId,
						}));
					}
				} catch (error) {
					console.error("Failed to fetch tailor details", error);
				}
			}
		};
		fetchTailorDetails();
	}, []);

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [itemErrors, setItemErrors] = useState<{
		[itemId: string]: { name?: string; price?: string };
	}>({});
	const [imagePreview, setImagePreview] = useState<string[]>([]);
	const [processedImages, setProcessedImages] = useState<ProcessedImageData[]>(
		[],
	);
	const [processingImages, setProcessingImages] = useState(false);
	const [currentProcessingIndex, setCurrentProcessingIndex] = useState(0);
	const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
	const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
		null,
	);
	// Track user's choice per image: 'original' or 'processed' (bg removed + 3D enhanced)
	const [imageChoices, setImageChoices] = useState<
		Record<number, "original" | "processed">
	>({});
	const [useAIProcessing, setUseAIProcessing] = useState(true);

	const updateFormData = (newData: Partial<ProductFormData>) => {
		setFormData((prev) => ({ ...prev, ...newData }));
	};

	/**
	 * Validate form fields step by step
	 */
	const validateStep = (step: number) => {
		const newErrors: Record<string, string> = {};

		// Step 1: Type selection
		if (step === 1) {
			if (!formData.type) newErrors.type = "Product type is required";
		}

		// Step 2: Basic details
		if (step === 2) {
			if (!formData.title.trim()) {
				newErrors.title = "Title is required";
			}

			if (!formData.description.trim()) {
				newErrors.description = "Description is required";
			} else if (formData.description.trim().length < 50) {
				newErrors.description =
					"Description must be at least 50 characters long";
			} else if (countWords(formData.description) > 150) {
				newErrors.description = "Description must not exceed 150 words";
			}

			if (!formData.category) {
				newErrors.category = "Category is required";
			}
		}

		// Step 3: Pricing
		if (step === 3) {
			if (!formData.price?.base || formData.price.base <= 0) {
				newErrors.price = "Base price must be greater than 0";
			}
			if (!formData.price?.currency) {
				newErrors.currency = "Currency is required";
			}
			if (!formData.deliveryTimeline) {
				newErrors.deliveryTimeline = "Delivery timeline is required";
			}

			// Multiple pricing validation
			if (formData.enableMultiplePricing) {
				if (
					!formData.individualItems ||
					formData.individualItems.length === 0
				) {
					newErrors.individualItems =
						"At least one item is required when multiple pricing is enabled";
				} else {
					// Validate each individual item
					const itemErrors: {
						[itemId: string]: { name?: string; price?: string };
					} = {};
					let totalIndividualPrice = 0;

					formData.individualItems.forEach((item) => {
						// Validate item name
						if (!item.name || item.name.trim() === "") {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].name = "Item name is required";
						} else if (item.name.trim().length < 2) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].name =
								"Item name must be at least 2 characters";
						}

						// Validate item price
						const itemPrice = item.price;
						const normalizedItemPrice = (() => {
							if (itemPrice === null || itemPrice === undefined)
								return undefined;
							const strValue = String(itemPrice);
							if (strValue === "") return undefined;
							return Number(itemPrice);
						})();
						const isItemPriceEmpty =
							normalizedItemPrice === undefined || isNaN(normalizedItemPrice);

						if (isItemPriceEmpty) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].price = "Price is required";
						} else if (isNaN(normalizedItemPrice!)) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].price = "Price must be a number";
						} else if (normalizedItemPrice! < 0) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].price = "Price cannot be negative";
						} else {
							// Add to total for validation
							totalIndividualPrice += normalizedItemPrice!;
						}
					});


					if (Object.keys(itemErrors).length > 0) {
						setItemErrors(itemErrors);
					} else {
						setItemErrors({});
					}
				}
			}
		}

		// Step 4: Media
		if (step === 4) {
			if (!formData.images || formData.images.length === 0) {
				newErrors.images = "Please upload at least one image or a video.";
				setErrors(newErrors);
				return false;
			}
		}

		// Step 5: Sizes & Options
		if (step === 5) {
			if (formData.type === "bespoke") {
				// For bespoke, either custom measurements OR production time is sufficient
				if (!formData.customSizes && !formData.bespokeOptions?.productionTime) {
					newErrors.productionTime =
						"Production time is required for bespoke products";
				}
			}

			if (formData.type === "ready-to-wear") {
				// Check if any size option is provided
				const hasStandardSizes = formData.sizes && formData.sizes.length > 0;
				const hasUserCustomSizes =
					formData.userCustomSizes &&
					formData.userCustomSizes.length > 0 &&
					formData.userCustomSizes.some(
						(size) => String(size.size).trim() !== "",
					);
				const usingUserCustomSizesFlag = formData.userCustomSizes !== undefined; // user opted into custom sizes (even if empty)
				const hasCustomSizes = formData.customSizes;

				// At least one size option must be provided
				if (!hasStandardSizes && !hasUserCustomSizes && !hasCustomSizes) {
					newErrors.sizes = "Please select sizes or enable custom sizing";
				} else {
					// Validate each selected standard size has a positive quantity and a label
					if (hasStandardSizes) {
						const invalid = formData.sizes.some(
							(s) =>
								!s.size ||
								String(s.size).trim() === "" ||
								Number(s.quantity) <= 0 ||
								isNaN(Number(s.quantity)),
						);
						if (invalid) {
							newErrors.sizes =
								"Each selected size must include a label and a quantity greater than 0";
						}
					}

					// If user explicitly enabled "user custom sizes" but provided none
					if (usingUserCustomSizesFlag && !hasUserCustomSizes) {
						newErrors.sizes =
							"Please add at least one custom size with a label and a quantity greater than 0";
					}
					// Validate user custom sizes entries if provided
					if (hasUserCustomSizes) {
						const invalidUser = formData.userCustomSizes!.some(
							(u) =>
								!u.size ||
								String(u.size).trim() === "" ||
								Number(u.quantity) <= 0 ||
								isNaN(Number(u.quantity)),
						);
						if (invalidUser) {
							newErrors.sizes =
								"All custom sizes must include a size label and a quantity greater than 0";
						}
					}
				}
			}
		}

		// Step 6: Size Guide (Optional)
		if (step === 6) {
			// No validation needed for now
		}

		// Step 7: Final checks (keywords, tags, etc.)
		if (step === 7) {
			if (formData.type === "bespoke") {
				// bespoke must have customization & measurements
				if (
					(!formData.bespokeOptions?.measurementsRequired ||
						formData.bespokeOptions.measurementsRequired.length === 0) &&
					!formData.customSizes
				) {
					newErrors.sizes =
						"Bespoke products require custom measurements or size details";
				}
				if (!formData.bespokeOptions?.productionTime) {
					newErrors.productionTime = "Production time is required for bespoke";
				}
			}
			if (!formData.tags || formData.tags.length === 0) {
				newErrors.tags = "Please add at least one tag/keyword";
			}
			// Fabric is only required if not using custom measurements
			if (!formData.customSizes && !formData.rtwOptions?.fabric?.trim()) {
				newErrors.fabric = "Fabric is required for ready-to-wear products";
			}
		}

		// Step 8: Shipping
		if (step === 8) {
			const validationError = validateShippingData(shipping);
			if (validationError) {
				newErrors.shipping = validationError;
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	/**
	 * Step navigation
	 */
	// Helper to find the index in processedImages matching a preview URL
	const getProcessedImageIndex = (previewUrl: string) => {
		return processedImages.findIndex(
			(p) => p.original === previewUrl || p.enhanced === previewUrl,
		);
	};

	const uploadFinalImages = async () => {
		const tailorId = localStorage.getItem("tailorUID");
		if (!tailorId) {
			toast.error("No tailor ID found");
			return false;
		}

		if (processedImages.length === 0) {
			// If no new images to upload, rely on existing formData.images logic?
			// But for CreateProduct, images might be empty initially.
			return true;
		}

		try {
			setUploadingImages(true);
			setUploadProgress(0);
			toast.loading(
				`Uploading ${processedImages.length} image(s) to cloud...`,
				{
					id: "image-upload",
				},
			);

			// Simulate progress
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => Math.min(prev + 10, 90));
			}, 300);

			// Upload processed images to Firebase with user's choices
			const uploadedUrls = await uploadProcessedImages(
				processedImages,
				tailorId,
				imageChoices,
			);

			clearInterval(progressInterval);
			setUploadProgress(100);

			// Create a map of blob/preview Url -> uploadedUrl
			const blobToUrlMap = new Map<string, string>();
			processedImages.forEach((img, index) => {
				if (uploadedUrls[index]) {
					if (img.original) blobToUrlMap.set(img.original, uploadedUrls[index]);
					if (img.enhanced) blobToUrlMap.set(img.enhanced, uploadedUrls[index]);
					// Also map the processed/enhanced/original file object URL if possible?
					// The imagePreview contains strings which are strictly matched here.
				}
			});

			// Reconstruct images list from imagePreview to maintain order and validity
			const newImagesList = imagePreview
				.map((previewUrl) => {
					// If it's already a remote URL (and not a blob/data uri), keep it
					if (
						previewUrl.startsWith("http") &&
						!previewUrl.includes("localhost") &&
						!previewUrl.includes("base64")
					) {
						return previewUrl;
					}
					// Otherwise replace with uploaded URL
					return blobToUrlMap.get(previewUrl) || "";
				})
				.filter((url) => url !== ""); // Remove any failed mappings

			// Update form data with final ordered list
			setFormData((prev) => ({
				...prev,
				images: newImagesList,
			}));

			// Fix: Update imagePreview with the uploaded URLs so we don't accidentally save blobs later
			setImagePreview(newImagesList);

			// Clear processed images after upload
			setProcessedImages([]);

			toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)!`, {
				id: "image-upload",
			});

			return true;
		} catch (err) {
			console.error("Upload failed:", err);
			toast.error("Image upload failed. Please try again.", {
				id: "image-upload",
			});
			return false;
		} finally {
			setUploadingImages(false);
			setUploadProgress(0);
		}
	};

	const nextStep = async () => {
		// Special handling for step 4 (image upload)
		if (currentStep === 4) {
			if (processedImages.length > 0) {
				// Upload images before proceeding
				const uploadSuccess = await uploadFinalImages();
				if (!uploadSuccess) return;
			} else {
				// No new images to upload, but we must ensure formData.images matches imagePreview order
				// (in case user reordered images without adding new ones)
				setFormData((prev) => ({
					...prev,
					images: imagePreview,
				}));
			}
		}

		if (validateStep(currentStep)) {
			setCurrentStep((prev) => Math.min(prev + 1, 8)); // Updated max steps to 8
		}
	};

	const prevStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	const removeImage = (index: number) => {
		const previewUrl = imagePreview[index];
		const processedIndex = getProcessedImageIndex(previewUrl);

		// Do NOT update formData.images here. Sync happens in nextStep.
		// setFormData((prev) => ({
		// 	...prev,
		// 	images: prev.images.filter((_, i) => i !== index),
		// }));

		setImagePreview((prev) => prev.filter((_, i) => i !== index));

		if (processedIndex !== -1) {
			setProcessedImages((prev) => prev.filter((_, i) => i !== processedIndex));

			// Update imageChoices: remove the deleted index and reindex remaining choices
			setImageChoices((prev) => {
				const updated: Record<number, "original" | "processed"> = {};
				Object.keys(prev).forEach((key) => {
					const idx = Number(key);
					if (idx < processedIndex) {
						updated[idx] = prev[idx];
					} else if (idx > processedIndex) {
						updated[idx - 1] = prev[idx];
					}
				});
				return updated;
			});
		}
	};

	const handleSizeToggle = (size: string) => {
		setFormData((prev) => {
			const existing = prev.sizes.find((s) => s.size === size);
			if (existing) {
				// remove if already selected
				return {
					...prev,
					sizes: prev.sizes.filter((s) => s.size !== size),
				};
			} else {
				// add with default quantity 1
				return {
					...prev,
					sizes: [...prev.sizes, { size, quantity: 1 }],
				};
			}
		});
	};

	const handleSizeQuantityChange = (size: string, quantity: number) => {
		setFormData((prev) => ({
			...prev,
			sizes: prev.sizes.map((s) => (s.size === size ? { ...s, quantity } : s)),
		}));
	};

	const handleImageUpload = async (files: FileList | null) => {
		if (!files) return;

		const maxFiles = 5 - imagePreview.length;
		const selectedFiles = Array.from(files).slice(0, maxFiles);

		if (selectedFiles.length === 0) {
			toast.error("Maximum 5 images allowed");
			return;
		}

		try {
			if (useAIProcessing) {
				// AI Processing Mode
				setProcessingImages(true);
				setCurrentProcessingIndex(0);
				toast.loading(`Processing ${selectedFiles.length} image(s)...`, {
					id: "image-processing",
				});

				// Process images with background removal
				const processed: ProcessedImageData[] = [];
				for (let i = 0; i < selectedFiles.length; i++) {
					setCurrentProcessingIndex(i + 1);
					toast.loading(
						`Removing background from image ${i + 1}/${
							selectedFiles.length
						}...`,
						{
							id: "image-processing",
						},
					);
					const processedData = await processImagesForPreview([
						selectedFiles[i],
					]);
					processed.push(...processedData);
				}

				// Save processed images to state for preview
				const currentProcessedCount = processedImages.length;
				setProcessedImages((prev) => [...prev, ...processed]);
				// Show enhanced version by default in preview
				setImagePreview((prev) => [
					...prev,
					...processed.map((p) => p.enhanced),
				]);

				// Initialize default choice as 'processed' for new images
				const newChoices: Record<number, "original" | "processed"> = {};
				processed.forEach((_, i) => {
					newChoices[currentProcessedCount + i] = "processed";
				});
				setImageChoices((prev) => ({ ...prev, ...newChoices }));

				toast.success(
					`Successfully processed ${processed.length} image(s)! Review and upload when ready.`,
					{
						id: "image-processing",
					},
				);
			} else {
				// Original Upload Mode
				toast.loading(
					`Uploading ${selectedFiles.length} original image(s)...`,
					{
						id: "image-processing",
					},
				);

				// Create preview URLs for original images
				const newPreviews: string[] = [];
				const mockProcessedData: ProcessedImageData[] = [];

				selectedFiles.forEach((file) => {
					const previewUrl = URL.createObjectURL(file);
					newPreviews.push(previewUrl);

					// Create mock processed data where both original and enhanced are the same
					mockProcessedData.push({
						original: previewUrl,
						cleaned: previewUrl, // Same as original for non-AI mode
						enhanced: previewUrl, // Same as original for non-AI mode
						originalFile: file,
						cleanedFile: file, // Same file for non-AI mode
						enhancedFile: file, // Same file for non-AI mode
					});
				});

				// Save to state
				const currentProcessedCount = processedImages.length;
				setProcessedImages((prev) => [...prev, ...mockProcessedData]);
				setImagePreview((prev) => [...prev, ...newPreviews]);

				// Set all choices as 'original' for non-AI mode
				const newChoices: Record<number, "original" | "processed"> = {};
				mockProcessedData.forEach((_, i) => {
					newChoices[currentProcessedCount + i] = "original";
				});
				setImageChoices((prev) => ({ ...prev, ...newChoices }));

				toast.success(
					`Successfully uploaded ${selectedFiles.length} original image(s)!`,
					{
						id: "image-processing",
					},
				);
			}
		} catch (err) {
			console.error("Processing failed:", err);
			toast.error("Image processing failed. Please try again.", {
				id: "image-processing",
			});
		} finally {
			setProcessingImages(false);
			setCurrentProcessingIndex(0);
		}
	};

	const handleCustomSizeChange = (
		index: number,
		key: "size" | "quantity",
		value: string | number,
	) => {
		setFormData((prev) => {
			const updated = [...(prev.userCustomSizes || [])];
			(updated[index] as any)[key] = value;
			return { ...prev, userCustomSizes: updated };
		});
	};

	const addCustomSize = () => {
		setFormData((prev) => ({
			...prev,
			userCustomSizes: [
				...(prev.userCustomSizes || []),
				{ size: "", quantity: 1 },
			],
		}));
	};

	const removeCustomSize = (index: number) => {
		setFormData((prev) => {
			const updated = (prev.userCustomSizes || []).filter(
				(_, i) => i !== index,
			);
			return { ...prev, userCustomSizes: updated };
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (isLoading) return; // 🚀 prevents double submission

		if (!validateStep(6)) {
			toast.error("Please fix all validation errors before submitting");
			return;
		}

		const validationError = validateShippingData(shipping);
		if (validationError) {
			alert(validationError);
			return;
		}
		setIsLoading(true);
		const tailorId = localStorage.getItem("tailorUID");
		if (!tailorId) {
			toast.error("No tailor ID found");
			setIsLoading(false);
			return;
		}

		try {
			// Convert sizes to the database format with quantities
			// For ready-to-wear include both standard sizes and userCustomSizes if present
			let sizesForAPI: { label: string; quantity: number }[] = [];
			if (formData.type === "ready-to-wear") {
				if (formData.sizes && formData.sizes.length > 0) {
					sizesForAPI = formData.sizes
						.filter(
							(s) =>
								s.size &&
								String(s.size).trim() !== "" &&
								Number(s.quantity) > 0,
						)
						.map((s) => ({ label: s.size, quantity: Number(s.quantity) }));
				}
				if (formData.userCustomSizes && formData.userCustomSizes.length > 0) {
					const custom = formData.userCustomSizes
						.filter(
							(u) =>
								u.size &&
								String(u.size).trim() !== "" &&
								Number(u.quantity) > 0,
						)
						.map((u) => ({
							label: String(u.size),
							quantity: Number(u.quantity),
						}));
					sizesForAPI = [...sizesForAPI, ...custom];
				}
			} else {
				// For bespoke or others, still map sizes if present
				sizesForAPI = (formData.sizes || []).map((s) => ({
					label: s.size,
					quantity: s.quantity || 1,
				}));
			}

			// Final guard: sizesForAPI must have entries for ready-to-wear unless customSizes
			if (
				formData.type === "ready-to-wear" &&
				!formData.customSizes &&
				(!sizesForAPI || sizesForAPI.length === 0)
			) {
				toast.error(
					"Please provide valid sizes with quantities before submitting",
				);
				setIsLoading(false);
				return;
			}

			// Ensure cleanShippingData result matches the ProductFormData.shipping type
			const finalShippingRaw = cleanShippingData(shipping);
			const finalShipping =
				typeof finalShippingRaw === "object" &&
				finalShippingRaw !== null &&
				"tierKey" in finalShippingRaw &&
				"manualOverride" in finalShippingRaw
					? (finalShippingRaw as { tierKey: string; manualOverride: boolean })
					: undefined;

			// Extract size labels as array of strings for rtwOptions.sizes
			const sizeLabels: string[] = sizesForAPI.map((s) => String(s.label));

			const payload: ProductFormData = {
				...formData,
				product_id: formData.product_id ?? "", // Ensure product_id is always a string
				shipping: finalShipping,
				tailor_id: tailorId,
				price: {
					base: formData.price?.base || 0,
					discount: formData.price?.discount || undefined,
					currency: formData.price?.currency || "USD",
				},
				discount: Number(formData.discount),
				wear_quantity: Number(formData.wear_quantity),
				tags: formData.tags.map((tag) => tag.trim()),
				keywords:
					typeof formData.keywords === "string"
						? formData.keywords.split(",").map((k) => k.trim())
						: formData.keywords,
				images: formData.images, // imageUrls is string[]
				sizes: sizesForAPI as any, // Override the sizes with the proper format
				userSizes: formData.userSizes, // Include userSizes for custom sizes
				userCustomSizes: formData.userCustomSizes, // Include userCustomSizes flag
				availability: formData.availability,
				deliveryTimeline: formData.deliveryTimeline,
				careInstructions: formData.careInstructions,
				rtwOptions: {
					colors: formData.rtwOptions?.colors,
					fabric: formData.rtwOptions?.fabric,
					season: formData.rtwOptions?.season,
					sizes:
						formData.type === "ready-to-wear"
							? sizeLabels
							: formData.rtwOptions?.sizes || [],
				},
				bespokeOptions: {
					customization: {
						fabricChoices:
							formData.bespokeOptions?.customization?.fabricChoices,
						styleOptions: formData.bespokeOptions?.customization?.styleOptions,
						finishingOptions:
							formData.bespokeOptions?.customization?.finishingOptions,
					},
					measurementsRequired: formData.bespokeOptions?.measurementsRequired,
					productionTime: formData.bespokeOptions?.productionTime,
				},
				metric_size_guide: formData.metric_size_guide,
				approvalStatus: "pending",
			};

			await addTailorWork(tailorId, payload as any);
			toast.success("Product added successfully!");

			router.push("/vendor/products");
			await fetch("/api/send-product-mail", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: localStorage.getItem("tailorToken") || "", // ✅ include token
				},
				body: JSON.stringify({
					to: auth.currentUser?.email, // recipient
					productName: formData.title,
					productImage: formData.images[0] || "",
					price: {
						base: formData.price?.base || 0,
						discount: formData.price?.discount || undefined,
						currency: formData.price?.currency || "USD",
					},
					category: formData.category,
					creatorName: auth.currentUser?.displayName || "Vendor",
					creatorRole: "Verifier",
				}),
			});
		} catch (error) {
			console.error("Error adding product:", error);
			toast.error("Error creating product");
		} finally {
			setIsLoading(false); // ✅ re-enable button after submission
		}
	};

	const stepTitles = [
		"Product Type",
		"Basic Information",
		"Pricing",
		"Images",
		"Sizes & Variants",
		"Size Guide",
		"Options",
		"Weight & Dimensions",
	];

	const updatePrice = (field: string, value: string | number) => {
		setFormData((prev) => ({
			...prev,
			price: { ...prev.price!, [field]: value },
		}));
	};

	const addTag = () => {
		if (newTag.trim()) {
			setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
			setNewTag("");
		}
	};

	const removeTag = (index: number) => {
		setFormData({
			...formData,
			tags: formData.tags.filter((_: string, i: number) => i !== index),
		});
	};

	const addSize = () => {
		if (newSize.trim()) {
			setFormData((prev) => ({
				...prev,
				sizes: [...prev.sizes, { size: newSize.trim(), quantity: 1 }],
			}));
			setNewSize("");
		}
	};

	const addColor = () => {
		if (newColor.trim()) {
			setFormData((prev) => ({
				...prev,
				rtwOptions: {
					...prev.rtwOptions,
					colors: [...(prev.rtwOptions?.colors || []), newColor.trim()],
				},
			}));
			setNewColor("");
		}
	};

	const updateBespokeOption = (field: string, value: any) => {
		setFormData({
			...formData,
			bespokeOptions: {
				...formData.bespokeOptions,
				[field]: value,
			},
		});
	};

	// Reorder Images (set selected index as first/main)
	const setAsMainImage = (index: number) => {
		setImagePreview((prev) => {
			const reordered = [prev[index], ...prev.filter((_, i) => i !== index)];
			// Do NOT update formData.images with potential blobs here.
			// It is handled in nextStep/uploadFinalImages.
			return reordered;
		});
	};

	const updateRTWOption = (field: string, value: any) => {
		setFormData({
			...formData,
			rtwOptions: {
				...formData.rtwOptions,
				[field]: value,
			},
		});
	};

	// Recommended tags based on product type and category
	const getRecommendedTags = () => {
		const tags: string[] = [];

		// Type-based tags
		if (formData.type === "bespoke") {
			tags.push(
				"Custom Made",
				"Tailored",
				"Bespoke",
				"Made to Order",
				"Custom Fit",
			);
		} else if (formData.type === "ready-to-wear") {
			tags.push("Ready to Wear", "Ready Made", "In Stock", "Quick Delivery");
		}

		// Category-specific tags with clothing items
		if (formData.category === "men") {
			tags.push(
				"Men's Fashion",
				"Menswear",
				"Men's Clothing",
				"Suits",
				"Shirts",
				"Trousers",
				"Agbada",
				"Kaftan",
				"Senator Wear",
				"Native Wear",
				"Dashiki",
				"Blazers",
				"Formal Wear",
				"Traditional Attire",
			);
		} else if (formData.category === "women") {
			tags.push(
				"Women's Fashion",
				"Womenswear",
				"Women's Clothing",
				"Ladies Fashion",
				"Dresses",
				"Gowns",
				"Skirts",
				"Blouses",
				"Ankara",
				"Aso Ebi",
				"Bubu",
				"Kaftan",
				"Wrapper",
				"Evening Wear",
				"Bridal",
				"Bridesmaid",
				"Maternity Wear",
			);
		} else if (formData.category === "kids") {
			tags.push(
				"Kids Fashion",
				"Children's Wear",
				"Kids Clothing",
				"Boys Wear",
				"Girls Wear",
				"School Uniform",
				"Playwear",
				"Party Dress",
				"Casual Kids",
				"Birthday Outfit",
				"Traditional Kids Wear",
			);
		} else if (formData.category === "unisex") {
			tags.push(
				"Unisex",
				"Gender Neutral",
				"For Everyone",
				"T-Shirts",
				"Hoodies",
				"Casual Wear",
				"Loungewear",
			);
		}

		// General fashion tags (common across all categories)
		tags.push(
			"African Fashion",
			"Handmade",
			"Quality Guaranteed",
			"Unique Design",
			"Traditional",
			"Modern",
			"Elegant",
			"Casual",
			"Formal",
			"Wedding",
			"Party Wear",
			"Office Wear",
			"Vintage",
			"Contemporary",
			"Luxury",
		);

		// Filter out already selected tags
		return tags.filter((tag) => !formData.tags.includes(tag));
	};

	return (
		<div className="min-h-screen bg-white">
			<ModernNavbar />
			<form
				onSubmit={(e) => e.preventDefault()}
				className="container mx-auto px-4 py-8"
			>
				<div className="max-w-4xl mx-auto">
					<div className="mb-8">
						<Button
							variant="ghost"
							onClick={() => router.back()}
							className="mb-4 text-gray-600 hover:text-gray-900"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Products
						</Button>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Create New Product
						</h1>
						<p className="text-gray-600">Add a new product to your catalog</p>
					</div>

					{/* Progress Steps */}
					<div className="mb-8">
						<div className="flex items-center justify-between overflow-x-auto no-scrollbar">
							{stepTitles.map((title, index) => {
								const stepNumber = index + 1;
								const isActive = stepNumber === currentStep;
								const isCompleted = stepNumber < currentStep;

								return (
									<div
										key={stepNumber}
										className="flex items-center flex-shrink-0 px-2"
									>
										<div className="flex flex-col items-center">
											<div
												className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
													isCompleted
														? "bg-green-500 text-white"
														: isActive
															? "bg-gradient-to-r from-gray-600 to-black text-white"
															: "bg-gray-200 text-gray-600"
												}`}
											>
												{stepNumber}
											</div>
											<span className="text-xs text-gray-600 mt-2 text-center max-w-20">
												{title}
											</span>
										</div>
										{stepNumber < 7 && (
											<div
												className={`flex-1 h-1 mx-4 ${
													stepNumber < currentStep
														? "bg-green-500"
														: "bg-gray-200"
												}`}
											/>
										)}
									</div>
								);
							})}
						</div>
					</div>

					{/* Step 1: Product Type */}
					{currentStep === 1 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Package className="h-5 w-5" />
									<span>Choose Product Type</span>
								</CardTitle>
								<CardDescription>
									Select the type of product you want to create
								</CardDescription>
							</CardHeader>
							<CardContent>
								<RadioGroup
									value={formData.type}
									onValueChange={(value) =>
										setFormData({
											...formData,
											type: value as "bespoke" | "ready-to-wear",
										})
									}
									className="space-y-4"
								>
									<div
										className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
											formData.type === "bespoke"
												? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md"
												: "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
										}`}
									>
										<RadioGroupItem
											value="bespoke"
											id="bespoke"
											className={`${
												formData.type === "bespoke"
													? "border-blue-500 text-blue-500"
													: "border-gray-300"
											}`}
										/>
										<div className="flex-1">
											<Label
												htmlFor="bespoke"
												className={`text-lg font-medium cursor-pointer ${
													formData.type === "bespoke"
														? "text-blue-900"
														: "text-gray-900"
												}`}
											>
												Bespoke
											</Label>
											<p
												className={`text-sm ${
													formData.type === "bespoke"
														? "text-blue-700"
														: "text-gray-600"
												}`}
											>
												Custom-made products tailored to individual measurements
											</p>
										</div>
										{formData.type === "bespoke" && (
											<div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg">
												<svg
													className="w-5 h-5 text-white"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
										)}
									</div>

									<div
										className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all duration-200 ${
											formData.type === "ready-to-wear"
												? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md"
												: "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
										}`}
									>
										<RadioGroupItem
											value="ready-to-wear"
											id="ready-to-wear"
											className={`${
												formData.type === "ready-to-wear"
													? "border-blue-500 text-blue-500"
													: "border-gray-300"
											}`}
										/>
										<div className="flex-1">
											<Label
												htmlFor="ready-to-wear"
												className={`text-lg font-medium cursor-pointer ${
													formData.type === "ready-to-wear"
														? "text-blue-900"
														: "text-gray-900"
												}`}
											>
												Ready to Wear
											</Label>
											<p
												className={`text-sm ${
													formData.type === "ready-to-wear"
														? "text-blue-700"
														: "text-gray-600"
												}`}
											>
												Pre-made products available in standard sizes
											</p>
										</div>
										{formData.type === "ready-to-wear" && (
											<div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg">
												<svg
													className="w-5 h-5 text-white"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fillRule="evenodd"
														d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
														clipRule="evenodd"
													/>
												</svg>
											</div>
										)}
									</div>
								</RadioGroup>
								{errors.type && (
									<p className="text-sm text-red-600 mt-2">{errors.type}</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Step 2: Basic Information */}
					{currentStep === 2 && (
						<Card>
							<CardHeader>
								<CardTitle>Basic Information</CardTitle>
								<CardDescription>
									Enter the basic details for your product
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="title">
										Title <span className="text-red-500">*</span>
									</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) =>
											setFormData({ ...formData, title: e.target.value })
										}
										placeholder="Enter product title"
										className={
											errors.title
												? "border-red-500"
												: "border-gray-300 focus:border-purple-500"
										}
									/>
									{errors.title && (
										<p className="text-sm text-red-600">{errors.title}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="description">
										Description <span className="text-red-500">*</span>
									</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											setFormData({ ...formData, description: e.target.value })
										}
										placeholder="Describe your product..."
										rows={4}
										className={
											errors.description
												? "border-red-500"
												: "border-gray-300 focus:border-purple-500"
										}
									/>
									<div className="flex justify-between items-center">
										<p className="text-sm text-gray-500">
											Minimum 50 characters, maximum 150 words
										</p>
										<div className="flex items-center space-x-4">
											<p
												className={`text-sm ${
													formData.description.trim().length < 50
														? "text-red-600 font-medium"
														: formData.description.trim().length < 60
															? "text-amber-600"
															: "text-gray-500"
												}`}
											>
												{formData.description.trim().length}/50 chars (min)
											</p>
											<p
												className={`text-sm ${
													countWords(formData.description) > 150
														? "text-red-600 font-medium"
														: countWords(formData.description) > 130
															? "text-amber-600"
															: "text-gray-500"
												}`}
											>
												{countWords(formData.description)}/150 words (max)
											</p>
										</div>
									</div>
									{errors.description && (
										<p className="text-sm text-red-600">{errors.description}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="category">
										Category <span className="text-red-500">*</span>
									</Label>
									<Select
										value={formData.category}
										onValueChange={(value) =>
											setFormData({
												...formData,
												category: value as "men" | "women" | "kids" | "unisex",
											})
										}
									>
										<SelectTrigger
											className={
												errors.category
													? "border-red-500"
													: "border-gray-300 focus:border-purple-500"
											}
										>
											<SelectValue placeholder="Choose category" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="men">Men</SelectItem>
											<SelectItem value="women">Women</SelectItem>
											<SelectItem value="kids">Kids</SelectItem>
											<SelectItem value="unisex">Unisex</SelectItem>
										</SelectContent>
									</Select>
									{errors.category && (
										<p className="text-sm text-red-600">{errors.category}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="wear_quantity">Quantity</Label>
									<Input
										id="wear_quantity"
										type="number"
										value={
											formData.wear_quantity === 0 ? "" : formData.wear_quantity
										} // ✅ allow empty input
										onChange={(e) => {
											const value = e.target.value;
											setFormData({
												...formData,
												wear_quantity: value === "" ? 0 : Number(value), // ✅ keep 0 when empty
											});
										}}
										placeholder="Enter quantity"
										className="border-gray-300 focus:border-purple-500"
									/>
									{errors.wear_quantity && (
										<p className="text-sm text-red-600">
											{errors.wear_quantity}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="keywords">Keywords (Optional)</Label>
									<Input
										id="keywords"
										value={formData.keywords}
										onChange={(e) =>
											setFormData({ ...formData, keywords: e.target.value })
										}
										placeholder="Enter keywords separated by commas"
										className="border-gray-300 focus:border-purple-500"
									/>
									<p className="text-sm text-gray-500">
										Used for search purposes
									</p>
								</div>
							</CardContent>
						</Card>
					)}

					{/* step 3: Pricing */}
					{currentStep === 3 && (
						<Card className="border-2">
							<CardHeader>
								<CardTitle className="text-xl font-semibold">
									Pricing & Availability
								</CardTitle>
								<CardDescription>
									Set your product pricing and availability details
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									{/* Base Price */}
									<div className="space-y-2">
										<Label htmlFor="base-price" className="text-sm font-medium">
											Base Price <span className="text-red-500">*</span>
										</Label>
										<Input
											id="base-price"
											type="number"
											placeholder="0"
											value={formData.price?.base || ""}
											onChange={(e) =>
												setFormData((p) => ({
													...p,
													price: {
														...p.price,
														base: Number(e.target.value),
														currency: p.price?.currency || "USD",
													},
												}))
											}
											className={errors.price ? "border-red-500" : "border-2"}
										/>
										{errors.price && (
											<p className="text-sm text-red-600">{errors.price}</p>
										)}
									</div>

									{/* Discount */}
									<div className="space-y-2">
										<Label htmlFor="discount" className="text-sm font-medium">
											Discount (%)
										</Label>
										<Input
											id="discount"
											type="number"
											placeholder="0"
											value={formData.price?.discount || ""}
											onChange={(e) =>
												setFormData((p) => ({
													...p,
													price: {
														...p.price,
														discount: Number(e.target.value) || undefined,
														base: p.price?.base || 0,
														currency: p.price?.currency || "USD",
													},
												}))
											}
											className="border-2"
										/>
									</div>

									{/* Currency */}
									<div className="space-y-2">
										<Label htmlFor="currency" className="text-sm font-medium">
											Currency <span className="text-red-500">*</span>
										</Label>
										<Select
											value={formData.price?.currency || "USD"}
											onValueChange={(value) =>
												setFormData((p) => ({
													...p,
													price: {
														...p.price,
														currency: value,
														base: p.price?.base || 0,
													},
												}))
											}
										>
											<SelectTrigger
												className={
													errors.currency ? "border-red-500" : "border-2"
												}
											>
												<SelectValue placeholder="Select currency" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="NGN">NGN</SelectItem>
												<SelectItem value="USD">USD</SelectItem>
											</SelectContent>
										</Select>
										{errors.currency && (
											<p className="text-sm text-red-600">{errors.currency}</p>
										)}
									</div>
								</div>

								{/* Multiple Pricing Toggle */}
								<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2">
									<div>
										<Label
											htmlFor="enableMultiplePricing"
											className="text-base font-medium"
										>
											Enable Multiple Pricing
										</Label>
										<p className="text-sm text-gray-600 mt-1">
											Turn on to add individual prices for each item (e.g., Aso
											Oke pants price, Ankara shirt price). Items can be sold
											together or separately.
										</p>
									</div>
									<Switch
										id="enableMultiplePricing"
										checked={formData.enableMultiplePricing}
										onCheckedChange={(checked) => {
											setFormData((p) => ({
												...p,
												enableMultiplePricing: checked,
												// When turning off multiple pricing, clear individual items
												individualItems: checked ? p.individualItems : [],
											}));
										}}
									/>
								</div>

								{/* Multiple Pricing Items - Only show if enabled */}
								{formData.enableMultiplePricing && (
									<div className="space-y-4 border-2 rounded-lg p-4 bg-white">
										<div className="flex justify-between items-center">
											<h3 className="text-lg font-semibold">
												Individual Items
											</h3>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													const newItem = {
														id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
														name: "",
														price: 0,
													};
													setFormData((p) => ({
														...p,
														individualItems: [
															...(p.individualItems || []),
															newItem,
														],
													}));
												}}
											>
												<Plus className="w-4 h-4 mr-2" />
												Add Item
											</Button>
										</div>

										{(formData.individualItems || []).length === 0 && (
											<p className="text-sm text-gray-500 text-center py-4">
												No items added yet. Click "Add Item" to add individual
												pricing.
											</p>
										)}

										{(formData.individualItems || []).map((item, index) => {
											const currentItemErrors = itemErrors[item.id] || {};
											return (
												<div
													key={item.id}
													className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-gray-50"
												>
													<div className="md:col-span-6 space-y-2">
														<Label htmlFor={`itemName-${item.id}`}>
															Item Name <span className="text-red-500">*</span>
														</Label>
														<Input
															id={`itemName-${item.id}`}
															type="text"
															value={item.name}
															onChange={(e) => {
																const updatedItems = [
																	...(formData.individualItems || []),
																];
																updatedItems[index] = {
																	...item,
																	name: e.target.value,
																};
																setFormData((p) => ({
																	...p,
																	individualItems: updatedItems,
																}));
															}}
															placeholder="e.g., Aso Oke Pants, Ankara Shirt"
															className={
																currentItemErrors.name ? "border-red-500" : ""
															}
														/>
														{currentItemErrors.name && (
															<p className="text-sm text-red-600">
																{currentItemErrors.name}
															</p>
														)}
													</div>

													<div className="md:col-span-5 space-y-2">
														<Label htmlFor={`itemPrice-${item.id}`}>
															Price ({formData.price?.currency || "USD"}){" "}
															<span className="text-red-500">*</span>
														</Label>
														<Input
															id={`itemPrice-${item.id}`}
															min="0"
															step="0.01"
															value={
																item.price !== undefined && item.price !== null
																	? item.price
																	: ""
															}
															onChange={(e) => {
																const updatedItems = [
																	...(formData.individualItems || []),
																];
																updatedItems[index] = {
																	...item,
																	price: Number(e.target.value),
																};
																setFormData((p) => ({
																	...p,
																	individualItems: updatedItems,
																}));
															}}
															placeholder="0.00"
															className={
																currentItemErrors.price ? "border-red-500" : ""
															}
														/>
														{currentItemErrors.price && (
															<p className="text-sm text-red-600">
																{currentItemErrors.price}
															</p>
														)}
													</div>

													<div className="md:col-span-1 flex items-end">
														<Button
															type="button"
															variant="outline"
															size="icon"
															onClick={() => {
																const updatedItems = [
																	...(formData.individualItems || []),
																];
																updatedItems.splice(index, 1);
																setFormData((p) => ({
																	...p,
																	individualItems: updatedItems,
																}));
															}}
															className="text-red-600 hover:text-red-700"
														>
															<Trash2 className="w-4 h-4" />
														</Button>
													</div>
												</div>
											);
										})}

										{errors.individualItems && (
											<p className="text-sm text-red-600">
												{errors.individualItems}
											</p>
										)}
									</div>
								)}

								{/* Availability & Delivery */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div className="space-y-2">
										<Label
											htmlFor="availability"
											className="text-sm font-medium"
										>
											Availability
										</Label>
										<Select
											value={formData.availability || "in_stock"}
											onValueChange={(value) =>
												setFormData((p) => ({ ...p, availability: value }))
											}
										>
											<SelectTrigger className="border-2">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="in_stock">In Stock</SelectItem>
												<SelectItem value="out_of_stock">
													Out of Stock
												</SelectItem>
												<SelectItem value="pre_order">Pre-order</SelectItem>
												<SelectItem value="made_to_order">
													Made to Order
												</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="delivery-timeline"
											className="text-sm font-medium"
										>
											Delivery Timeline <span className="text-red-500">*</span>
										</Label>
										<Input
											id="delivery-timeline"
											placeholder="e.g., 2-3 weeks"
											value={formData.deliveryTimeline || ""}
											onChange={(e) =>
												setFormData((p) => ({
													...p,
													deliveryTimeline: e.target.value,
												}))
											}
											className={
												errors.deliveryTimeline ? "border-red-500" : "border-2"
											}
										/>
										{errors.deliveryTimeline && (
											<p className="text-sm text-red-600">
												{errors.deliveryTimeline}
											</p>
										)}
									</div>
								</div>

								{/* Pricing Summary */}
								<Card className="bg-gray-100 border-accent">
									<CardContent className="pt-6">
										{formData.enableMultiplePricing &&
										formData.individualItems &&
										formData.individualItems.length > 0 ? (
											<>
												<div className="flex justify-between items-center mb-2">
													<span className="text-sm font-medium">
														Bundle Price (Base):
													</span>
													<span className="text-lg font-semibold text-gray-600">
														{formData.price?.currency || "USD"}{" "}
														{(formData.price?.base || 0).toLocaleString(
															undefined,
															{
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															},
														)}
													</span>
												</div>
												<div className="border-t border-gray-300 my-2 pt-2">
													{formData.individualItems.map((item, index) => (
														<div
															key={item.id}
															className="flex justify-between items-center text-sm text-gray-600 py-1"
														>
															<span>{item.name || `Item ${index + 1}`}:</span>
															<span>
																{formData.price?.currency || "USD"}{" "}
																{item.price.toLocaleString(undefined, {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																})}
															</span>
														</div>
													))}
												</div>
												<div className="flex justify-between items-center pt-2 border-t border-gray-300">
													<span className="text-sm font-medium">
														Total Individual Prices:
													</span>
													<span className="text-2xl font-bold text-gray-800">
														{formData.price?.currency || "USD"}{" "}
														{formData.individualItems
															.reduce((sum, item) => sum + item.price, 0)
															.toLocaleString(undefined, {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
													</span>
												</div>
												{formData.individualItems &&
													formData.individualItems.length > 0 && (
														<div className="flex justify-between items-center pt-1">
															<span className="text-sm font-medium">
																Bundle Price:
															</span>
															<span className="text-lg font-bold text-gray-800">
																{formData.price?.currency || "USD"}{" "}
																{(formData.price?.base || 0).toLocaleString(
																	undefined,
																	{
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	},
																)}
															</span>
														</div>
													)}

												<p className="text-xs text-gray-500 mt-2">
													*Items can be purchased individually or as a bundle
												</p>
											</>
										) : (
											<>
												<div className="flex justify-between items-center">
													<span className="text-sm font-medium">
														Final Price:
													</span>
													<span className="text-2xl font-bold text-gray-600">
														{formData.price?.currency || "USD"}{" "}
														{formData.price?.discount
															? (
																	(formData.price.base || 0) *
																	(1 - (formData.price.discount || 0) / 100)
																).toLocaleString(undefined, {
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																})
															: (formData.price?.base || 0).toLocaleString(
																	undefined,
																	{
																		minimumFractionDigits: 2,
																		maximumFractionDigits: 2,
																	},
																)}
													</span>
												</div>
												{formData.price?.discount && (
													<div className="flex justify-between items-center text-sm text-muted-foreground">
														<span>Original Price:</span>
														<span className="line-through">
															{formData.price.currency || "USD"}{" "}
															{(formData.price.base || 0).toLocaleString(
																undefined,
																{
																	minimumFractionDigits: 2,
																	maximumFractionDigits: 2,
																},
															)}
														</span>
													</div>
												)}
											</>
										)}
									</CardContent>
								</Card>
							</CardContent>
						</Card>
					)}

					{/* Step 3: Images */}
					{currentStep === 4 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<ImageIcon className="h-5 w-5" />
									<span>Product Media</span>
								</CardTitle>
								<CardDescription>
									Upload high-quality product media — up to 5 images.
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-6">
								{/* ----------- UPLOAD MODE SELECTION ----------- */}
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<h4 className="font-medium text-gray-900">Upload Mode</h4>
									</div>
									<RadioGroup
										value={useAIProcessing ? "ai" : "original"}
										onValueChange={(value) =>
											setUseAIProcessing(value === "ai")
										}
										className="grid grid-cols-1 md:grid-cols-2 gap-4"
									>
										<div
											className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
												useAIProcessing
													? "border-purple-500 bg-purple-50 ring-2 ring-purple-200 shadow-md"
													: "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
											}`}
										>
											<RadioGroupItem
												value="ai"
												id="ai-processing"
												className={`mt-1 ${
													useAIProcessing
														? "border-purple-500 text-purple-500"
														: "border-gray-300"
												}`}
											/>
											<div className="flex-1">
												<Label
													htmlFor="ai-processing"
													className={`text-base font-medium cursor-pointer ${
														useAIProcessing
															? "text-purple-900"
															: "text-gray-900"
													}`}
												>
													✨ AI Enhanced Upload
												</Label>
												<p
													className={`text-sm mt-1 ${
														useAIProcessing
															? "text-purple-700"
															: "text-gray-600"
													}`}
												>
													Automatically remove backgrounds and enhance images
													for professional product photos
												</p>
												<div className="flex items-center gap-2 mt-2">
													<div className="w-2 h-2 bg-green-500 rounded-full"></div>
													<span className="text-xs text-gray-600">
														Background removal
													</span>
													<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
													<span className="text-xs text-gray-600">
														Image enhancement
													</span>
												</div>
											</div>
											{useAIProcessing && (
												<div className="flex items-center justify-center w-8 h-8 bg-purple-500 rounded-full shadow-lg">
													<svg
														className="w-5 h-5 text-white"
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															fillRule="evenodd"
															d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
															clipRule="evenodd"
														/>
													</svg>
												</div>
											)}
										</div>

										<div
											className={`flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
												!useAIProcessing
													? "border-blue-500 bg-blue-50 ring-2 ring-blue-200 shadow-md"
													: "border-gray-200 hover:bg-gray-50 hover:border-gray-300"
											}`}
										>
											<RadioGroupItem
												value="original"
												id="original-upload"
												className={`mt-1 ${
													!useAIProcessing
														? "border-blue-500 text-blue-500"
														: "border-gray-300"
												}`}
											/>
											<div className="flex-1">
												<Label
													htmlFor="original-upload"
													className={`text-base font-medium cursor-pointer ${
														!useAIProcessing ? "text-blue-900" : "text-gray-900"
													}`}
												>
													📷 Original Upload
												</Label>
												<p
													className={`text-sm mt-1 ${
														!useAIProcessing ? "text-blue-700" : "text-gray-600"
													}`}
												>
													Upload images as-is without any AI processing or
													modifications
												</p>
												<div className="flex items-center gap-2 mt-2">
													<div className="w-2 h-2 bg-gray-500 rounded-full"></div>
													<span className="text-xs text-gray-600">
														No processing
													</span>
													<div className="w-2 h-2 bg-orange-500 rounded-full"></div>
													<span className="text-xs text-gray-600">
														Faster upload
													</span>
												</div>
											</div>
											{!useAIProcessing && (
												<div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full shadow-lg">
													<svg
														className="w-5 h-5 text-white"
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															fillRule="evenodd"
															d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
															clipRule="evenodd"
														/>
													</svg>
												</div>
											)}
										</div>
									</RadioGroup>
								</div>

								{/* ----------- IMAGE UPLOAD SECTION ----------- */}
								<div className="space-y-4">
									{formData.images?.length < 5 && (
										<label
											htmlFor="image-upload"
											className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
												uploadingImages || processingImages
													? "border-blue-400 bg-blue-50 cursor-not-allowed"
													: "border-gray-300 hover:border-purple-400 cursor-pointer"
											}`}
											onDrop={(e) => {
												if (uploadingImages || processingImages) return;
												e.preventDefault();
												const files = Array.from(e.dataTransfer.files).filter(
													(file) => file.type.startsWith("image/"),
												);
												if (files.length > 0) {
													handleImageUpload(e.dataTransfer.files);
												}
											}}
											onDragOver={(e) => e.preventDefault()}
										>
											{/* Processing/Uploading UI */}
											{processingImages ? (
												<>
													<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
													<h3 className="text-lg font-medium text-purple-900 mb-2">
														{useAIProcessing
															? "AI Background Removal"
															: "Processing Images"}
													</h3>
													<p className="text-sm text-gray-600 mb-4">
														{useAIProcessing
															? `Processing image ${currentProcessingIndex}...`
															: `Uploading image ${currentProcessingIndex}...`}
													</p>
													<div className="w-full bg-gray-200 rounded-full h-2 mb-4">
														<div
															className="bg-purple-600 h-2 rounded-full transition-all duration-300 animate-pulse"
															style={{ width: `75%` }}
														></div>
													</div>
												</>
											) : uploadingImages ? (
												<>
													<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
													<h3 className="text-lg font-medium text-blue-900 mb-2">
														Uploading to Cloud...
													</h3>
													<div className="w-full bg-gray-200 rounded-full h-2 mb-4">
														<div
															className="bg-blue-600 h-2 rounded-full transition-all duration-300"
															style={{ width: `${uploadProgress}%` }}
														></div>
													</div>
												</>
											) : (
												<>
													<Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
													<h3 className="text-lg font-medium text-gray-900 mb-2">
														{useAIProcessing
															? "Upload Images for AI Processing"
															: "Upload Original Images"}
													</h3>
													<p className="text-gray-500 mb-4">
														Drag and drop your images here, or click to browse
														<br />
														<span className="text-sm">
															({imagePreview.length}/5 images{" "}
															{useAIProcessing ? "processed" : "uploaded"})
														</span>
													</p>
													<input
														type="file"
														accept="image/jpeg,image/jpg,image/png,image/webp"
														multiple
														onChange={(e) => handleImageUpload(e.target.files)}
														className="hidden"
														id="image-upload"
														disabled={uploadingImages || processingImages}
													/>
													<Button
														variant="outline"
														type="button"
														className="bg-white hover:bg-gray-50 pointer-events-none"
														disabled={uploadingImages || processingImages}
													>
														<Upload className="h-4 w-4 mr-2" />
														Choose Images
													</Button>
													<p className="text-xs text-gray-500 mt-2">
														Supported formats: JPEG, PNG, WebP (Max 10MB each)
														<br />
														{useAIProcessing ? (
															<span className="text-purple-600 font-medium">
																✨ AI will remove backgrounds and enhance image
																quality for professional results
															</span>
														) : (
															<span className="text-blue-600 font-medium">
																📷 Images will be uploaded as-is without
																processing
															</span>
														)}
													</p>
												</>
											)}
										</label>
									)}

									{/* Preview Images with Before/After Comparison */}
									{imagePreview.length > 0 && (
										<>
											<div className="flex items-center justify-between mb-4">
												<h4 className="font-medium text-gray-900">
													Uploaded Images
												</h4>
												<Button
													variant="outline"
													size="sm"
													onClick={() => {
														setFormData((prev) => ({ ...prev, images: [] }));
														setImagePreview([]);
														setProcessedImages([]);
														setImageChoices({});
													}}
													className="text-red-600 hover:text-red-700 bg-white hover:bg-red-50"
												>
													<X className="h-4 w-4 mr-1" />
													Clear All
												</Button>
											</div>

											<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
												{imagePreview.map((preview, index) => {
													const processedIndex =
														getProcessedImageIndex(preview);
													return (
														<div key={index} className="relative group">
															<div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200 relative">
																<Image
																	src={preview || "/placeholder.svg"}
																	alt={`Product image ${index + 1}`}
																	width={200}
																	height={200}
																	className="w-full h-full object-cover"
																	unoptimized
																/>

																{/* Hover Overlay with Eye Icon - Only for AI processed images */}
																{processedIndex !== -1 &&
																	useAIProcessing &&
																	imageChoices[processedIndex] !==
																		"original" && (
																		<button
																			type="button"
																			onClick={() => {
																				setSelectedImageIndex(index);
																				setComparisonModalOpen(true);
																			}}
																			className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
																		>
																			<div className="flex flex-col items-center text-white">
																				<Eye className="h-8 w-8 mb-1" />
																				<span className="text-xs font-medium">
																					Compare
																				</span>
																			</div>
																		</button>
																	)}

																{/* Mode indicator badge */}
																{processedIndex !== -1 && (
																	<div className="absolute top-2 right-2">
																		{useAIProcessing &&
																		imageChoices[processedIndex] ===
																			"processed" ? (
																			<Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs shadow-lg">
																				✨ AI Enhanced
																			</Badge>
																		) : (
																			<Badge className="bg-blue-600 text-white text-xs">
																				📷 Original
																			</Badge>
																		)}
																	</div>
																)}

																{/* Quality indicator for AI enhanced images */}
																{useAIProcessing &&
																	processedIndex !== -1 &&
																	imageChoices[processedIndex] ===
																		"processed" && (
																		<div className="absolute bottom-2 left-2">
																			<Badge className="bg-green-600 text-white text-xs">
																				HD Quality
																			</Badge>
																		</div>
																	)}
															</div>

															{/* Remove Button */}
															<button
																type="button"
																onClick={() => removeImage(index)}
																className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 z-10"
															>
																<X className="h-3 w-3" />
															</button>

															{/* Set as Main Button */}
															{index !== 0 && (
																<button
																	type="button"
																	onClick={() => setAsMainImage(index)}
																	className="absolute top-2 left-2 bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded"
																>
																	Set as Main
																</button>
															)}

															{/* Main Badge */}
															{index === 0 && (
																<Badge className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs">
																	Main Image
																</Badge>
															)}

															{/* Position Index */}
															<div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
																{index + 1}
															</div>
														</div>
													);
												})}
											</div>
										</>
									)}
								</div>

								{errors.images && (
									<p className="text-sm text-red-600">{errors.images}</p>
								)}

								{/* Comparison Modal - Only show for AI processed images */}
								{comparisonModalOpen &&
									selectedImageIndex !== null &&
									useAIProcessing && (
										<div
											className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
											onClick={() => {
												setComparisonModalOpen(false);
												setSelectedImageIndex(null);
											}}
										>
											{(() => {
												// Resolve local index inside the modal logic
												const previewUrl = imagePreview[selectedImageIndex];
												const localIndex = getProcessedImageIndex(previewUrl);

												// Valid check
												if (localIndex === -1 || !processedImages[localIndex]) {
													return null;
												}

												const pImage = processedImages[localIndex];

												return (
													<div
														className="relative w-full max-w-4xl mx-4 bg-white rounded-lg shadow-2xl"
														onClick={(e) => e.stopPropagation()}
													>
														{/* Modal Header */}
														<div className="flex items-center justify-between p-4 border-b">
															<div>
																<h3 className="text-lg font-semibold text-gray-900">
																	{imageChoices[localIndex] === "original"
																		? "Original Image Preview"
																		: "AI Background Removal Comparison"}
																</h3>
																<p className="text-sm text-gray-500">
																	{imageChoices[localIndex] === "original"
																		? "Viewing original uploaded image"
																		: "Drag the slider to see before and after"}
																</p>
															</div>
															<button
																onClick={() => {
																	setComparisonModalOpen(false);
																	setSelectedImageIndex(null);
																}}
																className="text-gray-400 hover:text-gray-600 transition-colors"
															>
																<X className="h-6 w-6" />
															</button>
														</div>

														{/* Modal Body - Comparison Slider or Single Image */}
														<div className="p-6">
															<div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
																{imageChoices[localIndex] === "original" ? (
																	// Show only original image
																	<Image
																		src={pImage.original}
																		alt="Original image"
																		width={800}
																		height={600}
																		className="w-full h-full object-contain"
																		unoptimized
																	/>
																) : (
																	// Show comparison slider for processed
																	<ImageComparisonSlider
																		beforeImage={pImage.original}
																		afterImage={pImage.enhanced}
																		beforeLabel="Original"
																		afterLabel="Enhanced"
																	/>
																)}
															</div>
														</div>

														{/* Modal Footer */}
														<div className="p-4 border-t bg-gray-50 rounded-b-lg space-y-4">
															{/* Legend - only show for processed */}
															{imageChoices[localIndex] !== "original" && (
																<div className="flex items-center gap-4 text-sm text-gray-600">
																	<div className="w-3 h-3 bg-gray-800 rounded"></div>
																	<span>Original with background</span>
																	<span className="text-gray-400">•</span>
																	<div className="w-3 h-3 bg-green-600 rounded"></div>
																	<span>AI cleaned & enhanced</span>
																</div>
															)}

															{/* Version Selection */}
															<div className="flex items-center justify-between">
																<div className="flex items-center gap-4">
																	<p className="text-sm font-medium text-gray-700">
																		Version to use for product:
																	</p>
																	<RadioGroup
																		value={
																			imageChoices[localIndex] || "processed"
																		}
																		onValueChange={(
																			value: "original" | "processed",
																		) => {
																			setImageChoices((prev) => ({
																				...prev,
																				[localIndex]: value,
																			}));
																			// Update preview to show selected version
																			setImagePreview((prev) => {
																				const updated = [...prev];
																				updated[selectedImageIndex] =
																					value === "original"
																						? pImage.original
																						: pImage.enhanced;
																				return updated;
																			});
																		}}
																		className="flex items-center gap-4"
																	>
																		<div className="flex items-center space-x-2">
																			<RadioGroupItem
																				value="original"
																				id="modal-original"
																			/>
																			<Label
																				htmlFor="modal-original"
																				className="text-sm font-normal cursor-pointer"
																			>
																				Original
																			</Label>
																		</div>
																		<div className="flex items-center space-x-2">
																			<RadioGroupItem
																				value="processed"
																				id="modal-processed"
																			/>
																			<Label
																				htmlFor="modal-processed"
																				className="text-sm font-normal cursor-pointer"
																			>
																				Processed (Enhanced)
																			</Label>
																		</div>
																	</RadioGroup>
																</div>
																<Button
																	onClick={() => {
																		setComparisonModalOpen(false);
																		setSelectedImageIndex(null);
																	}}
																	variant="outline"
																>
																	Close
																</Button>
															</div>
														</div>
													</div>
												);
											})()}
										</div>
									)}
							</CardContent>
						</Card>
					)}

					{/* Step 4: Sizes */}
					{currentStep === 5 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Ruler className="h-5 w-5" />
									<span>Sizes & Variants</span>
								</CardTitle>
								<CardDescription>
									Select available sizes for your product
								</CardDescription>
							</CardHeader>

							<CardContent className="space-y-6">
								{/* Option 1: Custom Measurements - Only for Bespoke */}
								{formData.type === "bespoke" && (
									<div className="flex items-center space-x-2">
										<Checkbox
											id="custom-sizes"
											checked={formData.customSizes}
											onCheckedChange={(checked) =>
												setFormData({
													...formData,
													customSizes: checked as boolean,

													// Reset conflicting fields
													sizes: [],
													userCustomSizes: undefined,
													userSizes: [],
												})
											}
										/>
										<Label htmlFor="custom-sizes">
											This product uses custom measurements (Bespoke only)
										</Label>
									</div>
								)}

								{/* Ready-to-wear sizes section */}
								{formData.type === "ready-to-wear" && formData.category && (
									<div className="space-y-4">
										{/* Standard Sizes - show when NOT using custom sizes */}
										{!formData.userCustomSizes && (
											<>
												<Label>Available Sizes</Label>
												<div className="grid grid-cols-4 md:grid-cols-7 gap-3">
													{availableSizes[formData.category].map((size) => {
														const isSelected = formData.sizes.some(
															(s) => s.size === size,
														);
														const selectedSize = formData.sizes.find(
															(s) => s.size === size,
														);

														return (
															<div
																key={size}
																className="flex flex-col items-center"
															>
																<button
																	type="button"
																	onClick={() => handleSizeToggle(size)}
																	className={`p-3 border rounded-lg text-center font-medium transition-colors w-full ${
																		isSelected
																			? "bg-gradient-to-r from-gray-600 to-black text-white border-transparent"
																			: "border-gray-300 text-gray-700 hover:border-purple-300"
																	}`}
																>
																	{size}
																</button>

																{isSelected && (
																	<>
																		<p className="text-sm text-gray-600">qty</p>
																		<input
																			type="number"
																			min={1}
																			value={selectedSize?.quantity || ""}
																			placeholder="10"
																			onChange={(e) =>
																				handleSizeQuantityChange(
																					size,
																					Number(e.target.value),
																				)
																			}
																			className="mt-2 w-16 border rounded text-center text-sm"
																		/>
																	</>
																)}
															</div>
														);
													})}
												</div>
											</>
										)}

										{/* Custom Sizes Checkbox - Always visible */}
										<div className="flex items-center space-x-2 pt-2 border-t">
											<Checkbox
												id="user-custom-sizes"
												checked={!!formData.userCustomSizes}
												onCheckedChange={(checked) =>
													setFormData({
														...formData,
														userCustomSizes: checked ? [] : undefined,
														sizes: [],
														customSizes: checked ? true : false,
														userSizes: [],
													})
												}
											/>
											<Label htmlFor="user-custom-sizes">
												Add my custom sizes & quantities
											</Label>
										</div>
									</div>
								)}

								{/* Custom Measurements Info */}
								{formData.customSizes && (
									<div className="p-4 bg-blue-50 rounded-lg">
										<p className="text-sm text-blue-800">
											<strong>Custom Measurements:</strong> This product will be
											made to order based on individual customer measurements.
										</p>
									</div>
								)}

								{/* User-Defined Custom Sizes Section - Only for Ready-to-wear */}
								{formData.type === "ready-to-wear" &&
									formData.userCustomSizes && (
										<div className="space-y-4">
											<Label>Enter Your Custom Sizes</Label>

											{/* Inline validation messages */}
											{formData.userCustomSizes.length === 0 && (
												<p className="text-sm text-red-600">
													Please add at least one custom size before proceeding.
												</p>
											)}

											{formData.userCustomSizes.length > 0 &&
												formData.userCustomSizes.some(
													(u) =>
														!u.size ||
														String(u.size).trim() === "" ||
														Number(u.quantity) <= 0 ||
														isNaN(Number(u.quantity)),
												) && (
													<p className="text-sm text-red-600">
														Each custom size must include a label and a quantity
														greater than 0.
													</p>
												)}

											{formData.userCustomSizes.map((item, index) => (
												<div
													key={index}
													className="flex space-x-3 items-center mb-2"
												>
													<Input
														placeholder="Size"
														value={item.size}
														onChange={(e) =>
															handleCustomSizeChange(
																index,
																"size",
																e.target.value,
															)
														}
													/>
													<Input
														type="number"
														placeholder="Quantity"
														min={1}
														value={item.quantity || ""}
														onChange={(e) =>
															handleCustomSizeChange(
																index,
																"quantity",
																Number(e.target.value),
															)
														}
														className="w-24"
													/>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														onClick={() => removeCustomSize(index)}
													>
														Remove
													</Button>
												</div>
											))}

											<Button
												variant="outline"
												type="button"
												onClick={addCustomSize}
											>
												+ Add Custom Size
											</Button>
										</div>
									)}

								{/* Error Message */}
								{errors.sizes && (
									<p className="text-sm text-red-600">{errors.sizes}</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Step 6: Size Guide */}
					{currentStep === 6 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Ruler className="h-5 w-5" />
									<span>Size Guide (Optional)</span>
								</CardTitle>
								<CardDescription>
									Provide measurements for your sizes to help customers verify
									their fit.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<SizeGuideInput
									sizes={
										formData.type === "ready-to-wear"
											? formData.sizes.map((s) => s.size)
											: []
									}
									value={formData.metric_size_guide}
									onChange={(guide) =>
										setFormData({ ...formData, metric_size_guide: guide })
									}
								/>
							</CardContent>
						</Card>
					)}

					{/* Options: 7 step */}
					{currentStep === 7 && (
						<div className="space-y-6">
							{/* General Options */}
							<Card className="border-2">
								<CardHeader>
									<CardTitle className="text-xl font-semibold">
										General Options
									</CardTitle>
									<CardDescription>
										Add tags and additional information for your product
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="space-y-3">
										<Label className="text-sm font-medium">
											Tags <span className="text-red-500">*</span>
										</Label>
										<div className="flex gap-2">
											<Input
												placeholder="Add a tag"
												value={newTag}
												onChange={(e) => setNewTag(e.target.value)}
												onKeyPress={(e) => e.key === "Enter" && addTag()}
												className="border-2"
											/>
											<Button type="button" onClick={addTag} size="sm">
												<Plus className="h-4 w-4" />
											</Button>
										</div>

										{/* Recommended Tags Section */}
										{getRecommendedTags().length > 0 && (
											<div className="space-y-2">
												<Label className="text-xs font-medium text-gray-600">
													Suggested Tags (Click to add):
												</Label>
												<div className="flex flex-wrap gap-2">
													{getRecommendedTags()
														.slice(0, 12)
														.map((tag, index) => (
															<Badge
																key={index}
																variant="outline"
																className="cursor-pointer hover:bg-gray-100 transition-colors border-dashed"
																onClick={() => {
																	if (!formData.tags.includes(tag)) {
																		setFormData((prev) => ({
																			...prev,
																			tags: [...prev.tags, tag],
																		}));
																	}
																}}
															>
																<Plus className="h-3 w-3 mr-1" />
																{tag}
															</Badge>
														))}
												</div>
											</div>
										)}

										{/* Selected Tags */}
										{formData.tags && formData.tags?.length > 0 && (
											<div className="space-y-2">
												<Label className="text-xs font-medium text-gray-600">
													Selected Tags:
												</Label>
												<div className="flex flex-wrap gap-2">
													{formData.tags.map((tag: string, index: number) => (
														<Badge
															key={index}
															variant="secondary"
															className="gap-1"
														>
															{tag}
															<Button
																type="button"
																variant="ghost"
																size="sm"
																className="h-auto p-0 hover:bg-transparent"
																onClick={() => removeTag(index)}
															>
																<X className="h-3 w-3" />
															</Button>
														</Badge>
													))}
												</div>
											</div>
										)}
										{errors.tags && (
											<p className="text-sm text-red-600">{errors.tags}</p>
										)}
									</div>

									<div className="space-y-2">
										<Label
											htmlFor="care-instructions"
											className="text-sm font-medium"
										>
											Care Instructions
										</Label>
										<Textarea
											id="care-instructions"
											placeholder="How should customers care for this product?"
											value={formData.careInstructions || ""}
											onChange={(e) =>
												updateFormData({ careInstructions: e.target.value })
											}
											className="border-2"
										/>
									</div>
									
									{/* Bespoke Customization Options */}
									{formData.type === "bespoke" && (
										<>
											<div className="border-t pt-6 mt-6">
												<h3 className="text-lg font-semibold mb-4">Customization Options</h3>
												<p className="text-sm text-gray-500 mb-4">Configure available customization options for your bespoke product</p>
																						
												{/* Fabric Choices */}
												<div className="space-y-2">
													<Label className="text-sm font-medium">Fabric Choices</Label>
													<Textarea
														placeholder="Enter fabric options (comma separated). e.g., Cotton, Silk, Linen, Velvet"
														value={formData.bespokeOptions?.customization?.fabricChoices?.join(", ") || ""}
														onChange={(e) => {
															const fabricChoices = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
															setFormData(prev => ({
																...prev,
																bespokeOptions: {
																	...prev.bespokeOptions,
																	customization: {
																		...prev.bespokeOptions?.customization,
																		fabricChoices
																	}
																}
															}));
														}}
														className="border-2"
														rows={2}
													/>
												</div>
									
												{/* Style Options */}
												<div className="space-y-2">
													<Label className="text-sm font-medium">Style Options</Label>
													<Textarea
														placeholder="Enter style options (comma separated). e.g., Slim Fit, Regular Fit, Oversized, Tailored"
														value={formData.bespokeOptions?.customization?.styleOptions?.join(", ") || ""}
														onChange={(e) => {
															const styleOptions = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
															setFormData(prev => ({
																...prev,
																bespokeOptions: {
																	...prev.bespokeOptions,
																	customization: {
																		...prev.bespokeOptions?.customization,
																		styleOptions
																	}
																}
															}));
														}}
														className="border-2"
														rows={2}
													/>
												</div>
									
												{/* Finishing Options */}
												<div className="space-y-2">
													<Label className="text-sm font-medium">Finishing Options</Label>
													<Textarea
														placeholder="Enter finishing options (comma separated). e.g., Hand-stitched, Machine-stitched, Embroidery, Beading"
														value={formData.bespokeOptions?.customization?.finishingOptions?.join(", ") || ""}
														onChange={(e) => {
															const finishingOptions = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
															setFormData(prev => ({
																...prev,
																bespokeOptions: {
																	...prev.bespokeOptions,
																	customization: {
																		...prev.bespokeOptions?.customization,
																		finishingOptions
																	}
																}
															}));
														}}
														className="border-2"
														rows={2}
													/>
												</div>
											</div>
										</>
									)}
								</CardContent>
							</Card>

							{/* Ready-to-Wear Options */}
							{formData.type === "ready-to-wear" && (
								<Card className="border-2">
									<CardHeader>
										<CardTitle className="text-xl font-semibold">
											Ready-to-Wear Options
										</CardTitle>
										<CardDescription>
											Configure sizes, colors, and stock for your ready-to-wear
											product
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-2">
												<Label htmlFor="fabric" className="text-sm font-medium">
													Fabric <span className="text-red-500">*</span>
												</Label>
												<Input
													id="fabric"
													placeholder="e.g., 100% Cotton, Wool Blend"
													value={formData.rtwOptions?.fabric || ""}
													onChange={(e) =>
														updateRTWOption("fabric", e.target.value)
													}
													className={
														errors.fabric ? "border-red-500" : "border-2"
													}
												/>
												{errors.fabric && (
													<p className="text-sm text-red-600">
														{errors.fabric}
													</p>
												)}
											</div>

											<div className="space-y-3">
												<Label className="text-sm font-medium">
													Available Colors
												</Label>
												<div className="flex gap-2">
													<Input
														placeholder="e.g., Black, Navy, Gray"
														value={newColor}
														onChange={(e) => setNewColor(e.target.value)}
														onKeyPress={(e) => e.key === "Enter" && addColor()}
														className="border-2"
													/>
													<Button type="button" onClick={addColor} size="sm">
														<Plus className="h-4 w-4" />
													</Button>
												</div>
												{formData.rtwOptions?.colors &&
													formData.rtwOptions.colors.length > 0 && (
														<div className="flex flex-wrap gap-2">
															{formData.rtwOptions.colors.map(
																(color: string, index: number) => (
																	<Badge key={index} variant="outline">
																		{color}
																	</Badge>
																),
															)}
														</div>
													)}
											</div>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Bespoke Options */}
							{formData.type === "bespoke" && (
								<Card className="border-2">
									<CardHeader>
										<CardTitle className="text-xl font-semibold">
											Bespoke Options
										</CardTitle>
										<CardDescription>
											Configure customization options for your bespoke product
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="space-y-2">
											<Label
												htmlFor="production-time"
												className="text-sm font-medium"
											>
												Production Time <span className="text-red-500">*</span>
											</Label>
											<Input
												id="production-time"
												placeholder="e.g., 4-6 weeks"
												value={formData.bespokeOptions?.productionTime || ""}
												onChange={(e) =>
													updateBespokeOption("productionTime", e.target.value)
												}
												className={
													errors.productionTime ? "border-red-500" : "border-2"
												}
											/>
											{errors.productionTime && (
												<p className="text-sm text-red-600">
													{errors.productionTime}
												</p>
											)}
										</div>
									</CardContent>
								</Card>
							)}
						</div>
					)}
					{currentStep === 8 && (
						<>
							<ShippingSection shipping={shipping} setShipping={setShipping} />
						</>
					)}

					{/* Navigation Buttons */}
					<div className="flex justify-between mt-8">
						<Button
							variant="outline"
							onClick={prevStep}
							disabled={currentStep === 1}
							className="bg-transparent"
						>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Previous
						</Button>

						{/* Navigation Buttons */}

						{currentStep < 8 ? (
							<Button
								type="button"
								onClick={nextStep}
								className="bg-gradient-to-r from-gray-600 to-black hover:from-gray-300 hover:to-black"
							>
								Next
								<ArrowRight className="h-4 w-4 ml-2" />
							</Button>
						) : (
							<Button
								type="button" // ⬅ prevent auto form submit
								onClick={handleSubmit} // ⬅ trigger manually
								disabled={isLoading}
								className="bg-gradient-to-r from-gray-600 to-black hover:from-gray-300 hover:to-black"
							>
								{isLoading ? "Creating Product..." : "Create Product"}
							</Button>
						)}
					</div>
				</div>
			</form>
		</div>
	);
}
