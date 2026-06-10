"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { UserOrder } from "@/types";
import
{
	MapPin,
	Calendar,
	Eye,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import
{
	formatDate,
	getOrderStatusColor,
	getOrderStatusText,
} from "@/lib/utils/order-utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface OrderCardProps
{
	orderGroup: UserOrder[]; // Array of items belonging to the same order
	onTrackOrder: (order: UserOrder) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
	orderGroup,
	onTrackOrder,
}) =>
{
	const [expanded, setExpanded] = React.useState(false);
	const { userCurrency } = useCurrency();

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

	// Calculate Totals
	const { subtotal, total, displayCurrency, shipping, tax } = useMemo(() =>
	{
		if (!mainOrder)
			return { subtotal: 0, total: 0, displayCurrency: "USD", shipping: 0, tax: 0 };

		const orderCurrency = mainOrder.currency || "USD";
		const isNGN = orderCurrency === "NGN";

		// For NGN orders: use source_price (NGN) for items, shipping_fee and tax are already in NGN
		// For USD orders: use original_price/price, shipping_fee and tax are in USD
		let subtotalVal = 0;
		orderGroup.forEach((item) =>
		{
			const itemPrice = isNGN
				? (item.source_price || item.price || 0)
				: (item.original_price || item.price || 0);
			subtotalVal += itemPrice * item.quantity;
		});

		const shippingVal = mainOrder.shipping_fee || 0;
		const taxVal = mainOrder.tax || 0;

		return {
			subtotal: subtotalVal,
			shipping: shippingVal,
			tax: taxVal,
			total: subtotalVal + shippingVal + taxVal,
			displayCurrency: orderCurrency,
		};
	}, [orderGroup, mainOrder]);

	if (!mainOrder) return null;

	const toggleExpanded = () => setExpanded(!expanded);

	// Visible items: Show first 2, others hidden in expand
	const visibleItems = expanded ? orderGroup : orderGroup.slice(0, 2);
	const hiddenCount = orderGroup.length - 2;

	// Helper to format currency
	const fmt = (amount: number, curr: string) =>
	{
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
								<span>Placed {formatDate(mainOrder.createdAt ?? (mainOrder as any).timestamp)}</span>
							</div>
							<div className="font-medium text-gray-900">
								Total: {fmt(total, displayCurrency)}
							</div>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<button
							onClick={() => onTrackOrder(mainOrder)}
							className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium"
						>
							<Eye size={16} />
							<span>Track Order</span>
						</button>
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
				{visibleItems.map((item, idx) =>
				{
					// Per item pricing — use source_price for NGN orders, original_price/price for USD
					const isNGN = mainOrder.currency === "NGN";
					const itemPrice = isNGN
						? (item.source_price || item.price || 0)
						: (item.original_price || item.price || 0);
					const itemCurrency = mainOrder.currency || "USD";

					return (
						<div
							key={`${item.product_id}-${idx}`}
							className="flex gap-4 cursor-pointer hover:bg-gray-50 rounded-lg p-2 -mx-2 transition-colors group"
							onClick={() => onTrackOrder(item)}
						>
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
									<div className="flex-1 min-w-0">
										<h4 className="text-base font-medium text-gray-900 mb-1 truncate pr-4">
											{item.title}
										</h4>
										<p className="text-sm text-gray-600 mb-2 line-clamp-1">
											{item.description}
										</p>
									</div>
									<div className="text-right whitespace-nowrap flex flex-col items-end gap-1">
										<span className="block font-medium text-gray-900">
											{fmt(itemPrice, itemCurrency)}
										</span>
										{item.quantity > 1 && (
											<span className="text-xs text-gray-500">
												x {item.quantity}
											</span>
										)}
										<span className="text-xs text-gray-400 group-hover:text-black transition-colors flex items-center gap-1">
											<Eye size={11} /> Track
										</span>
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
