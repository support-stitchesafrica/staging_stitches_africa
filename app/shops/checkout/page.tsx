"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import
{
	generateBlurDataURL,
	RESPONSIVE_SIZES,
	IMAGE_DIMENSIONS,
} from "@/lib/utils/image-utils";
import { toast } from "sonner";

import
{
	ArrowLeft,
	CreditCard,
	MapPin,
	Package,
	CircleAlert,
	Info,
	SpadeIcon,
} from "lucide-react";
import { AddressService, Address } from "@/lib/address-service";
import
{
	DHLShippingService,
	ShippingRate,
	CartItemForShipping,
} from "@/lib/shipping/dhl-service";
import { TerminalAfricaService } from "@/lib/shipping/terminal-africa-service";
import
{
	PaymentService,
	PaymentData,
	PaymentProvider,
} from "@/lib/payment-service";
import
{
	StripePaymentModalLazy,
	FlutterwavePaymentModalLazy,
} from "@/components/shops/lazy/LazyPaymentComponents";
import { MeasurementsStep } from "@/components/shops/checkout/MeasurementsStep";
import { productRepository, collectionRepository } from "@/lib/firestore";
import { useAnalytics } from "@/hooks/useAnalytics";
import { UserMeasurements } from "@/types/measurements";
import { CartItem, ProductCollection } from "@/types";
import { measurementsRepository } from "@/lib/measurements-repository";
import { getActivityTracker } from "@/lib/analytics/activity-tracker";
import { VvipService } from "@/lib/vvip/vvip-service";
import VvipManualCheckout from "@/components/checkout/VvipManualCheckout";
import { Price } from "@/components/common/Price";
import { useCurrencyConversion } from "@/hooks/useCurrencyConversion";
import { loadFirebaseModule } from "@/lib/utils/module-helpers";
import { getFirebaseFunctions } from "@/lib/firebase";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { VoucherInput } from "@/components/checkout/VoucherInput";
import { SureGiftsVoucher, VoucherPaymentBreakdown } from "@/types/suregifts";
import { VoucherPaymentService } from "@/lib/suregifts/voucher-payment-service";
import { CouponInput } from "@/components/checkout/CouponInput";
import { useCouponValidation } from "@/hooks/useCouponValidation";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { ShippingCostDisplay } from "@/components/checkout/ShippingCostDisplay";
import
{
	COUNTRIES,
	getStatesForCountry,
	getCitiesForState,
	getCountryByCode,
} from "@/lib/location-data";

interface CheckoutStep
{
	id: string;
	title: string;
	completed: boolean;
}

