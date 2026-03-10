/**
 * Utility functions for handling product prices
 * Supports both legacy (flat number) and new (object with base/discount/currency) formats
 */

export const DUTY_RATE = 0; // Duty charge disabled globally as per request
// export const DUTY_RATE = 0.20; // 20% flat duty charge (Legacy)

export const PLATFORM_COMMISSION_RATE = 0.20; // 20% platform commission

/**
 * Apply platform fee to a price for display purposes.
 * This adds the 20% platform commission to the base price.
 * Formula: basePrice * (1 + PLATFORM_COMMISSION_RATE)
 * @param basePrice - The original product price (before platform fee)
 * @returns The price with platform fee included
 */
export const applyPlatformFee = (basePrice: number): number => {
return basePrice * (1 + PLATFORM_COMMISSION_RATE);
};

/**
 * Get the effective duty rate based on user's country.
 * Duty is currently disabled globally.
 * @param userCountry - The user's country code (e.g., 'NG', 'US')
 * @returns The duty rate to apply (0)
 */
export const getEffectiveDutyRate = (userCountry?: string): number => {
return 0;
};

export type PriceType = number | {
base: number;
discount?: number | null;
currency?: string;
};

/**
 * Calculate the price inclusive of duty and platform commission from the original vendor price.
 * Formula: originalPrice * (1 + DUTY_RATE + PLATFORM_COMMISSION_RATE)
 * Nigerian users (country 'NG') are exempt from duty but commission applies to all.
 * @param originalPrice - The vendor's base price
 * @param userCountry - Optional user's country code for duty exemption
 * @returns The customer-facing price including duty and commission
 */
export const calculateCustomerPrice = (originalPrice: number, userCountry?: string): number => {
const dutyRate = getEffectiveDutyRate(userCountry);
return originalPrice * (1 + dutyRate + PLATFORM_COMMISSION_RATE);
};

/**
 * Calculate the final price after discount, duty, and platform commission.
 * Formula: VendorPrice * (1 - Discount/100) * (1 + DUTY_RATE + PLATFORM_COMMISSION_RATE)
 * Nigerian users (country 'NG') are exempt from duty.
 * @param originalPrice - The vendor's base price
 * @param discountPercentage - Discount percentage (e.g. 10 for 10%)
 * @param userCountry - Optional user's country code for duty exemption
 * @returns The final price the customer pays
 */
export const calculateFinalPrice = (originalPrice: number, discountPercentage: number, userCountry?: string): number => {
const dutyRate = getEffectiveDutyRate(userCountry);
const discountFactor = 1 - (discountPercentage / 100);
const discountedVendorPrice = originalPrice * discountFactor;
return discountedVendorPrice * (1 + dutyRate + PLATFORM_COMMISSION_RATE);
};

/**
 * Calculate the final price when the original price already includes platform fee.
 * Use this for storefront cart items where the platform fee was already applied on the product page.
 * Formula: PriceWithFee * (1 - Discount/100)
 * @param priceWithFee - The price that already includes platform fee
 * @param discountPercentage - Discount percentage (e.g. 10 for 10%)
 * @returns The final price after discount (platform fee already included)
 */
export const calculateFinalPriceWithFeeIncluded = (priceWithFee: number, discountPercentage: number): number => {
const discountFactor = 1 - (discountPercentage / 100);
return priceWithFee * discountFactor;
};

/**
 * Calculate original price with duty (for strikethrough display).
 * Use this to show "Original Price" so it compares correctly with "Final Price".
 * Formula: actualPriceWithDuty / discountFactor
 * @param currentPrice - The final price being charged (inclusive of duty and after discount)
 * @param discountPercentage - The discount percentage applied
 * @returns The original price inclusive of duty
 */
export const calculateOriginalPriceWithDuty = (currentPrice: number, discountPercentage: number): number => {
if (!discountPercentage || discountPercentage <= 0) return currentPrice;
const discountFactor = 1 - (discountPercentage / 100);
return currentPrice / discountFactor;
};

/**
 * Calculate the duty amount for a given vendor price and discount.
 * Nigerian users (country 'NG') are exempt from duty.
 * @param originalPrice - Vendor's raw price
 * @param discountPercentage - Discount percentage
 * @param userCountry - Optional user's country code for duty exemption
 * @returns The duty amount
 */
export const calculateDutyAmount = (originalPrice: number, discountPercentage: number = 0, userCountry?: string): number => {
const dutyRate = getEffectiveDutyRate(userCountry);
const discountFactor = 1 - (discountPercentage / 100);
const discountedVendorPrice = originalPrice * discountFactor;
return discountedVendorPrice * dutyRate;
};

/**
 * Calculate the platform commission amount.
 * Formula: DiscountedVendorPrice * PLATFORM_COMMISSION_RATE
 * @param originalPrice - Vendor's raw price
 * @param discountPercentage - Discount percentage
 * @returns The commission amount
 */
export const calculatePlatformCommission = (originalPrice: number, discountPercentage: number = 0): number => {
const discountFactor = 1 - (discountPercentage / 100);
const discountedVendorPrice = originalPrice * discountFactor;
return discountedVendorPrice * PLATFORM_COMMISSION_RATE;
};

/**
 * Format price for display
 * @param price - Can be a number (legacy) or price object (new schema)
 * @param defaultCurrency - Default currency symbol if not specified
 * @returns Formatted price string with currency symbol
 */
export const formatPrice = (price: PriceType, defaultCurrency: string = "NGN"): string => {
if (typeof price === "number") {
  // Legacy format - treat as base price, but display functions should handle duty logic mostly.
  // If this is used for raw display, it just formats the number.
  const symbol = defaultCurrency === "NGN" ? "$" : "$";
  return `${symbol}${price.toFixed(2)}`;
} else if (price && typeof price === "object" && price.base !== undefined) {
  // New format
  const currency = price.currency || defaultCurrency;
  const symbol = currency === "NGN" ? "₦" : "$";
  return `${symbol}${price.base.toFixed(2)}`;
}
return "$0.00";
};

/**
 * Get the base price value (for calculations)
 * @param price - Can be a number (legacy) or price object (new schema)
 * @returns Base price as number
 */
export const getPriceValue = (price: PriceType): number => {
if (typeof price === "number") {
  return price;
} else if (price && typeof price === "object" && price.base !== undefined) {
  return price.base;
}
return 0;
};

/**
 * Get discount value
 * @param price - Can be a number (legacy) or price object (new schema)
 * @param legacyDiscount - Legacy discount field (separate from price)
 * @returns Discount value as number
 */
export const getDiscount = (price: PriceType, legacyDiscount?: number): number => {
if (typeof price === "object" && price.discount !== null && price.discount !== undefined) {
  return price.discount;
}
return legacyDiscount || 0;
};

/**
 * Get currency code
 * @param price - Can be a number (legacy) or price object (new schema)
 * @param defaultCurrency - Default currency if not specified
 * @returns Currency code
 */
export const getCurrency = (price: PriceType, defaultCurrency: string = "NGN"): string => {
if (typeof price === "object" && price.currency) {
  return price.currency;
}
return defaultCurrency;
};

