"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
	CircleCheck,
	Package,
	ArrowRight,
	Download,
	Printer,
	Mail,
	MapPin,
	CreditCard,
	Loader2,
	ShoppingBag,
	Phone,
} from "lucide-react";
import { orderRepository } from "@/lib/firestore";
import { UserOrder } from "@/types";
import { Price } from "@/components/common/Price";
import { useCurrency } from "@/contexts/CurrencyContext";
import { currencyService } from "@/lib/services/currencyService";

function CheckoutSuccessContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { userCurrency } = useCurrency();
	const [orderRef, setOrderRef] = useState<string | null>(null);
	const [orders, setOrders] = useState<UserOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [convertedShipping, setConvertedShipping] = useState<number | null>(
		null,
	);

	useEffect(() => {
		const ref = searchParams.get("ref");
		if (ref) {
			setOrderRef(ref);
			fetchOrders(ref);
		} else {
			setLoading(false);
		}
	}, [searchParams]);

	const fetchOrders = async (ref: string) => {
		try {
			const ordersData = await orderRepository.getOrdersByReference(ref);

			if (ordersData && ordersData.length > 0) {
				setOrders(ordersData);
			} else {
				console.warn("Orders not found with ref:", ref);
				// Fallback or error handled by the UI
			}
		} catch (err) {
			console.error("Error fetching orders:", err);
			setError(
				"Could not load order details, but your order was placed successfully.",
			);
		} finally {
			setLoading(false);
		}
	};

	// Determine if we should use source pricing
	// We use the first order as reference for the whole group
	const mainOrder = orders[0];
	const isNaira = userCurrency === "NGN";
	const hasSourcePricing =
		mainOrder && !!mainOrder.source_currency && !!mainOrder.source_price;
	const sourceIsNaira = mainOrder?.source_currency === "NGN";

	// Only apply special source pricing logic if user is in NGN and order has NGN source prices
	const useSource = isNaira && hasSourcePricing && sourceIsNaira;

	// Effect to convert shipping fee if using source pricing
	useEffect(() => {
		const convertShipping = async () => {
			if (useSource && mainOrder?.shipping_fee) {
				// Convert USD shipping to NGN
				const result = await currencyService.convertPrice(
					mainOrder.shipping_fee,
					"USD",
					"NGN",
				);
				setConvertedShipping(result.convertedPrice);
			} else {
				setConvertedShipping(null);
			}
		};

		if (mainOrder) {
			convertShipping();
		}
	}, [useSource, mainOrder]);

	const handlePrint = () => {
		window.print();
	};

	const handleDownloadInvoice = () => {
		window.print();
	};

	// Calculate totals based on pricing mode
	let subtotal = 0;
	let shippingFee = 0;
	let couponDiscount = 0;
	let total = 0;
	let displayCurrency = "USD";
	let skipConversion = false;

	if (useSource) {
		// Use source prices (NGN)
		subtotal = orders.reduce(
			(sum, order) => sum + (order.source_price || 0) * (order.quantity || 1),
			0,
		);
		shippingFee = convertedShipping !== null ? convertedShipping : 0;
		
		// Get coupon discount from first order (all orders share same coupon)
		if (mainOrder?.coupon_value && mainOrder?.coupon_currency) {
			if (mainOrder.coupon_currency === "NGN") {
				couponDiscount = mainOrder.coupon_value;
			} else {
				// Convert coupon to NGN if needed
				// This will be handled by async conversion below
			}
		}
		
		total = subtotal + shippingFee - couponDiscount;
		displayCurrency = "NGN";
		skipConversion = true;
	} else {
		// Use user's selected currency
		displayCurrency = userCurrency;
		skipConversion = false;
		
		subtotal = orders.reduce(
			(sum, order) => sum + (order.price || 0) * (order.quantity || 1),
			0,
		);
		shippingFee = orders.length > 0 ? orders[0].shipping_fee || 0 : 0;
		
		// Get coupon discount from first order
		if (mainOrder?.coupon_value && mainOrder?.coupon_currency) {
			couponDiscount = mainOrder.coupon_value;
		}
		
		total = subtotal + shippingFee - couponDiscount;
	}

	if (loading) {
		return <LoadingFallback />;
	}

	if (error || orders.length === 0) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
				<div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
					<div className="mb-6">
						<CircleCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
						<h1 className="text-2xl font-bold text-gray-900 mb-2">
							Order Confirmed!
						</h1>
						<p className="text-gray-600">
							Thank you for your purchase. Your order has been successfully
							placed.
						</p>
					</div>

					{orderRef && (
						<div className="bg-gray-50 rounded-lg p-4 mb-6">
							<p className="text-sm text-gray-600 mb-1">Order Reference</p>
							<p className="font-mono text-sm font-medium text-gray-900">
								{orderRef}
							</p>
						</div>
					)}

					<div className="space-y-3">
						<Link href="/shops" className="block">
							<button className="w-full bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors">
								Continue Shopping
							</button>
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 pb-20">
			<div className="max-w-4xl mx-auto">
				{/* Success Header */}
				<div className="bg-white rounded-2xl shadow-sm p-6 sm:p-10 mb-6 text-center print:shadow-none">
					<div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
						<CircleCheck className="h-10 w-10 text-green-600" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Order Confirmed!
					</h1>
					<p className="text-lg text-gray-600 mb-6">
						Thank you for your purchase. Your order has been successfully placed
						and is being processed.
					</p>

					<div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 max-w-sm mx-auto">
						<p className="text-sm text-green-800 mb-1 font-medium">
							Order Number
						</p>
						<p className="font-mono text-xl font-bold text-green-900">
							{orderRef}
						</p>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-wrap gap-4 justify-center print:hidden">
						<button
							onClick={handlePrint}
							className="inline-flex items-center px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
						>
							<Printer className="mr-2 h-4 w-4" />
							Print Invoice
						</button>
						<button
							onClick={handleDownloadInvoice}
							className="inline-flex items-center px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
						>
							<Download className="mr-2 h-4 w-4" />
							Download PDF
						</button>
					</div>
				</div>

				{/* Order Summary */}
				<div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 print:shadow-none">
					<div className="p-6 sm:p-8 border-b border-gray-100">
						<h2 className="text-xl font-bold text-gray-900 flex items-center">
							<ShoppingBag className="mr-3 h-6 w-6 text-gray-400" />
							Order Summary
						</h2>
					</div>

					<div className="p-6 sm:p-8">
						{/* Order Items */}
						<div className="space-y-6 mb-8">
							{orders.map((item, index) => {
								// Per item price determination
								const itemPrice = useSource
									? item.source_price || 0
									: item.price || 0;

								return (
									<div
										key={item.id || index}
										className="flex gap-6 pb-6 border-b border-gray-100 last:border-0 last:pb-0"
									>
										<div className="relative w-24 h-24 flex-shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
											{item.images && item.images.length > 0 ? (
												<Image
													src={item.images[0]}
													alt={item.title}
													fill
													className="object-cover"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<Package className="h-10 w-10 text-gray-200" />
												</div>
											)}
										</div>
										<div className="flex-1 min-w-0 py-1">
											<h3 className="text-base font-bold text-gray-900 truncate mb-1">
												{item.title}
											</h3>
											<p className="text-sm text-gray-500 mb-2">
												Tailor: {item.tailor_name || "Stitches Africa"}
											</p>
											<div className="flex items-center gap-4 text-sm">
												<span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
													Qty: {item.quantity || 1}
												</span>
												{item.size && (
													<span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">
														Size: {item.size}
													</span>
												)}
											</div>
										</div>
										<div className="text-right py-1">
											<p className="text-base font-bold text-gray-900">
												<Price
													price={itemPrice * (item.quantity || 1)}
													originalCurrency={displayCurrency}
													skipConversion={skipConversion}
												/>
											</p>
											{item.quantity && item.quantity > 1 && (
												<p className="text-xs text-gray-500 mt-1">
													<Price
														price={itemPrice}
														originalCurrency={displayCurrency}
														skipConversion={skipConversion}
													/>{" "}
													each
												</p>
											)}
										</div>
									</div>
								);
							})}
						</div>

						{/* Price Breakdown */}
						<div className="bg-gray-50 rounded-2xl p-6 space-y-3">
							<div className="flex justify-between text-sm text-gray-600">
								<span>Subtotal</span>
								<span className="font-medium text-gray-900">
									<Price
										price={subtotal}
										originalCurrency={displayCurrency}
										skipConversion={skipConversion}
									/>
								</span>
							</div>
							<div className="flex justify-between text-sm text-gray-600">
								<span>Shipping</span>
								<span className="font-medium text-gray-900">
									<Price
										price={shippingFee}
										originalCurrency={displayCurrency}
										skipConversion={skipConversion}
									/>
								</span>
							</div>
							{couponDiscount > 0 && (
								<div className="flex justify-between text-sm text-green-600">
									<span className="font-medium">
										Coupon Discount
										{mainOrder?.coupon_code && (
											<span className="ml-1 text-xs">({mainOrder.coupon_code})</span>
										)}
									</span>
									<span className="font-medium">
										-<Price
											price={couponDiscount}
											originalCurrency={displayCurrency}
											skipConversion={skipConversion}
										/>
									</span>
								</div>
							)}
							<div className="flex justify-between text-lg font-bold pt-4 border-t border-gray-200 text-gray-900">
								<span>Total Paid</span>
								<span className="text-black">
									<Price
										price={total}
										originalCurrency={displayCurrency}
										skipConversion={skipConversion}
									/>
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Shipping & Payment Info */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
					{/* Shipping Address */}
					<div className="bg-white rounded-2xl shadow-sm p-8 print:shadow-none">
						<div className="flex items-center mb-6">
							<div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-4">
								<MapPin className="h-5 w-5 text-blue-600" />
							</div>
							<h3 className="text-lg font-bold text-gray-900">
								Shipping Address
							</h3>
						</div>
						{mainOrder.user_address && (
							<div className="text-sm text-gray-600 space-y-1.5">
								<p className="font-bold text-gray-900 mb-2">
									{mainOrder.user_address.first_name}{" "}
									{mainOrder.user_address.last_name}
								</p>
								<p>{mainOrder.user_address.street_address}</p>
								<p>
									{mainOrder.user_address.city}, {mainOrder.user_address.state}{" "}
									{mainOrder.user_address.post_code}
								</p>
								<p>{mainOrder.user_address.country}</p>
								<p className="pt-3 border-t border-gray-50 mt-3">
									<span className="font-medium">Phone:</span>{" "}
									{mainOrder.user_address.phone_number}
								</p>
							</div>
						)}
					</div>

					{/* Payment Info */}
					<div className="bg-white rounded-2xl shadow-sm p-8 print:shadow-none">
						<div className="flex items-center mb-6">
							<div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mr-4">
								<CreditCard className="h-5 w-5 text-purple-600" />
							</div>
							<h3 className="text-lg font-bold text-gray-900">
								Payment Details
							</h3>
						</div>
						<div className="text-sm text-gray-600 space-y-4">
							<div className="flex justify-between pb-3 border-b border-gray-50">
								<span>Payment Method:</span>
								<span className="font-bold text-gray-900 capitalize">
									{mainOrder.delivery_type || "Card"}
								</span>
							</div>
							<div className="flex justify-between pb-3 border-b border-gray-50">
								<span>Status:</span>
								<span className="font-bold text-green-600 capitalize">
									{mainOrder.order_status || "Processed"}
								</span>
							</div>
							{mainOrder.delivery_date && (
								<div className="flex justify-between">
									<span>Estimated Delivery:</span>
									<span className="font-bold text-gray-900">
										{mainOrder.delivery_date}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Next Steps */}
				<div className="bg-blue-600 rounded-2xl p-8 mb-10 text-white shadow-xl shadow-blue-100 print:hidden">
					<h3 className="text-xl font-bold mb-6">What happens next?</h3>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
								<Mail className="h-6 w-6" />
							</div>
							<p className="text-sm font-medium">Confirmation Email</p>
							<p className="text-xs text-blue-100 mt-1">
								Sent within a few minutes
							</p>
						</div>
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
								<Package className="h-6 w-6" />
							</div>
							<p className="text-sm font-medium">Order Processing</p>
							<p className="text-xs text-blue-100 mt-1">
								Done in 1-2 work days
							</p>
						</div>
						<div className="flex flex-col items-center text-center">
							<div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-4">
								<Package className="h-6 w-6" />
							</div>
							<p className="text-sm font-medium">Track Shipment</p>
							<p className="text-xs text-blue-100 mt-1">Updates in dashboard</p>
						</div>
					</div>
				</div>

				{/* Final Actions */}
				<div className="flex flex-col sm:flex-row gap-4 print:hidden mb-8">
					<Link href="/shops" className="flex-1">
						<button className="w-full bg-black text-white px-8 py-4 rounded-2xl font-bold hover:bg-gray-800 transition-all transform hover:scale-[1.01] shadow-lg flex items-center justify-center">
							Continue Shopping
						</button>
					</Link>
					<Link href="/shops/account/orders" className="flex-1">
						<button className="w-full bg-white text-gray-900 border-2 border-gray-100 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center">
							View My Orders
							<ArrowRight className="ml-2 h-5 w-5" />
						</button>
					</Link>
				</div>
			</div>
		</div>
	);
}

function LoadingFallback() {
	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center">
			<div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-10 text-center">
				<Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600 mb-4" />
				<h2 className="text-xl font-bold text-gray-900">
					Loading confirmation...
				</h2>
				<p className="text-gray-500 mt-2">
					We're preparing your order details.
				</p>
			</div>
		</div>
	);
}

export default function CheckoutSuccessPage() {
	return (
		<Suspense fallback={<LoadingFallback />}>
			<CheckoutSuccessContent />
		</Suspense>
	);
}
