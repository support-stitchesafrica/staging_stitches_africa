"use client";

import { useState } from "react";
import { loadFirebaseModule } from "@/lib/utils/module-helpers";
import { getFirebaseApp } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { Loader2, Search, Truck, Package, User } from "lucide-react";
import { CartItem, Product, UserAddress } from "@/types";
import { AddressRepository, productRepository } from "@/lib/firestore";
// import { UserAddress } from "@/types/user";
import {
	DHLShippingService,
	ShippingRate,
	CartItemForShipping,
	ShippingTierUtility,
} from "@/lib/shipping/dhl-service";
import { TerminalAfricaService } from "@/lib/shipping/terminal-africa-service";
import {
	calculateFinalPrice,
	calculateDutyAmount,
	getEffectiveDutyRate,
	getPriceValue,
	getDiscount,
	getCurrency,
	calculatePlatformCommission,
} from "@/lib/priceUtils";
import { currencyService } from "@/lib/services/currencyService";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { fetchUserAddressesAdmin } from "@/app/actions/admin-address-actions";
import { useAuth } from "@/contexts/AuthContext";

interface ManualProcessPaymentRequest {
	userId: string;
	shippingFee: number;
	deliveryDate: string;
	manualItems?: CartItem[];
	skipClearCart?: boolean;
	userEmail?: string;
	shippingAddressId?: string;
	courierData?: any;
	tax?: number;
	tax_currency?: string;
	accessToken?: string;
	logoUrl?: string;
	isTestMode?: boolean;
	currency?: string;
	coupon_value?: number;
	coupon_currency?: string;
}

