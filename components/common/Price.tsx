/**
 * Price Component with Automatic Currency Conversion
 * Displays prices converted to user's local currency
 */

import React from "react";
import { useConvertedPrice } from "@/hooks/useCurrencyConversion";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export interface PriceProps {
	price: number;
	originalCurrency?: string;
	className?: string;
	showOriginal?: boolean;
	showTooltip?: boolean;
	size?: "sm" | "md" | "lg";
	variant?: "default" | "muted" | "accent";
	/** If true, skip currency conversion and display price as-is in original currency */
	skipConversion?: boolean;
}

export const Price: React.FC<PriceProps> = ({
	price,
	originalCurrency = "USD",
	className = "",
	showOriginal = false,
	showTooltip = true,
	size = "md",
	variant = "default",
	skipConversion = false,
}) => {
	// Use a stable value for the hook - if skipping conversion, use same currency to avoid conversion
	const effectiveCurrency = skipConversion
		? originalCurrency
		: originalCurrency;
	const { convertedPrice, isLoading, formattedPrice } = useConvertedPrice(
		price,
		effectiveCurrency,
	);

	const sizeClasses = {
		sm: "text-sm",
		md: "text-base",
		lg: "text-lg font-semibold",
	};

	const variantClasses = {
		default: "text-foreground",
		muted: "text-muted-foreground",
		accent: "text-primary font-medium",
	};

	const baseClasses = `${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

	// If skipping conversion, format and display price directly in original currency
	if (skipConversion) {
		const formatPrice = (amount: number, currency: string): string => {
			try {
				return new Intl.NumberFormat("en-US", {
					style: "currency",
					currency: currency,
					minimumFractionDigits: 0,
					maximumFractionDigits: 0,
				}).format(amount);
			} catch {
				return `${currency} ${amount.toLocaleString()}`;
			}
		};

		return (
			<span className={baseClasses}>
				{formatPrice(price, originalCurrency)}
			</span>
		);
	}

	if (isLoading) {
		return <Skeleton className={`h-5 w-16 ${className}`} />;
	}

	if (!convertedPrice || !formattedPrice) {
		return <span className={baseClasses}>${price.toFixed(2)}</span>;
	}

	const PriceDisplay = () => (
		<span className={baseClasses}>
			{formattedPrice}
			{showOriginal &&
				convertedPrice.originalCurrency !==
					convertedPrice.convertedCurrency && (
					<span className="text-xs text-muted-foreground ml-1">
						(${convertedPrice.originalPrice.toFixed(2)}{" "}
						{convertedPrice.originalCurrency})
					</span>
				)}
		</span>
	);

	if (
		showTooltip &&
		convertedPrice.originalCurrency !== convertedPrice.convertedCurrency
	) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<PriceDisplay />
					</TooltipTrigger>
					<TooltipContent>
						<div className="text-sm">
							<div>
								Original: ${convertedPrice.originalPrice.toFixed(2)}{" "}
								{convertedPrice.originalCurrency}
							</div>
							<div>
								Rate: 1 {convertedPrice.originalCurrency} ={" "}
								{convertedPrice.exchangeRate.toFixed(4)}{" "}
								{convertedPrice.convertedCurrency}
							</div>
							<div className="text-xs text-muted-foreground">
								Updated:{" "}
								{new Date(convertedPrice.lastRefreshed).toLocaleDateString()}
							</div>
						</div>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return <PriceDisplay />;
};

/**
 * Price Range Component for displaying min-max prices
 */
export interface PriceRangeProps {
	minPrice: number;
	maxPrice: number;
	originalCurrency?: string;
	className?: string;
	size?: "sm" | "md" | "lg";
	variant?: "default" | "muted" | "accent";
}

export const PriceRange: React.FC<PriceRangeProps> = ({
	minPrice,
	maxPrice,
	originalCurrency = "USD",
	className = "",
	size = "md",
	variant = "default",
}) => {
	if (minPrice === maxPrice) {
		return (
			<Price
				price={minPrice}
				originalCurrency={originalCurrency}
				className={className}
				size={size}
				variant={variant}
			/>
		);
	}

	return (
		<span className={className}>
			<Price
				price={minPrice}
				originalCurrency={originalCurrency}
				size={size}
				variant={variant}
				showTooltip={false}
			/>
			{" - "}
			<Price
				price={maxPrice}
				originalCurrency={originalCurrency}
				size={size}
				variant={variant}
				showTooltip={false}
			/>
		</span>
	);
};

/**
 * Discounted Price Component showing original and sale prices
 */
export interface DiscountedPriceProps {
	originalPrice: number;
	salePrice: number;
	originalCurrency?: string;
	className?: string;
	size?: "sm" | "md" | "lg";
	/** If true, skip currency conversion and display prices as-is */
	skipConversion?: boolean;
}

export const DiscountedPrice: React.FC<DiscountedPriceProps> = ({
	originalPrice,
	salePrice,
	originalCurrency = "USD",
	className = "",
	size = "md",
	skipConversion = false,
}) => {
	const discountPercentage = Math.round(
		((originalPrice - salePrice) / originalPrice) * 100,
	);

	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<Price
				price={salePrice}
				originalCurrency={originalCurrency}
				size={size}
				variant="accent"
				skipConversion={skipConversion}
			/>
			<Price
				price={originalPrice}
				originalCurrency={originalCurrency}
				size="sm"
				variant="muted"
				className="line-through"
				showTooltip={false}
				skipConversion={skipConversion}
			/>
			{/* <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
        -{discountPercentage}%
      </span> */}
		</div>
	);
};

export default Price;
