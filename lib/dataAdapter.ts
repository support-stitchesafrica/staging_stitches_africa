// Data adapter to transform existing Stitches Africa data to our component format
import { Product, Tailor } from "@/types";
import { resolveProductAvailability } from "@/lib/utils/product-availability";

export function adaptProductData(rawProduct: any): Product {
	// Handle price format - your data has both number and object formats
	const price =
		typeof rawProduct.price === "number"
			? { base: rawProduct.price, currency: "USD" }
			: rawProduct.price || { base: 0, currency: "USD" };

	// Create vendor object from tailor data
	const vendor = {
		id: rawProduct.tailor_id || "",
		name:
			rawProduct.brandName ||
			rawProduct.brand_name ||
			rawProduct.tailor ||
			"Unknown Brand",
	};

	// Map availability (normalized after full product shape is built)
	const rawAvailability = rawProduct.availability || rawProduct.in_stock || "in_stock";

	// Handle images array
	const images = Array.isArray(rawProduct.images) ? rawProduct.images : [];

	// Handle tags
	const tags = Array.isArray(rawProduct.tags) ? rawProduct.tags : [];

	// Determine product type based on existing data
	const type = rawProduct.type || "ready-to-wear";

	// Bespoke: pass through Firestore `bespokeOptions` (incl. sizingApproach + footwear)
	const bespokeCustomization = rawProduct.bespokeOptions?.customization;
	const bespokeOptions: Product["bespokeOptions"] | undefined =
		type === "bespoke"
			? {
					customization: bespokeCustomization || {},
					fabricChoices:
						rawProduct.bespokeOptions?.fabricChoices?.length > 0
							? rawProduct.bespokeOptions.fabricChoices
							: bespokeCustomization?.fabricChoices || [],
					styleOptions:
						rawProduct.bespokeOptions?.styleOptions?.length > 0
							? rawProduct.bespokeOptions.styleOptions
							: bespokeCustomization?.styleOptions || [],
					finishingOptions:
						bespokeCustomization?.finishingOptions?.length > 0
							? bespokeCustomization.finishingOptions
							: rawProduct.bespokeOptions?.finishingOptions || [],
					productionTime:
						rawProduct.bespokeOptions?.productionTime ||
						rawProduct.deliveryTimeline ||
						"",
					measurementsRequired:
						rawProduct.bespokeOptions?.measurementsRequired ?? [],
					depositAllowed: rawProduct.bespokeOptions?.depositAllowed,
					notesEnabled: rawProduct.bespokeOptions?.notesEnabled,
					sizingApproach: rawProduct.bespokeOptions?.sizingApproach,
					careInstructions: rawProduct.bespokeOptions?.careInstructions,
					footwearSizing:
						rawProduct.bespokeOptions?.footwearSizing ?? undefined,
				}
			: undefined;

	// RTW: derive from document. Bespoke footwear: `addTailorWork` stores mirror RTW in `rtwOptions`.
	const rtwOptions: Product["rtwOptions"] | undefined =
		type === "ready-to-wear"
			? {
					sizes:
						rawProduct.sizes || rawProduct.rtwOptions?.sizes || [],
					colors:
						rawProduct.colors || rawProduct.rtwOptions?.colors || [],
					fabric: rawProduct.rtwOptions?.fabric || "",
					season: rawProduct.rtwOptions?.season ?? undefined,
					sizingApproach: rawProduct.rtwOptions?.sizingApproach ?? undefined,
				}
			: type === "bespoke" &&
				  rawProduct.rtwOptions &&
				  typeof rawProduct.rtwOptions === "object"
				? {
						sizes: Array.isArray(rawProduct.rtwOptions.sizes)
							? rawProduct.rtwOptions.sizes
							: [],
						colors: rawProduct.rtwOptions.colors || [],
						fabric: rawProduct.rtwOptions.fabric || "",
						season: rawProduct.rtwOptions.season ?? undefined,
						sizingApproach:
							rawProduct.rtwOptions.sizingApproach ?? undefined,
					}
				: undefined;

	// Handle shipping data
	const shipping = rawProduct.shipping
		? {
				actualWeightKg: rawProduct.shipping.actualWeightKg || 0,
				heightCm: rawProduct.shipping.heightCm || 0,
				lengthCm: rawProduct.shipping.lengthCm || 0,
				widthCm: rawProduct.shipping.widthCm || 0,
				manualOverride: rawProduct.shipping.manualOverride || false,
				tierKey: rawProduct.shipping.tierKey || "tier_standard",
			}
		: undefined;

	const product: Product = {
		product_id: rawProduct.product_id || rawProduct.id,
		title: rawProduct.title || "Untitled Product",
		description: rawProduct.description || "",
		type: type as "bespoke" | "ready-to-wear",
		category: rawProduct.category || rawProduct.wear_category || "general",
		price,
		images,
		vendor,
		availability: rawAvailability as "in_stock" | "pre_order" | "out_of_stock",
		status: rawProduct.status || "verified",
		discount: rawProduct.discount || 0,
		deliveryTimeline: rawProduct.deliveryTimeline || "3-5 business days",
		returnPolicy: rawProduct.returnPolicy || "30 days return policy",
		tags,
		tailor_id: rawProduct.tailor_id || "",
		tailor: rawProduct.tailor || "",
		bespokeOptions,
		rtwOptions,
		shipping,
		metric_size_guide: rawProduct.metric_size_guide,
		sizeGuideImages: Array.isArray(rawProduct.sizeGuideImages)
			? rawProduct.sizeGuideImages
			: undefined,
		enableMultiplePricing: rawProduct.enableMultiplePricing || false,
		individualItems: rawProduct.individualItems || [],
		sizes: Array.isArray(rawProduct.sizes) ? rawProduct.sizes : undefined,
		userSizes: rawProduct.userSizes,
		userCustomSizes: rawProduct.userCustomSizes,
		customSizes: rawProduct.customSizes,
		wear_quantity: rawProduct.wear_quantity,
		wear_category: rawProduct.wear_category || rawProduct.category,
		isTest: rawProduct.isTest === true,
	};

	product.availability = resolveProductAvailability(product);
	return product;
}

export function adaptProductsArray(rawProducts: any[]): Product[] {
	return rawProducts.map(adaptProductData);
}

export function adaptTailorData(rawTailor: any): Tailor {
	return {
		id: rawTailor.id || rawTailor.uid,
		brandName: rawTailor.brandName || rawTailor.brand_name || "",
		brand_logo: rawTailor.brand_logo || "",
		first_name: rawTailor.first_name || "",
		last_name: rawTailor.last_name || "",
		email: rawTailor.email || "",
		phoneNumber: rawTailor.phoneNumber || rawTailor.phone_number || "",
		address: rawTailor.address || "",
		city: rawTailor.city || "",
		state: rawTailor.state || "",
		country: rawTailor.country || "",
		ratings: rawTailor.ratings || 0,
		yearsOfExperience: rawTailor.yearsOfExperience || 0,
		type: Array.isArray(rawTailor.type) ? rawTailor.type : [],
		featured_works: Array.isArray(rawTailor.featured_works)
			? rawTailor.featured_works
			: [],
		status: rawTailor.status || "pending",
	};
}

export function adaptTailorsArray(rawTailors: any[]): Tailor[] {
	return rawTailors.map(adaptTailorData);
}
