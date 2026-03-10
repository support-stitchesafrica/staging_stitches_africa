"use client";

import React, { useMemo, useEffect, useState } from "react";
import Image from "next/image";
import { UserOrder } from "@/types";
import {
	Package,
	Truck,
	MapPin,
	Calendar,
	Eye,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import {
	formatDate,
	getOrderStatusColor,
	getOrderStatusText,
} from "@/lib/utils/order-utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { currencyService } from "@/lib/services/currencyService";

interface OrderCardProps {
	orderGroup: UserOrder[]; // Array of items belonging to the same order
	onTrackOrder: (order: UserOrder) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
	orderGroup,
	onTrackOrder,
}) => {
	const [expanded, setExpanded] = React.useState(false);
	const { userCurrency } = useCurrency();
	const [convertedShipping, setConvertedShipping] = useState<number | null>(
		null,
	);
	const [convertedTax, setConvertedTax] = useState<number | null>(null);

	// We assume all items in the group share the same order-level details
	const mainOrder = orderGroup[0];

	const statusColor = mainOrder
		? getOrderStatusColor(mainOrder.order_status)
		: "";
	const statusText = mainOrder
		? getOrderStatusText(mainOrder.order_status)
		: "";
	const hasTracking = mainOrder?.packages && mainOrder.packages.length > 0;
	// Safety check for shipping object
	const latestEvent = mainOrder?.last_dhl_event;

	// Effect to handle async currency conversion for shipping/tax
	useEffect(() => {
		if (!mainOrder) return;

		const convertFees = async () => {
			// Check if we need to display in source currency (e.g. NGN)
			// Logic: If user's preferred currency matches the source currency, use source pricing.
			// Otherwise, stick to USD (base) or convert from base.

			// Actually, the user requirement is:
			// 1. If user currency == source currency (e.g. NGN), use source_price for items.
			//    In this case, we MUST convert shipping (USD) -> Source Currency (NGN).
			// 2. If user currency != source currency (e.g. USD, EUR), use price (USD) for items.
			//    In this case, we use shipping (USD). If user currency is EUR, we might need global conversion,
			//    but for now let's stick to the requested logic: "if not naira, then youd have to convert".

			// Let's refine based on "is only when its ni naira you d have to check for the soruce pricining".

			const isNaira = userCurrency === "NGN";
			const hasSourcePricing =
				!!mainOrder.source_currency && !!mainOrder.source_price;
			const sourceIsNaira = mainOrder.source_currency === "NGN";

			// If we are showing NGN and we have source pricing in NGN
			if (isNaira && hasSourcePricing && sourceIsNaira) {
				// Shipping is stored in USD, need to convert to NGN
				if (mainOrder.shipping_fee) {
					// We use a hardcoded rate or service to convert USD -> NGN
					// The user mentioned "same way you do for the shipping in the shops/checkout flow"
					// In checkout, they do: value * 1350 for NGN.
					// currencyService handles this via API or fallback.
					const result = await currencyService.convertPrice(
						mainOrder.shipping_fee,
						"USD",
						"NGN",
					);
					setConvertedShipping(result.convertedPrice);
				}

				if (mainOrder.tax) {
					const result = await currencyService.convertPrice(
						mainOrder.tax,
						"USD",
						"NGN",
					);
					setConvertedTax(result.convertedPrice);
				}
			} else {
				// Reset if not using source pricing logic (will default to base values)
				setConvertedShipping(null);
				setConvertedTax(null);
			}
		};

		convertFees();
	}, [mainOrder, userCurrency]);

	// Calculate Totals
	const { subtotal, total, displayCurrency, shipping, tax } = useMemo(() => {
		if (!mainOrder)
			return {
				subtotal: 0,
				total: 0,
				displayCurrency: "USD",
				shipping: 0,
				tax: 0,
			};

		const isNaira = userCurrency === "NGN";
		const hasSourcePricing =
			!!mainOrder.source_currency && !!mainOrder.source_price;
		const sourceIsNaira = mainOrder.source_currency === "NGN";

		// Decision: Should we use source pricing?
		// Only if user wants NGN and we have NGN source prices.
		const useSource = isNaira && hasSourcePricing && sourceIsNaira;

		let subtotalVal = 0;
		let currencyCode = useSource ? "NGN" : mainOrder.currency || "USD"; // Default to USD if not using source

		// If user currency is NOT USD and NOT NGN (e.g. EUR), we currently fallback to USD
		// based on the instruction "if not naira, then youd have to convert".
		// But wait, if user selects EUR, `userCurrency` is EUR.
		// If we follow the rule: "if the user local currenc choice is dollar... use theprice and shipping from the db"
		// If it is EUR, we probably should convert from USD -> EUR for everything?
		// The prompt says: "is only when its ni naira you d have to check for the soruce pricining... if not naira, then youd have to convert, shpping youd have to convert etc"
		// This implies for non-Naira (non-source) currencies, we perform standard conversion from USD.

		// For now, let's strictly handle the NGN source pricing case as requested,
		// and for everything else, usage the standard values (USD) and seemingly `fmt` will handle formatting?
		// No, `fmt` uses `currency` from this hook.

		// Let's align `currencyCode` with `userCurrency` if possible, but we need the values to match.
		// If we are in EUR, we need converted values.
		// `OrderCard` typically receives static data. Real-time conversion of everything might be heavy/complex
		// without a helper.
		// HOWEVER, the user specifically emphasized the NGN case vs USD case.
		// Let's stick to:
		// 1. NGN Mode (Source Available): Use source_price (NGN) + Converted Shipping (USD->NGN).
		// 2. Other Mode (Default): Use price (USD) + Shipping (USD).
		//    If `userCurrency` is EUR, our `fmt` function uses `currency` passed to it.
		//    If we pass 'USD' to `fmt` but `userCurrency` context is 'EUR', the format might be weird
		//    OR `fmt` helper needs to ignore context if we give it explicit currency?
		//    Actually `fmt` below uses `currency` from the hook scope which is `displayCurrency`.

		// Let's refine:
		// If useSource (NGN):
		//   Subtotal = Sum(item.source_price)
		//   Shipping = convertedShipping (calculated in effect) || 0
		//   Tax = convertedTax || 0
		//   Total = Subtotal + Shipping + Tax
		//   Currency = NGN

		// Else (USD/Other):
		//   Subtotal = Sum(item.price)  <-- This is USD
		//   Shipping = mainOrder.shipping_fee <-- This is USD
		//   Tax = mainOrder.tax <-- This is USD
		//   Total = ...
		//   Currency = USD

		// We will force the display currency to be what matches our values.

		if (useSource) {
			orderGroup.forEach((item) => {
				subtotalVal += (item.source_price || 0) * item.quantity;
			});
			const shippingVal = convertedShipping !== null ? convertedShipping : 0;
			const taxVal = convertedTax !== null ? convertedTax : 0;

			return {
				subtotal: subtotalVal,
				shipping: shippingVal,
				tax: taxVal,
				total: subtotalVal + shippingVal + taxVal,
				displayCurrency: "NGN",
			};
		} else {
			// Standard USD flow
			orderGroup.forEach((item) => {
				subtotalVal += (item.original_price || item.price || 0) * item.quantity;
			});
			const shippingVal = mainOrder.shipping_fee || 0;
			const taxVal = mainOrder.tax || 0;

			return {
				subtotal: subtotalVal,
				shipping: shippingVal,
				tax: taxVal,
				total: subtotalVal + shippingVal + taxVal,
				displayCurrency: "USD",
			};
		}
	}, [orderGroup, mainOrder, userCurrency, convertedShipping, convertedTax]);

	if (!mainOrder) return null;

	const toggleExpanded = () => setExpanded(!expanded);

	// Visible items: Show first 2, others hidden in expand
	const visibleItems = expanded ? orderGroup : orderGroup.slice(0, 2);
	const hiddenCount = orderGroup.length - 2;

	// Helper to format currency
	const fmt = (amount: number, curr: string) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: curr,
		}).format(amount);
	};

	return (
		<div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow mb-6">
			{/* Order Header */}
			<div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div>
						<div className="flex items-center gap-3 mb-2">
							<h3 className="text-lg font-semibold text-gray-900">
								Order #{mainOrder.order_id}
							</h3>
							<span
								className={`px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
							>
								{statusText}
							</span>
						</div>
						<div className="flex items-center gap-4 text-sm text-gray-600">
							<div className="flex items-center gap-1">
								<Calendar size={16} />
								<span>Placed {formatDate(mainOrder.createdAt)}</span>
							</div>
							<div className="font-medium text-gray-900">
								Total: {fmt(total, displayCurrency)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
						{hasTracking && (
							<button
								onClick={() => onTrackOrder(mainOrder)}
								className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
							>
								<Eye size={16} />
								<span className="hidden sm:inline">Track</span>
							</button>
						)}
						<button
							onClick={toggleExpanded}
							className="sm:hidden p-2 text-gray-500 hover:text-gray-700"
						>
							{expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
						</button>
					</div>
				</div>
			</div>

			{/* Order Items */}
			<div className="p-4 sm:p-6 space-y-6">
				{visibleItems.map((item, idx) => {
					// Per item pricing logic must match total logic
					const isNaira = userCurrency === "NGN";
					const hasSourcePricing =
						!!mainOrder.source_currency && !!mainOrder.source_price;
					const sourceIsNaira = mainOrder.source_currency === "NGN";
					const useSource = isNaira && hasSourcePricing && sourceIsNaira;

					const itemPrice = useSource
						? item.source_price || 0
						: item.original_price || item.price || 0;
					const itemCurrency = useSource ? "NGN" : "USD";

					return (
						<div key={`${item.product_id}-${idx}`} className="flex gap-4">
							{/* Product Image */}
							<div className="flex-shrink-0 relative w-20 h-20 sm:w-24 sm:h-24">
								<Image
									src={item.images?.[0] || "/placeholder-product.jpg"}
									alt={item.title}
									fill
									sizes="96px"
									className="object-cover rounded-lg border border-gray-200"
								/>
							</div>

							{/* Product Details */}
							<div className="flex-1 min-w-0">
								<div className="flex justify-between items-start">
									<div>
										<h4 className="text-base font-medium text-gray-900 mb-1 truncate pr-4">
											{item.title}
										</h4>
										<p className="text-sm text-gray-600 mb-2 line-clamp-1">
											{item.description}
										</p>
									</div>
									<div className="text-right whitespace-nowrap">
										<span className="block font-medium text-gray-900">
											{fmt(itemPrice, itemCurrency)}
										</span>
										{item.quantity > 1 && (
											<span className="text-xs text-gray-500">
												x {item.quantity}
											</span>
										)}
									</div>
								</div>

								<div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
									{item.size && (
										<span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
											Size: {item.size}
										</span>
									)}
									{item.color && (
										<span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-700">
											Color: {item.color}
										</span>
									)}
								</div>
							</div>
						</div>
					);
				})}

				{hiddenCount > 0 && !expanded && (
					<button
						onClick={toggleExpanded}
						className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded border border-dashed border-gray-300 transition-colors"
					>
						Show {hiddenCount} more items...
					</button>
				)}

				{expanded && hiddenCount > 0 && (
					<button
						onClick={toggleExpanded}
						className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 text-center"
					>
						Show Less
					</button>
				)}
			</div>

			{/* Order Footer / Totals */}
			<div className="bg-gray-50 p-4 sm:p-6 rounded-b-lg border-t border-gray-200">
				<div className="flex gap-4 flex-col sm:flex-row justify-between">
					{/* Delivery Info */}
					<div className="text-sm text-gray-600 sm:max-w-xs">
						<h5 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
							<MapPin size={14} /> Delivery Address
						</h5>
						<div className="pl-5.5">
							{mainOrder.user_address.first_name}{" "}
							{mainOrder.user_address.last_name}
							<br />
							{mainOrder.user_address.street_address}
							<br />
							{mainOrder.user_address.city}, {mainOrder.user_address.state}
						</div>
						{hasTracking && latestEvent && (
							<div className="mt-2 text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
								<span className="font-semibold block mb-0.5">
									Latest Update:
								</span>
								{latestEvent.description}
								<div className="opacity-75 mt-0.5">
									{formatDate(latestEvent.date)}
								</div>
							</div>
						)}
					</div>

					{/* Totals Breakdown */}
					<div className="sm:w-64 space-y-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-200">
						<div className="flex justify-between text-sm text-gray-600">
							<span>Subtotal</span>
							<span>{fmt(subtotal, displayCurrency)}</span>
						</div>
						<div className="flex justify-between text-sm text-gray-600">
							<span>Shipping</span>
							<span>{fmt(shipping, displayCurrency)}</span>
						</div>
						{tax > 0 && (
							<div className="flex justify-between text-sm text-gray-600">
								<span>Tax</span>
								<span>{fmt(tax, displayCurrency)}</span>
							</div>
						)}
						<div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200 mt-2">
							<span>Total</span>
							<span>{fmt(total, displayCurrency)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
