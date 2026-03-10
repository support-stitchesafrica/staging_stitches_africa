"use client";

import { useCallback, useMemo } from "react";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { ProductFormData } from "@/types/collections";

interface ProductFormProps {
	productData: ProductFormData;
	onProductChange: (data: ProductFormData) => void;
	uploadProgress?: number;
	showErrors?: boolean;
}

interface ValidationErrors {
	title?: string;
	description?: string;
	quantity?: string;
	size?: string;
	color?: string;
	price?: string;
	brandName?: string;
	images?: string;
	ownerName?: string;
	ownerEmail?: string;
	ownerPhoneNumber?: string;
	// Multiple pricing validation errors
	individualItems?: string;
	itemErrors?: {
		[itemId: string]: {
			name?: string;
			price?: string;
		};
	};
}

export function ProductForm({
	productData,
	onProductChange,
	uploadProgress,
	showErrors = false,
}: ProductFormProps) {
	// Validate individual fields
	const validateField = useCallback(
		(field: keyof ProductFormData, value: any): string | undefined => {
			switch (field) {
				case "title":
					if (!value || value.trim() === "") return "Title is required";
					if (value.length < 3) return "Title must be at least 3 characters";
					if (value.length > 100)
						return "Title must be less than 100 characters";
					break;

				case "description":
					if (!value || value.trim() === "") return "Description is required";
					if (value.length < 10)
						return "Description must be at least 10 characters";
					if (value.length > 500)
						return "Description must be less than 500 characters";
					break;

				case "quantity":
					// Handle both number and string inputs (empty string from number inputs)
					const quantityVal =
						value === "" || value === null || value === undefined
							? undefined
							: Number(value);
					if (quantityVal !== undefined && isNaN(quantityVal))
						return "Quantity must be a number";
					if (quantityVal !== undefined && quantityVal < 0)
						return "Quantity cannot be negative";
					break;

				case "size":
					if (!value || value.trim() === "") return "Size is required";
					break;

				case "color":
					if (!value || value.trim() === "") return "Color is required";
					break;

				case "price":
					// Handle both number and string inputs (empty string from number inputs)
					const priceVal =
						value === "" || value === null || value === undefined
							? undefined
							: Number(value);
					if (priceVal === undefined) return "Price is required";
					if (isNaN(priceVal)) return "Price must be a number";
					if (priceVal < 0) return "Price cannot be negative";
					break;

				case "brandName":
					if (!value || value.trim() === "") return "Brand name is required";
					if (value.length < 2)
						return "Brand name must be at least 2 characters";
					break;

				case "images":
					// Check if there are either new images (File objects) or existing images (URLs)
					if (
						(!productData.images || productData.images.length === 0) &&
						(!productData.imagePreviewUrls ||
							productData.imagePreviewUrls.length === 0)
					) {
						return "At least one image is required";
					}
					break;
			}

			return undefined;
		},
		[productData.images],
	);

	// Validate owner fields
	const validateOwnerField = useCallback(
		(
			field: "name" | "email" | "phoneNumber",
			value: string,
		): string | undefined => {
			switch (field) {
				case "name":
					if (!value || value.trim() === "") return "Owner name is required";
					if (value.length < 2)
						return "Owner name must be at least 2 characters";
					break;

				case "email":
					if (!value || value.trim() === "") return "Owner email is required";
					const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
					if (!emailRegex.test(value))
						return "Please enter a valid email address";
					break;

				case "phoneNumber":
					if (!value || value.trim() === "")
						return "Owner phone number is required";
					const phoneRegex = /^[\d\s\-\+\(\)]+$/;
					if (!phoneRegex.test(value))
						return "Please enter a valid phone number";
					if (value.replace(/\D/g, "").length < 10)
						return "Phone number must be at least 10 digits";
					break;
			}

			return undefined;
		},
		[],
	);

	// Get all validation errors
	const errors = useMemo((): ValidationErrors => {
		if (!showErrors) return {};

		return {
			title: validateField("title", productData.title),
			description: validateField("description", productData.description),
			quantity: validateField("quantity", productData.quantity),
			size: validateField("size", productData.size),
			color: validateField("color", productData.color),
			price: validateField("price", productData.price),
			brandName: validateField("brandName", productData.brandName),
			images: validateField("images", productData.images),
			ownerName: validateOwnerField("name", productData.owner?.name || ""),
			ownerEmail: validateOwnerField("email", productData.owner?.email || ""),
			ownerPhoneNumber: validateOwnerField(
				"phoneNumber",
				productData.owner?.phoneNumber || "",
			),
		};
	}, [showErrors, productData, validateField, validateOwnerField]);

	// Handle field changes
	const handleFieldChange = useCallback(
		(field: keyof ProductFormData, value: any) => {
			onProductChange({
				...productData,
				[field]: value,
			});
		},
		[productData, onProductChange],
	);

	// Handle image changes
	const handleImagesChange = useCallback(
		(files: File[], previews: string[]) => {
			onProductChange({
				...productData,
				images: files,
				imagePreviewUrls: previews,
			});
		},
		[productData, onProductChange],
	);

	// Handle owner field changes
	const handleOwnerFieldChange = useCallback(
		(field: "name" | "email" | "phoneNumber", value: string) => {
			onProductChange({
				...productData,
				owner: {
					...productData.owner,
					[field]: value,
				},
			});
		},
		[productData, onProductChange],
	);

	return (
		<div className="space-y-6">
			{/* Title */}
			<div className="space-y-2">
				<Label htmlFor={`title-${productData.id}`}>
					Title <span className="text-red-500">*</span>
				</Label>
				<Input
					id={`title-${productData.id}`}
					type="text"
					value={productData.title}
					onChange={(e) => handleFieldChange("title", e.target.value)}
					placeholder="Enter product title"
					aria-invalid={!!errors.title}
				/>
				{errors.title && (
					<div className="flex items-start gap-2 text-sm text-red-600">
						<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<span>{errors.title}</span>
					</div>
				)}
			</div>

			{/* Description */}
			<div className="space-y-2">
				<Label htmlFor={`description-${productData.id}`}>
					Description <span className="text-red-500">*</span>
				</Label>
				<Textarea
					id={`description-${productData.id}`}
					value={productData.description}
					onChange={(e) => handleFieldChange("description", e.target.value)}
					placeholder="Enter product description"
					rows={4}
					aria-invalid={!!errors.description}
				/>
				{errors.description && (
					<div className="flex items-start gap-2 text-sm text-red-600">
						<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<span>{errors.description}</span>
					</div>
				)}
			</div>

			{/* Size */}
			<div className="space-y-2">
				<Label htmlFor={`size-${productData.id}`}>
					Size <span className="text-red-500">*</span>
				</Label>
				<Input
					id={`size-${productData.id}`}
					type="text"
					value={productData.size}
					onChange={(e) => handleFieldChange("size", e.target.value)}
					placeholder="e.g., S, M, L, XL"
					aria-invalid={!!errors.size}
				/>
				{errors.size && (
					<div className="flex items-start gap-2 text-sm text-red-600">
						<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<span>{errors.size}</span>
					</div>
				)}
			</div>

			{/* Color, Price, and Quantity */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="space-y-2">
					<Label htmlFor={`color-${productData.id}`}>
						Color <span className="text-red-500">*</span>
					</Label>
					<Input
						id={`color-${productData.id}`}
						type="text"
						value={productData.color}
						onChange={(e) => handleFieldChange("color", e.target.value)}
						placeholder="e.g., Red, Blue, Black"
						aria-invalid={!!errors.color}
					/>
					{errors.color && (
						<div className="flex items-start gap-2 text-sm text-red-600">
							<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
							<span>{errors.color}</span>
						</div>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor={`price-${productData.id}`}>
						Price (₦) <span className="text-red-500">*</span>
					</Label>
					<Input
						id={`price-${productData.id}`}
						type="number"
						min="0"
						step="0.01"
						value={
							productData.price !== undefined && productData.price !== null
								? productData.price
								: ""
						}
						onChange={(e) => handleFieldChange("price", e.target.value)}
						placeholder="0.00"
						aria-invalid={!!errors.price}
					/>
					{errors.price && (
						<div className="flex items-start gap-2 text-sm text-red-600">
							<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
							<span>{errors.price}</span>
						</div>
					)}
				</div>

				<div className="space-y-2">
					<Label htmlFor={`quantity-${productData.id}`}>
						Quantity (Inventory)
					</Label>
					<Input
						id={`quantity-${productData.id}`}
						type="number"
						min="0"
						step="1"
						value={
							productData.quantity !== undefined &&
							productData.quantity !== null
								? productData.quantity
								: ""
						}
						onChange={(e) => handleFieldChange("quantity", e.target.value)}
						placeholder="0"
						aria-invalid={!!errors.quantity}
					/>
					{errors.quantity && (
						<div className="flex items-start gap-2 text-sm text-red-600">
							<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
							<span>{errors.quantity}</span>
						</div>
					)}
				</div>
			</div>

			{/* Multiple Pricing Toggle */}
			<div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
				<div>
					<Label
						htmlFor={`enableMultiplePricing-${productData.id}`}
						className="text-base font-medium"
					>
						Enable Multiple Pricing
					</Label>
					<p className="text-sm text-gray-600 mt-1">
						Turn on to add individual prices for each item in the collection
						(e.g., shirt price, pant price)
					</p>
				</div>
				<Switch
					id={`enableMultiplePricing-${productData.id}`}
					checked={productData.enableMultiplePricing}
					onCheckedChange={(checked) => {
						handleFieldChange("enableMultiplePricing", checked);
						// When turning off multiple pricing, clear individual items
						if (!checked) {
							handleFieldChange("individualItems", []);
						}
					}}
				/>
			</div>

			{/* Multiple Pricing Items - Only show if enabled */}
			{productData.enableMultiplePricing && (
				<div className="space-y-4 border rounded-lg p-4 bg-white">
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold">Individual Items</h3>
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
								const updatedItems = [
									...(productData.individualItems || []),
									newItem,
								];
								handleFieldChange("individualItems", updatedItems);
							}}
						>
							<Plus className="w-4 h-4 mr-2" />
							Add Item
						</Button>
					</div>

					{(productData.individualItems || []).map((item, index) => {
						const itemErrors = errors.itemErrors?.[item.id] || {};
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
												...(productData.individualItems || []),
											];
											updatedItems[index] = { ...item, name: e.target.value };
											handleFieldChange("individualItems", updatedItems);
										}}
										placeholder="e.g., Shirt, Pant, Shoes"
										aria-invalid={!!itemErrors.name}
									/>
									{itemErrors.name && (
										<div className="flex items-start gap-2 text-sm text-red-600">
											<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
											<span>{itemErrors.name}</span>
										</div>
									)}
								</div>

								<div className="md:col-span-5 space-y-2">
									<Label htmlFor={`itemPrice-${item.id}`}>
										Price (₦) <span className="text-red-500">*</span>
									</Label>
									<Input
										id={`itemPrice-${item.id}`}
										type="number"
										min="0"
										step="0.01"
										value={
											item.price !== undefined && item.price !== null
												? item.price
												: ""
										}
										onChange={(e) => {
											const updatedItems = [
												...(productData.individualItems || []),
											];
											updatedItems[index] = {
												...item,
												price: Number(e.target.value),
											};
											handleFieldChange("individualItems", updatedItems);
										}}
										placeholder="0.00"
										aria-invalid={!!itemErrors.price}
									/>
									{itemErrors.price && (
										<div className="flex items-start gap-2 text-sm text-red-600">
											<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
											<span>{itemErrors.price}</span>
										</div>
									)}
								</div>

								<div className="md:col-span-1 flex items-end">
									<Button
										type="button"
										variant="outline"
										size="icon"
										onClick={() => {
											const updatedItems = [
												...(productData.individualItems || []),
											];
											updatedItems.splice(index, 1);
											handleFieldChange("individualItems", updatedItems);
										}}
										className="text-red-600 hover:text-red-700"
									>
										<Trash2 className="w-4 h-4" />
									</Button>
								</div>
							</div>
						);
					})}

					{/* Display total if there are items */}
					{productData.individualItems &&
						productData.individualItems.length > 0 && (
							<div className="pt-4 border-t">
								<div className="flex justify-between text-lg font-semibold">
									<span>Total Price:</span>
									<span>
										₦
										{productData.individualItems
											.reduce((sum, item) => sum + item.price, 0)
											.toLocaleString()}
									</span>
								</div>
							</div>
						)}
				</div>
			)}

			{/* Brand Name */}
			<div className="space-y-2">
				<Label htmlFor={`brandName-${productData.id}`}>
					Brand Name <span className="text-red-500">*</span>
				</Label>
				<Input
					id={`brandName-${productData.id}`}
					type="text"
					value={productData.brandName}
					onChange={(e) => handleFieldChange("brandName", e.target.value)}
					placeholder="Enter brand name"
					aria-invalid={!!errors.brandName}
				/>
				{errors.brandName && (
					<div className="flex items-start gap-2 text-sm text-red-600">
						<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<span>{errors.brandName}</span>
					</div>
				)}
			</div>

			{/* Product Owner Information Section */}
			<div className="border-t pt-6 space-y-4">
				<h3 className="text-lg font-semibold">Product Owner Information</h3>

				{/* Owner Name */}
				<div className="space-y-2">
					<Label htmlFor={`ownerName-${productData.id}`}>
						Owner Name <span className="text-red-500">*</span>
					</Label>
					<Input
						id={`ownerName-${productData.id}`}
						type="text"
						value={productData.owner?.name || ""}
						onChange={(e) => handleOwnerFieldChange("name", e.target.value)}
						placeholder="Enter owner's full name"
						aria-invalid={!!errors.ownerName}
					/>
					{errors.ownerName && (
						<div className="flex items-start gap-2 text-sm text-red-600">
							<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
							<span>{errors.ownerName}</span>
						</div>
					)}
				</div>

				{/* Owner Email and Phone */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor={`ownerEmail-${productData.id}`}>
							Owner Email <span className="text-red-500">*</span>
						</Label>
						<Input
							id={`ownerEmail-${productData.id}`}
							type="email"
							value={productData.owner?.email || ""}
							onChange={(e) => handleOwnerFieldChange("email", e.target.value)}
							placeholder="owner@example.com"
							aria-invalid={!!errors.ownerEmail}
						/>
						{errors.ownerEmail && (
							<div className="flex items-start gap-2 text-sm text-red-600">
								<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>{errors.ownerEmail}</span>
							</div>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor={`ownerPhone-${productData.id}`}>
							Owner Phone Number <span className="text-red-500">*</span>
						</Label>
						<Input
							id={`ownerPhone-${productData.id}`}
							type="tel"
							value={productData.owner?.phoneNumber || ""}
							onChange={(e) =>
								handleOwnerFieldChange("phoneNumber", e.target.value)
							}
							placeholder="+1 (555) 123-4567"
							aria-invalid={!!errors.ownerPhoneNumber}
						/>
						{errors.ownerPhoneNumber && (
							<div className="flex items-start gap-2 text-sm text-red-600">
								<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
								<span>{errors.ownerPhoneNumber}</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Images */}
			<div className="space-y-2">
				<Label>
					Product Images <span className="text-red-500">*</span>
				</Label>
				<ImageUploader
					productId={productData.id}
					images={productData.images}
					previewUrls={productData.imagePreviewUrls}
					onImagesChange={handleImagesChange}
					uploadProgress={uploadProgress}
				/>
				{errors.images && (
					<div className="flex items-start gap-2 text-sm text-red-600">
						<AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<span>{errors.images}</span>
					</div>
				)}
			</div>
		</div>
	);
}

// Export validation function for use in parent components
export function validateProductForm(productData: ProductFormData): {
	isValid: boolean;
	errors: ValidationErrors;
} {
	const errors: ValidationErrors = {};

	// Debug: Log the product data being validated
	console.log("[validateProductForm] Validating product:", {
		id: productData.id,
		title: productData.title,
		description: productData.description,
		quantity: productData.quantity,
		quantityType: typeof productData.quantity,
		price: productData.price,
		priceType: typeof productData.price,
		size: productData.size,
		color: productData.color,
		brandName: productData.brandName,
		images: productData.images?.length || 0,
		imagePreviewUrls: productData.imagePreviewUrls?.length || 0,
		owner: productData.owner,
	});

	// Title validation
	if (!productData.title || productData.title.trim() === "") {
		errors.title = "Title is required";
	} else if (productData.title.length < 3) {
		errors.title = "Title must be at least 3 characters";
	} else if (productData.title.length > 100) {
		errors.title = "Title must be less than 100 characters";
	}

	// Description validation
	if (!productData.description || productData.description.trim() === "") {
		errors.description = "Description is required";
	} else if (productData.description.length < 10) {
		errors.description = "Description must be at least 10 characters";
	} else if (productData.description.length > 500) {
		errors.description = "Description must be less than 500 characters";
	}

	// Quantity validation removed - not used in pricing

	// Size validation
	if (!productData.size || productData.size.trim() === "") {
		errors.size = "Size is required";
	}

	// Color validation
	if (!productData.color || productData.color.trim() === "") {
		errors.color = "Color is required";
	}

	// Price validation - handle both number and string inputs
	const priceValue = productData.price;
	const normalizedPrice = (() => {
		if (priceValue === null || priceValue === undefined) return undefined;
		const strValue = String(priceValue);
		if (strValue === "") return undefined;
		return Number(priceValue);
	})();
	const isPriceEmpty = normalizedPrice === undefined || isNaN(normalizedPrice);

	if (isPriceEmpty) {
		errors.price = "Price is required";
	} else {
		if (isNaN(normalizedPrice)) {
			errors.price = "Price must be a number";
		} else if (normalizedPrice < 0) {
			errors.price = "Price cannot be negative";
		}
	}

	// Brand name validation
	if (!productData.brandName || productData.brandName.trim() === "") {
		errors.brandName = "Brand name is required";
	} else if (productData.brandName.length < 2) {
		errors.brandName = "Brand name must be at least 2 characters";
	}

	// Owner validation
	if (!productData.owner?.name || productData.owner.name.trim() === "") {
		errors.ownerName = "Owner name is required";
	} else if (productData.owner.name.length < 2) {
		errors.ownerName = "Owner name must be at least 2 characters";
	}

	if (!productData.owner?.email || productData.owner.email.trim() === "") {
		errors.ownerEmail = "Owner email is required";
	} else {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(productData.owner.email)) {
			errors.ownerEmail = "Please enter a valid email address";
		}
	}

	if (
		!productData.owner?.phoneNumber ||
		productData.owner.phoneNumber.trim() === ""
	) {
		errors.ownerPhoneNumber = "Owner phone number is required";
	} else {
		const phoneRegex = /^[\d\s\-\+\(\)]+$/;
		if (!phoneRegex.test(productData.owner.phoneNumber)) {
			errors.ownerPhoneNumber = "Please enter a valid phone number";
		} else if (productData.owner.phoneNumber.replace(/\D/g, "").length < 10) {
			errors.ownerPhoneNumber = "Phone number must be at least 10 digits";
		}
	}

	// Images validation - check both new images and existing image URLs
	if (
		(!productData.images || productData.images.length === 0) &&
		(!productData.imagePreviewUrls || productData.imagePreviewUrls.length === 0)
	) {
		errors.images = "At least one image is required";
	}

	// Multiple pricing validation
	if (productData.enableMultiplePricing) {
		if (
			!productData.individualItems ||
			productData.individualItems.length === 0
		) {
			errors.individualItems =
				"At least one item is required when multiple pricing is enabled";
		} else {
			// Validate each individual item
			const itemErrors: {
				[itemId: string]: {
					name?: string;
					price?: string;
					quantity?: string;
				};
			} = {};

			productData.individualItems.forEach((item) => {
				// Validate item name
				if (!item.name || item.name.trim() === "") {
					if (!itemErrors[item.id]) itemErrors[item.id] = {};
					itemErrors[item.id].name = "Item name is required";
				} else if (item.name.trim().length < 2) {
					if (!itemErrors[item.id]) itemErrors[item.id] = {};
					itemErrors[item.id].name = "Item name must be at least 2 characters";
				}

				// Validate item price - handle both number and string inputs
				const itemPrice = item.price;
				const normalizedItemPrice = (() => {
					if (itemPrice === null || itemPrice === undefined) return undefined;
					const strValue = String(itemPrice);
					if (strValue === "") return undefined;
					return Number(itemPrice);
				})();
				const isItemPriceEmpty =
					normalizedItemPrice === undefined || isNaN(normalizedItemPrice);

				if (isItemPriceEmpty) {
					if (!itemErrors[item.id]) itemErrors[item.id] = {};
					itemErrors[item.id].price = "Price is required";
				} else if (isNaN(normalizedItemPrice)) {
					if (!itemErrors[item.id]) itemErrors[item.id] = {};
					itemErrors[item.id].price = "Price must be a number";
				} else if (normalizedItemPrice < 0) {
					if (!itemErrors[item.id]) itemErrors[item.id] = {};
					itemErrors[item.id].price = "Price cannot be negative";
				}
			});

			if (Object.keys(itemErrors).length > 0) {
				errors.itemErrors = itemErrors;
			}
		}
	}

	const isValid = Object.keys(errors).length === 0;

	// Debug: Log validation result
	console.log("[validateProductForm] Validation result:", {
		productId: productData.id,
		isValid,
		errorCount: Object.keys(errors).length,
		errors: Object.keys(errors).length > 0 ? errors : "none",
	});

	return {
		isValid,
		errors,
	};
}
