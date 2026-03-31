"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StorefrontConfig } from "@/types/storefront";
import { useStorefrontCart } from "@/contexts/StorefrontCartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Price } from "@/components/common/Price";
import
	{
		ArrowLeft,
		ShoppingCart,
		CreditCard,
		MapPin,
		User,
		Package,
		CircleAlert,
	} from "lucide-react";
import Image from "next/image";
import
	{
		GuestCheckoutModal,
		GuestCheckoutData,
	} from "@/components/shops/checkout/GuestCheckoutModal";
import
	{
		processGuestCheckout,
		cleanupGuestPassword,
		migrateGuestCart,
	} from "@/lib/services/guestCheckoutService";
import { toast } from "sonner";
import
	{
		StripePaymentModalLazy,
		FlutterwavePaymentModalLazy,
	} from "@/components/shops/lazy/LazyPaymentComponents";
import { PaymentService, PaymentData } from "@/lib/payment-service";
import { AddressService, Address } from "@/lib/address-service";
import
	{
		DHLShippingService,
		ShippingRate,
		CartItemForShipping,
	} from "@/lib/shipping/dhl-service";
import { TerminalAfricaService } from "@/lib/shipping/terminal-africa-service";
import { MeasurementsStep } from "@/components/shops/checkout/MeasurementsStep";
import { UserMeasurements } from "@/types/measurements";
import { measurementsRepository } from "@/lib/measurements-repository";
import { ManualPaymentForm } from "@/components/checkout/ManualPaymentForm";
import { BankDetails } from "@/types/vvip";
import { PaymentMethodSelector } from "@/components/checkout/PaymentMethodSelector";
import { cartRepository } from "@/lib/firestore";
import { loadFirebaseModule } from "@/lib/utils/module-helpers";

interface CheckoutStep
{
	id: string;
	title: string;
	completed: boolean;
}

interface StorefrontCheckoutProps
{
	storefront: StorefrontConfig;
}