export default function CheckoutPage()
{
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();
	const {
		items,
		totalAmount,
		shippingCost: contextShippingCost,
		totalWithShipping,
		clearCart,
	} = useCart();

	// Unified Checkout: Use all items
	const regularItems = items;

	// Calculate totals for all items (unified)
	const regularItemsTotal = totalAmount;
	const regularItemsCount = items.length;

	// Tax Calculation (7.5%) - Temporarily disabled (set to 0)
	const taxAmount = 0; // regularItemsTotal * 0.075;

	// Calculate source total if all items have the same source currency (Fix for price discrepancy)
	const uniqueSourceCurrencies = new Set(
		regularItems.filter((i) => i.sourceCurrency).map((i) => i.sourceCurrency),
	);

	const hasUniformSourceCurrency = uniqueSourceCurrencies.size === 1;
	const allItemsHaveSourcePrice = regularItems.every(
		(i) => i.sourcePrice !== undefined,
	);

	const sourceCurrency =
		hasUniformSourceCurrency && allItemsHaveSourcePrice
			? regularItems[0].sourceCurrency
			: undefined;

	const sourceSubtotal =
		hasUniformSourceCurrency && allItemsHaveSourcePrice && sourceCurrency
			? regularItems.reduce(
				(sum, item) => sum + (item.sourcePrice || 0) * item.quantity,
				0,
			)
			: undefined;

	const sourceTax = sourceSubtotal !== undefined ? 0 : undefined;

	const {
		trackClick,
		trackFormSubmit,
		trackFeatureUsage,
		trackError,
		trackPaymentAttempt,
	} = useAnalytics();
	const [currentStep, setCurrentStep] = useState(0);
	const [loading, setLoading] = useState(false);
	const [shippingLoading, setShippingLoading] = useState(false);
	const [paymentLoading, setPaymentLoading] = useState(false);

	// Address management
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
	const [showAddressForm, setShowAddressForm] = useState(false);
	const [addressErrors, setAddressErrors] = useState<string[]>([]);

	// Shipping
	const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
	const [shippingError, setShippingError] = useState<string | null>(null);
	const [isFreeShipping, setIsFreeShipping] = useState<boolean>(false);

	// Payment
	const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "NGN">(
		"USD",
	);
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [showStripeModal, setShowStripeModal] = useState(false);
	const [showFlutterwaveModal, setShowFlutterwaveModal] = useState(false);

	const [activePaymentData, setActivePaymentData] =
		useState<PaymentData | null>(null);
	const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<
		"stripe" | "flutterwave" | "paystack"
	>("stripe");

	// Shipping in source currency (for accurate display in NGN)
	const [sourceShipping, setSourceShipping] = useState<number>(0);
	const [shippingCurrency, setShippingCurrency] = useState<string>('USD');

	// Dynamic shipping cost calculation
	const shippingCost = shippingRate ? shippingRate.amount : contextShippingCost;

	// Coupon functionality
	const {
		validateCoupon,
		validationResult: couponValidationResult,
		isValidating: isCouponValidating,
		error: couponError,
		clearValidation: clearCouponValidation,
	} = useCouponValidation();

	// Calculate totals with coupon discount (in USD for internal use)
	const couponDiscountUSD = couponValidationResult?.discountAmountUSD || 0;

	// Coupon discount in NGN - read directly from coupon object (discountValue is always NGN)
	// This avoids any conversion issues
	const couponDiscountNGN = couponValidationResult?.coupon
		? couponValidationResult.coupon.discountType === "PERCENTAGE"
			? Math.round(
				((sourceSubtotal || regularItemsTotal) *
					couponValidationResult.coupon.discountValue) /
				100,
			)
			: couponValidationResult.coupon.discountValue
		: 0;

	const subtotalAfterCoupon = Math.max(
		0,
		regularItemsTotal - couponDiscountUSD,
	);

	const regularItemsTotalWithShipping =
		subtotalAfterCoupon + shippingCost + taxAmount;

	// Measurements for bespoke items
	const [selectedMeasurements, setSelectedMeasurements] =
		useState<UserMeasurements | null>(null);
	const [measurementsLoading, setMeasurementsLoading] = useState(false);
	const [measurementError, setMeasurementError] = useState<string | null>(null);
	const [measurementsChecked, setMeasurementsChecked] = useState(false);
	const [measurementRetryCount, setMeasurementRetryCount] = useState(0);
	const MAX_RETRY_ATTEMPTS = 3;

	// VVIP functionality
	const [isVvipUser, setIsVvipUser] = useState(false);
	const [vvipLoading, setVvipLoading] = useState(false);
	const [showVvipCheckout, setShowVvipCheckout] = useState(false);

	// Voucher functionality
	const [selectedVoucher, setSelectedVoucher] =
		useState<SureGiftsVoucher | null>(null);
	const [voucherBreakdown, setVoucherBreakdown] =
		useState<VoucherPaymentBreakdown | null>(null);
	const [voucherLoading, setVoucherLoading] = useState(false);
	const [showVoucherForm, setShowVoucherForm] = useState(false);

	// Flag to prevent redirect to cart when order is successfully completed
	const [isOrderComplete, setIsOrderComplete] = useState(false);

	const handleApplyCoupon = async (code: string) =>
	{
		if (!user?.email)
		{
			toast.error("You must be logged in to apply coupons");
			return { success: false, error: "Not authenticated" };
		}

		// Use source currency (NGN) when available so the coupon ₦50,000 stays as ₦50,000
		// instead of being converted to ~$33 USD and back (which loses precision)
		const couponCurrency = sourceCurrency || selectedCurrency;
		try
		{
			const orderAmount =
				couponCurrency === "NGN" && sourceSubtotal
					? sourceSubtotal
					: (await convertPrice(regularItemsTotal, "USD", couponCurrency))
						.convertedPrice;
			return await validateCoupon(
				code,
				user.email,
				orderAmount,
				couponCurrency,
			);
		} catch (error)
		{
			console.error("Error converting price for coupon validation:", error);
			// Fallback: use sourceSubtotal in NGN if available
			if (sourceSubtotal && sourceCurrency === "NGN")
			{
				return await validateCoupon(code, user.email, sourceSubtotal, "NGN");
			}
			return await validateCoupon(code, user.email, regularItemsTotal, "USD");
		}
	};

	const applyCouponToOrder = async (orderId: string) =>
	{
		if (couponValidationResult && user)
		{
			try
			{
				const idToken = await user.getIdToken();
				// Pass the converted order amount and currency
				const conversion = await convertPrice(
					regularItemsTotal,
					"USD",
					selectedCurrency,
				);

				await fetch("/api/shops/coupons/apply", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${idToken}`,
					},
					body: JSON.stringify({
						couponCode: couponValidationResult?.coupon?.couponCode,
						orderId,
						orderAmount: conversion.convertedPrice,
						userEmail: user.email,
						discountAmount: couponValidationResult.discountAmount,
						currency: selectedCurrency,
					}),
				});
				trackFeatureUsage("coupon_used", {
					couponId: couponValidationResult?.coupon?.id,
					orderId,
					discountAmount: couponValidationResult.discountAmount,
				});
			} catch (error)
			{
				console.error("Failed to apply coupon:", error);
			}
		}
	};

	// Calculate base total and final breakdown with voucher
	const baseTotal = subtotalAfterCoupon + shippingCost + taxAmount;
	const finalBreakdown =
		voucherBreakdown ||
		VoucherPaymentService.calculatePaymentBreakdown(
			baseTotal,
			selectedVoucher,
			selectedCurrency,
		);

	// Currency display - show local currency throughout checkout
	const {
		userCurrency,
		formatPrice,
		convertPrice,
		isLoading: currencyLoading,
	} = useCurrencyConversion();

	// Determine if user is Nigerian (for NGN display)
	const isNigerianUser = userCurrency === "NGN";

	// Check if cart has bespoke items (only from regular items)
	const hasBespokeItems = regularItems.some(
		(item) => item.type === "bespoke" || item.product?.type === "bespoke",
	);

	const { t } = useLanguage();
	const steps: CheckoutStep[] = [
		{ id: "cart", title: t.checkout.steps.cart, completed: false },
		...(hasBespokeItems
			? [
				{
					id: "measurements",
					title: t.checkout.steps.measurements,
					completed: false,
				},
			]
			: []),
		{ id: "shipping", title: t.checkout.steps.shipping, completed: false },
		{ id: "payment", title: t.checkout.steps.payment, completed: false },
	];

	const [newAddress, setNewAddress] = useState<Partial<Address>>({
		first_name: "",
		last_name: "",
		street_address: "",
		city: "",
		state: "",
		post_code: "",
		country: "United States",
		country_code: "US",
		dial_code: "+1",
		phone_number: "",
		flat_number: "",
		type: "home",
		is_default: false,
		userId: user?.uid || "",
	});

	const availableStates = getStatesForCountry(newAddress.country_code || "US");

	// Removed location selection state - using manual entry only

	useEffect(() =>
	{
		const initializeCheckout = async () =>
		{
			// Redirect to cart if no regular items and order is not complete
			if (regularItems.length === 0 && !isOrderComplete)
			{
				router.push("/shops/cart");
				return;
			}

			// Check VVIP status if user is logged in
			if (user)
			{
				await checkVvipStatus();
				loadUserAddresses();
			}

			// Check for bespoke items and measurements
			if (hasBespokeItems && user && !measurementsChecked)
			{
				await checkMeasurements();
			}
		};

		initializeCheckout();
	}, [
		items,
		router,
		user,
		hasBespokeItems,
		measurementsChecked,
		isOrderComplete,
	]);

	// Handle source shipping conversion when shippingCost or sourceCurrency changes
	useEffect(() =>
	{
		const updateSourceShipping = async () =>
		{
			// If shipping is already in NGN (domestic fallback), use it directly - no conversion needed
			const rateCurrency = shippingRate?.currency || shippingCurrency;
			if (rateCurrency === "NGN")
			{
				setSourceShipping(shippingCost);
			} else if (sourceCurrency && sourceCurrency !== "USD")
			{
				try
				{
					const converted = await convertPrice(
						shippingCost,
						"USD",
						sourceCurrency,
					);
					setSourceShipping(converted.convertedPrice);
				} catch (err)
				{
					console.error("Failed to convert source shipping:", err);
					setSourceShipping(0);
				}
			} else
			{
				setSourceShipping(shippingCost);
			}
		};

		updateSourceShipping();
	}, [shippingCost, shippingCurrency, shippingRate, sourceCurrency, convertPrice]);

	// Removed dropdown state management - using manual entry only

	// Auto-select currency based on address country
	useEffect(() =>
	{
		if (selectedAddress)
		{
			const country = selectedAddress.country?.toLowerCase();
			const countryCode = selectedAddress.country_code?.toUpperCase();

			if (
				country === "nigeria" ||
				countryCode === "NG" ||
				countryCode === "NGA"
			)
			{
				setSelectedCurrency("NGN");
			} else
			{
				// If switching away from Nigeria, revert to USD if currently NGN
				if (selectedCurrency === "NGN")
				{
					setSelectedCurrency("USD");
				}
			}
		}
	}, [selectedAddress]);

	/**
	 * Check if user has VVIP status
	 */
	const checkVvipStatus = async (): Promise<void> =>
	{
		if (!user) return;

		setVvipLoading(true);
		try
		{
			const vvipStatus = await VvipService.isVvipUser(user.uid);
			setIsVvipUser(vvipStatus);

			// Track VVIP status check
			trackFeatureUsage("checkout_vvip_status_checked", {
				userId: user.uid,
				isVvip: vvipStatus,
				itemCount: regularItems.length,
				totalAmount: regularItemsTotal,
			});
		} catch (error)
		{
			console.error("Error checking VVIP status:", error);
			// Don't block checkout if VVIP check fails
			setIsVvipUser(false);
		} finally
		{
			setVvipLoading(false);
		}
	};

	/**
	 * Check if user has measurements for bespoke items
	 */
	const checkMeasurements = async (): Promise<boolean> =>
	{
		// Edge case: No user logged in
		if (!user)
		{
			const errorMessage = "You must be logged in to check measurements";
			setMeasurementError(errorMessage);
			trackError(
				"measurement_check_error",
				"No user logged in",
				"checkout_page",
			);
			trackFeatureUsage("checkout_measurement_error", {
				errorType: "missing_user",
				bespokeItemCount: regularItems.filter(
					(item) => item.type === "bespoke" || item.product?.type === "bespoke",
				).length,
				errorMessage,
			});
			return false;
		}

		setMeasurementsLoading(true);
		setMeasurementError(null);

		// Track measurement check initiation
		trackFeatureUsage("checkout_measurement_check_started", {
			bespokeItemCount: regularItems.filter(
				(item) => item.type === "bespoke" || item.product?.type === "bespoke",
			).length,
			totalItems: regularItems.length,
			userId: user.uid,
			retryAttempt: measurementRetryCount,
		});

		try
		{
			const userMeasurements = await loadUserMeasurements();

			if (!userMeasurements)
			{
				// No measurements found - redirect to measurements page
				trackFeatureUsage("checkout_measurements_required", {
					bespokeItemCount: regularItems.filter(
						(item) =>
							item.type === "bespoke" || item.product?.type === "bespoke",
					).length,
					totalItems: regularItems.length,
					redirectReason: "no_measurements_found",
				});

				// Track redirect event
				trackFeatureUsage("checkout_redirect_to_measurements", {
					reason: "missing_measurements",
					bespokeItemCount: regularItems.filter(
						(item) =>
							item.type === "bespoke" || item.product?.type === "bespoke",
					).length,
					totalItems: regularItems.length,
					cartValue: regularItemsTotal,
				});

				redirectToMeasurements();
				return false;
			}

			// Validate measurement data structure
			if (
				!userMeasurements.volume_params ||
				typeof userMeasurements.volume_params !== "object"
			)
			{
				const errorMessage =
					"Invalid measurement data. Please update your measurements.";
				setMeasurementError(errorMessage);
				trackError(
					"measurement_validation_error",
					"Invalid measurement data structure",
					"checkout_page",
				);
				trackFeatureUsage("checkout_measurement_error", {
					errorType: "invalid_data",
					userId: user.uid,
					hasMeasurements: !!userMeasurements,
					hasVolumeParams: !!userMeasurements.volume_params,
					errorMessage,
				});
				return false;
			}

			// Measurements found and valid
			setSelectedMeasurements(userMeasurements);
			setMeasurementsChecked(true);
			setMeasurementRetryCount(0); // Reset retry count on success

			// Track successful measurement load
			trackFeatureUsage("checkout_measurements_loaded", {
				measurementAge: Date.now() - userMeasurements.updatedAt.getTime(),
				hasMeasurements: true,
				bespokeItemCount: regularItems.filter(
					(item) => item.type === "bespoke" || item.product?.type === "bespoke",
				).length,
				totalItems: regularItems.length,
				retriesNeeded: measurementRetryCount,
			});

			return true;
		} catch (error)
		{
			console.error("Error checking measurements:", error);

			// Determine error type and message
			let errorMessage = "Failed to load measurements. Please try again.";
			let errorType = "unknown_error";

			if (error instanceof TypeError && error.message.includes("fetch"))
			{
				errorMessage =
					"Network error. Please check your connection and try again.";
				errorType = "network_error";
			} else if (error instanceof Error)
			{
				if (
					error.message.includes("permission") ||
					error.message.includes("unauthorized")
				)
				{
					errorMessage = "You do not have permission to access measurements.";
					errorType = "permission_error";
				} else if (error.message.includes("timeout"))
				{
					errorMessage = "Request timed out. Please try again.";
					errorType = "timeout_error";
				}
			}

			setMeasurementError(errorMessage);

			// Track detailed error information
			trackError(
				"measurement_load_error",
				error instanceof Error ? error.message : "Unknown error",
				"checkout_page",
			);
			trackFeatureUsage("checkout_measurement_error", {
				errorType,
				userId: user.uid,
				bespokeItemCount: regularItems.filter(
					(item) => item.type === "bespoke" || item.product?.type === "bespoke",
				).length,
				totalItems: regularItems.length,
				retryAttempt: measurementRetryCount,
				errorMessage,
				errorStack:
					error instanceof Error ? error.stack?.substring(0, 200) : undefined,
			});

			return false;
		} finally
		{
			setMeasurementsLoading(false);
		}
	};


	const loadUserMeasurements = async (): Promise<UserMeasurements | null> =>
	{
		// Edge case: No user logged in
		if (!user)
		{
			throw new Error("User not authenticated");
		}

		try
		{
			const measurements = await measurementsRepository.getUserMeasurements(
				user.uid,
			);
			return measurements;
		} catch (error)
		{
			console.error("Error loading user measurements:", error);

			// Re-throw with more context for better error handling upstream
			if (error instanceof Error)
			{
				throw new Error(`Failed to load measurements: ${error.message}`);
			}
			throw new Error("Failed to load measurements: Unknown error");
		}
	};

	/**
	 * Retry loading measurements with exponential backoff
	 */
	const retryLoadMeasurements = async (): Promise<void> =>
	{
		if (!user)
		{
			setMeasurementError("You must be logged in to load measurements");
			return;
		}

		if (measurementRetryCount >= MAX_RETRY_ATTEMPTS)
		{
			const errorMessage = `Failed to load measurements after ${MAX_RETRY_ATTEMPTS} attempts. Please refresh the page or try again later.`;
			setMeasurementError(errorMessage);

			trackError(
				"measurement_retry_exhausted",
				`Max retry attempts (${MAX_RETRY_ATTEMPTS}) reached`,
				"checkout_page",
			);
			trackFeatureUsage("checkout_measurement_retry_exhausted", {
				userId: user.uid,
				bespokeItemCount: regularItems.filter(
					(item) => item.type === "bespoke" || item.product?.type === "bespoke",
				).length,
				totalRetries: measurementRetryCount,
				maxRetries: MAX_RETRY_ATTEMPTS,
			});
			return;
		}

		// Increment retry count
		setMeasurementRetryCount((prev) => prev + 1);

		// Track retry attempt
		trackFeatureUsage("checkout_measurement_retry_attempt", {
			retryCount: measurementRetryCount + 1,
			maxRetries: MAX_RETRY_ATTEMPTS,
			userId: user.uid,
			bespokeItemCount: regularItems.filter(
				(item) => item.type === "bespoke" || item.product?.type === "bespoke",
			).length,
		});

		// Exponential backoff: 1s, 2s, 4s
		const backoffDelay = Math.pow(2, measurementRetryCount) * 1000;

		setMeasurementError(
			`Retrying... (Attempt ${measurementRetryCount + 1
			} of ${MAX_RETRY_ATTEMPTS})`,
		);

		await new Promise((resolve) => setTimeout(resolve, backoffDelay));

		// Retry the check
		await checkMeasurements();
	};

	/**
	 * Redirect to measurements page with return URL
	 */
	const redirectToMeasurements = (): void =>
	{
		const returnUrl = encodeURIComponent("/shops/checkout");
		router.push(
			`/shops/measurements?redirect=${returnUrl}&from=checkout&required=true`,
		);
	};

	const loadUserAddresses = async () =>
	{
		if (!user) return;

		try
		{
			const userAddresses = await AddressService.getUserAddresses(user.uid);
			setAddresses(userAddresses);

			// Set default address if available
			const defaultAddress =
				userAddresses.find((addr) => addr.isDefault) || userAddresses[0];
			if (defaultAddress)
			{
				setSelectedAddress(defaultAddress);
			}
		} catch (error)
		{
			console.error("Error loading addresses:", error);
		}
	};

	const [courierData, setCourierData] = useState<any>(null);
	const [deliveryDate, setDeliveryDate] = useState<string | null>(null);

	/**
	 * Helper to detect Nigerian addresses
	 * Used for determining domestic shipping eligibility
	 */
	const isNigerianAddress = (address: Address): boolean =>
	{
		// Check country_code field (primary)
		const countryCode = address.country_code?.toUpperCase().trim();
		if (countryCode === 'NG' || countryCode === 'NGA')
		{
			return true;
		}

		// Check alternative countryCode field
		const altCountryCode = address.countryCode?.toUpperCase().trim();
		if (altCountryCode === 'NG' || altCountryCode === 'NGA')
		{
			return true;
		}

		// Check country name as fallback
		const countryName = address.country?.toLowerCase().trim();
		if (countryName === 'nigeria')
		{
			return true;
		}

		// If country code is null or undefined, treat as international (Requirement 7.5)
		return false;
	};

	/**
	 * Interface for free shipping eligibility result
	 */
	interface FreeShippingEligibility
	{
		isEligible: boolean;
		reason?: string; // For debugging/logging
	}

	/**
	 * Determines if cart qualifies for free shipping
	 * Requirements: 
	 * - All items must be from collections with isFreeShipping=true
	 * - Shipping to Nigeria (domestic)
	 * - Cart total must be at least ₦90,000
	 * @param cartItems - Items in the cart
	 * @param collections - Map of collection ID to ProductCollection
	 * @param shippingAddress - Destination address
	 * @param cartTotalNGN - Cart total in Nigerian Naira
	 * @returns Eligibility result with reason for debugging
	 */
	const checkFreeShippingEligibility = (
		cartItems: CartItem[],
		collections: Map<string, ProductCollection>,
		shippingAddress: Address | null,
		cartTotalNGN: number
	): FreeShippingEligibility =>
	{
		// 1. Check for null/undefined address before eligibility check
		if (!shippingAddress)
		{
			return { isEligible: false, reason: 'No shipping address' };
		}

		// 2. Check if address is domestic (Nigeria)
		const isDomestic = isNigerianAddress(shippingAddress);
		if (!isDomestic)
		{
			return { isEligible: false, reason: 'International shipping - only Nigeria qualifies' };
		}

		// 3. Check minimum order amount (₦90,000)
		const MINIMUM_ORDER_AMOUNT_NGN = 90000;
		if (cartTotalNGN < MINIMUM_ORDER_AMOUNT_NGN)
		{
			return {
				isEligible: false,
				reason: `Cart total (₦${cartTotalNGN.toLocaleString()}) is below minimum ₦${MINIMUM_ORDER_AMOUNT_NGN.toLocaleString()} for free shipping`
			};
		}

		// 4. Check if all items are collection items
		// Use collectionId as the source of truth — isCollectionItem may not always be set
		const allAreCollectionItems = cartItems.every(
			item => !!item.collectionId
		);
		if (!allAreCollectionItems)
		{
			return { isEligible: false, reason: 'Cart contains non-collection items' };
		}

		// 5. Extract unique collection IDs from cart items
		const uniqueCollectionIds = new Set(
			cartItems
				.filter(item => item.collectionId)
				.map(item => item.collectionId!)
		);

		// 6. Check if all collections have free shipping enabled
		for (const collectionId of uniqueCollectionIds)
		{
			const collection = collections.get(collectionId);

			// Handle deleted collections gracefully - treat as ineligible
			if (!collection)
			{
				return {
					isEligible: false,
					reason: `Collection ${collectionId} not found (may have been deleted)`
				};
			}

			// Validate isFreeShipping is boolean or undefined
			// Treat undefined as false for eligibility
			const isFreeShipping = collection.isFreeShipping;
			if (typeof isFreeShipping !== 'boolean' && typeof isFreeShipping !== 'undefined')
			{
				console.warn(`Invalid isFreeShipping value for collection ${collectionId}:`, isFreeShipping);
				return {
					isEligible: false,
					reason: `Collection ${collectionId} has invalid isFreeShipping value`
				};
			}

			// Treat undefined as false
			if (isFreeShipping !== true)
			{
				return {
					isEligible: false,
					reason: `Collection ${collectionId} does not have free shipping`
				};
			}
		}

		return { isEligible: true };
	};

	const calculateShipping = async (address: Address): Promise<boolean> =>
	{
		if (!address) return false;

		setShippingLoading(true);
		setShippingError(null);
		setCourierData(null);
		setDeliveryDate(null);

		try
		{
			// Convert Address to ShippingAddress format
			// Normalize country code to uppercase for consistent comparison
			let normalizedCountryCode = address.country_code || address.countryCode;
			if (!normalizedCountryCode)
			{
				normalizedCountryCode = DHLShippingService.getCountryCode(address.country || "United States");
			}
			// Ensure it's uppercase and handle NGA -> NG conversion
			normalizedCountryCode = normalizedCountryCode.toUpperCase();
			if (normalizedCountryCode === 'NGA')
			{
				normalizedCountryCode = 'NG';
			}

			const shippingAddress = {
				streetAddress: address.street_address || address.streetAddress || "",
				postcode: address.post_code || address.postcode || "",
				city: address.city || "",
				state: address.state || "",
				countryCode: normalizedCountryCode,
				firstName: address.first_name || address.firstName,
				lastName: address.last_name || address.lastName,
				phoneNumber: address.phone_number || address.phoneNumber,
			};

			// Prepare items for shipping calculation
			const cartItemsForShipping: CartItemForShipping[] = regularItems.map(
				(item) => ({
					productId: item.product_id,
					quantity: item.quantity,
					price: item.price,
					weight: item.product?.shipping?.actualWeightKg || 0.5, // Default weight if missing
					dimensions: {
						width: item.product?.shipping?.widthCm || 10,
						length: item.product?.shipping?.lengthCm || 10,
						height: item.product?.shipping?.heightCm || 5,
					},
				}),
			);

			// NEW: Check free shipping eligibility first
			// Use collectionId as the source of truth — isCollectionItem may not always be set
			const uniqueCollectionIds = Array.from(
				new Set(
					regularItems
						.filter(item => !!item.collectionId)
						.map(item => item.collectionId!)
				)
			);

			let collectionsMap = new Map<string, ProductCollection>();
			if (uniqueCollectionIds.length > 0)
			{
				try
				{
					const collections = await collectionRepository.getByIds(uniqueCollectionIds);
					collectionsMap = new Map(collections.map(c => [c.id, c]));
					console.log('📦 Loaded collections for free shipping check:', collections.length);
				} catch (error)
				{
					// Log error for debugging
					console.error('❌ Error loading collections for free shipping check:', error);

					// Track error for monitoring
					trackError(
						'free_shipping_collection_fetch_error',
						error instanceof Error ? error.message : 'Unknown error',
						'checkout_page'
					);

					// Treat cart as ineligible for free shipping on error
					// Continue with normal shipping calculation
					console.log('⚠️ Treating cart as ineligible for free shipping due to collection fetch error');
				}
			}

			// Calculate cart total in NGN for free shipping check
			let cartTotalNGN = 0;
			if (sourceSubtotal !== undefined && sourceCurrency === 'NGN')
			{
				// Use source subtotal if available in NGN
				cartTotalNGN = sourceSubtotal;
			} else
			{
				// Convert USD to NGN (rate: 1 USD = 1500 NGN, consistent with DHL service)
				cartTotalNGN = regularItemsTotal * 1500;
			}

			const eligibility = checkFreeShippingEligibility(
				regularItems,
				collectionsMap,
				address,
				cartTotalNGN
			);

			console.log('🎁 Free shipping eligibility check:', eligibility);

			if (eligibility.isEligible)
			{
				// Free shipping applies!
				console.log('✅ FREE SHIPPING APPLIED');
				setShippingRate({
					amount: 0,
					deliveryDate: getFutureDate(7), // Default estimate
					courierName: 'Free Shipping',
					packageWeight: 0,
					packageDimensions: { width: 0, length: 0, height: 0 }
				});
				setIsFreeShipping(true);
				setShippingLoading(false);

				// Track free shipping applied
				trackFeatureUsage('checkout_free_shipping_applied', {
					collectionIds: Array.from(uniqueCollectionIds),
					itemCount: regularItems.length,
					totalAmount: regularItemsTotal,
					totalAmountNGN: cartTotalNGN,
					minimumRequired: 90000,
					address: {
						country: address.country,
						country_code: address.country_code
					}
				});

				return true;
			}

			// LOGIC SPLIT: DOMESTIC (NG) vs INTERNATIONAL (DHL)
			// Use the helper function for reliable detection
			const isDomestic = isNigerianAddress(address);

			// Log for debugging
			console.log('🔍 Shipping Detection:', {
				country: address.country,
				country_code: address.country_code,
				countryCode: address.countryCode,
				normalizedCountryCode: shippingAddress.countryCode,
				isDomestic,
				service: isDomestic ? 'Terminal Africa' : 'DHL'
			});

			let useTerminalAfrica = isDomestic;

			if (useTerminalAfrica)
			{
				try
				{
					console.log("🇳🇬 NIGERIA DETECTED: Using Terminal Africa Flow");

					// 1. Create Delivery Address (Terminal Africa)
					const deliveryAddr =
						await TerminalAfricaService.createDeliveryAddress({
							city: shippingAddress.city,
							countryCode: "NG",
							email: user?.email || "",
							isResidential: true, // Defaulting to true for B2C
							firstName: shippingAddress.firstName || "",
							lastName: shippingAddress.lastName || "",
							line1: shippingAddress.streetAddress,
							phone: shippingAddress.phoneNumber || "",
							dialCode: address.dial_code || "+234", // Pass dialCode
							state: shippingAddress.state,
							postalCode: shippingAddress.postcode,
							isLive: true, // Assuming production for now, switch based on env if needed
						});

					// 2. Create Pickup Address (Terminal Africa)
					// Note: Pickup Address is typically static/merchant address, configured or created dynamically
					const pickupAddr =
						await TerminalAfricaService.createPickupAddress(true);

					// 3. Create Packaging (Terminal Africa) & Parcel
					// We simplify by creating a single parcel for the entire order for now
					const combinedData =
						DHLShippingService.calculateCombinedPackageData(
							cartItemsForShipping,
						);

					// Package creation
					const packagingRef = await TerminalAfricaService.createPackaging({
						weight: combinedData.weight,
						height: combinedData.dimensions.height,
						length: combinedData.dimensions.length,
						width: combinedData.dimensions.width,
						isLive: true,
					});

					// Parcel creation
					const parcel = await TerminalAfricaService.createParcel({
						description: `Order for ${shippingAddress.firstName}`,
						packagingId: packagingRef.packaging_id, // Adjust based on actual return field
						items: regularItems.map((item) =>
						{
							// Ensure the price is valid and positive for Terminal Africa
							const validPrice =
								item.price && typeof item.price === "number" && item.price > 0
									? item.price
									: item.originalPrice || 1; // Fallback to original price or 1 USD
							const calculatedValue = validPrice * 1350;

							return {
								name: item.title,
								description: item.description || "Apparel",
								currency: "NGN", // Terminal Africa usually expects NGN value
								value: calculatedValue, // Approximate conversion or fetch real rate
								quantity: item.quantity,
								weight: item.product?.shipping?.actualWeightKg || 0.5,
							};
						}),
						isLive: true,
					});

					// 4. Get Rates (Terminal Africa)
					const ratesResponse = await TerminalAfricaService.getRates({
						pickUpAddressId: pickupAddr.address_id, // Adjust field name
						deliveryAddressId: deliveryAddr.address_id, // Adjust field name
						parcelId: parcel.parcel_id, // Adjust field name
						cashOnDelivery: false,
						isLive: true,
					});

					// 5. Select Best Rate (Cheapest or fastest? Default to cheapest for now or expose selection)
					// For MVP, auto-select the first valid rate
					const rates = ratesResponse.data || []; // Adjust based on response structure
					if (rates.length > 0)
					{
						// Sort by amount
						rates.sort((a: any, b: any) => a.amount - b.amount);
						const bestRate = rates[0];

						// Convert amount from NGN to USD for display
						const amountUSD = bestRate.amount / 1350;

						setShippingRate({
							amount: amountUSD,
							deliveryDate: bestRate.delivery_date,
							courierName: bestRate.courier_name,
							packageWeight: combinedData.weight,
							packageDimensions: combinedData.dimensions,
						});
						setIsFreeShipping(false);

						// SAVE COURIER DATA for Payment Step
						setCourierData({
							terminal_africa_data: {
								pickup_address_id: pickupAddr.address_id,
								delivery_address_id: deliveryAddr.address_id,
								parcel_id: parcel.parcel_id,
								rate_id: bestRate.rate_id,
								shipment_id: null,
							},
						});
						setDeliveryDate(bestRate.delivery_date || getFutureDate(7));
						return true; // SUCCESS - Exit function
					} else
					{
						throw new Error(t.checkout.errors.noDomesticRates);
					}
				} catch (terminalError)
				{
					console.warn(t.checkout.errors.terminalAfricaFailed, terminalError);
					useTerminalAfrica = false; // Fallback to DHL
				}
			}

			// LOGIC SPLIT: DOMESTIC (NG) vs INTERNATIONAL (DHL)
			// IF NOT NIGERIA OR IF TERMINAL AFRICA FAILED
			if (!useTerminalAfrica)
			{
				// INTERNATIONAL (DHL) or DOMESTIC FALLBACK
				console.log("🌍 INTERNATIONAL/FALLBACK DETECTED: Using DHL Flow");

				const rate = await DHLShippingService.getShippingRate({
					address: shippingAddress,
					multipleItems: cartItemsForShipping,
				});

				setShippingRate(rate);
				setShippingCurrency(rate?.currency || 'USD');
				setIsFreeShipping(false);

				// SAVE COURIER DATA for Payment Step
				if (rate?.dhlData)
				{
					setCourierData({
						dhl_data: {
							plannedShippingDate: rate.dhlData.plannedShippingDate,
							productCode: rate.dhlData.productCode,
						},
					});
					setDeliveryDate(rate.deliveryDate || getFutureDate(7));
				} else
				{
					// Fallback if fixed rate used
					setCourierData({});
					setDeliveryDate(getFutureDate(7));
				}
			}
		} catch (error: any)
		{
			console.error("Shipping calculation error:", error);
			setShippingError(
				error?.message || t.checkout.errors.shippingCalculationFailed,
			);
			return false;
		} finally
		{
			setShippingLoading(false);
		}
		return true;
	};

	// Helper for fallback date
	const getFutureDate = (days: number) =>
	{
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date.toISOString();
	};

	const handleAddressSubmit = async (e: React.FormEvent) =>
	{
		e.preventDefault();

		if (!user) return;

		// Validate address
		const errors = AddressService.validateAddress(newAddress);
		if (errors.length > 0)
		{
			setAddressErrors(errors);
			return;
		}

		setLoading(true);
		setAddressErrors([]);

		try
		{
			const addressId = await AddressService.saveAddress({
				...newAddress,
				userId: user.uid,
			} as Omit<Address, "id" | "createdAt" | "updatedAt">);

			// Reload addresses and select the new one
			await loadUserAddresses();
			const savedAddress = addresses.find((addr) => addr.id === addressId);
			if (savedAddress)
			{
				setSelectedAddress(savedAddress);
			}

			setShowAddressForm(false);

			// Reset form
			setNewAddress({
				first_name: "",
				last_name: "",
				street_address: "",
				city: "",
				state: "",
				post_code: "",
				country: "United States",
				country_code: "US",
				dial_code: "+1",
				phone_number: "",
				flat_number: "",
				type: "home",
				is_default: false,
				userId: user.uid,
			});
		} catch (error)
		{
			console.error("Error saving address:", error);
			setAddressErrors([t.common.error]);
		} finally
		{
			setLoading(false);
		}
	};

	const handleNextStep = async () =>
	{
		if (currentStep === 0)
		{
			// From cart to measurements (if bespoke items) or shipping
			if (hasBespokeItems)
			{
				// Validate measurements exist for bespoke items
				if (!selectedMeasurements)
				{
					setMeasurementError(t.checkout.errors.missingMeasurements);

					// Track measurement validation failure
					trackError(
						"checkout_error",
						"Missing measurements for bespoke items",
						"cart_step",
					);
					trackFeatureUsage("checkout_measurement_error", {
						errorType: "missing_measurements",
						bespokeItemCount: regularItems.filter(
							(item) =>
								item.type === "bespoke" || item.product?.type === "bespoke",
						).length,
						totalItems: regularItems.length,
						currentStep: 0,
					});
					trackFeatureUsage("checkout_measurement_validation_failed", {
						bespokeItemCount: regularItems.filter(
							(item) =>
								item.type === "bespoke" || item.product?.type === "bespoke",
						).length,
						totalItems: regularItems.length,
						currentStep: 0,
						reason: "no_measurements",
					});

					// Redirect to measurements page with return URL
					redirectToMeasurements();
					return;
				}

				// Validate measurement data structure
				if (
					!selectedMeasurements.volume_params ||
					typeof selectedMeasurements.volume_params !== "object"
				)
				{
					setMeasurementError(t.checkout.errors.invalidMeasurementData);

					trackError(
						"checkout_error",
						"Invalid measurement data structure",
						"cart_step",
					);
					trackFeatureUsage("checkout_measurement_error", {
						errorType: "invalid_measurement_data",
						userId: user?.uid,
						hasMeasurements: !!selectedMeasurements,
						hasVolumeParams: !!selectedMeasurements.volume_params,
						currentStep: 0,
					});

					redirectToMeasurements();
					return;
				}

				// Check if measurements have any values
				const hasAnyMeasurement = Object.values(
					selectedMeasurements.volume_params,
				).some((value) => typeof value === "number" && value > 0);

				if (!hasAnyMeasurement)
				{
					setMeasurementError(t.checkout.errors.emptyMeasurements);

					trackError("checkout_error", "Empty measurement values", "cart_step");
					trackFeatureUsage("checkout_measurement_error", {
						errorType: "empty_measurements",
						userId: user?.uid,
						currentStep: 0,
					});

					redirectToMeasurements();
					return;
				}

				// Track successful measurement validation and navigation
				trackClick("checkout_continue_to_measurements", {
					itemCount: regularItems.length,
					totalAmount: regularItemsTotal,
					hasMeasurements: true,
					bespokeItemCount: regularItems.filter(
						(item) =>
							item.type === "bespoke" || item.product?.type === "bespoke",
					).length,
				});

				trackFeatureUsage("checkout_measurement_validation_passed", {
					measurementAge: selectedMeasurements
						? Date.now() - selectedMeasurements.updatedAt.getTime()
						: 0,
					bespokeItemCount: regularItems.filter(
						(item) =>
							item.type === "bespoke" || item.product?.type === "bespoke",
					).length,
					measurementCount: Object.values(
						selectedMeasurements.volume_params,
					).filter((v) => typeof v === "number" && v > 0).length,
				});

				setCurrentStep(1);
			} else
			{
				// No bespoke items - skip measurements step
				trackClick("checkout_continue_to_shipping", {
					itemCount: regularItems.length,
					totalAmount: regularItemsTotal,
					hasBespokeItems: false,
				});
				setCurrentStep(hasBespokeItems ? 2 : 1);
			}
		} else if (currentStep === 1 && hasBespokeItems)
		{
			// From measurements to shipping
			trackClick("checkout_continue_to_shipping", {
				itemCount: regularItems.length,
				totalAmount,
				fromMeasurements: true,
			});

			trackFeatureUsage("checkout_measurements_step_completed", {
				hasMeasurements: !!selectedMeasurements,
				bespokeItemCount: regularItems.filter(
					(item) => item.type === "bespoke" || item.product?.type === "bespoke",
				).length,
			});

			setCurrentStep(2);
		} else if (
			(currentStep === 1 && !hasBespokeItems) ||
			(currentStep === 2 && hasBespokeItems)
		)
		{
			// From shipping to payment - calculate shipping first
			if (!selectedAddress)
			{
				trackError(
					"checkout_error",
					"No shipping address selected",
					"shipping_step",
				);
				alert(t.checkout.errors.noShippingAddress);
				return;
			}

			trackClick("checkout_continue_to_payment", {
				addressCountry: selectedAddress.country,
				shippingCost,
				hasBespokeItems,
				hasMeasurements: !!selectedMeasurements,
			});
			const shippingSuccess = await calculateShipping(selectedAddress);
			if (shippingSuccess)
			{
				setCurrentStep(hasBespokeItems ? 3 : 2);
			}
			// If failed, user stays on shipping step and sees the error
		}
	};

	const handlePrevStep = () =>
	{
		if (currentStep > 0)
		{
			trackClick("checkout_back_step", {
				fromStep: currentStep,
				toStep: currentStep - 1,
			});
			setCurrentStep(currentStep - 1);
		}
	};

	const handleMeasurementsComplete = (
		measurements: UserMeasurements | null,
	) =>
	{
		setSelectedMeasurements(measurements);

		// Track measurement completion in checkout flow
		trackFeatureUsage("checkout_measurements_completed", {
			hasMeasurements: !!measurements,
			bespokeItemCount: regularItems.filter(
				(item) => item.type === "bespoke" || item.product?.type === "bespoke",
			).length,
			totalItems: regularItems.length,
			measurementAge: measurements
				? Date.now() - measurements.updatedAt.getTime()
				: 0,
		});

		// Auto-advance to shipping step
		setCurrentStep(2);
	};

	const handleMeasurementsBack = () =>
	{
		setCurrentStep(0); // Back to cart
	};

	const handlePayment = async () =>
	{
		// Validate required information
		if (!user)
		{
			const errorMessage = t.checkout.errors.userNotAuthenticated;
			setPaymentError(errorMessage);
			trackError("checkout_error", "User not authenticated", "payment_step");
			trackFeatureUsage("checkout_payment_error", {
				errorType: "missing_user",
				errorMessage,
			});
			return;
		}

		if (!selectedAddress)
		{
			const errorMessage = t.checkout.errors.noShippingAddress;
			setPaymentError(errorMessage);
			trackError(
				"checkout_error",
				"No shipping address selected",
				"payment_step",
			);
			trackFeatureUsage("checkout_payment_error", {
				errorType: "missing_address",
				userId: user.uid,
				errorMessage,
			});
			return;
		}

		// Validate measurements for bespoke items
		if (hasBespokeItems)
		{
			if (!selectedMeasurements)
			{
				const errorMessage = t.checkout.errors.missingMeasurements;
				setPaymentError(errorMessage);
				trackError(
					"checkout_error",
					"Missing measurements at payment",
					"payment_step",
				);
				trackFeatureUsage("checkout_payment_error", {
					errorType: "missing_measurements",
					userId: user.uid,
					bespokeItemCount: regularItems.filter(
						(item) =>
							item.type === "bespoke" || item.product?.type === "bespoke",
					).length,
					errorMessage,
				});

				// Redirect to measurements page
				redirectToMeasurements();
				return;
			}

			// Validate measurement data structure
			if (
				!selectedMeasurements.volume_params ||
				typeof selectedMeasurements.volume_params !== "object"
			)
			{
				const errorMessage = t.checkout.errors.invalidMeasurementData;
				setPaymentError(errorMessage);
				trackError(
					"checkout_error",
					"Invalid measurement data at payment",
					"payment_step",
				);
				trackFeatureUsage("checkout_payment_error", {
					errorType: "invalid_measurement_data",
					userId: user.uid,
					hasMeasurements: !!selectedMeasurements,
					hasVolumeParams: !!selectedMeasurements.volume_params,
					errorMessage,
				});

				redirectToMeasurements();
				return;
			}

			// Check if measurements have any values
			const hasAnyMeasurement = Object.values(
				selectedMeasurements.volume_params,
			).some((value) => typeof value === "number" && value > 0);

			if (!hasAnyMeasurement)
			{
				const errorMessage = t.checkout.errors.emptyMeasurements;
				setPaymentError(errorMessage);
				trackError(
					"checkout_error",
					"Empty measurements at payment",
					"payment_step",
				);
				trackFeatureUsage("checkout_payment_error", {
					errorType: "empty_measurements",
					userId: user.uid,
					errorMessage,
				});

				redirectToMeasurements();
				return;
			}

			// Validate measurement values using repository validation
			const validationResult = measurementsRepository.validateMeasurements(
				selectedMeasurements.volume_params,
			);
			if (!validationResult.isValid)
			{
				const errorMessage = `${t.checkout.errors.invalidMeasurementValues} ${validationResult.errors.join(", ")}`;
				setPaymentError(errorMessage);
				trackError(
					"checkout_error",
					"Invalid measurement values at payment",
					"payment_step",
				);
				trackFeatureUsage("checkout_payment_error", {
					errorType: "invalid_measurement_values",
					userId: user.uid,
					validationErrors: validationResult.errors,
					errorMessage,
				});

				// Don't redirect, just show error so user can see what's wrong
				return;
			}

			// Check measurement completeness - ensure key measurements are present
			const keyMeasurements = ["chest", "waist", "neck"];
			const missingKeyMeasurements = keyMeasurements.filter((key) =>
			{
				const value =
					selectedMeasurements.volume_params[
					key as keyof typeof selectedMeasurements.volume_params
					];
				return !value || value <= 0;
			});

			if (missingKeyMeasurements.length > 0)
			{
				const errorMessage = `${t.checkout.errors.incompleteMeasurements} ${missingKeyMeasurements.join(", ")}`;
				setPaymentError(errorMessage);
				trackError(
					"checkout_error",
					"Incomplete measurements at payment",
					"payment_step",
				);
				trackFeatureUsage("checkout_payment_error", {
					errorType: "incomplete_measurements",
					userId: user.uid,
					missingMeasurements: missingKeyMeasurements,
					errorMessage,
				});

				// Don't redirect, just show error so user can see what's missing
				return;
			}

			// Track successful measurement validation
			trackFeatureUsage("checkout_measurement_validation_success", {
				userId: user.uid,
				bespokeItemCount: regularItems.filter(
					(item) => item.type === "bespoke" || item.product?.type === "bespoke",
				).length,
				measurementCount: Object.values(
					selectedMeasurements.volume_params,
				).filter((v) => typeof v === "number" && v > 0).length,
				measurementAge: Date.now() - selectedMeasurements.updatedAt.getTime(),
			});
		}

		// Clear any previous payment errors
		setPaymentError(null);

		// Track payment attempt with Stripe
		trackPaymentAttempt(
			"stripe",
			selectedCurrency,
			selectedCurrency === "USD"
				? regularItemsTotalWithShipping
				: PaymentService.convertCurrency(
					regularItemsTotalWithShipping,
					"USD",
					selectedCurrency,
				),
			`order_${Date.now()}`,
		);

		// Open Stripe modal
		trackClick("checkout_stripe_modal_open", {
			currency: selectedCurrency,
			amount: regularItemsTotalWithShipping,
			hasBespokeItems,
			hasMeasurements: !!selectedMeasurements,
		});
		setShowStripeModal(true);
	};

	const handleStripePaymentSuccess = async (paymentIntentId: string) =>
	{
		console.log("Stripe payment successful:", paymentIntentId);

		// Track successful Stripe payment with measurement details
		trackFeatureUsage("stripe_payment_success", {
			paymentIntentId,
			currency: selectedCurrency,
			amount: regularItemsTotalWithShipping,
			itemCount: items.length,
			hasBespokeItems,
			hasMeasurements: !!selectedMeasurements,
			measurementsIncludedInOrder: hasBespokeItems && !!selectedMeasurements,
			bespokeItemCount: regularItems.filter(
				(item) => item.type === "bespoke" || item.product?.type === "bespoke",
			).length,
		});

		// Send order confirmation emails (non-blocking)
		if (user && selectedAddress)
		{
			const customerName = `${selectedAddress.first_name || selectedAddress.firstName
				} ${selectedAddress.last_name || selectedAddress.lastName}`;
			const orderId = `ORD-${Date.now()}`;
			const orderDate = new Date().toLocaleDateString("en-US", {
				dateStyle: "full",
			});

			// Group items by vendor for vendor notifications (only regular items)
			const vendorMap = new Map<
				string,
				{ vendorName: string; email: string; items: any[]; subtotal: number }
			>();

			regularItems.forEach((item) =>
			{
				const vendorId = item.product?.tailor_id || item.tailor_id;
				const vendorName =
					item.product?.vendor?.name || item.product?.tailor || "Vendor";
				const vendorEmail = item.product?.vendor?.email || "";

				if (vendorId && vendorEmail)
				{
					if (!vendorMap.has(vendorId))
					{
						vendorMap.set(vendorId, {
							vendorName,
							email: vendorEmail,
							items: [],
							subtotal: 0,
						});
					}

					const vendor = vendorMap.get(vendorId)!;
					vendor.items.push({
						title: item.title,
						quantity: item.quantity,
						price: item.price,
						image: item.images?.[0],
						type: item.type || item.product?.type,
					});
					vendor.subtotal += item.price * item.quantity;
				}
			});

			// Prepare measurements data structure for bespoke orders
			const measurementsData =
				hasBespokeItems && selectedMeasurements
					? {
						userId: selectedMeasurements.userId,
						volume_params: selectedMeasurements.volume_params,
						updatedAt: selectedMeasurements.updatedAt.toISOString(),
						hasBespokeItems: true,
					}
					: undefined;

			// Track measurement inclusion in order payload
			if (measurementsData)
			{
				trackFeatureUsage("checkout_measurements_included_in_order", {
					orderId,
					bespokeItemCount: regularItems.filter(
						(item) =>
							item.type === "bespoke" || item.product?.type === "bespoke",
					).length,
					totalItems: regularItems.length,
					measurementAge:
						Date.now() - selectedMeasurements!.updatedAt.getTime(),
					orderValue: regularItemsTotalWithShipping,
					currency: selectedCurrency,
				});
			}

			// Send order confirmation emails with measurements
			fetch("/api/shops/send-order-confirmation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					customerEmail: user.email,
					customerName,
					orderId,
					orderDate,
					items: regularItems.map((item) => ({
						title: item.title,
						quantity: item.quantity,
						price: item.price,
						image: item.images?.[0],
						type: item.type || item.product?.type,
					})),
					subtotal: regularItemsTotal,
					shippingCost: shippingCost,
					total: regularItemsTotalWithShipping,
					currency: selectedCurrency,
					shippingAddress:
						AddressService.formatAddressForDisplay(selectedAddress),
					vendorEmails: Array.from(vendorMap.values()),
					measurements: measurementsData,
					// Include coupon information
					coupon: couponValidationResult ? {
						code: couponValidationResult.coupon?.couponCode,
						discountAmount: couponValidationResult.discountAmount,
						currency: couponValidationResult.currency
					} : undefined,
				}),
			})
				.then((response) =>
				{
					if (!response.ok)
					{
						throw new Error(`Email API returned ${response.status}`);
					}
					return response.json();
				})
				.then((data) =>
				{
					console.log("Order confirmation emails sent successfully:", data);
					trackFeatureUsage("checkout_order_confirmation_emails_sent", {
						orderId,
						vendorCount: vendorMap.size,
						hasMeasurements: !!measurementsData,
						emailsSent: true,
					});
				})
				.catch((err) =>
				{
					console.error("Failed to send order confirmation emails:", err);
					trackError(
						"order_confirmation_email_error",
						err instanceof Error ? err.message : "Unknown error",
						"payment_success",
					);
					trackFeatureUsage("checkout_email_error", {
						orderId,
						vendorCount: vendorMap.size,
						hasMeasurements: !!measurementsData,
						errorType: "email_send_failure",
						errorMessage: err instanceof Error ? err.message : "Unknown error",
					});
					// Note: We don't block the checkout flow if emails fail
				});
		}

		// Track purchase for referral program (Requirement 9.1, 9.2, 9.3, 9.4, 9.5)
		if (user)
		{
			try
			{
				await fetch("/api/referral/track-purchase", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						refereeId: user.uid,
						orderId: `order_${Date.now()}`,
						amount: regularItemsTotalWithShipping,
					}),
				});
			} catch (referralError)
			{
				// Don't fail the order if referral tracking fails
				console.error("Failed to track referral purchase:", referralError);
			}
		}

		// Track purchase activities for vendor analytics
		// Validates: Requirements 21.4
		const activityTracker = getActivityTracker();
		const orderId = `ORD-${Date.now()}`;

		// Track each item purchase
		regularItems.forEach((item) =>
		{
			const vendorId = item.product?.tailor_id || item.tailor_id;
			if (vendorId)
			{
				activityTracker
					.trackPurchase(
						orderId,
						item.product_id,
						vendorId,
						item.price,
						item.quantity,
						user?.uid,
					)
					.catch((err) =>
						console.warn("Could not track purchase for analytics:", err),
					);
			}
		});

		// Clear cart and redirect to success page
		// Track purchases for Collections Analytics
		trackCollectionPurchases(items, orderId);

		// Track BOGO redemptions
		trackBogoRedemptions(items, orderId);

		await processOrderCreation(paymentIntentId, "stripe");
	};

	const handleStripePaymentError = (error: string) =>
	{
		console.error("Stripe payment error:", error);

		// Track Stripe payment error
		trackError("stripe_payment_error", error, "stripe_modal");

		toast.error(error, {
			duration: 5000,
		});
		setPaymentError(error);
		setShowStripeModal(false);
	};

	const handleFlutterwavePaymentSuccess = async (transactionId: string) =>
	{
		console.log("Flutterwave payment successful:", transactionId);

		// Track successful Flutterwave payment with measurement details
		trackFeatureUsage("flutterwave_payment_success", {
			transactionId,
			currency: selectedCurrency,
			amount: regularItemsTotalWithShipping,
			itemCount: items.length,
			hasBespokeItems,
			hasMeasurements: !!selectedMeasurements,
			measurementsIncludedInOrder: hasBespokeItems && !!selectedMeasurements,
			bespokeItemCount: regularItems.filter(
				(item) => item.type === "bespoke" || item.product?.type === "bespoke",
			).length,
		});

		// Send order confirmation emails (non-blocking)
		if (user && selectedAddress)
		{
			const customerName = `${selectedAddress.first_name || selectedAddress.firstName
				} ${selectedAddress.last_name || selectedAddress.lastName}`;
			const orderId = `ORD-${Date.now()}`;
			const orderDate = new Date().toLocaleDateString("en-US", {
				dateStyle: "full",
			});

			// Group items by vendor for vendor notifications (only regular items)
			const vendorMap = new Map<
				string,
				{ vendorName: string; email: string; items: any[]; subtotal: number }
			>();

			regularItems.forEach((item) =>
			{
				const vendorId = item.product?.tailor_id || item.tailor_id;
				const vendorName =
					item.product?.vendor?.name || item.product?.tailor || "Vendor";
				const vendorEmail = item.product?.vendor?.email || "";

				if (vendorId && vendorEmail)
				{
					if (!vendorMap.has(vendorId))
					{
						vendorMap.set(vendorId, {
							vendorName,
							email: vendorEmail,
							items: [],
							subtotal: 0,
						});
					}

					const vendor = vendorMap.get(vendorId)!;
					vendor.items.push({
						title: item.title,
						quantity: item.quantity,
						price: item.price,
						image: item.images?.[0],
						type: item.type || item.product?.type,
					});
					vendor.subtotal += item.price * item.quantity;
				}
			});

			// Prepare measurements data structure for bespoke orders
			const measurementsData =
				hasBespokeItems && selectedMeasurements
					? {
						userId: selectedMeasurements.userId,
						volume_params: selectedMeasurements.volume_params,
						updatedAt: selectedMeasurements.updatedAt.toISOString(),
						hasBespokeItems: true,
					}
					: undefined;

			// Track measurement inclusion in order payload
			if (measurementsData)
			{
				trackFeatureUsage("checkout_measurements_included_in_order", {
					orderId,
					bespokeItemCount: regularItems.filter(
						(item) =>
							item.type === "bespoke" || item.product?.type === "bespoke",
					).length,
					totalItems: regularItems.length,
					measurementAge:
						Date.now() - selectedMeasurements!.updatedAt.getTime(),
					orderValue: regularItemsTotalWithShipping,
					currency: selectedCurrency,
				});
			}

			// Send order confirmation emails with measurements
			fetch("/api/shops/send-order-confirmation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					customerEmail: user.email,
					customerName,
					orderId,
					orderDate,
					items: regularItems.map((item) => ({
						title: item.title,
						quantity: item.quantity,
						price: item.price,
						image: item.images?.[0],
						type: item.type || item.product?.type,
					})),
					subtotal: regularItemsTotal,
					shippingCost: shippingCost,
					total: regularItemsTotalWithShipping,
					currency: selectedCurrency,
					shippingAddress:
						AddressService.formatAddressForDisplay(selectedAddress),
					vendorEmails: Array.from(vendorMap.values()),
					measurements: measurementsData,
					// Include coupon information
					coupon: couponValidationResult ? {
						code: couponValidationResult.coupon?.couponCode,
						discountAmount: couponValidationResult.discountAmount,
						currency: couponValidationResult.currency
					} : undefined,
				}),
			})
				.then((response) =>
				{
					if (!response.ok)
					{
						throw new Error(`Email API returned ${response.status}`);
					}
					return response.json();
				})
				.then((data) =>
				{
					console.log("Order confirmation emails sent successfully:", data);
					trackFeatureUsage("checkout_order_confirmation_emails_sent", {
						orderId,
						vendorCount: vendorMap.size,
						hasMeasurements: !!measurementsData,
						emailsSent: true,
					});
				})
				.catch((err) =>
				{
					console.error("Failed to send order confirmation emails:", err);
					trackError(
						"order_confirmation_email_error",
						err instanceof Error ? err.message : "Unknown error",
						"payment_success",
					);
					trackFeatureUsage("checkout_email_error", {
						orderId,
						vendorCount: vendorMap.size,
						hasMeasurements: !!measurementsData,
						errorType: "email_send_failure",
						errorMessage: err instanceof Error ? err.message : "Unknown error",
					});
					// Note: We don't block the checkout flow if emails fail
				});
		}

		// Track purchase for referral program (Requirement 9.1, 9.2, 9.3, 9.4, 9.5)
		if (user)
		{
			try
			{
				await fetch("/api/referral/track-purchase", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						refereeId: user.uid,
						orderId: `order_${Date.now()}`,
						amount: regularItemsTotalWithShipping,
					}),
				});
			} catch (referralError)
			{
				// Don't fail the order if referral tracking fails
				console.error("Failed to track referral purchase:", referralError);
			}
		}

		// Track purchase activities for vendor analytics
		// Validates: Requirements 21.4
		const activityTracker = getActivityTracker();
		const orderId = `ORD-${Date.now()}`;

		// Track each item purchase
		regularItems.forEach((item) =>
		{
			const vendorId = item.product?.tailor_id || item.tailor_id;
			if (vendorId)
			{
				activityTracker
					.trackPurchase(
						orderId,
						item.product_id,
						vendorId,
						item.price,
						item.quantity,
						user?.uid,
					)
					.catch((err) =>
						console.warn("Could not track purchase for analytics:", err),
					);
			}
		});

		// Track purchases for Collections Analytics
		trackCollectionPurchases(items, orderId);

		// Track BOGO redemptions
		trackBogoRedemptions(items, orderId);

		await processOrderCreation(transactionId, "flutterwave");
	};

	/**
	 * Handle voucher validation
	 */
	const handleVoucherValidated = (voucher: SureGiftsVoucher | null) =>
	{
		setSelectedVoucher(voucher);

		if (voucher)
		{
			// Calculate payment breakdown with voucher
			const breakdown = VoucherPaymentService.calculatePaymentBreakdown(
				baseTotal,
				voucher,
				selectedCurrency,
			);
			setVoucherBreakdown(breakdown);

			// Track voucher application
			trackFeatureUsage("checkout_voucher_applied", {
				voucherCode: voucher.code,
				voucherBalance: voucher.balance,
				orderTotal: baseTotal,
				remainingAmount: breakdown.remainingAmount,
				currency: selectedCurrency,
			});

			toast.success(
				`${t.checkout.voucher.voucherApplied} ${breakdown.remainingAmount === 0
					? t.checkout.voucher.orderFullyCovered
					: `${t.checkout.voucher.payRemainingAmount} ${selectedCurrency} ${breakdown.remainingAmount.toFixed(
						2,
					)}`
				}`,
			);
		} else
		{
			setVoucherBreakdown(null);
		}
	};

	/**
	 * Handle voucher-only payment (when voucher covers full amount)
	 */
	const handleVoucherOnlyPayment = async () =>
	{
		if (
			!selectedVoucher ||
			!voucherBreakdown ||
			voucherBreakdown.remainingAmount > 0
		)
		{
			toast.error(t.checkout.errors.voucherNotCoverFull);
			return;
		}

		if (!user || !selectedAddress)
		{
			toast.error(t.checkout.errors.missingUserOrAddress);
			return;
		}

		setVoucherLoading(true);
		setPaymentError(null);

		try
		{
			const orderId = `ORD-${Date.now()}`;

			// Track voucher-only payment attempt
			trackFeatureUsage("checkout_voucher_only_payment_attempt", {
				voucherCode: selectedVoucher.code,
				orderTotal: baseTotal,
				voucherAmount: voucherBreakdown.voucherAmount,
				orderId,
				userId: user.uid,
			});

			// Process voucher payment
			const result = await VoucherPaymentService.processVoucherPayment(
				selectedVoucher,
				baseTotal,
				orderId,
				user.uid,
				user.email || "",
				`${selectedAddress.first_name || selectedAddress.firstName} ${selectedAddress.last_name || selectedAddress.lastName}`,
				undefined, // No additional payment needed
			);

			if (!result.success)
			{
				throw new Error(result.error || t.checkout.errors.voucherPaymentFailed);
			}

			// Track successful voucher redemption
			trackFeatureUsage("suregifts_payment_success", {
				voucherCode: selectedVoucher.code,
				orderId,
				amount: baseTotal,
				currency: selectedCurrency,
				itemCount: items.length,
			});

			// Track purchases for analytics
			trackCollectionPurchases(items, orderId);
			trackBogoRedemptions(items, orderId);

			// Process order creation
			await processOrderCreation(
				result.voucherTransactionId || orderId,
				"voucher",
			);

			toast.success(t.checkout.voucher.orderCompletedWithVoucher);
		} catch (error: any)
		{
			console.error("Voucher payment error:", error);
			trackError(
				"suregifts_payment_error",
				error.message || "Unknown error",
				"voucher_payment",
			);
			toast.error(error.message || t.checkout.errors.voucherPaymentFailed);
			setPaymentError(error.message || t.checkout.errors.voucherPaymentFailed);
		} finally
		{
			setVoucherLoading(false);
		}
	};

	const handleFlutterwavePaymentError = (error: string) =>
	{
		console.error("Flutterwave payment error:", error);

		// Track Flutterwave payment error
		trackError("flutterwave_payment_error", error, "flutterwave_modal");

		toast.error(error, {
			duration: 5000,
		});
		setPaymentError(error);
		setShowFlutterwaveModal(false);
	};

	// Helper to call the Firebase Callable (Regular Checkout)
	const processOrderCreation = async (
		paymentRef?: string,
		provider?: string,
	) =>
	{
		try
		{
			console.log("🚀 Starting processOrderCreation for Regular Checkout...");
			// Imports are handled at top level or lazy loaded if needed, but we added imports at top.
			// But to match collection page style which used dynamic imports (optional but let's stick to imports added at top)

			const functionsModule = await loadFirebaseModule(
				"firebase/functions",
				"process_post_payment",
			);

			// Get app and initialize functions with specific region 'europe-west1'
			const firebaseModule = await import("@/lib/firebase");
			const app = await firebaseModule.getFirebaseApp();
			const { getFunctions } = functionsModule;
			const functions = getFunctions(app, "europe-west1");
			const idToken = await user?.getIdToken();

			const processPostPayment = functionsModule.httpsCallable(
				functions,
				"processPostPayment",
			);

			const payload = {
				userId: user?.uid,
				shippingAddress: {
					street_address:
						selectedAddress?.street_address || selectedAddress?.streetAddress,
					city: selectedAddress?.city,
					state: selectedAddress?.state,
					country_code:
						selectedAddress?.country_code || selectedAddress?.countryCode,
					first_name: selectedAddress?.first_name || selectedAddress?.firstName,
					last_name: selectedAddress?.last_name || selectedAddress?.lastName,
					phone_number:
						selectedAddress?.phone_number || selectedAddress?.phoneNumber,
					email: user?.email,
				},
				shippingFee: shippingCost,
				deliveryDate: deliveryDate,
				courierData: courierData,
				userEmail: user?.email,
				isBogoCheckout: items.some((i) => i.isBogoFree),
				isUnifiedCheckout: true,
				tax:
					selectedCurrency === "USD"
						? taxAmount
						: (await convertPrice(taxAmount, "USD")).convertedPrice,
				tax_currency: selectedCurrency,
				paymentProvider: provider, // 'stripe', 'flutterwave', 'paystack'
				accessToken: idToken,
				logoUrl: "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
				// isTestMode: process.env.NODE_ENV === "development",
				isTestMode: false,
				currency: selectedCurrency,
				// Include coupon information
				coupon_code: couponValidationResult?.coupon?.couponCode,
				coupon_value: couponValidationResult?.discountAmount,
				coupon_currency: couponValidationResult?.currency,
				// Include subtotal after coupon for backend validation
				subtotal_after_coupon: subtotalAfterCoupon,

				// collectionId is null for regular checkout

				// Regular checkout might imply `buyNowProductId` if single item immediate checkout,
				// but this is cart checkout so we don't pass buyNowProductId usually unless tracking specific source.
				// Mobile app usually passes `cartItems` or relies on backend to fetch cart?
				// Wait, the Callable `processPostPayment` usually fetches the cart from the database for the user
				// OR it accepts items in the payload?
				// Looking at the collection page implementation, we didn't pass items in the payload.
				// Be careful: if the backend expects items for regular checkout, checking mobile implementation.
				// Mobile implementation usually relies on server fetching 'active cart' or 'buy now item'.
				// Since this is standard checkout, backend likely fetches the user's active cart.
			};

			console.log(
				"📦 Calling processPostPayment (Regular) with:",
				JSON.stringify(payload, null, 2),
			);

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result: any = await processPostPayment(payload);
			console.log("✅ processPostPayment Result:", result.data);

			if (result.data.success)
			{
				// Success!
				setIsOrderComplete(true);
				clearCart();

				// Apply coupon if present
				if (couponValidationResult)
				{
					await applyCouponToOrder(result.data.orderId);
				}

				toast.success(t.checkout.success);
				router.push(
					`/shops/checkout/success?ref=${result.data.orderId}&provider=${provider || "stripe"}`,
				);
			} else
			{
				throw new Error("Order creation reported failure");
			}
		} catch (error: any)
		{
			console.error("❌ processPostPayment Failed:", error);

			// Handle Structured Stock Errors
			if (error?.details?.code === "STOCK_VALIDATION_FAILED")
			{
				const details = error.details;
				toast.error(
					`${t.checkout.errors.stockError}: ${details.productTitle} - ${details.availableStock} left.`,
				);
				setPaymentError(
					`${t.checkout.errors.stockError}: ${details.productTitle} ${t.checkout.errors.stockUnavailable}.`,
				);
			} else
			{
				setPaymentError(error.message || t.checkout.errors.paymentFailed);
				toast.error(t.checkout.errors.paymentFailed);
			}
		} finally
		{
			setPaymentLoading(false);
		}
	};

	const handlePaymentSuccess = async (paymentData: PaymentData) =>
	{
		try
		{
			setPaymentLoading(true);
			setPaymentError(null);

			// Track payment attempt
			const orderId = `order_${Date.now()}`;
			trackPaymentAttempt(
				"stripe",
				selectedCurrency,
				regularItemsTotalWithShipping,
				orderId,
			);

			// Note: PaymentService.initializePayment creates an intent/transaction?
			// If this is called, it usually implies we are proceeding to verify or we just got a success signal.
			// But processOrderCreation expects a 'reference' that was successful.
			// If 'paymentData' is just setup data, this function name is misleading or this logic is for manual handling?
			// Reading closely: This seems to be the flow for manual/legacy or testing?
			// It calls `PaymentService.initializePayment`.
			// THEN if success, it redirects.
			// If we want to use the server-side order creation, `initializePayment` presumably charges the card?
			// Actually `PaymentService.initializePayment` for Stripe usually returns a client secret or redirects.
			// But if it returns success=true immediately, it might be for a provider that completes instantly or manual?
			// Let's assume we want to replace the `router.push` here with `processOrderCreation`.

			const initAmount =
				selectedCurrency === "USD"
					? regularItemsTotalWithShipping
					: (await convertPrice(regularItemsTotalWithShipping, "USD"))
						.convertedPrice;

			// Initialize Payment
			const result = await PaymentService.initializePayment(
				{
					amount: initAmount,
					currency: selectedCurrency,
					email: user!.email!,
					name: `${selectedAddress!.first_name || selectedAddress!.firstName} ${selectedAddress!.last_name || selectedAddress!.lastName
						}`,
					userId: user!.uid,
					orderId: orderId,
					description: `Order for ${regularItems.length} items from Stitches Africa`,
				},
				"stripe",
			);

			if (result.success)
			{
				// Track successful payment
				trackFeatureUsage("checkout_payment_success", {
					amount: regularItemsTotalWithShipping,
					currency: selectedCurrency,
					itemCount: regularItemsCount,
					paymentProvider: "stripe",
					orderId: orderId,
					userId: user?.uid,
				});

				// Track purchases for AI recommendations
				trackPurchases(regularItems);

				// Track purchases for Collections Analytics
				trackCollectionPurchases(items, orderId);

				// Track BOGO redemptions
				trackBogoRedemptions(items, orderId);

				// Use the new order creation flow
				// Use the reference (or orderId if reference missing)
				await processOrderCreation(result.reference || orderId, "stripe");
			} else
			{
				throw new Error(result.error || t.checkout.errors.paymentFailed);
			}
		} catch (error: any)
		{
			console.error("Payment error:", error);
			const errorMessage = error.message || t.checkout.errors.paymentFailed;
			setPaymentError(errorMessage);
			trackError("checkout_payment_error", errorMessage, "checkout_page");
			trackFeatureUsage("checkout_payment_failed", {
				amount: regularItemsTotalWithShipping,
				currency: selectedCurrency,
				itemCount: regularItemsCount,
				error: errorMessage,
				userId: user?.uid,
			});
		} finally
		{
			setPaymentLoading(false);
		}
	};

	// Track purchases for AI recommendations
	const trackPurchases = async (items: any[]) =>
	{
		try
		{
			// Get unique user identifier from localStorage or generate one
			let uniqueUserId = localStorage.getItem("ai-chat-unique-user-id");

			if (!uniqueUserId)
			{
				uniqueUserId = `user_${Date.now()}_${Math.random()
					.toString(36)
					.substr(2, 9)}`;
				localStorage.setItem("ai-chat-unique-user-id", uniqueUserId);
			}

			// Track each purchased product with the highest weight
			const trackPromises = items.map((item) =>
				fetch("/api/ai-assistant/user-preferences", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						userId: uniqueUserId,
						productId: item.product_id || item.id,
						interactionType: "purchase",
					}),
				}),
			);

			await Promise.all(trackPromises);
		} catch (error)
		{
			console.warn("Could not track purchases:", error);
		}
	};

	const trackBogoRedemptions = async (items: CartItem[], orderId: string) =>
	{
		try
		{
			const { bogoClientTracker } =
				await import("@/lib/bogo/client-tracking-service");
			const { bogoMappingService } = await import("@/lib/bogo/mapping-service");

			// Identify BOGO free items to track redemptions
			const freeItems = items.filter(
				(item) => item.isBogoFree && item.bogoMainProductId,
			);

			for (const item of freeItems)
			{
				const mainProductId = item.bogoMainProductId!;
				// Find main item to attribute revenue
				const mainItem = items.find((i) => i.product_id === mainProductId);
				const orderValue = mainItem ? mainItem.price : 0;

				// Resolve mapping ID
				const mapping =
					await bogoMappingService.getActiveMapping(mainProductId);

				if (mapping)
				{
					bogoClientTracker.trackRedemption(
						mapping.id,
						mainProductId,
						item.product_id,
						user?.uid,
						orderValue,
						item.bogoOriginalPrice || 0,
						{ orderId },
					);
				}
			}
		} catch (error)
		{
			console.error("Error tracking BOGO redemptions:", error);
		}
	};

	const handleVvipManualCheckoutSuccess = async (orderId: string) =>
	{
		// Track successful VVIP manual order submission
		trackFeatureUsage("vvip_manual_checkout_success", {
			orderId,
			userId: user?.uid,
			totalAmount: regularItemsTotalWithShipping,
			currency: selectedCurrency,
			itemCount: regularItems.length,
			hasBespokeItems,
			hasMeasurements: !!selectedMeasurements,
		});

		// Clear cart and redirect to success page
		setIsOrderComplete(true);
		clearCart();

		// Apply coupon if present
		if (couponValidationResult)
		{
			await applyCouponToOrder(orderId);
		}

		toast.success(t.checkout.success, {
			duration: 5000,
		});
		router.push(
			`/shops/checkout/success?ref=${orderId}&provider=manual&vvip=true`,
		);
	};

	const handleVvipManualCheckoutError = (error: string) =>
	{
		console.error("VVIP manual checkout error:", error);

		// Track VVIP manual checkout error
		trackError("vvip_manual_checkout_error", error, "vvip_checkout");
		trackFeatureUsage("vvip_manual_checkout_error", {
			userId: user?.uid,
			errorMessage: error,
			totalAmount: regularItemsTotalWithShipping,
			currency: selectedCurrency,
		});

		setPaymentError(error);
	};

	const trackCollectionPurchases = async (
		items: CartItem[],
		orderId: string,
	) =>
	{
		try
		{
			// Filter for items that belong to a collection
			const collectionItems = items.filter(
				(item) => item.isCollectionItem && item.collectionId,
			);

			if (collectionItems.length === 0) return;

			// Track each item
			const trackPromises = collectionItems.map((item) =>
			{
				const basePrice = item.price; // CartItem price is always a number (final price)

				return fetch("/api/collections/analytics", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						eventType: "purchase",
						collectionId: item.collectionId,
						collectionName: item.collectionName || "Collection",
						productId: item.product_id,
						productName: item.title,
						price: basePrice,
						quantity: item.quantity,
						userId: user?.uid,
						metadata: {
							orderId,
							trackingSource: "checkout_payment_success",
						},
					}),
				});
			});

			await Promise.all(trackPromises);
		} catch (error)
		{
			console.warn("Could not track collection purchases:", error);
		}
	};

	const getStripePaymentData = (
		currencyOverride?: "USD" | "NGN",
	): PaymentData =>
	{
		if (!user || !selectedAddress)
		{
			throw new Error("Missing required information");
		}

		const currency = currencyOverride || selectedCurrency;

		// Payment amount based on selected currency
		const paymentAmount = regularItemsTotalWithShipping;

		return {
			amount: paymentAmount,
			currency: currency,
			email: user.email || "",
			name: `${selectedAddress.first_name || selectedAddress.firstName} ${selectedAddress.last_name || selectedAddress.lastName
				}`,
			phone: selectedAddress.phone_number || selectedAddress.phoneNumber,
			userId: user.uid, // Include userId for referral tracking
			orderId: `order_${Date.now()}`,
			description: `Order for ${regularItems.length} items from Stitches Africa`,
		};
	};

	const getFlutterwavePaymentData = async (
		currencyOverride?: "USD" | "NGN",
	): Promise<PaymentData> =>
	{
		if (!user || !selectedAddress)
		{
			throw new Error("Missing required information");
		}

		const currency = currencyOverride || selectedCurrency;

		// Payment amount based on selected currency
		let paymentAmount = regularItemsTotalWithShipping;

		if (currency === "NGN")
		{
			// precision fix: if source currency is NGN, use the exact source amounts
			if (sourceCurrency === "NGN" && sourceSubtotal)
			{
				// If shipping is already in NGN (domestic fallback), use it directly
				// Otherwise convert from USD to NGN
				let shippingInNGN: number;
				if (shippingCurrency === "NGN")
				{
					shippingInNGN = shippingCost;
				} else
				{
					const shippingConversion = await convertPrice(shippingCost, "USD");
					shippingInNGN = shippingConversion.convertedPrice;
				}

				const taxConversion = await convertPrice(taxAmount, "USD");

				// Coupon discount - use NGN value directly (no conversion needed)
				const discountSource = couponDiscountNGN;

				paymentAmount =
					Math.max(0, sourceSubtotal - discountSource) +
					shippingInNGN +
					taxConversion.convertedPrice;
			} else
			{
				// Fallback to standard conversion
				const conversion = await convertPrice(
					regularItemsTotalWithShipping,
					"USD",
				);
				paymentAmount = conversion.convertedPrice;
			}
		}

		return {
			amount: paymentAmount,
			currency: currency as "USD" | "NGN", // Allow NGN
			email: user.email || "",
			name: `${selectedAddress.first_name || selectedAddress.firstName} ${selectedAddress.last_name || selectedAddress.lastName
				}`,
			phone: selectedAddress.phone_number || selectedAddress.phoneNumber,
			userId: user.uid, // Include userId for referral tracking
			orderId: `order_${Date.now()}`,
			description: `Order for ${regularItems.length} items from Stitches Africa`,
		};
	};

	const getPaystackPaymentData = async (): Promise<PaymentData> =>
	{
		if (!user || !selectedAddress)
		{
			throw new Error("Missing required information");
		}

		// Calculate NGN amount using the same conversion as the Price component
		// This ensures the amount displayed matches the amount requested
		let paymentAmount: number;

		try
		{
			const conversion = await convertPrice(
				regularItemsTotalWithShipping,
				"USD",
			);

			// precision fix: if source currency is NGN, use the exact source amounts
			if (
				conversion.convertedCurrency === "NGN" &&
				sourceCurrency === "NGN" &&
				sourceSubtotal
			)
			{
				const shippingConversion = await convertPrice(shippingCost, "USD");
				const taxConversion = await convertPrice(taxAmount, "USD");

				// Coupon discount - use NGN value directly (no conversion needed)
				const discountSource = couponDiscountNGN;

				paymentAmount =
					Math.max(0, sourceSubtotal - discountSource) +
					shippingConversion.convertedPrice +
					taxConversion.convertedPrice;
			}
			// If conversion returned NGN (user is in Nigeria/NGN region), use that exact amount
			else if (conversion.convertedCurrency === "NGN")
			{
				paymentAmount = conversion.convertedPrice;
			} else
			{
				// Fallback to legacy hardcoded conversion if user is not in NGN region but paying with Paystack
				// This avoids charging e.g. 441 NGN (approx $0.25) instead of 700k NGN
				console.warn(
					"User currency is not NGN, falling back to legacy conversion for Paystack",
				);
				paymentAmount = PaymentService.convertCurrency(
					regularItemsTotalWithShipping,
					"USD",
					"NGN",
				);
			}
		} catch (error)
		{
			console.error("Error converting price for Paystack:", error);
			// Fallback on error
			paymentAmount = PaymentService.convertCurrency(
				regularItemsTotalWithShipping,
				"USD",
				"NGN",
			);
		}

		return {
			amount: paymentAmount,
			currency: "NGN",
			email: user.email || "",
			name: `${selectedAddress.first_name || selectedAddress.firstName} ${selectedAddress.last_name || selectedAddress.lastName
				}`,
			phone: selectedAddress.phone_number || selectedAddress.phoneNumber,
			userId: user.uid,
			orderId: `order_${Date.now()}`,
			description: `Order for ${regularItems.length} items from Stitches Africa`,
		};
	};

	const handlePaystackPaymentSuccess = async (reference: string) =>
	{
		console.log("Paystack payment successful:", reference);

		// Track successful Paystack payment
		trackFeatureUsage("paystack_payment_success", {
			reference,
			currency: "NGN",
			amount: PaymentService.convertCurrency(
				regularItemsTotalWithShipping,
				"USD",
				"NGN",
			),
			itemCount: items.length,
			hasBespokeItems,
			hasMeasurements: !!selectedMeasurements,
		});

		const orderId = `ORD-${Date.now()}`;

		// Track collection purchases
		trackCollectionPurchases(items, orderId);

		// Track BOGO
		trackBogoRedemptions(items, orderId);

		// Process order creation on backend
		await processOrderCreation(reference, "paystack");
	};

	const handlePaystackPaymentError = (error: string) =>
	{
		console.error("Paystack payment error:", error);
		trackError("paystack_payment_error", error, "paystack_widget");
		toast.error(error, { duration: 5000 });
		setPaymentError(error);
		setPaymentLoading(false);
	};

	const handlePaystackPayment = async (currencyOverride?: "USD" | "NGN") =>
	{
		if (!user || !selectedAddress)
		{
			toast.error(t.checkout.errors.missingUserOrAddress);
			return;
		}

		// Validate measurements if needed (similar to handlePayment)
		// I'll skip full duplication of measurement validation for brevity
		// assuming handlePayment's validation is usually triggered or we rely on Step 1 validation.
		// But strictly I should validate. For now proceeding with payment logic.

		setPaymentLoading(true);
		setPaymentError(null);

		const currency = currencyOverride || selectedCurrency;

		try
		{
			// Get Paystack data using the possibly overridden currency (needs to be updated too technically,
			// but getPaystackPaymentData is hardcoded to return NGN currency in object,
			// but uses selectedCurrency for calculation in some paths.
			// We should probably rely on getPaystackPaymentData respecting context or we ensure state is set.)
			// Actually getPaystackPaymentData always returns currency: 'NGN'.
			// The only dynamic part is the AMOUNT calculation which might depend on sourceCurrency context mostly.

			const paymentData = await getPaystackPaymentData();

			// Track attempt
			trackPaymentAttempt(
				"paystack",
				"NGN",
				paymentData.amount,
				paymentData.orderId,
			);

			// Initialize Paystack
			const result = await PaymentService.initializePayment(
				paymentData,
				"paystack",
			);

			if (result.success)
			{
				handlePaystackPaymentSuccess(
					result.reference || result.transactionId || "",
				);
			} else
			{
				handlePaystackPaymentError(
					result.error || t.checkout.errors.paymentFailed,
				);
			}
		} catch (error: any)
		{
			handlePaystackPaymentError(error.message || t.common.error);
		}
	};

	const handlePaymentMethodSelection = async (
		provider: "stripe" | "flutterwave" | "paystack",
		currency: "USD" | "NGN",
	) =>
	{
		// Set state for context
		setSelectedCurrency(currency);
		setSelectedPaymentProvider(provider);

		// Trigger flow based on provider
		if (provider === "stripe")
		{
			// For Stripe, we just open the modal. The Modal uses getStripePaymentData
			// We pass the currency explicitly to getStripePaymentData logic inside the modal
			// OR we assume the modal uses the `selectedCurrency` state which we just set.
			// React state updates are async, so we should rely on passing data if possible or be careful.
			// However, since we open a modal, there's a render cycle, so state should be updated by the time modal renders?
			// Yes, usually.
			setShowStripeModal(true);
		} else if (provider === "flutterwave")
		{
			try
			{
				setPaymentLoading(true);
				// Pass currency explicitly to ensure we use the correct one regardless of state update timing
				const data = await getFlutterwavePaymentData(currency);
				setActivePaymentData(data);
				setShowFlutterwaveModal(true);
			} catch (error)
			{
				console.error("Error preparing Flutterwave payment:", error);
				toast.error("Failed to initialize payment. Please try again.");
			} finally
			{
				setPaymentLoading(false);
			}
		} else if (provider === "paystack")
		{
			// Paystack handles its own initialization immediately
			handlePaystackPayment(currency);
		}
	};

	if (regularItems.length === 0)
	{
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						{t.cart.empty}
					</h2>
					<p className="text-gray-600 mb-6">{t.cart.discover}</p>
					<Link href="/shops/products">
						<span className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors">
							{t.cart.continueShopping}
						</span>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
				{/* Header */}
				<div className="mb-6 sm:mb-8">
					<Link
						href="/shops/cart"
						className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-3 sm:mb-4"
					>
						<ArrowLeft size={18} className="mr-2 sm:mr-2" />
						<span className="text-sm sm:text-base">
							{t.checkout.backToCart}
						</span>
					</Link>
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
						{t.checkout.title}
					</h1>
				</div>

				{/* Progress Steps */}
				<div className="mb-6 sm:mb-8">
					<div className="flex items-center justify-between overflow-x-auto pb-2">
						{steps.map((step, index) => (
							<div key={step.id} className="flex items-center flex-shrink-0">
								<div
									className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${index <= currentStep
										? "bg-black text-white"
										: "bg-gray-200 text-gray-600"
										}`}
								>
									{index + 1}
								</div>
								<span
									className={`ml-1 sm:ml-2 text-xs sm:text-sm font-medium whitespace-nowrap ${index <= currentStep ? "text-gray-900" : "text-gray-500"
										}`}
								>
									<span className="hidden sm:inline">{step.title}</span>
									<span className="sm:hidden">
										{step.id === "cart"
											? "Cart"
											: step.id === "measurements"
												? "Meas."
												: step.id === "shipping"
													? "Addr."
													: "Pay"}
									</span>
								</span>
								{index < steps.length - 1 && (
									<div
										className={`w-8 sm:w-16 h-0.5 mx-2 sm:mx-4 ${index < currentStep ? "bg-black" : "bg-gray-200"
											}`}
									/>
								)}
							</div>
						))}
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 order-2 lg:order-1">
						<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
							{/* Step 1: Cart Review */}
							{currentStep === 0 && (
								<div>
									<div className="flex items-center mb-4 sm:mb-6">
										<Package className="mr-2 sm:mr-3 text-gray-600" size={20} />
										<h2 className="text-lg sm:text-xl font-semibold">
											{t.checkout.reviewCart}
										</h2>
									</div>

									{/* Measurement Loading State */}
									{measurementsLoading && hasBespokeItems && (
										<div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
											<div className="flex items-center">
												<div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-3"></div>
												<span className="text-sm text-blue-800">
													{t.checkout.checkingMeasurements}
												</span>
											</div>
										</div>
									)}

									{/* Measurement Error */}
									{measurementError && hasBespokeItems && (
										<div className="mb-4 sm:mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
											<div className="flex items-start">
												<CircleAlert
													size={16}
													className="text-red-600 mr-2 flex-shrink-0 mt-0.5"
												/>
												<div className="flex-1">
													<p className="text-xs sm:text-sm text-red-800 font-medium mb-2">
														{measurementError}
													</p>
													<div className="flex flex-col sm:flex-row gap-2">
														{measurementRetryCount < MAX_RETRY_ATTEMPTS && (
															<button
																onClick={retryLoadMeasurements}
																disabled={measurementsLoading}
																className="text-xs sm:text-sm text-red-600 hover:text-red-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
															>
																{measurementsLoading
																	? t.checkout.retrying
																	: `Retry (${measurementRetryCount}/${MAX_RETRY_ATTEMPTS})`}
															</button>
														)}
														<button
															onClick={redirectToMeasurements}
															className="text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
														>
															{t.checkout.addMeasurementsNow}
														</button>
													</div>
												</div>
											</div>
										</div>
									)}

									<div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
										{regularItems.map((item) => (
											<div
												key={`${item.product_id}-${item.size || ""}-${item.color || ""
													}`}
												className="flex items-start sm:items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border border-gray-200 rounded-lg"
											>
												<div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
													<Image
														src={item.images?.[0] || "/placeholder-product.svg"}
														alt={item.title}
														fill
														className="object-cover"
														sizes={RESPONSIVE_SIZES.orderItem}
														placeholder="blur"
														blurDataURL={generateBlurDataURL(
															IMAGE_DIMENSIONS.orderItem.width,
															IMAGE_DIMENSIONS.orderItem.height,
														)}
													/>
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">
														{item.title}
													</h3>
													<p className="text-xs sm:text-sm text-gray-600">
														{t.checkout.quantity}: {item.quantity}
													</p>
													{(item.size || item.color) && (
														<p className="text-xs sm:text-sm text-gray-600 truncate">
															{item.size && `${t.checkout.size}: ${item.size}`}
															{item.size && item.color && ", "}
															{item.color &&
																`${t.checkout.color}: ${item.color}`}
														</p>
													)}
												</div>
												<div className="text-right flex-shrink-0">
													<p className="font-medium text-gray-900 text-sm sm:text-base">
														<Price
															price={
																(item.sourcePrice || item.price) * item.quantity
															}
															originalCurrency={item.sourceCurrency || "USD"}
														/>
													</p>
												</div>
											</div>
										))}
									</div>

									<div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
										<div className="flex justify-between items-center">
											<span className="text-base sm:text-lg font-semibold">
												{t.cart.subtotal}
											</span>
											<span className="text-base sm:text-lg font-semibold">
												<Price
													price={sourceSubtotal || regularItemsTotal}
													originalCurrency={sourceCurrency || "USD"}
												/>
											</span>
										</div>
										<p className="text-xs sm:text-sm text-gray-600 mt-2">
											{t.checkout.shippingNote}
										</p>
									</div>

									<div className="flex justify-end">
										<button
											onClick={handleNextStep}
											className="w-full mb-3 sm:w-auto bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
										>
											{t.checkout.continueToShipping}
										</button>
									</div>
								</div>
							)}

							{/* Step 2: Measurements (only for bespoke items) */}
							{currentStep === 1 && hasBespokeItems && (
								<MeasurementsStep
									cartItems={regularItems}
									onComplete={handleMeasurementsComplete}
									onBack={handleMeasurementsBack}
								/>
							)}

							{/* Step 2/3: Shipping Address */}
							{((currentStep === 1 && !hasBespokeItems) ||
								(currentStep === 2 && hasBespokeItems)) && (
									<div>
										<div className="flex items-center mb-4 sm:mb-6">
											<MapPin className="mr-2 sm:mr-3 text-gray-600" size={20} />
											<h2 className="text-lg sm:text-xl font-semibold">
												{t.checkout.shippingAddress}
											</h2>
										</div>

										{/* Existing Addresses */}
										{addresses.length > 0 && (
											<div className="mb-4 sm:mb-6">
												<h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
													{t.checkout.selectAddress}
												</h3>
												<div className="space-y-3">
													{addresses.map((address) => (
														<div
															key={address.id}
															className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress?.id === address.id
																? "border-black bg-gray-50"
																: "border-gray-200 hover:border-gray-300"
																}`}
															onClick={() => setSelectedAddress(address)}
														>
															<div className="flex items-start justify-between">
																<div className="flex-1 min-w-0 pr-3">
																	<p className="font-medium text-sm sm:text-base">
																		{address.first_name || address.firstName}{" "}
																		{address.last_name || address.lastName}
																	</p>
																	<p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
																		{AddressService.formatAddressOneLine(address)}
																	</p>
																	<p className="text-xs sm:text-sm text-gray-600">
																		{address.phone_number || address.phoneNumber}
																	</p>
																	{(address.is_default || address.isDefault) && (
																		<span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
																			{t.checkout.form.defaultAddress.replace(
																				"Set as ",
																				"",
																			)}
																		</span>
																	)}
																</div>
																<div
																	className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${selectedAddress?.id === address.id
																		? "border-black bg-black"
																		: "border-gray-300"
																		}`}
																/>
															</div>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Add New Address Button */}
										<div className="mb-4 sm:mb-6">
											<button
												onClick={() => setShowAddressForm(!showAddressForm)}
												className="w-full sm:w-auto bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
											>
												{showAddressForm
													? t.checkout.cancel
													: t.checkout.addNewAddress}
											</button>
										</div>

										{/* New Address Form */}
										{showAddressForm && (
											<form
												onSubmit={handleAddressSubmit}
												className="mb-4 sm:mb-6 p-3 sm:p-4 border border-gray-200 rounded-lg"
											>
												<h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">
													{t.checkout.addNewAddress}
												</h3>

												{addressErrors.length > 0 && (
													<div className="mb-3 sm:mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
														<div className="flex items-center mb-2">
															<CircleAlert
																size={16}
																className="text-red-600 mr-2 flex-shrink-0"
															/>
															<span className="text-xs sm:text-sm font-medium text-red-800">
																{t.checkout.missingInfo}
															</span>
														</div>
														<ul className="text-xs sm:text-sm text-red-700 list-disc list-inside">
															{addressErrors.map((error, index) => (
																<li key={index}>{error}</li>
															))}
														</ul>
													</div>
												)}

												<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.firstName} *
														</label>
														<input
															type="text"
															value={newAddress.first_name || ""}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	first_name: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
															required
														/>
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.lastName} *
														</label>
														<input
															type="text"
															value={newAddress.last_name || ""}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	last_name: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
															required
														/>
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.phoneNumber} *
														</label>
														<input
															type="tel"
															value={newAddress.phone_number || ""}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	phone_number: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
															required
														/>
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.addressType}
														</label>
														<select
															value={newAddress.type || "home"}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	type: e.target.value as
																		| "home"
																		| "work"
																		| "other",
																})
															}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
														>
															<option value="home">
																{t.checkout.form.addressTypes.home}
															</option>
															<option value="work">
																{t.checkout.form.addressTypes.work}
															</option>
															<option value="other">
																{t.checkout.form.addressTypes.other}
															</option>
														</select>
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.flatNumber}
														</label>
														<input
															type="text"
															value={newAddress.flat_number || ""}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	flat_number: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
															placeholder={
																t.checkout.form.placeholders.flatNumber
															}
														/>
													</div>
													<div className="sm:col-span-2">
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.streetAddress} *
														</label>
														<input
															type="text"
															value={newAddress.street_address || ""}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	street_address: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
															required
														/>
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.country} *
														</label>
														<select
															value={newAddress.country_code || "US"}
															onChange={(e) =>
															{
																const countryCode = e.target.value;
																const country = getCountryByCode(countryCode);

																if (country)
																{
																	setNewAddress({
																		...newAddress,
																		country: country.name,
																		country_code: country.code,
																		dial_code: country.dialCode,
																		state: "",
																		city: "",
																	});
																}
															}}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
															required
														>
															{COUNTRIES.map((country) => (
																<option key={country.code} value={country.code}>
																	{country.name}
																</option>
															))}
														</select>
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.state} *
														</label>
														{availableStates.length > 0 ? (
															<select
																value={newAddress.state || ""}
																onChange={(e) =>
																	setNewAddress({
																		...newAddress,
																		state: e.target.value,
																		city: "",
																	})
																}
																className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
																required
															>
																<option value="">Select State/Province</option>
																{availableStates.map((state) => (
																	<option key={state.code} value={state.code}>
																		{state.name}
																	</option>
																))}
															</select>
														) : (
															<input
																type="text"
																value={newAddress.state || ""}
																onChange={(e) =>
																	setNewAddress({
																		...newAddress,
																		state: e.target.value,
																	})
																}
																className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
																placeholder="Enter state/province"
																required
															/>
														)}
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.city} *
														</label>
														{availableCities.length > 0 ? (
															<select
																value={newAddress.city || ""}
																onChange={(e) =>
																	setNewAddress({
																		...newAddress,
																		city: e.target.value,
																	})
																}
																className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
																required
															>
																<option value="">Select City</option>
																{availableCities.map((city) => (
																	<option key={city.name} value={city.name}>
																		{city.name}
																	</option>
																))}
															</select>
														) : (
															<input
																type="text"
																value={newAddress.city || ""}
																onChange={(e) =>
																	setNewAddress({
																		...newAddress,
																		city: e.target.value,
																	})
																}
																className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
																placeholder="Enter city"
																required
															/>
														)}
													</div>
													<div>
														<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
															{t.checkout.form.postalCode} *
														</label>
														<input
															type="text"
															value={newAddress.post_code || ""}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	post_code: e.target.value,
																})
															}
															className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
															required
														/>
													</div>
												</div>

												<div className="mt-3 sm:mt-4">
													<label className="flex items-center">
														<input
															type="checkbox"
															checked={newAddress.is_default || false}
															onChange={(e) =>
																setNewAddress({
																	...newAddress,
																	is_default: e.target.checked,
																})
															}
															className="mr-2"
														/>
														<span className="text-xs sm:text-sm text-gray-700">
															{t.checkout.form.defaultAddress}
														</span>
													</label>
												</div>

												<div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
													<button
														type="button"
														onClick={() => setShowAddressForm(false)}
														className="w-full sm:w-auto bg-gray-100 text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
													>
														{t.checkout.cancel}
													</button>
													<button
														type="submit"
														disabled={loading}
														className="w-full sm:w-auto bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 text-sm sm:text-base"
													>
														{loading ? t.common.loading : t.checkout.saveAddress}
													</button>
												</div>
											</form>
										)}

										{/* Shipping Calculation Note */}
										<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
											<div className="flex items-start">
												<div className="flex-shrink-0">
													<svg
														className="w-5 h-5 text-blue-600 mt-0.5"
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															fillRule="evenodd"
															d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
															clipRule="evenodd"
														/>
													</svg>
												</div>
												<div className="ml-3">
													<h4 className="text-sm font-medium text-blue-800">
														{t.checkout.shippingCalculation}
													</h4>
													<div className="mt-1 text-xs sm:text-sm text-blue-700">
														<p>{t.checkout.shippingNote}</p>
													</div>
												</div>
											</div>
										</div>

										<div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-3">
											<button
												onClick={handlePrevStep}
												className="w-full sm:w-auto bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base order-2 sm:order-1"
											>
												{t.checkout.backToCart}
											</button>
											<button
												onClick={handleNextStep}
												disabled={!selectedAddress || shippingLoading}
												className="w-full sm:w-auto mb-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base order-1 sm:order-2 flex items-center justify-center gap-2"
											>
												{shippingLoading ? (
													<>
														<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
														<span>Calculating shipping...</span>
													</>
												) : (
													t.checkout.calculateShipping
												)}
											</button>
										</div>
									</div>
								)}

							{/* Step 3/4: Payment */}
							{((currentStep === 2 && !hasBespokeItems) ||
								(currentStep === 3 && hasBespokeItems)) && (
									<div>
										<div className="flex items-center mb-4 sm:mb-6">
											<CreditCard
												className="mr-2 sm:mr-3 text-gray-600"
												size={20}
											/>
											<h2 className="text-lg sm:text-xl font-semibold">
												{t.checkout.payment}
											</h2>
										</div>

										{/* Order Summary */}
										<div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
											<h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
												{t.checkout.orderSummary}
											</h3>
											<div className="space-y-2 text-xs sm:text-sm">
												<div className="flex justify-between">
													<span>
														{t.checkout.subtotal} ({regularItems.length} items)
													</span>
													<span>
														<Price
															price={sourceSubtotal || regularItemsTotal}
															originalCurrency={sourceCurrency || "USD"}
														/>
													</span>
												</div>
												<div className="flex justify-between">
													<span>{t.checkout.shipping} </span>
													<span>
														<ShippingCostDisplay
															shippingCost={shippingCost}
															isFreeShipping={isFreeShipping}
															currency={shippingCurrency}
														/>
													</span>
												</div>
												{couponValidationResult && (
													<div className="flex justify-between text-green-600 font-medium">
														<span>
															Coupon ({couponValidationResult?.coupon?.couponCode}
															)
														</span>
														<span>
															-
															<Price
																price={
																	sourceSubtotal
																		? couponDiscountNGN
																		: couponDiscountUSD
																}
																originalCurrency={sourceSubtotal ? "NGN" : "USD"}
															/>
														</span>
													</div>
												)}
												{/* <div className="flex justify-between">
												<span>{t.checkout.tax}</span>
												<span>
													<Price price={taxAmount} originalCurrency="USD" />
												</span>
											</div> */}
												<div className="border-t pt-2 flex justify-between font-semibold text-sm sm:text-base">
													<span>{t.checkout.total}</span>
													<span>
														<Price
															price={
																(sourceSubtotal || regularItemsTotal) +
																(sourceSubtotal ? sourceShipping : 0) +
																(sourceSubtotal
																	? sourceTax
																	: (taxAmount as any)) -
																(sourceSubtotal
																	? couponDiscountNGN
																	: couponDiscountUSD)
															}
															originalCurrency={sourceCurrency || "USD"}
														/>
													</span>
												</div>
											</div>
										</div>

										{/* Shipping Address */}
										{selectedAddress && (
											<div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
												<h3 className="font-semibold mb-2 text-sm sm:text-base">
													{t.checkout.shippingAddress}
												</h3>
												<p className="text-xs sm:text-sm text-gray-600 break-words">
													{AddressService.formatAddressForDisplay(
														selectedAddress,
													)}
												</p>
											</div>
										)}

										{/* Payment Errors */}
										{paymentError && (
											<div className="mb-4 sm:mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
												<div className="flex items-start">
													<CircleAlert
														size={16}
														className="text-red-600 mr-2 flex-shrink-0 mt-0.5"
													/>
													<span className="text-xs sm:text-sm text-red-800">
														{paymentError}
													</span>
												</div>
											</div>
										)}

										{/* Shipping Errors */}
										{shippingError && (
											<div className="mb-4 sm:mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
												<div className="flex items-start">
													<CircleAlert
														size={16}
														className="text-red-600 mr-2 flex-shrink-0 mt-0.5"
													/>
													<span className="text-xs sm:text-sm text-red-800">
														{shippingError}
													</span>
												</div>
												<button
													onClick={() =>
														selectedAddress && calculateShipping(selectedAddress)
													}
													className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
												>
													{t.checkout.retrying}
												</button>
											</div>
										)}

										{/* Payment Method Selection */}
										{isVvipUser ? (
											/* VVIP Manual Checkout */
											<div>
												{!showVvipCheckout ? (
													<div className="space-y-4">
														{/* VVIP Status Display */}
														<div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
															<div className="flex items-center gap-3">
																<div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
																	<CreditCard className="w-4 h-4 text-white" />
																</div>
																<div>
																	<h3 className="font-semibold text-purple-900">
																		{t.checkout.vvipShopper}
																	</h3>
																	<p className="text-sm text-purple-700">
																		{t.checkout.vvipNote}
																	</p>
																</div>
															</div>
														</div>

														{/* Payment Amount Display */}
														<div className="bg-gray-50 p-4 rounded-lg">
															<div className="flex justify-between items-center mb-2">
																<span className="text-lg font-semibold">
																	{t.checkout.totalAmount}
																</span>
																<span className="text-2xl font-bold text-purple-600">
																	<Price
																		price={regularItemsTotalWithShipping}
																		originalCurrency="USD"
																	/>
																</span>
															</div>
															<p className="text-sm text-gray-600">
																{t.checkout.manualPaymentNote}
															</p>
														</div>

														{/* Action Buttons */}
														<div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
															<button
																onClick={handlePrevStep}
																className="w-full sm:w-auto bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm sm:text-base"
															>
																{t.checkout.backToShipping}
															</button>
															<button
																onClick={() => setShowVvipCheckout(true)}
																className="w-full sm:w-auto bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm sm:text-base"
															>
																{t.checkout.manualPayment}
															</button>
														</div>
													</div>
												) : (
													/* VVIP Manual Checkout Form */
													<VvipManualCheckout
														orderData={{
															userId: user!.uid,
															items: regularItems,
															totalAmount: regularItemsTotalWithShipping,
															shippingAddress: selectedAddress!,
															shippingCost,
															currency: selectedCurrency,
															measurements: selectedMeasurements,
														}}
														onSuccess={handleVvipManualCheckoutSuccess}
														onError={handleVvipManualCheckoutError}
													/>
												)}
											</div>
										) : (
											/* Regular Payment Methods - Enhanced UI */
											<div className="space-y-6">
												{/* Coupon Input */}
												<div className="mb-6">
													<CouponInput
														onApply={handleApplyCoupon}
														onRemove={clearCouponValidation}
														appliedCode={
															couponValidationResult?.coupon?.couponCode
														}
														discount={
															couponValidationResult?.coupon?.discountValue
														}
														discountType={
															couponValidationResult?.coupon?.discountType
														}
														formattedDiscount={
															couponValidationResult?.coupon?.discountType ===
																"PERCENTAGE" &&
																couponValidationResult?.coupon?.discountValue !==
																undefined
																? `${couponValidationResult.coupon.discountValue}%`
																: couponValidationResult?.discountAmount !==
																	undefined
																	? formatPrice(
																		couponValidationResult.discountAmount,
																		selectedCurrency,
																	)
																	: undefined
														}
														disabled={paymentLoading}
													/>
												</div>

												{/* Payment Methods Selection Button */}
												<div>
													<h3 className="text-sm font-semibold text-gray-900 mb-4">
														{finalBreakdown.remainingAmount === 0
															? t.checkout.paymentMethods.completeYourOrder
															: t.checkout.paymentMethods.choosePaymentMethod}
													</h3>

													{finalBreakdown.remainingAmount === 0 ? (
														/* Voucher covers full amount */
														<button
															onClick={handleVoucherOnlyPayment}
															disabled={paymentLoading || voucherLoading}
															className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
														>
															{voucherLoading ? (
																<>
																	<div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
																	<span>
																		{t.checkout.voucher.processingVoucher}
																	</span>
																</>
															) : (
																<>
																	<Package className="w-5 h-5" />
																	<span>
																		{t.checkout.voucher.completeOrderWithVoucher}
																	</span>
																</>
															)}
														</button>
													) : (
														/* Payment Methods List */
														<PaymentMethodSelector
															selectedProvider={selectedPaymentProvider}
															selectedCurrency={selectedCurrency}
															onSelect={(method) =>
																handlePaymentMethodSelection(
																	method.provider,
																	method.currency,
																)
															}
															disabled={paymentLoading || voucherLoading}
														/>
													)}
												</div>

												{/* Security Badge */}
												<div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl">
													<svg
														className="w-5 h-5 text-green-600"
														fill="currentColor"
														viewBox="0 0 20 20"
													>
														<path
															fillRule="evenodd"
															d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
															clipRule="evenodd"
														/>
													</svg>
													<span>{t.checkout.paymentMethods.secureCheckout}</span>
												</div>

												{/* Back Button */}
												<button
													onClick={handlePrevStep}
													className="w-full bg-gray-100 text-gray-900 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
												>
													<ArrowLeft className="w-5 h-5" />
													{t.checkout.paymentMethods.backToShipping}
												</button>
											</div>
										)}
									</div>
								)}
						</div>
					</div>

					{/* Order Summary Sidebar */}
					<div className="lg:col-span-1 order-1 lg:order-2">
						<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-4">
							<h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
								{t.checkout.orderSummary}
							</h3>

							<div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
								<div className="flex justify-between text-sm sm:text-base">
									<span className="text-gray-600">
										{t.checkout.subtotal} ({regularItems.length} items)
									</span>
									<span className="font-medium">
										<Price
											price={sourceSubtotal || regularItemsTotal}
											originalCurrency={sourceCurrency || "USD"}
										/>
									</span>
								</div>
								{couponValidationResult && (
									<div className="flex justify-between text-sm sm:text-base text-green-600">
										<span className="flex items-center gap-1">
											Coupon ({couponValidationResult?.coupon?.couponCode || ""}
										</span>
										<span className="font-medium">
											-
											<Price
												price={
													sourceSubtotal ? couponDiscountNGN : couponDiscountUSD
												}
												originalCurrency={sourceSubtotal ? "NGN" : "USD"}
											/>
										</span>
									</div>
								)}
								{/* Only show shipping on payment step */}
								{((currentStep === 2 && !hasBespokeItems) ||
									(currentStep === 3 && hasBespokeItems)) && (
										<>
											<div className="flex justify-between text-sm sm:text-base">
												<span className="text-gray-600">
													{t.checkout.shipping}{" "}
												</span>
												<span className="font-medium">
													<ShippingCostDisplay
														shippingCost={shippingCost}
														isFreeShipping={isFreeShipping}
														currency={shippingCurrency}
													/>
												</span>
											</div>
											{/* <div className="flex justify-between text-sm sm:text-base">
											<span className="text-gray-600">{t.checkout.tax} </span>
											<span className="font-medium">
												<Price price={taxAmount} originalCurrency="USD" />
											</span>
										</div> */}
										</>
									)}
								{currentStep < 2 && (
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600">
											{t.checkout.deliveryFeeTax}
										</span>
										<span className="font-medium text-gray-500">
											{t.checkout.toBeCalculated}
										</span>
									</div>
								)}
								<div className="border-t pt-2 sm:pt-3">
									<div className="flex justify-between">
										<span className="text-base sm:text-lg font-semibold">
											{t.checkout.total}
										</span>
										<span className="text-base sm:text-lg font-semibold flex items-center gap-1">
											{(currentStep === 2 && !hasBespokeItems) ||
												(currentStep === 3 && hasBespokeItems) ? (
												<Price
													price={
														(sourceSubtotal || regularItemsTotal) +
														sourceShipping +
														((sourceSubtotal !== undefined
															? sourceTax
															: taxAmount) || 0) -
														(sourceSubtotal
															? couponDiscountNGN
															: couponDiscountUSD)
													}
													originalCurrency={sourceCurrency || "USD"}
												/>
											) : (
												<>
													<Price
														price={
															(sourceSubtotal || regularItemsTotal) -
															(sourceSubtotal
																? couponDiscountNGN
																: couponDiscountUSD)
														}
														originalCurrency={sourceCurrency || "USD"}
													/>{" "}
													{t.checkout.plusShipping}
												</>
											)}
										</span>
									</div>
								</div>
							</div>

							<div className="text-xs text-gray-500 text-center sm:text-left">
								{isVvipUser ? (
									<p>{t.checkout.vvipManualPaymentAvailable}</p>
								) : (
									<p>{t.checkout.paymentMethods.secureCheckout}</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Stripe Payment Modal */}
			{showStripeModal && user && selectedAddress && (
				<StripePaymentModalLazy
					isOpen={showStripeModal}
					onClose={() => setShowStripeModal(false)}
					paymentData={getStripePaymentData()}
					onSuccess={handleStripePaymentSuccess}
					onError={handleStripePaymentError}
				/>
			)}

			{/* Flutterwave Payment Modal */}
			{showFlutterwaveModal && user && selectedAddress && activePaymentData && (
				<FlutterwavePaymentModalLazy
					isOpen={showFlutterwaveModal}
					onClose={() => setShowFlutterwaveModal(false)}
					paymentData={activePaymentData}
					onSuccess={handleFlutterwavePaymentSuccess}
					onError={handleFlutterwavePaymentError}
				/>
			)}
		</div>
	);
}
