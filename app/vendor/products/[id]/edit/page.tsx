"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
	Play,
	Eye,
	Trash2,
} from "lucide-react";
import Image from "next/image";
import { getTailorWorkById } from "@/vendor-services/getTailorWorkById";
import { updateTailorWork } from "@/vendor-services/addTailorWork";
import { getTailorKyc } from "@/vendor-services/tailorService";
import { toast } from "sonner";
import {
	processImagesForPreview,
	uploadProcessedImages,
	type ProcessedImageData,
} from "@/vendor-services/uploadImages";
import { auth, storage, db } from "@/firebase";
import { ImageComparisonSlider } from "@/components/ui/image-comparison-slider";
import { getDownloadURL, uploadBytesResumable, ref } from "firebase/storage";
import {
	collectionGroup,
	query,
	where,
	getDocs,
	doc,
	getDoc,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";
import { sendEmailToAdmins } from "@/vendor-services/emailService";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/firebase";
import ShippingSection, {
	cleanShippingData,
	validateShippingData,
} from "@/components/ShippingSection";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { SizeGuideInput } from "@/components/vendor/SizeGuideInput";
import { SizeGuide } from "@/types";

/**
 * Payload contract for wishlist restock notification email sending.
 */
type SendWishlistRestockEmailRequest = {
	to: string;
	userName: string;
	productTitle: string;
	productImage: string;
	price: number;
	currency: string;
	tailorName: string;
	productUrl: string;
	restockedSizes?: string[]; // Optional: array of restocked sizes
	logoUrl: string;
	accessToken?: string;
};

export interface ProductFormData {
	product_id?: string;
	type: "bespoke" | "ready-to-wear" | "";
	title: string;
	price?: {
		base: number;
		discount?: number;
		currency: string;
	};
	discount?: number;
	description: string;
	category: "men" | "women" | "kids" | "unisex" | "";
	wear_quantity: number;
	wear_category: string;
	tags: string[];
	keywords: string | string[];
	images: string[];
	sizes: { size: string; quantity: number }[];
	customSizes: boolean;
	userCustomSizes?: any;
	userSizes?: { size: string; quantity: number }[];
	tailor: string;
	tailor_id?: string;
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
	shipping?: {
		tierKey: string;
		manualOverride: boolean;
		actualWeightKg?: number;
		lengthCm?: number;
		widthCm?: number;
		heightCm?: number;
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
	men: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
	women: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
	kids: ["2T", "3T", "4T", "5T", "6", "7", "8", "10", "12", "14", "16"],
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
	],
};

export default function EditProduct() {
	const params = useParams();
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [loadingProduct, setLoadingProduct] = useState(true);
	const [uploadingImages, setUploadingImages] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [user, setUser] = useState<any>(null);

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
		discount: 0,
		price: {
			base: 0,
			discount: undefined,
			currency: "NGN",
		},
		wear_quantity: 0,
		wear_category: "",
		category: "",
		tags: [],
		sizes: [],
		images: [],
		tailor: "",
		tailor_id: "",
		type: "",
		keywords: "",
		customSizes: false,
		userCustomSizes: false,
		userSizes: [],
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
		metric_size_guide: { columns: [], rows: [] },
	});

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
	const [imageChoices, setImageChoices] = useState<
		Record<number, "original" | "processed">
	>({});
	const [newTag, setNewTag] = useState("");
	const [newSize, setNewSize] = useState("");
	const [newColor, setNewColor] = useState("");
	const [mediaType, setMediaType] = useState<"image" | "video">("image");
	const [videoUrls, setVideoUrls] = useState<string[]>([]);
	const [videoUploading, setVideoUploading] = useState(false);
	const [videoUploadProgress, setVideoUploadProgress] = useState(0);
	const [shipping, setShipping] = useState({
		tierKey: "",
		manualOverride: false,
	});

	// Load existing product data
	useEffect(() => {
		const fetchProduct = async () => {
			try {
				setLoadingProduct(true);
				const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
				setUser(storedUser);
				const userId = storedUser?.id || storedUser?.uid;

				if (!userId || !params.id) {
					toast.error("User not logged in or product ID missing");
					router.push("/vendor/products");
					return;
				}

				const res = await getTailorWorkById(params.id as string, userId);
				if (res.success && res.data) {
					const product = res.data;
					console.log("Loaded product data:", product);
					console.log("Product sizes:", product.sizes);
					console.log("Product userSizes:", (product as any).userSizes);
					console.log("Product userCustomSizes:", product.userCustomSizes);
					console.log("Product price object:", product.price);
					console.log("Product discount field:", product.discount);

					// Determine size configuration based on product data
					let sizes: { size: string; quantity: number }[] = [];
					let customSizes = false;
					let userCustomSizes = false;
					let userSizes: { size: string; quantity: number }[] = [];

					// Check if it's bespoke (custom measurements)
					if (product.type === "bespoke" && product.customSizes) {
						customSizes = true;
					}
					// Check if it has user custom sizes (for ready-to-wear)
					else if (
						product.type === "ready-to-wear" &&
						(product.customSizes ||
							((product as any).userSizes &&
								(product as any).userSizes.length > 0) ||
							(product.userCustomSizes && product.userCustomSizes.length > 0))
					) {
						userCustomSizes = true;
						// Use userSizes if available, otherwise use userCustomSizes
						userSizes =
							(product as any).userSizes &&
							(product as any).userSizes.length > 0
								? (product as any).userSizes
								: product.userCustomSizes;
					}
					// Otherwise use standard sizes - handle both formats
					else if (product.sizes && product.sizes.length > 0) {
						// Check if sizes are already objects with quantities
						if (
							typeof product.sizes[0] === "object" &&
							"label" in product.sizes[0]
						) {
							// Convert from { label: string; quantity: number }[] format
							sizes = (product.sizes as any[]).map((sizeObj: any) => ({
								size: sizeObj.label || sizeObj.size,
								quantity: sizeObj.quantity || 1,
							}));
						} else if (
							typeof product.sizes[0] === "object" &&
							"size" in product.sizes[0]
						) {
							// Already in { size: string; quantity: number }[] format
							sizes = product.sizes as unknown as {
								size: string;
								quantity: number;
							}[];
						} else {
							// Convert string array to size objects with quantity 1
							sizes = (product.sizes as string[]).map((size: string) => ({
								size: size,
								quantity: 1,
							}));
						}
					}

					// Ensure tailor name is set
					let tailorName = product.tailor || "";
					if (!tailorName && product.tailor_id) {
						try {
							// Assuming getTailorKyc is an async function that returns an object with brandName
							const kyc = await getTailorKyc(product.tailor_id);
							if (kyc?.brandName) {
								tailorName = kyc.brandName;
							}
						} catch (e) {
							console.error(
								"Failed to fetch tailor name for tailor_id:",
								product.tailor_id,
								e,
							);
						}
					}

					// Prefill form with existing data
					setFormData({
						product_id: product.id,
						type: (product.type as "bespoke" | "ready-to-wear" | "") || "",
						title: product.title || "",
						price: {
							base:
								typeof product.price === "number"
									? product.price
									: product.price?.base || 0,
							discount: product.price?.discount || undefined,
							currency: product.price?.currency || "NGN",
						},
						discount: product.price?.discount || 0,
						description: product.description || "",
						category:
							(product.category as "men" | "women" | "kids" | "unisex" | "") ||
							"",
						wear_quantity: product.wear_quantity || 0,
						wear_category: product.wear_category || "",
						tags: product.tags || [],
						keywords: product.keywords || "",
						images: product.images || [],
						sizes: sizes,
						customSizes: customSizes,
						userCustomSizes: userCustomSizes,
						userSizes: userSizes,
						tailor: tailorName,
						tailor_id: product.tailor_id || "",
						availability: (product as any).availability || "",
						deliveryTimeline: (product as any).deliveryTimeline || "",
						careInstructions: (product as any).careInstructions || "",
						rtwOptions: {
							colors: (product as any).rtwOptions?.colors || [],
							fabric: (product as any).rtwOptions?.fabric || "",
							season: (product as any).rtwOptions?.season || "",
							sizes: (product as any).rtwOptions?.sizes || [],
						},
						bespokeOptions: {
							customization: {
								fabricChoices:
									(product as any).bespokeOptions?.customization
										?.fabricChoices || [],
								styleOptions:
									(product as any).bespokeOptions?.customization
										?.styleOptions || [],
								finishingOptions:
									(product as any).bespokeOptions?.customization
										?.finishingOptions || [],
							},
							measurementsRequired:
								(product as any).bespokeOptions?.measurementsRequired || [],
							productionTime:
								(product as any).bespokeOptions?.productionTime || "",
							depositAllowed:
								(product as any).bespokeOptions?.depositAllowed || false,
							notesEnabled:
								(product as any).bespokeOptions?.notesEnabled || false,
						},
						// Multiple pricing support
						enableMultiplePricing: (product as any).enableMultiplePricing || false,
						individualItems: (product as any).individualItems || [],
						metric_size_guide: (product as any).metric_size_guide || {
							columns: [],
							rows: [],
						},
					});

					setImagePreview(product.images || []);
					setVideoUrls((product as any).videosUrl || []);

					// Load shipping data
					if (product.shipping) {
						setShipping({
							tierKey: product.shipping.tierKey || "",
							manualOverride: product.shipping.manualOverride || false,
						});
					}

					console.log("Final form data:", {
						customSizes,
						userCustomSizes,
						sizes,
						userSizes,
					});
				} else {
					toast.error(res.message || "Product not found");
					router.push("/vendor/products");
				}
			} catch (error: any) {
				console.error("Error fetching product:", error);
				toast.error("Failed to load product");
				router.push("/vendor/products");
			} finally {
				setLoadingProduct(false);
			}
		};

		if (params.id) {
			fetchProduct();
		}
	}, [params.id, router]);

	const validateStep = (step: number) => {
		const newErrors: Record<string, string> = {};

		// Step 1: Type selection (no validation needed - it's locked)
		if (step === 1) {
			// Product type is locked, no validation needed
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
				if (!formData.individualItems || formData.individualItems.length === 0) {
					newErrors.individualItems = "At least one item is required when multiple pricing is enabled";
				} else {
					// Validate each individual item
					const itemErrors: { [itemId: string]: { name?: string; price?: string } } = {};
																							
					formData.individualItems.forEach((item) => {
						// Validate item name
						if (!item.name || item.name.trim() === '') {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].name = 'Item name is required';
						} else if (item.name.trim().length < 2) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].name = 'Item name must be at least 2 characters';
						}
																									
						// Validate item price
						const itemPrice = item.price;
						const normalizedItemPrice = (() => {
							if (itemPrice === null || itemPrice === undefined) return undefined;
							const strValue = String(itemPrice);
							if (strValue === '') return undefined;
							return Number(itemPrice);
						})();
						const isItemPriceEmpty = normalizedItemPrice === undefined || isNaN(normalizedItemPrice);
																										
						if (isItemPriceEmpty) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].price = 'Price is required';
						} else if (isNaN(normalizedItemPrice!)) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].price = 'Price must be a number';
						} else if (normalizedItemPrice! < 0) {
							if (!itemErrors[item.id]) itemErrors[item.id] = {};
							itemErrors[item.id].price = 'Price cannot be negative';
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
			if (formData.images.length === 0) {
				newErrors.images = "At least one image or video is required";
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
					formData.userSizes &&
					formData.userSizes.length > 0 &&
					formData.userSizes.some((size: any) => size.size.trim() !== "");
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
						const invalidUser = formData.userSizes!.some(
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

	const uploadFinalImages = async () => {
		const tailorId = localStorage.getItem("tailorUID");
		if (!tailorId) {
			toast.error("No tailor ID found");
			return false;
		}

		if (processedImages.length === 0) {
			return true; // No new images to upload
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
				}
			});

			// Reconstruct images list from imagePreview to maintain order and validity
			const newImagesList = imagePreview
				.map((previewUrl) => {
					// If it's already a remote URL (and not a blob/data uri/local), keep it
					if (
						previewUrl.startsWith("http") &&
						!previewUrl.includes("localhost") &&
						!previewUrl.includes("blob:") &&
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
				// No new images to upload, but sync formData.images with imagePreview order
				// (in case of reordering existing images)
				setFormData((prev) => ({
					...prev,
					images: imagePreview,
				}));
			}
		}

		if (validateStep(currentStep)) {
			setCurrentStep((prev) => Math.min(prev + 1, 8));
		}
	};

	const prevStep = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 1));
	};

	// Helper to find the index in processedImages matching a preview URL
	const getProcessedImageIndex = (previewUrl: string) => {
		return processedImages.findIndex(
			(p) => p.original === previewUrl || p.enhanced === previewUrl,
		);
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
				return {
					...prev,
					sizes: prev.sizes.filter((s) => s.size !== size),
				};
			} else {
				return {
					...prev,
					sizes: [...prev.sizes, { size, quantity: 1 }],
					// Clear custom sizes when selecting predefined sizes
					userCustomSizes: undefined,
					userSizes: [],
					customSizes: false,
				};
			}
		});
	};

	const handleSizeQuantityChange = (size: string, quantity: number) => {
		setFormData((prev) => ({
			...prev,
			sizes: prev.sizes.map((s) => (s.size === size ? { ...s, quantity } : s)),
			// Clear custom sizes when modifying predefined sizes
			userCustomSizes: undefined,
			userSizes: [],
			customSizes: false,
		}));
	};

	const handleImageUpload = async (files: FileList | null) => {
		if (!files) return;

		const maxFiles = 5 - imagePreview.length; // Use imagePreview length for total count
		const selectedFiles = Array.from(files).slice(0, maxFiles);

		if (selectedFiles.length === 0) {
			toast.error("Maximum 5 images allowed");
			return;
		}

		try {
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
					`Removing background from image ${i + 1}/${selectedFiles.length}...`,
					{
						id: "image-processing",
					},
				);
				const processedData = await processImagesForPreview([selectedFiles[i]]);
				processed.push(...processedData);
			}

			// Save processed images to state for preview
			const currentProcessedCount = processedImages.length;
			setProcessedImages((prev) => [...prev, ...processed]);
			// Show enhanced version by default in preview
			setImagePreview((prev) => [...prev, ...processed.map((p) => p.enhanced)]);

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

	const addTag = () => {
		if (newTag.trim()) {
			setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
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
			setFormData({
				...formData,
				sizes: [...formData.sizes, { size: newSize.trim(), quantity: 1 }],
			});
			setNewSize("");
		}
	};

	const addColor = () => {
		if (newColor.trim()) {
			setFormData({
				...formData,
				rtwOptions: {
					...formData.rtwOptions,
					colors: [...(formData.rtwOptions?.colors || []), newColor.trim()],
				},
			});
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

	const updateRTWOption = (field: string, value: any) => {
		setFormData({
			...formData,
			rtwOptions: {
				...formData.rtwOptions,
				[field]: value,
			},
		});
	};

	// Reorder Images (set selected index as first/main)
	const setAsMainImage = (index: number) => {
		setImagePreview((prev) => {
			const reordered = [prev[index], ...prev.filter((_, i) => i !== index)];
			// Do NOT update formData.images here with potentially blob URLs.
			// It will be constructed correctly in uploadFinalImages logic.
			return reordered;
		});

		// Also reorder processedImages if possible, but matching might be tricky.
		// Since we don't strictly use processedImages order for final reconstruction (we map by URL),
		// we just need to ensure the preview order is what user sees.
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (isLoading) return;
		setIsLoading(true);

		// Validate shipping data
		const validationError = validateShippingData(shipping);
		if (validationError) {
			alert(validationError);
			setIsLoading(false);
			return;
		}

		try {
			// TODO: BACK IN STOCK NOTIFICATION FEATURE
			// ---------------------------------------------
			// Detect if product is coming back in stock (was 0, now > 0)
			// We need to get the current product data first to compare
			const currentProduct = await getTailorWorkById(
				params.id as string,
				user?.id || user?.uid,
			);

			if (currentProduct.success && currentProduct.data) {
				const oldQuantity = currentProduct.data.wear_quantity || 0;
				const newQuantity = Number(formData.wear_quantity);

				// Check overall stock change
				const wasOutOfStock = oldQuantity === 0;
				const nowInStock = newQuantity > 0;

				// For ready-to-wear, also check individual size quantities
				let sizesCameBackInStock = false;
				if (formData.type === "ready-to-wear" && currentProduct.data.sizes) {
					const oldSizes: any[] = Array.isArray(currentProduct.data.sizes)
						? currentProduct.data.sizes
						: [];

					formData.sizes.forEach((newSize) => {
						// Handle both object formats: {label, quantity} or {size, quantity}
						const oldSize: any = oldSizes.find((s: any) => {
							if (typeof s === "string") return s === newSize.size;
							return (s.label || s.size) === newSize.size;
						});

						const oldQty =
							typeof oldSize === "object" && oldSize !== null
								? oldSize.quantity || 0
								: 0;

						if (oldQty === 0 && newSize.quantity > 0) {
							sizesCameBackInStock = true;
						}
					});
				}

				// If product came back in stock, notify wishlist users
				if ((wasOutOfStock && nowInStock) || sizesCameBackInStock) {
					console.log(
						"🔔 Product came back in stock! Need to notify wishlist users",
					);

					// Step 1: Get all users who wishlisted this product
					try {
						const wishlistQuery = query(
							collectionGroup(db, "user_wishlist_items"),
							where("product_id", "==", formData.product_id),
							where("tailor_id", "==", formData.tailor_id),
						);

						const wishlistSnapshot = await getDocs(wishlistQuery);
						console.log(
							`📦 Found ${wishlistSnapshot.size} users who wishlisted this product`,
						);

						// Extract unique user IDs from document paths
						// Path structure: users_wishlist_items/{userId}/user_wishlist_items/{itemId}
						const userIds = new Set<string>();
						wishlistSnapshot.docs.forEach((wishlistDoc) => {
							const userId = wishlistDoc.ref.parent.parent?.id;
							if (userId) {
								userIds.add(userId);
							}
						});

						console.log(`👥 Unique users to notify: ${userIds.size}`);

						// Step 2: Get user emails from 'users' collection
						const recipients: Array<{
							email: string;
							name: string;
							userId: string;
						}> = [];

						for (const userId of userIds) {
							try {
								const userDocRef = doc(db, "users", userId);
								const userDoc = await getDoc(userDocRef);

								if (userDoc.exists()) {
									const userData = userDoc.data();
									const email = userData?.email;
									const name =
										userData?.name || userData?.displayName || "Customer";

									if (email) {
										recipients.push({
											email,
											name,
											userId,
										});
										console.log(`✅ Added recipient: ${email}`);
									} else {
										console.warn(`⚠️ User ${userId} has no email`);
									}
								}
							} catch (err) {
								console.error(`❌ Error fetching user ${userId}:`, err);
							}
						}

						console.log(
							`📧 Total recipients with emails: ${recipients.length}`,
						);

						// Determine which sizes came back in stock (for email content)
						const restockedSizes: string[] = [];
						if (sizesCameBackInStock) {
							const oldSizes: any[] = Array.isArray(currentProduct.data.sizes)
								? currentProduct.data.sizes
								: [];

							formData.sizes.forEach((newSize) => {
								const oldSize: any = oldSizes.find((s: any) => {
									if (typeof s === "string") return s === newSize.size;
									return (s.label || s.size) === newSize.size;
								});

								const oldQty =
									typeof oldSize === "object" && oldSize !== null
										? oldSize.quantity || 0
										: 0;

								if (oldQty === 0 && newSize.quantity > 0) {
									restockedSizes.push(newSize.size);
								}
							});
						}

						// Step 3: Send emails if we have recipients
						if (recipients.length > 0) {
							console.log(
								"📧 Preparing to send emails to:",
								recipients.length,
								"recipients",
							);

							// Calculate final price with discount
							const finalPrice = formData.price?.discount
								? (formData.price.base || 0) *
									(1 - (formData.price.discount || 0) / 100)
								: formData.price?.base || 0;

							// Get tailor name - fetch from tailors collection if missing
							let tailorName = formData.tailor;
							if (!tailorName || tailorName.trim() === "") {
								try {
									const tailorId = formData.tailor_id || user?.id || user?.uid;
									if (tailorId) {
										const tailorDocRef = doc(db, "tailors", tailorId);
										const tailorDoc = await getDoc(tailorDocRef);
										if (tailorDoc.exists()) {
											const tailorData = tailorDoc.data();
											tailorName =
												tailorData?.brandName || tailorData?.name || "Vendor";
											console.log(`✅ Fetched tailor name: ${tailorName}`);
										}
									}
								} catch (err) {
									console.error("❌ Error fetching tailor name:", err);
									tailorName = "Vendor"; // Fallback
								}
							}

							// Get Firebase callable function from europe-west1 region
							const functionsEU = getFunctions(app, "europe-west1");
							const sendWishlistRestockEmail = httpsCallable(
								functionsEU,
								"sendWishlistRestockEmail",
							);

							// 🔑 GET CURRENT USER'S ACCESS TOKEN
							const currentUser = auth.currentUser;
							const accessToken = await currentUser?.getIdToken();

							if (!accessToken) {
								console.error(
									"❌ No access token available - user not authenticated",
								);
								toast.error("Authentication required to send notifications");
								return; // Exit early if no token
							}

							// Send email to each recipient
							let successCount = 0;
							let failureCount = 0;

							for (const recipient of recipients) {
								try {
									const emailPayload: SendWishlistRestockEmailRequest = {
										to: recipient.email,
										userName: recipient.name,
										productTitle: formData.title,
										productImage: formData.images[0] || "",
										price: finalPrice,
										currency: formData.price?.currency || "NGN",
										tailorName: tailorName || "Vendor",
										productUrl: `https://stitchesafrica.com/products/${formData.product_id}`,
										logoUrl: "https://stitchesafrica.com/logo.png",
										accessToken: accessToken,
										...(restockedSizes.length > 0 && { restockedSizes }),
									};

									// Debug: Log the payload being sent
									console.log(
										"📤 Sending email payload:",
										JSON.stringify(emailPayload, null, 2),
									);

									// Call the Firebase function
									const result = await sendWishlistRestockEmail(emailPayload);

									console.log("📨 Function response:", result);
									successCount++;
									console.log(`✅ Email sent to ${recipient.email}`);
								} catch (emailError: any) {
									failureCount++;
									console.error(
										`❌ Failed to send email to ${recipient.email}:`,
										emailError,
									);
									console.error("Error details:", {
										message: emailError.message,
										code: emailError.code,
										details: emailError.details,
									});
								}
							}

							console.log(
								`📊 Email sending complete: ${successCount} sent, ${failureCount} failed`,
							);

							// Show toast notification
							if (successCount > 0) {
								toast.success(
									`Back-in-stock notifications sent to ${successCount} customer(s)!`,
								);
							}
							if (failureCount > 0) {
								toast.warning(
									`Failed to send ${failureCount} notification(s). Check console for details.`,
								);
							}
						} else {
							console.log("ℹ️ No recipients with valid emails found");
						}
					} catch (error) {
						console.error(
							"❌ Error preparing back-in-stock notifications:",
							error,
						);
						// Don't fail the update if notification fails
					}
				}
			}
			// ---------------------------------------------

			// Convert sizes back to the database format with quantities
			const sizesForAPI = formData.sizes.map((s) => ({
				label: s.size,
				quantity: s.quantity || 1,
			}));

			// Extract size labels as array of strings for rtwOptions.sizes
			const sizeLabels: string[] = sizesForAPI.map((s) => String(s.label));

			// Ensure cleanShippingData result matches the ProductFormData.shipping type
			const finalShippingRaw = cleanShippingData(shipping);
			const finalShipping =
				typeof finalShippingRaw === "object" &&
				finalShippingRaw !== null &&
				"tierKey" in finalShippingRaw &&
				"manualOverride" in finalShippingRaw
					? (finalShippingRaw as { tierKey: string; manualOverride: boolean })
					: undefined;

			const payload: any = {
				title: formData.title,
				description: formData.description,
				price: {
					base: formData.price?.base || 0,
					currency: formData.price?.currency || "NGN",
					// Only include discount if it has a value
					...(formData.price?.discount !== undefined && {
						discount: formData.price.discount,
					}),
				},
				discount: formData.discount || 0,
				wear_quantity: Number(formData.wear_quantity),
				category: formData.category,
				wear_category: formData.wear_category,
				tags: formData.tags.map((tag) => tag.trim()),
				keywords:
					typeof formData.keywords === "string"
						? formData.keywords.split(",").map((k) => k.trim())
						: formData.keywords,
				images: formData.images,
				sizes: sizesForAPI,
				customSizes: formData.customSizes,
				userCustomSizes: formData.userCustomSizes,
				userSizes: formData.userSizes,
				type: formData.type,
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
					depositAllowed: formData.bespokeOptions?.depositAllowed,
					notesEnabled: formData.bespokeOptions?.notesEnabled,
				},
			shipping: finalShipping,
			approvalStatus: "pending",
			// Multiple pricing support
			enableMultiplePricing: formData.enableMultiplePricing,
			individualItems: formData.individualItems,
				metric_size_guide: formData.metric_size_guide,
				
			};

			// Remove undefined values to avoid Firestore errors
			const cleanPayload = Object.fromEntries(
				Object.entries(payload).filter(([_, value]) => value !== undefined),
			);

			console.log("Sending update payload:", cleanPayload);
			console.log("Price object in payload:", cleanPayload.price);
			console.log("Discount field in payload:", cleanPayload.discount);
			await updateTailorWork(params.id as string, cleanPayload);
			// Send notification to admins (non-blocking)
			sendEmailToAdmins(
				{
					...formData,
					id: params.id as string,
				} as any,
				"updated",
			).catch((err) => console.error("Failed to send admin notification", err));
			toast.success("Product updated successfully!");
			router.push(`/vendor/products/${params.id}`);
		} catch (error: any) {
			console.error("Error updating product:", error);
			// Use setTimeout to avoid setState during render
			setTimeout(() => {
				toast.error(
					`Error updating product: ${error.message || "Unknown error"}`,
				);
			}, 0);
		} finally {
			setIsLoading(false);
		}
	};

	if (loadingProduct) {
		return (
			<div className="min-h-screen bg-white">
				<ModernNavbar />
				<div className="container mx-auto px-4 py-8">
					<div className="max-w-4xl mx-auto">
						<div className="animate-pulse">
							<div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
							<div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
							<div className="h-96 bg-gray-200 rounded"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

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

	return (
		<div className="min-h-screen bg-white">
			<Navbar />

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
							Back to Product
						</Button>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">
							Edit Product
						</h1>
						<p className="text-gray-600">Update your product information</p>
					</div>

					{/* Progress Steps */}
					<div className="mb-8">
						<div className="flex items-center justify-between">
							{stepTitles.map((title, index) => {
								const stepNumber = index + 1;
								const isActive = stepNumber === currentStep;
								const isCompleted = stepNumber < currentStep;

								return (
									<div key={stepNumber} className="flex items-center">
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
										{stepNumber < 8 && (
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

					{/* Step 1: Product Type (Read-Only) */}
					{currentStep === 1 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<Package className="h-5 w-5" />
									<span>Product Type</span>
								</CardTitle>
								<CardDescription>
									Product type is locked after creation and cannot be changed
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div
										className={`flex items-center space-x-3 p-4 border-2 rounded-lg ${
											formData.type === "bespoke"
												? "border-blue-500 bg-blue-50"
												: "border-gray-200 bg-gray-50"
										}`}
									>
										<div
											className={`w-4 h-4 rounded-full border-2 ${
												formData.type === "bespoke"
													? "border-blue-500 bg-blue-500"
													: "border-gray-300"
											}`}
										/>
										<div className="flex-1">
											<div className="text-lg font-medium text-gray-900">
												Bespoke
											</div>
											<p className="text-sm text-gray-600">
												Custom-made products tailored to individual measurements
											</p>
										</div>
									</div>

									<div
										className={`flex items-center space-x-3 p-4 border-2 rounded-lg ${
											formData.type === "ready-to-wear"
												? "border-blue-500 bg-blue-50"
												: "border-gray-200 bg-gray-50"
										}`}
									>
										<div
											className={`w-4 h-4 rounded-full border-2 ${
												formData.type === "ready-to-wear"
													? "border-blue-500 bg-blue-500"
													: "border-gray-300"
											}`}
										/>
										<div className="flex-1">
											<div className="text-lg font-medium text-gray-900">
												Ready to Wear
											</div>
											<p className="text-sm text-gray-600">
												Pre-made products available in standard sizes
											</p>
										</div>
									</div>
								</div>

								<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<p className="text-sm text-yellow-800">
										<strong>Note:</strong> Product type cannot be changed after
										creation. If you need a different product type, please
										create a new product.
									</p>
								</div>
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
												category: value as "men" | "women" | "kids",
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
										}
										onChange={(e) => {
											const value = e.target.value;
											setFormData({
												...formData,
												wear_quantity: value === "" ? 0 : Number(value),
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
										value={
											typeof formData.keywords === "string"
												? formData.keywords
												: formData.keywords.join(", ")
										}
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

					{/* Step 3: Pricing */}
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
														currency: p.price?.currency || "NGN",
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
											onChange={(e) => {
												const discountValue =
													Number(e.target.value) || undefined;
												setFormData((p) => ({
													...p,
													price: {
														...p.price,
														discount: discountValue,
														base: p.price?.base || 0,
														currency: p.price?.currency || "NGN",
													},
													// Keep both discount fields in sync
													discount: discountValue || 0,
												}));
											}}
											className="border-2"
										/>
									</div>

									{/* Currency */}
									<div className="space-y-2">
										<Label htmlFor="currency" className="text-sm font-medium">
											Currency <span className="text-red-500">*</span>
										</Label>
										<Select
											value={formData.price?.currency || "NGN"}
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
										<Label htmlFor="enableMultiplePricing" className="text-base font-medium">
											Enable Multiple Pricing
										</Label>
										<p className="text-sm text-gray-600 mt-1">
											Turn on to add individual prices for each item (e.g., Aso Oke pants price, Ankara shirt price). Items can be sold together or separately.
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
											<h3 className="text-lg font-semibold">Individual Items</h3>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													const newItem = {
														id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
														name: '',
														price: 0,
													};
													setFormData((p) => ({
															...p,
															individualItems: [...(p.individualItems || []), newItem],
														}));
												}}
											>
												<Plus className="w-4 h-4 mr-2" />
												Add Item
											</Button>
										</div>
										
										{(formData.individualItems || []).length === 0 && (
											<p className="text-sm text-gray-500 text-center py-4">
												No items added yet. Click "Add Item" to add individual pricing.
											</p>
										)}
										
										{(formData.individualItems || []).map((item, index) => {
											const currentItemErrors = itemErrors[item.id] || {};
											return (
												<div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg bg-gray-50">
													<div className="md:col-span-6 space-y-2">
														<Label htmlFor={`itemName-${item.id}`}>
															Item Name <span className="text-red-500">*</span>
														</Label>
														<Input
															id={`itemName-${item.id}`}
															type="text"
															value={item.name}
															onChange={(e) => {
																const updatedItems = [...(formData.individualItems || [])];
																updatedItems[index] = { ...item, name: e.target.value };
																setFormData((p) => ({ ...p, individualItems: updatedItems }));
															}}
															placeholder="e.g., Aso Oke Pants, Ankara Shirt"
															className={currentItemErrors.name ? "border-red-500" : ""}
														/>
														{currentItemErrors.name && (
															<p className="text-sm text-red-600">{currentItemErrors.name}</p>
														)}
													</div>
													
													<div className="md:col-span-5 space-y-2">
														<Label htmlFor={`itemPrice-${item.id}`}>
															Price ({formData.price?.currency || "NGN"}) <span className="text-red-500">*</span>
														</Label>
														<Input
															id={`itemPrice-${item.id}`}
															type="number"
															min="0"
															step="0.01"
															value={item.price !== undefined && item.price !== null ? item.price : ''}
															onChange={(e) => {
																const updatedItems = [...(formData.individualItems || [])];
																updatedItems[index] = { ...item, price: Number(e.target.value) };
																setFormData((p) => ({ ...p, individualItems: updatedItems }));
															}}
															placeholder="0.00"
															className={currentItemErrors.price ? "border-red-500" : ""}
														/>
														{currentItemErrors.price && (
															<p className="text-sm text-red-600">{currentItemErrors.price}</p>
														)}
													</div>
													
													<div className="md:col-span-1 flex items-end">
														<Button
															type="button"
															variant="outline"
															size="icon"
															onClick={() => {
																const updatedItems = [...(formData.individualItems || [])];
																updatedItems.splice(index, 1);
																setFormData((p) => ({ ...p, individualItems: updatedItems }));
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
											<p className="text-sm text-red-600">{errors.individualItems}</p>
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
										{formData.enableMultiplePricing && formData.individualItems && formData.individualItems.length > 0 ? (
											<>
												<div className="flex justify-between items-center mb-2">
													<span className="text-sm font-medium">Bundle Price (Base):</span>
													<span className="text-lg font-semibold text-gray-600">
														{formData.price?.currency || "NGN"}{" "}
														{(formData.price?.base || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
													</span>
												</div>
												<div className="border-t border-gray-300 my-2 pt-2">
													{formData.individualItems.map((item, index) => (
														<div key={item.id} className="flex justify-between items-center text-sm text-gray-600 py-1">
															<span>{item.name || `Item ${index + 1}`}:</span>
															<span>{formData.price?.currency || "NGN"} {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
														</div>
													))}
												</div>
												<div className="flex justify-between items-center pt-2 border-t border-gray-300">
													<span className="text-sm font-medium">Total Individual Prices:</span>
													<span className="text-2xl font-bold text-gray-800">
														{formData.price?.currency || "NGN"}{" "}
														{formData.individualItems.reduce((sum, item) => sum + item.price, 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
													</span>
												</div>
												{formData.individualItems && formData.individualItems.length > 0 && (
													<div className="flex justify-between items-center pt-1">
														<span className="text-sm font-medium">Bundle Price:</span>
														<span className="text-lg font-bold text-gray-800">
															{formData.price?.currency || "NGN"}{" "}
															{(formData.price?.base || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
													<span className="text-sm font-medium">Final Price:</span>
											<span className="text-2xl font-bold text-gray-600">
												{formData.price?.currency || "NGN"}{" "}
												{formData.price?.discount
													? (
															(formData.price.base || 0) *
															(1 - (formData.price.discount || 0) / 100)
														).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
													: (formData.price?.base || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
											</span>
										</div>
										{formData.price?.discount && (
											<div className="flex justify-between items-center text-sm text-muted-foreground">
												<span>Original Price:</span>
												<span className="line-through">
													{formData.price.currency || "NGN"}{" "}
													{(formData.price.base || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

					{/* Step 4: Product Media */}
					{currentStep === 4 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center space-x-2">
									<ImageIcon className="h-5 w-5" />
									<span>Product Media</span>
								</CardTitle>
								<CardDescription>
									Upload up to 5 high-quality product images
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* ----------- IMAGE UPLOAD SECTION ----------- */}
								<div className="space-y-4">
									{formData.images.length < 5 && (
										<label
											htmlFor="image-upload"
											className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
												uploadingImages
													? "border-blue-400 bg-blue-50 cursor-not-allowed"
													: "border-gray-300 hover:border-purple-400 cursor-pointer"
											}`}
											onDrop={(e) => {
												if (uploadingImages) return;
												e.preventDefault();
												const files = Array.from(e.dataTransfer.files).filter(
													(file) => file.type.startsWith("image/"),
												);
												if (files.length > 0) {
													handleImageUpload(e.dataTransfer.files);
												}
											}}
											onDragOver={(e) => e.preventDefault()}
											onDragEnter={(e) => e.preventDefault()}
										>
											{uploadingImages ? (
												<>
													<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
													<h3 className="text-lg font-medium text-blue-900 mb-2">
														Uploading Images...
													</h3>
													<div className="w-full bg-gray-200 rounded-full h-2 mb-4">
														<div
															className="bg-blue-600 h-2 rounded-full transition-all duration-300"
															style={{ width: `${uploadProgress}%` }}
														></div>
													</div>
													<p className="text-blue-700 text-sm">
														Please wait while we upload your images...
													</p>
												</>
											) : (
												<>
													<Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
													<h3 className="text-lg font-medium text-gray-900 mb-2">
														Upload Images
													</h3>
													<p className="text-gray-500 mb-4">
														Drag and drop your images here, or click to browse
														<br />
														<span className="text-sm">
															({formData.images.length}/5 images uploaded)
														</span>
													</p>
													<input
														type="file"
														accept="image/jpeg,image/jpg,image/png,image/webp"
														multiple
														onChange={(e) => handleImageUpload(e.target.files)}
														className="hidden"
														id="image-upload"
														disabled={uploadingImages}
													/>
													<Button
														variant="outline"
														type="button"
														className="bg-white hover:bg-gray-50 pointer-events-none"
														disabled={uploadingImages}
													>
														<Upload className="h-4 w-4 mr-2" />
														Choose Images
													</Button>
													<p className="text-xs text-gray-500 mt-2">
														Supported formats: JPEG, PNG, WebP (Max 10MB each)
													</p>
												</>
											)}
										</label>
									)}

									{/* Uploaded Images */}
									{imagePreview.length > 0 && (
										<div>
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
													}}
													className="text-red-600 hover:text-red-700 bg-white hover:bg-red-50"
												>
													<X className="h-4 w-4 mr-1" />
													Clear All
												</Button>
											</div>

											<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
												{imagePreview.map((preview, index) => (
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

															{/* Hover Overlay with Eye Icon */}
															{processedImages[index] && (
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
														</div>

														{/* Remove Button */}
														<button
															type="button"
															onClick={() => removeImage(index)}
															className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-full p-1.5 shadow-lg transition-all duration-200 z-10"
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
												))}
											</div>

											{formData.images.length < 5 && (
												<div className="mt-4 text-center">
													<label
														htmlFor="add-more-images"
														className={`cursor-pointer ${
															uploadingImages ? "cursor-not-allowed" : ""
														}`}
													>
														<input
															type="file"
															accept="image/jpeg,image/jpg,image/png,image/webp"
															multiple
															onChange={(e) =>
																handleImageUpload(e.target.files)
															}
															className="hidden"
															id="add-more-images"
															disabled={uploadingImages || processingImages}
														/>
														<Button
															variant="outline"
															type="button"
															size="sm"
															className="bg-white hover:bg-gray-50 pointer-events-none"
															disabled={uploadingImages || processingImages}
														>
															<Plus className="h-4 w-4 mr-2" />
															{processingImages
																? "Processing..."
																: uploadingImages
																	? "Uploading..."
																	: `Add More Images (${
																			5 - formData.images.length
																		} remaining)`}
														</Button>
													</label>
												</div>
											)}
										</div>
									)}
								</div>

								{errors.images && (
									<p className="text-sm text-red-600">{errors.images}</p>
								)}
							</CardContent>
						</Card>
					)}

					{/* Step 5: Sizes */}
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
																			value={
																				selectedSize?.quantity === 0 ||
																				selectedSize?.quantity === undefined
																					? ""
																					: selectedSize?.quantity
																			}
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
														sizes: checked ? [] : formData.sizes, // Clear predefined sizes when switching to custom
														customSizes: checked ? true : false,
														userSizes: checked ? [] : [], // Always clear userSizes when switching
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
											{formData.userSizes?.length === 0 && (
												<p className="text-sm text-red-600">
													Please add at least one custom size before proceeding.
												</p>
											)}

											{formData.userSizes &&
												formData.userSizes.length > 0 &&
												formData.userSizes.some(
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

											{formData.userSizes?.map((item, index) => (
												<div
													key={index}
													className="flex space-x-3 items-center"
												>
													<Input
														placeholder="Size (e.g. XL Tall)"
														value={item.size}
														onChange={(e) => {
															const updated = [...(formData.userSizes || [])];
															updated[index].size = e.target.value;
															setFormData({ ...formData, userSizes: updated });
														}}
														className="w-40"
													/>
													<Input
														type="number"
														min={1}
														placeholder="Quantity"
														value={item.quantity || ""}
														onChange={(e) => {
															const updated = [...(formData.userSizes || [])];
															updated[index].quantity = Number(e.target.value);
															setFormData({ ...formData, userSizes: updated });
														}}
														className="w-24"
													/>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														onClick={() => {
															const updated = (formData.userSizes || []).filter(
																(_, i) => i !== index,
															);
															setFormData({ ...formData, userSizes: updated });
														}}
													>
														Remove
													</Button>
												</div>
											))}
											<Button
												type="button"
												variant="outline"
												onClick={() =>
													setFormData({
														...formData,
														userSizes: [
															...(formData.userSizes || []),
															{ size: "", quantity: 1 },
														],
													})
												}
											>
												+ Add Custom Size
											</Button>
										</div>
									)}

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

					{/* Step 7: Options */}
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
												setFormData({
													...formData,
													careInstructions: e.target.value,
												})
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
														setFormData({
															...formData,
															rtwOptions: {
																...formData.rtwOptions,
																fabric: e.target.value,
															},
														})
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
																	<Badge
																		key={index}
																		variant="outline"
																		className="gap-1"
																	>
																		{color}
																		<Button
																			type="button"
																			variant="ghost"
																			size="sm"
																			className="h-auto p-0 hover:bg-transparent"
																			onClick={() => {
																				const updatedColors = (
																					formData.rtwOptions?.colors || []
																				).filter((_, i) => i !== index);
																				setFormData({
																					...formData,
																					rtwOptions: {
																						...formData.rtwOptions,
																						colors: updatedColors,
																					},
																				});
																			}}
																		>
																			<X className="h-3 w-3" />
																		</Button>
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
													setFormData({
														...formData,
														bespokeOptions: {
															...formData.bespokeOptions,
															productionTime: e.target.value,
														},
													})
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

					{/* Step 8: Shipping */}
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
								type="button"
								onClick={handleSubmit}
								disabled={isLoading}
								className="bg-gradient-to-r from-gray-600 to-black hover:from-gray-300 hover:to-black"
							>
								{isLoading ? "Updating Product..." : "Update Product"}
							</Button>
						)}
					</div>
				</div>
			</form>

			{/* Comparison Modal - Outside form to avoid clipping */}
			{comparisonModalOpen &&
				selectedImageIndex !== null &&
				processedImages[selectedImageIndex] && (
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
													: "Background Removal Comparison"}
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
												<div className="flex items-center gap-1">
													<div className="w-3 h-3 bg-gray-800 rounded"></div>
													<span>Original with background</span>
												</div>
												<span className="text-gray-400">•</span>
												<div className="flex items-center gap-1">
													<div className="w-3 h-3 bg-green-600 rounded"></div>
													<span>AI cleaned & enhanced</span>
												</div>
											</div>
										)}

										{/* Version Selection */}
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-4">
												<p className="text-sm font-medium text-gray-700">
													Version to use for product:
												</p>
												<RadioGroup
													value={imageChoices[localIndex] || "processed"}
													onValueChange={(value: "original" | "processed") => {
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
		</div>
	);
}
