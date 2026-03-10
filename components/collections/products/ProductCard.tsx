"use client";

import Image from "next/image";
import { Product } from "@/types";
import { formatPrice, calculateDiscountedPrice } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProductCardProps {
	product: Product;
	isSelected: boolean;
	onToggleSelection: (productId: string) => void;
}

export function ProductCard({
	product,
	isSelected,
	onToggleSelection,
}: ProductCardProps) {
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
			{/* Selection Checkbox */}
			<div className="absolute top-2 left-2 z-10">
				<div
					className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
						isSelected
							? "bg-primary-600 border-primary-600"
							: "bg-white border-gray-300 hover:border-primary-400"
					}`}
				>
					{isSelected && <Check className="w-3 h-3 text-white" />}
				</div>
			</div>

			{/* Product Image */}
			<div className="relative aspect-square overflow-hidden bg-gray-100">
				<Image
					src={product.images[0] || "/placeholder-product.svg"}
					alt={product.title}
					fill
					className="object-cover"
					sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
					loading="lazy"
					placeholder="blur"
					blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
				/>

				{/* Discount Badge */}
				{product.discount > 0 && (
					<div className="absolute top-2 right-2 bg-red-500 text-white px-1.5 py-0.5 text-[10px] font-semibold rounded">
						-{product.discount}%
					</div>
				)}
			</div>

			{/* Product Info - Compact */}
			<div className="p-2">
				<h3 className="text-xs font-semibold text-gray-900 line-clamp-1 mb-0.5">
					{product.title}
				</h3>
				<p className="text-[10px] text-gray-500 line-clamp-1 mb-1">
					{product.vendor?.name || product.tailor || "Unknown"}
				</p>

				<div className="flex items-center justify-between">
					{product.discount > 0 ? (
						<div className="flex flex-col">
							<span className="text-xs font-bold text-gray-900">
								{formatPrice(discountedPrice, currency)}
							</span>
							<span className="text-[10px] text-gray-400 line-through">
								{formatPrice(basePrice, currency)}
							</span>
						</div>
					) : (
						<span className="text-xs font-bold text-gray-900">
							{formatPrice(basePrice, currency)}
						</span>
					)}

					{/* Availability Dot */}
					<div
						className={`w-2 h-2 rounded-full ${
							product.availability === "in_stock"
								? "bg-green-500"
								: product.availability === "pre_order"
									? "bg-yellow-500"
									: "bg-red-500"
						}`}
						title={product.availability.replace("_", " ")}
					/>
				</div>
			</div>
		</div>
	);
}
