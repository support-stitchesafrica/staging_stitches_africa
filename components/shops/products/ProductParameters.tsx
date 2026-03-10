"use client";

import React from "react";
import { Product } from "@/types";
import {
	getRelevantParameters,
	shouldShowFeature,
	getTypeSpecificStyling,
} from "@/lib/utils/product-type-utils";
import {
	Package,
	Clock,
	Shield,
	Star,
	TrendingUp,
	Award,
	Eye,
	Calendar,
} from "lucide-react";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { TranslatedValue } from "@/components/common/TranslatedValue";

interface ProductParametersProps {
	product: Product;
}

export const ProductParameters: React.FC<ProductParametersProps> = ({
	product,
}) => {
	const { t } = useLanguage();
	const relevantParams = getRelevantParameters(product);
	const styling = getTypeSpecificStyling(product);
	const isBespoke = product.type === "bespoke";

	const getParameterIcon = (param: string) => {
		switch (param) {
			case "category":
				return <Package size={14} />;
			case "deliveryTimeline":
				return <Clock size={14} />;
			case "returnPolicy":
				return <Shield size={14} />;
			case "featured":
				return <Star size={14} />;
			case "isNewArrival":
				return <TrendingUp size={14} />;
			case "isBestSeller":
				return <Award size={14} />;
			case "isPublished":
				return <Eye size={14} />;
			case "createdAt":
				return <Calendar size={14} />;
			case "updatedAt":
				return <Calendar size={14} />;
			default:
				return null;
		}
	};

	const getParameterValue = (param: string, value: any) => {
		switch (param) {
			case "availability":
				return (
					<span
						className={`px-2 py-1 rounded text-xs ${
							value === "in_stock"
								? "bg-green-100 text-green-800"
								: value === "pre_order"
									? "bg-yellow-100 text-yellow-800"
									: "bg-red-100 text-red-800"
						}`}
					>
						{value === "in_stock"
							? t.productPage.inStock
							: value === "pre_order"
								? "Pre-Order"
								: t.productPage.outOfStock}
					</span>
				);

			case "status":
				return (
					<span
						className={`px-2 py-1 rounded text-xs ${
							value === "verified"
								? "bg-green-100 text-green-800"
								: value === "pending"
									? "bg-yellow-100 text-yellow-800"
									: value === "draft"
										? "bg-gray-100 text-gray-800"
										: "bg-red-100 text-red-800"
						}`}
					>
						{value.toUpperCase()}
					</span>
				);

			case "featured":
			case "isNewArrival":
			case "isBestSeller":
			case "customSizes":
			case "isPublished":
				return (
					<span className={value ? "text-green-600" : "text-gray-400"}>
						{value ? t.misc.yes : t.misc.no}
					</span>
				);

			case "createdAt":
			case "updatedAt":
				return value ? new Date(value).toLocaleDateString() : "N/A";

			default:
				return <TranslatedValue value={value || "N/A"} />;
		}
	};

	const getParameterLabel = (param: string) => {
		const labels: Record<string, string> = {
			category: t.productPage.category,
			availability: "Availability",
			status: "Status",
			deliveryTimeline: t.productPage.deliveryTimeline,
			returnPolicy: t.productPage.returnPolicy,
			wear_category: t.productPage.wearCategory,
			wear_quantity: t.productPage.wearQuantity,
			customSizes: t.productPage.customSizesAvailable,
			featured: t.productPage.featuredProduct,
			isNewArrival: t.productPage.newArrival,
			isBestSeller: t.productPage.bestSeller,
			isPublished: t.productPage.published,
			createdAt: t.productPage.created,
			updatedAt: t.productPage.lastUpdated,
		};
		return labels[param] || param;
	};

	return (
		<div className="space-y-6">
			{/* Primary Parameters */}
			<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
				<h3 className={`text-lg font-semibold ${styling.textClasses} mb-4`}>
					{isBespoke
						? t.productPage.bespokeProductDetails
						: t.productPage.productInformation}
				</h3>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
					{relevantParams.primary.map((param) => {
						const value = product[param as keyof Product];
						if (
							value === undefined ||
							value === null ||
							param === "returnPolicy"
						)
							return null;

						return (
							<div key={param} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{getParameterIcon(param)}
									<span className={`font-medium ${styling.accentClasses}`}>
										{getParameterLabel(param)}:
									</span>
								</div>
								<div className="text-right">
									{getParameterValue(param, value)}
								</div>
							</div>
						);
					})}
				</div>

				{/* User Sizes Information - Type-specific display */}
				{shouldShowFeature(product, "user-sizes") && product.userSizes && (
					<div className="pt-4 border-t border-gray-200 mt-4">
						<span className={`font-medium ${styling.accentClasses} block mb-2`}>
							{isBespoke
								? t.productPage.customSizeOptions
								: t.productPage.availableUserSizes}
						</span>
						<div className="flex flex-wrap gap-2">
							{product.userSizes.map((userSize, index) => (
								<div
									key={index}
									className={`px-3 py-1 border rounded text-xs ${
										isBespoke
											? "bg-purple-50 border-purple-200 text-purple-700"
											: "bg-blue-50 border-blue-200 text-blue-700"
									}`}
								>
									<span className="font-medium">{userSize.size}</span>
									<span className="ml-1 text-gray-500">
										(Qty: {userSize.quantity})
									</span>
								</div>
							))}
						</div>
					</div>
				)}
			</div>

			{/* Type-specific highlights */}
			{isBespoke ? (
				<BespokeHighlights product={product} styling={styling} />
			) : (
				<ReadyToWearHighlights product={product} styling={styling} />
			)}

			{/* Secondary Parameters */}
			<div className="bg-gray-50 p-4 rounded-lg">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					{t.productPage.additionalInformation}
				</h3>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
					{relevantParams.secondary.map((param) => {
						const value = product[param as keyof Product];
						if (value === undefined || value === null) return null;

						return (
							<div key={param} className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									{getParameterIcon(param)}
									<span className="font-medium text-gray-700">
										{getParameterLabel(param)}:
									</span>
								</div>
								<div className="text-right">
									{getParameterValue(param, value)}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

const BespokeHighlights: React.FC<{ product: Product; styling: any }> = ({
	product,
	styling,
}) => {
	const { t } = useLanguage();
	const highlights = [];

	if (product.customSizes) {
		highlights.push({
			icon: <Package size={16} />,
			label: t.productPage.customSizing,
			description: "Tailored to your exact measurements",
		});
	}

	if (product.bespokeOptions?.measurementsRequired?.length) {
		highlights.push({
			icon: <Shield size={16} />,
			label: t.productPage.professionalFitting,
			description: `${product.bespokeOptions.measurementsRequired.length} measurements required`,
		});
	}

	if (product.bespokeOptions?.productionTime) {
		highlights.push({
			icon: <Clock size={16} />,
			label: t.productPage.handcrafted,
			description: `${product.bespokeOptions.productionTime} production time`,
		});
	}

	if (highlights.length === 0) return null;

	return (
		<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
			<h3 className={`text-lg font-semibold ${styling.textClasses} mb-4`}>
				{t.productPage.bespokeAdvantages}
			</h3>
			<div className="space-y-3">
				{highlights.map((highlight, index) => (
					<div key={index} className="flex items-start gap-3">
						<div className={`p-2 rounded-full ${styling.badgeClasses}`}>
							{highlight.icon}
						</div>
						<div>
							<div className={`font-medium ${styling.accentClasses}`}>
								{highlight.label}
							</div>
							<div className="text-sm text-gray-600">
								{highlight.description}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

const ReadyToWearHighlights: React.FC<{ product: Product; styling: any }> = ({
	product,
	styling,
}) => {
	const { t } = useLanguage();
	const highlights = [];

	if (product.featured) {
		highlights.push({
			icon: <Star size={16} />,
			label: t.productPage.featuredProduct,
			description: "Highlighted in our collection",
		});
	}

	if (product.isNewArrival) {
		highlights.push({
			icon: <TrendingUp size={16} />,
			label: t.productPage.newArrival,
			description: "Latest addition to our catalog",
		});
	}

	if (product.isBestSeller) {
		highlights.push({
			icon: <Award size={16} />,
			label: t.productPage.bestSeller,
			description: "Popular choice among customers",
		});
	}

	if (product.rtwOptions?.sizes?.length) {
		highlights.push({
			icon: <Package size={16} />,
			label: t.productPage.multipleSizes,
			description: `${product.rtwOptions.sizes.length} size options available`,
		});
	}

	if (highlights.length === 0) return null;

	return (
		<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
			<h3 className={`text-lg font-semibold ${styling.textClasses} mb-4`}>
				{t.productPage.productHighlights}
			</h3>
			<div className="space-y-3">
				{highlights.map((highlight, index) => (
					<div key={index} className="flex items-start gap-3">
						<div className={`p-2 rounded-full ${styling.badgeClasses}`}>
							{highlight.icon}
						</div>
						<div>
							<div className={`font-medium ${styling.accentClasses}`}>
								{highlight.label}
							</div>
							<div className="text-sm text-gray-600">
								{highlight.description}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