export default function StorefrontCheckout({
	storefront,
}: StorefrontCheckoutProps)
{
	const router = useRouter();
	const { items, totalAmount, itemCount, clearCart, loading } =
		useStorefrontCart();
	const { user, loading: authLoading } = useAuth();
	const {
		formatPrice: formatCurrencyPrice,
		userCurrency,
		convertPrice,
	} = useCurrency();

	// Calculate totals
	const regularItemsTotal = totalAmount;
	const regularItemsCount = itemCount;

	// State management
	const [currentStep, setCurrentStep] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [shippingLoading, setShippingLoading] = useState(false);
	const [paymentLoading, setPaymentLoading] = useState(false);

	// Guest checkout
	const [showGuestModal, setShowGuestModal] = useState(false);
	const [isGuestUser, setIsGuestUser] = useState(false);
	const [guestUserData, setGuestUserData] = useState<any>(null);

	// Address management
	const [addresses, setAddresses] = useState<Address[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
	const [showAddressForm, setShowAddressForm] = useState(false);
	const [addressErrors, setAddressErrors] = useState<string[]>([]);

	// Shipping
	const [shippingRate, setShippingRate] = useState<ShippingRate | null>(null);
	const [shippingError, setShippingError] = useState<string | null>(null);
	const [courierData, setCourierData] = useState<any>(null);
	const [deliveryDate, setDeliveryDate] = useState<string | null>(null);

	// Payment
	const [paymentError, setPaymentError] = useState<string | null>(null);
	const [showStripeModal, setShowStripeModal] = useState(false);
	const [showFlutterwaveModal, setShowFlutterwaveModal] = useState(false);
	const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<
		"stripe" | "flutterwave" | "paystack"
	>("stripe");
	const [selectedCurrency, setSelectedCurrency] = useState<"USD" | "NGN">(
		userCurrency === "NGN" ? "NGN" : "USD",
	);

	// Measurements for bespoke items
	const [selectedMeasurements, setSelectedMeasurements] =
		useState<UserMeasurements | null>(null);
	const [measurementsLoading, setMeasurementsLoading] = useState(false);
	const [measurementError, setMeasurementError] = useState<string | null>(null);
	const [measurementsChecked, setMeasurementsChecked] = useState(false);

	// VVIP payment state
	const [isVvipShopper, setIsVvipShopper] = useState<boolean>(false);
	const [vvipLoading, setVvipLoading] = useState(false);
	const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

	// Multi-currency support for payment
	const [nairaTotal, setNairaTotal] = useState<number | null>(null);

	// Use dynamic shipping cost from shippingRate if available, else fallback to $30 per item
	const shippingCost = shippingRate?.amount || itemCount * 30;
	// Tax removed as per requirement
	const regularItemsTotalWithShipping = totalAmount + shippingCost;

	// Check if cart has bespoke items
	const hasBespokeItems = items.some((item) => item.type === "bespoke");

	const steps: CheckoutStep[] = [
		{ id: "cart", title: "Cart Review", completed: false },
		...(hasBespokeItems
			? [{ id: "measurements", title: "Measurements", completed: false }]
			: []),
		{ id: "shipping", title: "Shipping Address", completed: false },
		{ id: "payment", title: "Payment", completed: false },
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

	// Cart Sync logic
	const syncCartToFirestore = async (userId: string) =>
	{
		if (items.length === 0) return;
		try
		{
			// Clear existing items in Firestore cart first to avoid duplicates
			await cartRepository.clearUserCart(userId);

			// Migrate local items
			await migrateGuestCart(userId, items as any);
			console.log("🛒 Cart synced to Firestore for user:", userId);
		} catch (error)
		{
			console.error("❌ Failed to sync cart to Firestore:", error);
		}
	};

	// Initialize checkout
	useEffect(() =>
	{
		const initializeCheckout = async () =>
		{
			// Redirect to cart if no items
			if (items.length === 0 && !loading)
			{
				const timer = setTimeout(() =>
				{
					if (items.length === 0)
					{
						router.push(`/store/${storefront.handle}`);
					}
				}, 1000);
				return () => clearTimeout(timer);
			}

			// Handle authentication
			if (!authLoading && !user && !isGuestUser && items.length > 0)
			{
				setShowGuestModal(true);
				return;
			}

			// Check VVIP status for logged-in users
			if (user && !isGuestUser)
			{
				await checkVvipStatus();
			}

			// Check for bespoke items and measurements
			if (hasBespokeItems && (user || isGuestUser) && !measurementsChecked)
			{
				await checkMeasurements();
			}

			// Load user addresses if logged in
			if (user && !isGuestUser)
			{
				loadUserAddresses();
			}
		};

		initializeCheckout();
	}, [
		items.length,
		router,
		user,
		authLoading,
		isGuestUser,
		hasBespokeItems,
		measurementsChecked,
		loading,
	]);

	/**
	 * Load user addresses
	 */
	const loadUserAddresses = async () =>
	{
		if (!user) return;

		try
		{
			const userAddresses = await AddressService.getUserAddresses(user.uid);
			setAddresses(userAddresses);

			// Auto-select default address
			const defaultAddress = userAddresses.find((addr) => addr.is_default);
			if (defaultAddress)
			{
				setSelectedAddress(defaultAddress);
			}
		} catch (error)
		{
			console.error("Error loading addresses:", error);
		}
	};

	/**
	 * Check VVIP status for the current user
	 */
	const checkVvipStatus = async () =>
	{
		if (!user) return;

		setVvipLoading(true);
		try
		{
			// Check VVIP status via API
			const response = await fetch(
				`/api/checkout/vvip/check-status?userId=${user.uid}`,
			);
			const data = await response.json();

			if (data.success)
			{
				setIsVvipShopper(data.isVvip);

				// Load bank details if user is VVIP
				if (data.isVvip)
				{
					const bankResponse = await fetch("/api/checkout/vvip/bank-details");
					const bankData = await bankResponse.json();

					if (bankData.success)
					{
						setBankDetails(bankData.bankDetails);
					}
				}
			}
		} catch (error)
		{
			console.error("Error checking VVIP status:", error);
			// Don't show error to user, just assume not VVIP
			setIsVvipShopper(false);
		} finally
		{
			setVvipLoading(false);
		}
	};

	/**
	 * Check measurements for bespoke items
	 */
	const checkMeasurements = async (): Promise<boolean> =>
	{
		if (!user && !isGuestUser)
		{
			setMeasurementError("You must be logged in to check measurements");
			return false;
		}

		setMeasurementsLoading(true);
		setMeasurementError(null);

		try
		{
			const userMeasurements = await loadUserMeasurements();

			if (!userMeasurements)
			{
				// For guest users, we'll handle measurements differently
				if (isGuestUser)
				{
					setMeasurementError(
						"Measurements will be collected after order confirmation for bespoke items.",
					);
					setMeasurementsChecked(true);
					return true;
				}

				// For logged-in users, redirect to measurements
				redirectToMeasurements();
				return false;
			}

			setSelectedMeasurements(userMeasurements);
			setMeasurementsChecked(true);
			return true;
		} catch (error)
		{
			console.error("Error checking measurements:", error);
			setMeasurementError("Failed to load measurements");
			return false;
		} finally
		{
			setMeasurementsLoading(false);
		}
	};

	/**
	 * Load user measurements
	 */
	const loadUserMeasurements = async (): Promise<UserMeasurements | null> =>
	{
		if (!user) return null;

		try
		{
			return await measurementsRepository.getUserMeasurements(user.uid);
		} catch (error)
		{
			console.error("Error loading measurements:", error);
			return null;
		}
	};

	/**
	 * Redirect to measurements page
	 */
	const redirectToMeasurements = () =>
	{
		const returnUrl = `/store/${storefront.handle}/checkout`;
		router.push(
			`/shops/measurements?redirect=${encodeURIComponent(returnUrl)}`,
		);
	};

	/**
	 * Calculate shipping for selected address
	 */
	const calculateShipping = async (address: Address) =>
	{
		if (!address) return;

		setShippingLoading(true);
		setShippingError(null);
		setCourierData(null);
		setDeliveryDate(null);

		try
		{
			// Convert Address to ShippingAddress format
			const shippingAddress = {
				streetAddress: address.street_address || address.streetAddress || "",
				postcode: address.post_code || address.postcode || "",
				city: address.city || "",
				state: address.state || "",
				countryCode:
					address.country_code ||
					address.countryCode ||
					DHLShippingService.getCountryCode(address.country || "United States"),
				firstName: address.first_name || address.firstName,
				lastName: address.last_name || address.lastName,
				phoneNumber: address.phone_number || address.phoneNumber,
			};

			// Prepare items for shipping calculation
			const cartItemsForShipping: CartItemForShipping[] = items.map((item) => ({
				productId: item.product_id,
				quantity: item.quantity,
				price: item.price,
				weight: (item.product as any)?.shipping?.actualWeightKg || 0.5, // Default weight if missing
				dimensions: {
					width: (item.product as any)?.shipping?.widthCm || 10,
					length: (item.product as any)?.shipping?.lengthCm || 10,
					height: (item.product as any)?.shipping?.heightCm || 5,
				},
			}));

			// LOGIC SPLIT: DOMESTIC (NG) vs INTERNATIONAL (DHL)
			let useTerminalAfrica = shippingAddress.countryCode === "NG";

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
							isLive: true,
						});

					// 2. Create Pickup Address (Terminal Africa)
					const pickupAddr =
						await TerminalAfricaService.createPickupAddress(true);

					// 3. Create Packaging (Terminal Africa) & Parcel
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
						packagingId: packagingRef.packaging_id,
						items: items.map((item) => ({
							name: item.title,
							description: item.description || "Apparel",
							currency: "NGN", // Terminal Africa expects NGN value
							value: item.price * 1350, // Approximate conversion
							quantity: item.quantity,
							weight: (item.product as any)?.shipping?.actualWeightKg || 0.5,
						})),
						isLive: true,
					});

					// 4. Get Rates (Terminal Africa)
					const ratesResponse = await TerminalAfricaService.getRates({
						pickUpAddressId: pickupAddr.address_id,
						deliveryAddressId: deliveryAddr.address_id,
						parcelId: parcel.parcel_id,
						cashOnDelivery: false,
						isLive: true,
					});

					// 5. Select Best Rate (cheapest)
					const rates = ratesResponse.data || [];
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
						console.log("✅ Terminal Africa shipping calculated:", amountUSD);
						return; // SUCCESS - Exit function
					} else
					{
						throw new Error("No domestic shipping rates available");
					}
				} catch (terminalError)
				{
					console.warn(
						"Terminal Africa failed, falling back to DHL:",
						terminalError,
					);
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

				if (rate)
				{
					setShippingRate(rate);

					// SAVE COURIER DATA for Payment Step
					if (rate.dhlData)
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
					console.log("✅ DHL shipping calculated:", rate.amount);
				} else
				{
					throw new Error("Failed to get shipping rate from DHL");
				}
			}
		} catch (error: any)
		{
			console.error("Shipping calculation error:", error);
			setShippingError(
				error?.message || "Failed to calculate shipping. Please try again.",
			);
		} finally
		{
			setShippingLoading(false);
		}
	};

	// Helper for fallback date
	const getFutureDate = (days: number) =>
	{
		const date = new Date();
		date.setDate(date.getDate() + days);
		return date.toISOString();
	};

	/**
	 * Handle next step navigation
	 */
	const handleNextStep = async () =>
	{
		console.log("handleNextStep called, currentStep:", currentStep);
		console.log("selectedAddress:", selectedAddress);
		console.log("hasBespokeItems:", hasBespokeItems);

		if (currentStep === 0)
		{
			// From cart to measurements (if bespoke items) or shipping
			if (hasBespokeItems)
			{
				if (!measurementsChecked)
				{
					const hasValidMeasurements = await checkMeasurements();
					if (!hasValidMeasurements) return;
				}
				setCurrentStep(1);
			} else
			{
				setCurrentStep(hasBespokeItems ? 2 : 1);
			}
		} else if (currentStep === 1 && hasBespokeItems)
		{
			// From measurements to shipping
			setCurrentStep(2);
		} else if (
			(currentStep === 1 && !hasBespokeItems) ||
			(currentStep === 2 && hasBespokeItems)
		)
		{
			// From shipping to payment - calculate shipping first
			if (!selectedAddress)
			{
				setShippingError("Please select a shipping address");
				console.error("No address selected for shipping calculation");
				return;
			}

			console.log("Calculating shipping for address:", selectedAddress);
			await calculateShipping(selectedAddress);
			setCurrentStep(hasBespokeItems ? 3 : 2);
		}
	};

	/**
	 * Handle previous step navigation
	 */
	const handlePreviousStep = () =>
	{
		if (currentStep > 0)
		{
			setCurrentStep(currentStep - 1);
		}
	};

	/**
	 * Handle measurements back navigation
	 */
	const handleMeasurementsBack = () =>
	{
		setCurrentStep(0);
	};

	/**
	 * Handle sign in redirect
	 */
	const handleSignIn = () =>
	{
		const currentUrl = `/store/${storefront.handle}/checkout`;
		router.push(`/shops/auth?redirect=${encodeURIComponent(currentUrl)}`);
	};

	/**
	 * Handle guest checkout setup
	 */
	const handleGuestCheckout = async (guestData: GuestCheckoutData) =>
	{
		try
		{
			// Convert storefront cart items to the format expected by processGuestCheckout
			const cartItems = items.map((item) => ({
				product_id: item.product_id,
				title: item.title,
				description: item.description || "",
				price: item.price,
				discount: item.discount || 0,
				quantity: item.quantity,
				images: item.images || [],
				tailor_id: item.tailor_id || "",
				tailor: item.tailor || "",
				user_id: "",
				createdAt: item.createdAt || new Date(),
				updatedAt: item.updatedAt || new Date(),
				isCollectionItem: false,
				isRemovable: true,
				type: item.type || "ready-to-wear",
				color: item.color || null,
				size: item.size || null,
				sizes: item.sizes || null,
			}));

			// Create guest user account
			const result = await processGuestCheckout(guestData, cartItems as any);

			// Set guest user state
			setIsGuestUser(true);
			setGuestUserData({
				...result,
				email: guestData.email,
			});
			setShowGuestModal(false);

			// Create address from guest data
			const guestAddress: Address = {
				id: "guest-address",
				first_name: guestData.firstName,
				last_name: guestData.lastName,
				street_address: guestData.address.street_address,
				city: guestData.address.city,
				state: guestData.address.state,
				post_code: guestData.address.post_code || "",
				country: guestData.address.country,
				country_code: guestData.address.country_code || "US",
				dial_code: guestData.address.dial_code || "+1",
				phone_number: guestData.phoneNumber,
				flat_number: guestData.address.flat_number || "",
				type: "home",
				is_default: true,
				userId: result.uid,
			};

			setSelectedAddress(guestAddress);
			setAddresses([guestAddress]);

			toast.success("Guest account created! Proceeding with checkout...");

			// Clean up guest password from database after a delay
			setTimeout(() =>
			{
				cleanupGuestPassword(result.uid).catch(console.error);
			}, 5000);
		} catch (error: any)
		{
			console.error("Error during guest checkout:", error);
			toast.error(error.message || "Failed to process guest checkout");
			throw error;
		}
	};

	/**
	 * Handle address input changes
	 */
	const handleAddressInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) =>
	{
		const { name, value } = e.target;
		setNewAddress((prev) => ({ ...prev, [name]: value }));
	};

	/**
	 * Add new address
	 */
	const handleAddAddress = async () =>
	{
		if (!user && !isGuestUser) return;

		const errors = validateAddress(newAddress);
		if (errors.length > 0)
		{
			setAddressErrors(errors);
			return;
		}

		try
		{
			const addressToAdd: Address = {
				...newAddress,
				id: `addr_${Date.now()}`,
				userId: user?.uid || guestUserData?.uid || "",
			} as Address;

			if (user && !isGuestUser)
			{
				// Save to database for logged-in users
				// For now, just add to local state - you can implement AddressService.addAddress later
				setAddresses((prev) => [...prev, addressToAdd]);
				setSelectedAddress(addressToAdd);
			} else
			{
				// For guest users, just add to local state
				setAddresses((prev) => [...prev, addressToAdd]);
				setSelectedAddress(addressToAdd);
			}

			setShowAddressForm(false);
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
				userId: user?.uid || guestUserData?.uid || "",
			});
			setAddressErrors([]);
		} catch (error)
		{
			console.error("Error adding address:", error);
			toast.error("Failed to add address");
		}
	};

	/**
	 * Validate address
	 */
	const validateAddress = (address: Partial<Address>): string[] =>
	{
		const errors: string[] = [];

		if (!address.first_name) errors.push("First name is required");
		if (!address.last_name) errors.push("Last name is required");
		if (!address.street_address) errors.push("Street address is required");
		if (!address.city) errors.push("City is required");
		if (!address.state) errors.push("State is required");
		if (!address.post_code) errors.push("ZIP code is required");
		if (!address.phone_number) errors.push("Phone number is required");

		return errors;
	};

	/**
	 * Handle payment initiation
	 */
	const handlePayment = async () =>
	{
		if (!selectedAddress)
		{
			setPaymentError("Please select a shipping address");
			return;
		}

		// Validate measurements for bespoke items
		if (hasBespokeItems && !isGuestUser)
		{
			if (!selectedMeasurements)
			{
				setPaymentError("Measurements are required for bespoke items");
				redirectToMeasurements();
				return;
			}
		}

		setPaymentError(null);

		// Route to appropriate payment method based on VVIP status
		if (isVvipShopper)
		{
			// VVIP users don't need to open payment modals - they use the manual payment form
			return;
		}

		// Standard payment flow for non-VVIP users
		if (selectedPaymentProvider === "stripe")
		{
			// Stripe always USD for now
			setSelectedCurrency("USD");
			setShowStripeModal(true);
		} else if (selectedPaymentProvider === "flutterwave")
		{
			setPaymentLoading(true);
			try
			{
				if (selectedCurrency === "NGN")
				{
					console.log("🇳🇬 Converting amount to NGN for Flutterwave...");
					const conversion = await convertPrice(
						regularItemsTotalWithShipping,
						"USD",
						"NGN",
					);
					setNairaTotal(conversion.convertedPrice);
					setShowFlutterwaveModal(true);
				} else
				{
					setNairaTotal(null);
					setShowFlutterwaveModal(true);
				}
			} catch (error)
			{
				console.error("Currency conversion error for Flutterwave:", error);
				setPaymentError("Failed to convert currency. Using USD.");
				setSelectedCurrency("USD");
				setShowFlutterwaveModal(true);
			} finally
			{
				setPaymentLoading(false);
			}
		} else if (selectedPaymentProvider === "paystack")
		{
			await handlePaystackPayment();
		}
	};

	/**
	 * Handle VVIP manual payment submission
	 */
	const handleVvipPayment = async (paymentData: {
		amount_paid: number;
		payment_reference?: string;
		payment_date: Date;
		payment_proof_url: string;
	}) =>
	{
		if (!user || !selectedAddress)
		{
			toast.error("Missing required information");
			return;
		}

		setPaymentLoading(true);

		try
		{
			// Create VVIP order via API
			const response = await fetch("/api/checkout/vvip/create-order", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userId: user.uid,
					items: items.map((item) => ({
						product_id: item.product_id,
						title: item.title,
						description: item.description || "",
						price: item.price,
						quantity: item.quantity,
						images: item.images || [],
						tailor_id: item.tailor_id || "",
						type: item.type || "ready-to-wear",
						color: item.color || null,
						size: item.size || null,
					})),
					total: regularItemsTotalWithShipping,
					currency: "NGN",
					amount_paid: paymentData.amount_paid,
					payment_reference: paymentData.payment_reference,
					payment_date: paymentData.payment_date.toISOString(),
					payment_proof_url: paymentData.payment_proof_url,
					shipping_address: {
						first_name: selectedAddress.first_name,
						last_name: selectedAddress.last_name,
						street_address: selectedAddress.street_address,
						city: selectedAddress.city,
						state: selectedAddress.state,
						post_code: selectedAddress.post_code,
						country: selectedAddress.country,
						phone_number: selectedAddress.phone_number,
					},
				}),
			});

			const result = await response.json();

			if (!response.ok)
			{
				throw new Error(result.message || "Failed to create VVIP order");
			}

			const orderId = result.orderId;

			// Clear the cart
			clearCart();

			// Show success message
			toast.success(
				"Payment submitted successfully! Your order is being reviewed.",
			);

			// Redirect to success page
			router.push(
				`/store/${storefront.handle}/checkout/success?orderId=${orderId}&vvip=true`,
			);
		} catch (error)
		{
			console.error("Error processing VVIP payment:", error);
			toast.error("Failed to submit payment. Please try again.");
		} finally
		{
			setPaymentLoading(false);
		}
	};

	/**
	 * Get payment data
	 */
	const getPaymentData = (): PaymentData =>
	{
		const amount =
			selectedCurrency === "NGN" && nairaTotal !== null
				? nairaTotal
				: regularItemsTotalWithShipping;

		return {
			orderId: `storefront_${storefront.handle}_${Date.now()}`,
			amount: amount,
			currency: selectedCurrency as "NGN" | "USD" | "EUR",
			email:
				user?.email ||
				guestUserData?.email ||
				`guest_${Date.now()}@example.com`,
			name: selectedAddress
				? `${selectedAddress.first_name} ${selectedAddress.last_name}`
				: "",
			phone: selectedAddress?.phone_number,
			userId: user?.uid || guestUserData?.uid,
			description: `Order from ${storefront.handle} storefront`,
		};
	};

	/**
	 * Get Stripe payment data
	 */
	const getStripePaymentData = (): PaymentData =>
	{
		return {
			...getPaymentData(),
			amount: regularItemsTotalWithShipping,
			currency: "USD",
		};
	};

	/**
	 * Handle Stripe payment success
	 */
	const handleStripePaymentSuccess = async (paymentIntentId: string) =>
	{
		console.log("Stripe payment successful:", paymentIntentId);
		await handlePaymentSuccess(paymentIntentId);
	};

	/**
	 * Handle Flutterwave payment success
	 */
	const handleFlutterwavePaymentSuccess = async (transactionId: string) =>
	{
		console.log("Flutterwave payment successful:", transactionId);
		await processOrderCreation(transactionId, "flutterwave");
	};

	/**
	 * Handle Paystack payment success
	 */
	const handlePaystackPaymentSuccess = async (reference: string) =>
	{
		console.log("Paystack payment successful:", reference);
		await processOrderCreation(reference, "paystack");
	};

	/**
	 * Helper to call the Firebase Callable (Regular Checkout)
	 */
	const processOrderCreation = async (
		paymentRef?: string,
		provider?: string,
	) =>
	{
		try
		{
			setIsProcessing(true);
			setPaymentLoading(true);
			console.log(
				"🚀 Starting processOrderCreation for Storefront Checkout...",
			);

			// Load Firebase functions module
			const functionsModule = await loadFirebaseModule(
				"firebase/functions",
				"process_post_payment",
			);

			// Initialize functions
			const firebaseModule = await import("@/lib/firebase");
			const app = await firebaseModule.getFirebaseApp();
			const { getFunctions, httpsCallable } = functionsModule;
			const functions = getFunctions(app, "europe-west1");
			const idToken = await user?.getIdToken();

			// Sync cart to Firestore before calling the function
			const currentUserId = user?.uid || guestUserData?.uid;
			if (currentUserId)
			{
				await syncCartToFirestore(currentUserId);
			}

			const processPostPayment = httpsCallable(functions, "processPostPayment");

			const payload = {
				userId: currentUserId,
				shippingAddress: {
					street_address: selectedAddress?.street_address,
					city: selectedAddress?.city,
					state: selectedAddress?.state,
					country_code: selectedAddress?.country_code,
					first_name: selectedAddress?.first_name,
					last_name: selectedAddress?.last_name,
					phone_number: selectedAddress?.phone_number,
					email: user?.email || guestUserData?.email,
				},
				shippingFee: shippingCost,
				deliveryDate: deliveryDate,
				courierData: courierData,
				userEmail: user?.email || guestUserData?.email,
				isBogoCheckout: false,
				isUnifiedCheckout: true,
				tax: 0,
				tax_currency: selectedCurrency,
				paymentProvider: provider,
				accessToken: idToken,
				logoUrl: "https://staging-stitches-africa.vercel.app/Stitches-Africa-Logo-06.png",
				isTestMode: false,
				currency: selectedCurrency,
				storefrontId: storefront.id,
				storefrontHandle: storefront.handle,
				source: "storefront",
			};

			console.log("📦 Calling processPostPayment (Storefront) with:", payload);

			const result: any = await processPostPayment(payload);
			console.log("✅ processPostPayment Result:", result.data);

			if (result.data.success)
			{
				clearCart();
				toast.success("Order placed successfully!");
				router.push(
					`/store/${storefront.handle}/checkout/success?orderId=${result.data.orderId}&paymentId=${paymentRef}`,
				);
			} else
			{
				throw new Error(
					result.data.message || "Order creation reported failure",
				);
			}
		} catch (error: any)
		{
			console.error("❌ processPostPayment Failed:", error);
			setPaymentError(
				error.message || "Failed to create order. Please contact support.",
			);
			toast.error("Failed to finalise order.");
		} finally
		{
			setPaymentLoading(false);
			setIsProcessing(false);
		}
	};

	/**
	 * Handle payment success (Stripe)
	 */
	const handlePaymentSuccess = async (paymentIntentId: string) =>
	{
		await processOrderCreation(paymentIntentId, "stripe");
	};

	/**
	 * Handle Paystack payment flow
	 */
	const handlePaystackPayment = async () =>
	{
		if (!user && !isGuestUser)
		{
			toast.error("Please sign in or continue as guest");
			return;
		}

		setPaymentLoading(true);
		setPaymentError(null);

		try
		{
			const paymentData = getPaymentData();
			// Paystack always NGN for us
			paymentData.currency = "NGN";

			// Calculate NGN amount accurately
			let totalNGN = 0;
			const hasSourceNGN = items.every((item) => item.sourceCurrency === "NGN");

			if (hasSourceNGN)
			{
				const itemsTotalNGN = items.reduce(
					(acc, item) => acc + (item.sourcePrice || 0) * item.quantity,
					0,
				);
				// Convert shipping cost to NGN accurately
				const shippingConversion = await convertPrice(
					shippingCost,
					"USD",
					"NGN",
				);
				totalNGN = itemsTotalNGN + shippingConversion.convertedPrice;
			} else
			{
				// Convert total USD to NGN accurately
				const totalConversion = await convertPrice(
					regularItemsTotalWithShipping,
					"USD",
					"NGN",
				);
				totalNGN = totalConversion.convertedPrice;
			}

			const result = await PaymentService.initializePayment(
				{
					...paymentData,
					amount: totalNGN,
					currency: "NGN",
				},
				"paystack",
			);

			if (result.success)
			{
				handlePaystackPaymentSuccess(result.reference || "");
			} else
			{
				setPaymentError(result.error || "Payment failed");
			}
		} catch (error: any)
		{
			console.error("Paystack error:", error);
			setPaymentError(error.message || "Payment failed");
		} finally
		{
			setPaymentLoading(false);
		}
	};

	/**
	 * Handle payment errors
	 */
	const handleStripePaymentError = (error: string) =>
	{
		console.error("Stripe payment error:", error);
		setPaymentError(error);
		setShowStripeModal(false);
	};

	const handleFlutterwavePaymentError = (error: string) =>
	{
		console.error("Flutterwave payment error:", error);
		setPaymentError(error);
		setShowFlutterwaveModal(false);
	};

	const handlePaymentError = (error: string) =>
	{
		console.error("Payment error:", error);
		setPaymentError(error);
		setShowStripeModal(false);
		setShowFlutterwaveModal(false);
	};

	/**
	 * Format price for display
	 */
	const formatPrice = (price: number) =>
	{
		return formatCurrencyPrice(price);
	};

	// Show loading while checking authentication or cart
	if (authLoading || loading)
	{
		return (
			<div
				className="min-h-screen flex items-center justify-center"
				style={{
					backgroundColor: storefront.theme.colors.background,
					color: storefront.theme.colors.text,
				}}
			>
				<div className="text-center">
					<div
						className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
						style={{ borderColor: storefront.theme.colors.primary }}
					></div>
					<p className="text-gray-600">Loading checkout...</p>
				</div>
			</div>
		);
	}

	// Redirect if no items (handled in useEffect, but show nothing while redirecting)
	if (items.length === 0)
	{
		return null;
	}

	return (
		<>
			<GuestCheckoutModal
				isOpen={showGuestModal}
				onClose={() => setShowGuestModal(false)}
				onSignIn={handleSignIn}
				onGuestCheckout={handleGuestCheckout}
			/>

			<div
				className="min-h-screen bg-gray-50"
				style={{
					backgroundColor: storefront.theme.colors.background,
					color: storefront.theme.colors.text,
					fontFamily: storefront.theme.typography.bodyFont,
				}}
			>
				{/* Header */}
				<header className="bg-white shadow-sm border-b sticky top-0 z-10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<button
								onClick={() => router.push(`/store/${storefront.handle}/cart`)}
								className="flex items-center gap-3 hover:opacity-80 transition-opacity"
							>
								<ArrowLeft className="w-5 h-5" />
								<span className="font-medium">Back to Cart</span>
							</button>

							<div className="flex items-center gap-2">
								<ShoppingCart className="w-6 h-6" />
								<span className="font-semibold">Checkout</span>
							</div>
						</div>
					</div>
				</header>

				{/* Progress Steps */}
				<div className="bg-white border-b">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
						<div className="flex items-center justify-between">
							{steps.map((step, index) => (
								<div key={step.id} className="flex items-center">
									<div
										className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${index <= currentStep
												? "text-white"
												: "bg-gray-200 text-gray-600"
											}`}
										style={{
											backgroundColor:
												index <= currentStep
													? storefront.theme.colors.primary
													: undefined,
										}}
									>
										{index + 1}
									</div>
									<span
										className={`ml-2 text-sm font-medium ${index <= currentStep ? "text-gray-900" : "text-gray-500"
											}`}
									>
										{step.title}
									</span>
									{index < steps.length - 1 && (
										<div className="ml-4 w-8 h-0.5 bg-gray-200"></div>
									)}
								</div>
							))}
						</div>
					</div>
				</div>

				{/* Main Content */}
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						{/* Main Checkout Form */}
						<div className="lg:col-span-2">
							<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
								{/* Step 1: Cart Review */}
								{currentStep === 0 && (
									<div>
										<div className="flex items-center mb-4 sm:mb-6">
											<ShoppingCart
												className="mr-2 sm:mr-3 text-gray-600"
												size={20}
											/>
											<h2 className="text-lg sm:text-xl font-semibold">
												Review Your Order
											</h2>
										</div>

										<div className="space-y-4 mb-6">
											{items.map((item) => (
												<div
													key={item.product_id}
													className="flex gap-4 p-4 border rounded-lg"
												>
													<div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
														{item.images?.[0] ? (
															<Image
																src={item.images[0]}
																alt={item.title}
																fill
																className="object-cover"
															/>
														) : (
															<div className="w-full h-full flex items-center justify-center text-gray-400">
																<Package className="w-6 h-6" />
															</div>
														)}
													</div>
													<div className="flex-1">
														<h3 className="font-medium">{item.title}</h3>
														<p className="text-sm text-gray-600">
															Qty: {item.quantity}
														</p>
														{item.type === "bespoke" && (
															<span className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full mt-1">
																Bespoke
															</span>
														)}
														<p className="text-sm font-semibold mt-1">
															<Price
																price={item.price * item.quantity}
																originalCurrency="USD"
															/>
														</p>
													</div>
												</div>
											))}
										</div>

										{hasBespokeItems && (
											<div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
												<div className="flex items-start gap-2">
													<CircleAlert className="w-5 h-5 text-amber-600 mt-0.5" />
													<div>
														<h4 className="font-medium text-amber-800 mb-1">
															Bespoke Items Notice
														</h4>
														<p className="text-sm text-amber-700">
															Your order contains custom-made items.{" "}
															{isGuestUser
																? "After payment, you'll be contacted to provide measurements and discuss customization details."
																: "We'll verify your measurements in the next step."}
														</p>
													</div>
												</div>
											</div>
										)}

										<div className="flex justify-end">
											<button
												onClick={handleNextStep}
												className="px-6 py-2 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
												style={{
													backgroundColor: storefront.theme.colors.primary,
												}}
											>
												Continue to{" "}
												{hasBespokeItems && !isGuestUser
													? "Measurements"
													: "Shipping"}
											</button>
										</div>
									</div>
								)}

								{/* Step 2: Measurements (only for bespoke items and logged-in users) */}
								{currentStep === 1 && hasBespokeItems && !isGuestUser && (
									<div>
										<div className="flex items-center mb-4 sm:mb-6">
											<User className="mr-2 sm:mr-3 text-gray-600" size={20} />
											<h2 className="text-lg sm:text-xl font-semibold">
												Measurements Required
											</h2>
										</div>

										<div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
											<p className="text-sm text-blue-800">
												Your order contains bespoke items that require
												measurements. Please add your measurements to continue.
											</p>
										</div>

										<div className="flex justify-between">
											<button
												onClick={handleMeasurementsBack}
												className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
											>
												Back
											</button>
											<button
												onClick={redirectToMeasurements}
												className="px-6 py-2 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
												style={{
													backgroundColor: storefront.theme.colors.primary,
												}}
											>
												Add Measurements
											</button>
										</div>
									</div>
								)}

								{/* Step 2/3: Shipping Address */}
								{((currentStep === 1 && !hasBespokeItems) ||
									(currentStep === 2 && hasBespokeItems) ||
									(currentStep === 1 && isGuestUser)) && (
										<div>
											<div className="flex items-center mb-4 sm:mb-6">
												<MapPin
													className="mr-2 sm:mr-3 text-gray-600"
													size={20}
												/>
												<h2 className="text-lg sm:text-xl font-semibold">
													Shipping Address
												</h2>
											</div>

											{/* Existing Addresses */}
											{addresses.length > 0 && (
												<div className="mb-6">
													<h3 className="font-medium mb-3">Select Address</h3>
													<div className="space-y-3">
														{addresses.map((address) => (
															<div
																key={address.id}
																className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedAddress?.id === address.id
																		? "border-blue-500 bg-blue-50"
																		: "border-gray-200 hover:border-gray-300"
																	}`}
																onClick={() => setSelectedAddress(address)}
															>
																<div className="flex items-start justify-between">
																	<div>
																		<p className="font-medium">
																			{address.first_name} {address.last_name}
																		</p>
																		<p className="text-sm text-gray-600 mt-1">
																			{AddressService.formatAddressForDisplay(
																				address,
																			)}
																		</p>
																		<p className="text-sm text-gray-600">
																			{address.phone_number}
																		</p>
																	</div>
																	<input
																		type="radio"
																		checked={selectedAddress?.id === address.id}
																		onChange={() => setSelectedAddress(address)}
																		className="mt-1"
																	/>
																</div>
															</div>
														))}
													</div>
												</div>
											)}

											{/* Add New Address */}
											{!showAddressForm && (
												<button
													onClick={() => setShowAddressForm(true)}
													className="mb-6 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
												>
													+ Add Address
												</button>
											)}

											{/* Address Form */}
											{showAddressForm && (
												<div className="mb-6 p-4 border rounded-lg bg-gray-50">
													<h3 className="font-medium mb-4">Add Address</h3>

													{addressErrors.length > 0 && (
														<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
															<ul className="text-sm text-red-800">
																{addressErrors.map((error, index) => (
																	<li key={index}>• {error}</li>
																))}
															</ul>
														</div>
													)}

													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
														<div>
															<label className="block text-sm font-medium mb-1">
																First Name *
															</label>
															<input
																type="text"
																name="first_name"
																value={newAddress.first_name}
																onChange={handleAddressInputChange}
																className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
															/>
														</div>
														<div>
															<label className="block text-sm font-medium mb-1">
																Last Name *
															</label>
															<input
																type="text"
																name="last_name"
																value={newAddress.last_name}
																onChange={handleAddressInputChange}
																className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
															/>
														</div>
													</div>

													<div className="mb-4">
														<label className="block text-sm font-medium mb-1">
															Street Address *
														</label>
														<input
															type="text"
															name="street_address"
															value={newAddress.street_address}
															onChange={handleAddressInputChange}
															className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
														/>
													</div>

													<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
														<div>
															<label className="block text-sm font-medium mb-1">
																City *
															</label>
															<input
																type="text"
																name="city"
																value={newAddress.city}
																onChange={handleAddressInputChange}
																className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
															/>
														</div>
														<div>
															<label className="block text-sm font-medium mb-1">
																State *
															</label>
															<input
																type="text"
																name="state"
																value={newAddress.state}
																onChange={handleAddressInputChange}
																className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
															/>
														</div>
														<div>
															<label className="block text-sm font-medium mb-1">
																ZIP Code *
															</label>
															<input
																type="text"
																name="post_code"
																value={newAddress.post_code}
																onChange={handleAddressInputChange}
																className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
															/>
														</div>
													</div>

													<div className="mb-4">
														<label className="block text-sm font-medium mb-1">
															Phone Number *
														</label>
														<input
															type="tel"
															name="phone_number"
															value={newAddress.phone_number}
															onChange={handleAddressInputChange}
															className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
														/>
													</div>

													<div className="flex gap-2">
														<button
															onClick={handleAddAddress}
															className="px-4 py-2 text-white rounded-lg hover:shadow-lg transition-all duration-200"
															style={{
																backgroundColor: storefront.theme.colors.primary,
															}}
														>
															Add Address
														</button>
														<button
															onClick={() =>
															{
																setShowAddressForm(false);
																setAddressErrors([]);
															}}
															className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
														>
															Cancel
														</button>
													</div>
												</div>
											)}

											{/* Navigation */}
											<div className="flex justify-between">
												<button
													onClick={handlePreviousStep}
													className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
												>
													Back
												</button>
												<button
													onClick={handleNextStep}
													disabled={!selectedAddress || shippingLoading}
													className="px-6 py-2 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
													style={{
														backgroundColor: storefront.theme.colors.primary,
													}}
												>
													{shippingLoading
														? "Calculating..."
														: "Continue to Payment"}
												</button>
											</div>
										</div>
									)}

								{/* Step 3/4: Payment */}
								{((currentStep === 2 && !hasBespokeItems) ||
									(currentStep === 3 && hasBespokeItems) ||
									(currentStep === 2 && isGuestUser)) && (
										<div>
											<div className="flex items-center mb-4 sm:mb-6">
												<CreditCard
													className="mr-2 sm:mr-3 text-gray-600"
													size={20}
												/>
												<h2 className="text-lg sm:text-xl font-semibold">
													Payment
												</h2>
											</div>

											{/* VVIP Manual Payment Form */}
											{isVvipShopper && bankDetails ? (
												<ManualPaymentForm
													bankDetails={bankDetails}
													orderTotal={regularItemsTotalWithShipping}
													currency="NGN"
													onSubmit={handleVvipPayment}
													loading={paymentLoading}
												/>
											) : (
												<>
													{/* Order Summary */}
													<div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
														<h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">
															Order Summary
														</h3>
														<div className="space-y-2 text-xs sm:text-sm">
															<div className="flex justify-between">
																<span>Subtotal ({items.length} items)</span>
																<span>
																	<Price
																		price={regularItemsTotal}
																		originalCurrency="USD"
																	/>
																</span>
															</div>
															<div className="flex justify-between">
																<span>
																	Shipping
																	{shippingRate?.courierName && (
																		<span className="text-gray-500 text-xs ml-1">
																			({shippingRate.courierName})
																		</span>
																	)}
																</span>
																<span>
																	<Price
																		price={shippingCost}
																		originalCurrency="USD"
																	/>
																</span>
															</div>

															<div className="border-t pt-2 flex justify-between font-semibold text-sm sm:text-base">
																<span>Total</span>
																<span>
																	<Price
																		price={regularItemsTotalWithShipping}
																		originalCurrency="USD"
																	/>
																</span>
															</div>
														</div>
													</div>

													{/* Shipping Address */}
													{selectedAddress && (
														<div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
															<h3 className="font-semibold mb-2 text-sm sm:text-base">
																Shipping Address
															</h3>
															<p className="text-xs sm:text-sm text-gray-600 break-words">
																{AddressService.formatAddressForDisplay(
																	selectedAddress,
																)}
															</p>
														</div>
													)}

													{/* Payment Method Selection */}
													<div className="mb-4 sm:mb-6">
														<PaymentMethodSelector
															selectedProvider={selectedPaymentProvider}
															selectedCurrency={selectedCurrency}
															onSelect={({ provider, currency }) =>
															{
																setSelectedPaymentProvider(provider);
																setSelectedCurrency(currency);
															}}
															disabled={isProcessing || paymentLoading}
														/>
													</div>

													{/* Payment Amount Display */}
													<div className="bg-gray-50 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
														<div className="flex items-center gap-2 mb-2">
															<CreditCard size={20} className="text-gray-600" />
															<h3 className="font-semibold text-sm sm:text-base">
																{selectedPaymentProvider === "stripe"
																	? "Stripe Payment"
																	: selectedPaymentProvider === "flutterwave"
																		? "Flutterwave Payment"
																		: "Paystack Payment"}
															</h3>
														</div>
														<p className="text-xs sm:text-sm text-gray-600 mb-3">
															{selectedPaymentProvider === "stripe"
																? "Secure payment processing with credit/debit cards"
																: selectedPaymentProvider === "flutterwave"
																	? "Pay with mobile money, cards, and bank transfers"
																	: "Fast and secure payment with Paystack"}
														</p>
														<div className="mt-3 text-lg font-bold">
															<Price
																price={regularItemsTotalWithShipping}
																size="lg"
																variant="accent"
																originalCurrency="USD"
															/>
														</div>
													</div>

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
																	selectedAddress &&
																	calculateShipping(selectedAddress)
																}
																className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
															>
																Try calculating shipping again
															</button>
														</div>
													)}

													{/* Navigation */}
													<div className="flex justify-between">
														<button
															onClick={handlePreviousStep}
															className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
														>
															Back
														</button>
														<button
															onClick={handlePayment}
															disabled={paymentLoading}
															className="px-6 py-2 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
															style={{
																backgroundColor: storefront.theme.colors.primary,
															}}
														>
															{paymentLoading
																? "Processing..."
																: `Pay ${selectedCurrency === "USD" ? "$" : "₦"}${selectedCurrency === "USD"
																	? regularItemsTotalWithShipping.toFixed(2)
																	: (
																		regularItemsTotalWithShipping * 1500
																	).toLocaleString()
																} with ${selectedPaymentProvider === "stripe"
																	? "Stripe"
																	: selectedPaymentProvider === "flutterwave"
																		? "Flutterwave"
																		: "Paystack"
																}`}
														</button>
													</div>
												</>
											)}

											{/* Navigation for VVIP users */}
											{isVvipShopper && (
												<div className="flex justify-between mt-6">
													<button
														onClick={handlePreviousStep}
														className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
													>
														Back
													</button>
												</div>
											)}
										</div>
									)}
							</div>
						</div>

						{/* Order Summary Sidebar */}
						<div className="lg:col-span-1">
							<div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-24">
								<h2 className="text-xl font-semibold mb-4">Order Summary</h2>

								{/* Items */}
								<div className="space-y-4 mb-6">
									{items.map((item) => (
										<div key={item.product_id} className="flex gap-3">
											<div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
												{item.images?.[0] ? (
													<Image
														src={item.images[0]}
														alt={item.title}
														fill
														className="object-cover"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center text-gray-400">
														<Package className="w-6 h-6" />
													</div>
												)}
											</div>
											<div className="flex-1">
												<h3 className="font-medium text-sm">{item.title}</h3>
												<p className="text-sm text-gray-600">
													Qty: {item.quantity}
												</p>
												{item.type === "bespoke" && (
													<span className="inline-block px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded-full mt-1">
														Bespoke
													</span>
												)}
												<p className="text-sm font-semibold mt-1">
													<Price
														price={item.price * item.quantity}
														originalCurrency="USD"
													/>
												</p>
											</div>
										</div>
									))}
								</div>

								{/* Totals */}
								<div className="space-y-2 border-t pt-4">
									<div className="flex justify-between text-sm sm:text-base">
										<span className="text-gray-600">Subtotal</span>
										<span className="font-medium">
											<Price price={regularItemsTotal} originalCurrency="USD" />
										</span>
									</div>

									{/* Only show shipping on payment step */}
									{((currentStep === 2 && !hasBespokeItems) ||
										(currentStep === 3 && hasBespokeItems) ||
										(currentStep === 2 && isGuestUser)) && (
											<>
												<div className="flex justify-between text-sm sm:text-base">
													<span className="text-gray-600">
														Shipping
														{shippingRate?.courierName && (
															<span className="text-gray-500 text-xs ml-1">
																({shippingRate.courierName})
															</span>
														)}
													</span>
													<span className="font-medium">
														<Price price={shippingCost} originalCurrency="USD" />
													</span>
												</div>
											</>
										)}

									<div className="flex justify-between text-base sm:text-lg font-semibold pt-2 border-t">
										<span>Total</span>
										<span style={{ color: storefront.theme.colors.primary }}>
											{(currentStep === 2 && !hasBespokeItems) ||
												(currentStep === 3 && hasBespokeItems) ||
												(currentStep === 2 && isGuestUser) ? (
												<Price
													price={regularItemsTotalWithShipping}
													originalCurrency="USD"
												/>
											) : (
												<>
													<Price
														price={regularItemsTotal}
														originalCurrency="USD"
													/>{" "}
													+ shipping
												</>
											)}
										</span>
									</div>
								</div>

								<div className="mt-6 p-4 bg-gray-50 rounded-lg">
									<p className="text-sm text-gray-600 text-center">
										🔒 Your information is secure and encrypted
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* Payment Modals */}
			{showStripeModal && (
				<StripePaymentModalLazy
					isOpen={showStripeModal}
					onClose={() => setShowStripeModal(false)}
					paymentData={getStripePaymentData()}
					onSuccess={handleStripePaymentSuccess}
					onError={handleStripePaymentError}
				/>
			)}

			{showFlutterwaveModal && (
				<FlutterwavePaymentModalLazy
					isOpen={showFlutterwaveModal}
					onClose={() => setShowFlutterwaveModal(false)}
					paymentData={getPaymentData()}
					onSuccess={handleFlutterwavePaymentSuccess}
					onError={handleFlutterwavePaymentError}
				/>
			)}
		</>
	);
}