export function ManualOrderProcessor() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<any>(null);

	const [formData, setFormData] = useState<ManualProcessPaymentRequest>({
		userId: "",
		shippingFee: 0,
		deliveryDate: new Date().toISOString().split("T")[0],
		userEmail: "",
		skipClearCart: false,
		manualItems: [],
		courierData: {},
		tax: 0,
		tax_currency: "USD",
		isTestMode: process.env.NODE_ENV === "development",
		currency: "USD",
		coupon_value: 0,
		coupon_currency: "NGN",
	});

	// Address State
	const [addresses, setAddresses] = useState<UserAddress[]>([]);
	const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
		null,
	);
	const [fetchingAddresses, setFetchingAddresses] = useState(false);

	// Product Lookup State
	const [lookupProductId, setLookupProductId] = useState("");
	const [lookupLoading, setLookupLoading] = useState(false);
	const [manualItems, setManualItems] = useState<CartItem[]>([]);
	const [manualItemsJson, setManualItemsJson] = useState("");

	// Shipping State
	const [shippingLoading, setShippingLoading] = useState(false);
	const [shippingRates, setShippingRates] = useState<any[]>([]);

	const addressRepo = new AddressRepository();

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]:
				name === "shippingFee" || name === "tax" ? parseFloat(value) : value,
		}));
	};

	const handleCheckboxChange = (checked: boolean) => {
		setFormData((prev) => ({ ...prev, skipClearCart: checked }));
	};

	// --- 1. Address Fetching ---
	const fetchUserAddresses = async () => {
		if (!formData.userId) {
			toast.error("Please enter a User ID first");
			return;
		}
		setFetchingAddresses(true);
		try {
			// Use Server Action instead of Client Repository
			const fetched = await fetchUserAddressesAdmin(formData.userId);
			setAddresses(fetched);

			if (fetched.length > 0) {
				// Auto-select default or first
				const defaultAddr = fetched.find((a) => a.is_default) || fetched[0];
				handleAddressSelection(defaultAddr.id!);
				toast.success(`Found ${fetched.length} addresses`);
			} else {
				toast("No addresses found for this user");
			}
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Failed to fetch addresses");
		} finally {
			setFetchingAddresses(false);
		}
	};

	const handleAddressSelection = (addressId: string) => {
		const addr = addresses.find((a) => a.id === addressId);
		if (addr) {
			setSelectedAddress(addr);
			setFormData((prev) => ({
				...prev,
				shippingAddressId: addr.id,
				// Auto-fill email if not present
				userEmail: prev.userEmail || "", // Could fetch user email potentially
			}));
		}
	};

	// --- 2. Product Lookup ---
	const fetchProduct = async () => {
		if (!lookupProductId) return;
		setLookupLoading(true);
		try {
			const product = await productRepository.getById(lookupProductId);
			if (!product) {
				toast.error("Product not found");
				return;
			}

			// Generate CartItem
			let basePrice = getPriceValue(product.price as any);
			const discount = getDiscount(product.price as any, product.discount);
			const productCurrency = getCurrency(product.price as any, "USD");

			// Capturing Source Pricing Details (Before Any Conversion)
			const sourceCurrency = productCurrency;
			const sourceOriginalPrice = basePrice;
			const sourcePlatformCommission = calculatePlatformCommission(
				basePrice,
				discount,
			);
			// Source price is the final price in the source currency (inclusive of duty/commission)
			// effectively what the customer would pay if they paid in source currency
			const sourcePrice = calculateFinalPrice(
				basePrice,
				discount,
				"NG", // Assuming NG for source calculation context or based on vendor? Usually standard formula.
			);

			// If product is in NGN, convert to USD for manual order pricing
			if (productCurrency === "NGN") {
				const conversion = await currencyService.convertPrice(
					basePrice,
					"NGN",
					"USD",
				);
				basePrice = conversion.convertedPrice;
			}

			// Use 'NG' to force exemption as requested (or pass actual country if needed,
			// but requirement was "duty free for all" in priceUtils anyway)
			// Actually priceUtils is updated to be 0 global, so country param doesn't matter much.
			const userCountry = selectedAddress?.country_code || "NG";

			const price = calculateFinalPrice(basePrice, discount, userCountry);
			const dutyCharge = calculateDutyAmount(basePrice, discount, userCountry);

			const newItem: CartItem = {
				product_id: product.product_id,
				tailor_id: product.tailor_id,
				title: product.title,
				description: product.description || "",
				quantity: 1,
				price: price,
				originalPrice: basePrice, // This becomes the converted base price
				dutyCharge: dutyCharge,
				discount: discount,
				images: product.images || [],
				size: product.rtwOptions?.sizes?.[0]
					? String(product.rtwOptions.sizes[0])
					: "",
				color: "",
				tailor: product.tailor || product.vendor?.name || "Unknown",
				user_id: formData.userId,
				createdAt: new Date(),
				updatedAt: new Date(),
				isCollectionItem: false,
				isRemovable: true,
				// Source Pricing Fields
				sourcePrice: sourcePrice,
				sourceCurrency: sourceCurrency,
				sourceOriginalPrice: sourceOriginalPrice,
				sourcePlatformCommission: sourcePlatformCommission,
			};

			const updatedItems = [...manualItems, newItem];
			setManualItems(updatedItems);
			setManualItemsJson(JSON.stringify(updatedItems, null, 2));
			toast.success("Product added");
			setLookupProductId("");
		} catch (error) {
			console.error(error);
			toast.error("Failed to fetch product");
		} finally {
			setLookupLoading(false);
		}
	};

	// --- 3. Shipping Calculation ---
	const calculateShipping = async (provider: "dhl" | "terminal") => {
		if (!selectedAddress) {
			toast.error("Select an address first");
			return;
		}

		// Use manual items if present, else warn
		const itemsToShip = manualItems.length > 0 ? manualItems : [];
		if (itemsToShip.length === 0) {
			toast(
				"No manual items to calculate shipping for. Will try to use cart items on backend? (Not supported for shipping calc here)",
			);
			// Note: Backend processPostPayment fetches cart, but for shipping calc HERE we need items.
			// If user leaves items empty to use backend cart, we can't calc shipping here easily without fetching cart.
			// Let's assume manual items for this advanced flow.
		}

		setShippingLoading(true);
		setShippingRates([]);

		try {
			// Prepare shipping items
			const shippingItems: CartItemForShipping[] = itemsToShip.map((item) => {
				// Approximate weight/dim if missing (could fetch product details if incomplete)
				// Assuming simple mapping for now
				const tier = ShippingTierUtility.determineTier(item.quantity * 0.5); // Fallback weight approximation
				return {
					weight: 0.5 * item.quantity, // Dummy weight if not on item
					dimensions: {
						length: tier.length,
						width: tier.width,
						height: tier.height,
					},
					price: item.price,
					quantity: item.quantity,
				};
			});

			if (provider === "dhl") {
				const rate = await DHLShippingService.getShippingRate({
					address: {
						streetAddress: selectedAddress.street_address,
						city: selectedAddress.city,
						state: selectedAddress.state,
						countryCode: selectedAddress.country_code,
						postcode: selectedAddress.post_code || "00000",
					},
					multipleItems: shippingItems,
				});

				if (rate) {
					setFormData((prev) => ({
						...prev,
						shippingFee: rate.amount,
						deliveryDate: rate.deliveryDate,
						courierData: {
							dhl_data: {
								plannedShippingDate: rate.dhlData?.plannedShippingDate,
								productCode: rate.dhlData?.productCode,
							},
						},
					}));
					toast.success(`DHL Rate Applied: $${rate.amount}`);
				}
			} else {
				// Terminal Africa
				// Note: Terminal Africa usually needs parcel creation first.
				// Simplified flow: Create dummy parcel for rate check?
				// Or duplicate the full flow from checkout?
				// For manual processor, maybe just getting a rough rate or enabling the
				// "fetch rates" which requires packaging/address creation on TA side.

				// Let's implement full flow roughly
				const weight = shippingItems.reduce(
					(sum, i) => sum + (i.weight || 0),
					0,
				);
				const packagingParams = {
					length: 20,
					width: 20,
					height: 10,
					weight: Math.max(weight, 1),
					isLive: true,
				};

				// 1. Create Address (Pickup - hardcoded/admin) & Delivery
				// We'll skip actual address creation on TA for speed unless strict
				// Assuming we can get rates with raw data or need IDs?
				// TA service requires IDs.

				// Fallback: Just warn this is complex
				toast.error(
					"Terminal Africa full integration requires Backend Address IDs. Use DHL for quick calc or enter manually.",
				);
			}
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Shipping calc failed");
		} finally {
			setShippingLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setResult(null);

		try {
			// Updated items from state
			let items: CartItem[] = manualItems;

			// If user edited the JSON manually, parse it
			if (
				manualItemsJson.trim() &&
				manualItemsJson !== JSON.stringify(manualItems, null, 2)
			) {
				try {
					items = JSON.parse(manualItemsJson);
					if (!Array.isArray(items))
						throw new Error("Manual items must be an array");
				} catch (jsonError) {
					toast.error("Invalid JSON format for Manual Items");
					setLoading(false);
					return;
				}
			}

			console.log("🚀 Calling manualProcessPostPayment (europe-west1)...");

			const functionsModule = await loadFirebaseModule(
				"firebase/functions",
				"manual_process_payment",
			);

			const firebaseModule = await import("@/lib/firebase");
			const app = await firebaseModule.getFirebaseApp();
			const { getFunctions } = functionsModule;

			const functions = getFunctions(app, "europe-west1");
			const manualProcess = functionsModule.httpsCallable(
				functions,
				"manualProcessPostPayment",
			);

			const idToken = user ? await user.getIdToken() : undefined;

			const payload = {
				...formData,
				manualItems: items.length > 0 ? items : undefined,
				accessToken: idToken,
				logoUrl: "https://www.stitchesafrica.com/Stitches-Africa-Logo-06.png",
			};

			const response = await manualProcess(payload);
			console.log("✅ Manual Process Success:", response.data);
			setResult(response.data);
			toast.success("Order processed successfully!");
		} catch (error: any) {
			console.error("❌ Manual Process Failed:", error);
			toast.error(error.message || "Failed to process order");
			setResult({ error: error.message });
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-5xl mx-auto">
			<CardHeader>
				<CardTitle>Manual Order Processor</CardTitle>
				<CardDescription>
					Admin tool to create orders, charge wallets, and generate shipments.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-8">
					{/* Section 1: User & Address */}
					<div className="space-y-4 p-4 border rounded-lg bg-slate-50">
						<h3 className="font-semibold flex items-center gap-2">
							<User size={18} /> User Details
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="userId">User ID*</Label>
								<div className="flex gap-2">
									<Input
										id="userId"
										name="userId"
										placeholder="User UID"
										value={formData.userId}
										onChange={handleInputChange}
										required
									/>
									<Button
										type="button"
										variant="outline"
										onClick={fetchUserAddresses}
										disabled={fetchingAddresses}
									>
										{fetchingAddresses ? (
											<Loader2 className="animate-spin" />
										) : (
											"Fetch Addr"
										)}
									</Button>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="userEmail">User Email</Label>
								<Input
									id="userEmail"
									name="userEmail"
									type="email"
									value={formData.userEmail}
									onChange={handleInputChange}
								/>
							</div>
						</div>

						{addresses.length > 0 && (
							<div className="space-y-2">
								<Label>Select Shipping Address</Label>
								<Select
									onValueChange={handleAddressSelection}
									value={selectedAddress?.id}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select address" />
									</SelectTrigger>
									<SelectContent>
										{addresses.map((addr) => (
											<SelectItem key={addr.id} value={addr.id!}>
												{addr.street_address}, {addr.city} ({addr.country_code})
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</div>

					{/* Section 2: Items */}
					<div className="space-y-4 p-4 border rounded-lg bg-slate-50">
						<h3 className="font-semibold flex items-center gap-2">
							<Package size={18} /> Order Items
						</h3>
						<div className="flex gap-2 items-end">
							<div className="flex-1 space-y-2">
								<Label>Product Lookup (ID)</Label>
								<Input
									placeholder="Enter Product ID to auto-fill"
									value={lookupProductId}
									onChange={(e) => setLookupProductId(e.target.value)}
								/>
							</div>
							<Button
								type="button"
								onClick={fetchProduct}
								disabled={lookupLoading}
							>
								{lookupLoading ? (
									<Loader2 className="animate-spin" />
								) : (
									<Search size={16} />
								)}
							</Button>
						</div>

						<div className="space-y-2">
							<Label htmlFor="manualItems">Items JSON (Editable)</Label>
							<Textarea
								id="manualItems"
								className="font-mono h-48 text-xs"
								value={manualItemsJson}
								onChange={(e) => setManualItemsJson(e.target.value)}
							/>
						</div>
					</div>

					{/* Section 3: Shipping & Payment */}
					<div className="space-y-4 p-4 border rounded-lg bg-slate-50">
						<h3 className="font-semibold flex items-center gap-2">
							<Truck size={18} /> Shipping & Logistics
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="shippingFee">Shipping Fee</Label>
								<div className="flex gap-2">
									<Input
										id="shippingFee"
										name="shippingFee"
										type="number"
										value={formData.shippingFee}
										onChange={handleInputChange}
										required
									/>
									<Button
										type="button"
										variant="secondary"
										onClick={() => calculateShipping("dhl")}
										disabled={shippingLoading}
										className="whitespace-nowrap"
									>
										Calc DHL
									</Button>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="deliveryDate">Delivery Date</Label>
								<Input
									id="deliveryDate"
									name="deliveryDate"
									type="date"
									value={formData.deliveryDate}
									onChange={handleInputChange}
									required
								/>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							<div className="space-y-2">
								<Label htmlFor="tax">Tax Amount</Label>
								<Input
									id="tax"
									name="tax"
									type="number"
									step="0.01"
									value={formData.tax}
									onChange={handleInputChange}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="tax_currency">Tax Currency</Label>
								<Select
									onValueChange={(val) =>
										setFormData((prev) => ({ ...prev, tax_currency: val }))
									}
									value={formData.tax_currency}
								>
									<SelectTrigger>
										<SelectValue placeholder="USD" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="USD">USD</SelectItem>
										<SelectItem value="NGN">NGN</SelectItem>
										<SelectItem value="EUR">EUR</SelectItem>
										<SelectItem value="GBP">GBP</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
							<div className="space-y-2">
								<Label htmlFor="currency">Payment Currency</Label>
								<Select
									onValueChange={(val) =>
										setFormData((prev) => ({ ...prev, currency: val }))
									}
									value={formData.currency}
								>
									<SelectTrigger>
										<SelectValue placeholder="USD" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="USD">USD</SelectItem>
										<SelectItem value="NGN">NGN</SelectItem>
										<SelectItem value="EUR">EUR</SelectItem>
										<SelectItem value="GBP">GBP</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						{/* Coupon Details */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 border rounded-lg border-blue-100 bg-blue-50/50">
							<div className="space-y-2">
								<Label htmlFor="coupon_value">Coupon Value (Optional)</Label>
								<Input
									id="coupon_value"
									name="coupon_value"
									type="number"
									step="0.01"
									value={formData.coupon_value}
									onChange={handleInputChange}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="coupon_currency">Coupon Currency</Label>
								<Select
									onValueChange={(val) =>
										setFormData((prev) => ({ ...prev, coupon_currency: val }))
									}
									value={formData.coupon_currency}
								>
									<SelectTrigger>
										<SelectValue placeholder="NGN" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="NGN">NGN</SelectItem>
										<SelectItem value="USD">USD</SelectItem>
										<SelectItem value="EUR">EUR</SelectItem>
										<SelectItem value="GBP">GBP</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="flex items-center space-x-2 pt-2">
							<Checkbox
								id="skipClearCart"
								checked={formData.skipClearCart}
								onCheckedChange={handleCheckboxChange}
							/>
							<Label htmlFor="skipClearCart">
								Skip Clear Cart (Keep items in user's cart)
							</Label>
						</div>
						<div className="flex items-center space-x-2 pt-2">
							<Checkbox
								id="isTestMode"
								checked={formData.isTestMode}
								onCheckedChange={(checked) =>
									setFormData((prev) => ({
										...prev,
										isTestMode: checked as boolean,
									}))
								}
							/>
							<Label htmlFor="isTestMode">
								Test Mode (Skip marketing emails)
							</Label>
						</div>
					</div>

					<Button
						type="submit"
						size="lg"
						className="w-full bg-blue-600 hover:bg-blue-700"
						disabled={loading}
					>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Processing Order...
							</>
						) : (
							"Create Order"
						)}
					</Button>

					{result && (
						<div className="mt-4 p-4 bg-muted rounded-md overflow-auto max-h-60 border border-green-200">
							<pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
						</div>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
