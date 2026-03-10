"use client";

import Image from "next/image";
import { Product } from "@/types";
import { formatPrice, calculateDiscountedPrice } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProductListItemProps {
	product: Product;
	isSelected: boolean;
	onToggleSelection: (productId: string) => void;
}

export function ProductListItem({
	product,
	isSelected,
	onToggleSelection,
}: ProductListItemProps) {
	const basePrice =
		typeof product.price === "number" ? product.price : product.price.base;
	const currency =
		typeof product.price === "object" ? product.price.currency : "NGN";
	const discountedPrice =
		product.discount > 0
			? calculateDiscountedPrice(basePrice, product.discount)
			: basePrice;

	const handleClick = () => {
		onToggleSelection(product.product_id);
	};

	return (
		<div
			onClick={handleClick}
			className={`relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-2 cursor-pointer ${
				isSelected
					? "border-primary-600 ring-2 ring-primary-100"
					: "border-gray-200 hover:border-gray-300"
			}`}
		>
			<div className="flex items-center p-4 gap-4">
				{/* Selection Checkbox */}
				<div className="flex-shrink-0">
					<div
						className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
							isSelected
								? "bg-primary-600 border-primary-600"
								: "bg-white border-gray-300 hover:border-primary-400"
						}`}
					>
						{isSelected && <Check className="w-4 h-4 text-white" />}
					</div>
				</div>

				{/* Product Image */}
				<div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
					<Image
						src={product.images[0] || "/placeholder-product.svg"}
						alt={product.title}
						fill
						className="object-cover"
						sizes="80px"
					/>
				</div>

				{/* Product Info */}
				<div className="flex-1 min-w-0">
					<h3 className="text-sm font-semibold text-gray-900 truncate mb-1">
						{product.title}
					</h3>
					<p className="text-xs text-gray-600 mb-2">
						{product.vendor?.name || product.tailor || "Unknown Brand"}
					</p>
					<div className="flex items-center gap-3 flex-wrap">
						<span
							className={`px-2 py-1 text-xs font-medium rounded ${
								product.type === "bespoke"
									? "bg-purple-100 text-purple-800"
									: "bg-blue-100 text-blue-800"
							}`}
						>
							{product.type === "bespoke" ? "Bespoke" : "Ready-to-Wear"}
						</span>
						<div className="flex items-center">
							<div
								className={`w-2 h-2 rounded-full mr-1 ${
									product.availability === "in_stock"
										? "bg-green-500"
										: product.availability === "pre_order"
											? "bg-yellow-500"
											: "bg-red-500"
								}`}
							/>
							<span className="text-xs text-gray-600 capitalize">
								{product.availability.replace("_", " ")}
							</span>
						</div>
					</div>
				</div>

				{/* Price and Discount */}
				<div className="flex-shrink-0 text-right">
					{product.discount > 0 ? (
						<div className="flex flex-col items-end">
							<span className="text-base font-bold text-gray-900">
								{formatPrice(discountedPrice, currency)}
							</span>
							<span className="text-xs text-gray-500 line-through">
								{formatPrice(basePrice, currency)}
							</span>
							<span className="text-xs font-semibold text-red-600 mt-1">
								-{product.discount}%
							</span>
						</div>
					) : (
						<span className="text-base font-bold text-gray-900">
							{formatPrice(basePrice, currency)}
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
