"use client";

import React, { useMemo } from "react";
import { UserOrder } from "@/types";
import { OrderCard } from "./OrderCard";

interface OrderListProps {
	orders: UserOrder[];
	onTrackOrder: (order: UserOrder) => void; // Keeps compatibility, but we might need to pass the whole group
}

export const OrderList: React.FC<OrderListProps> = ({
	orders,
	onTrackOrder,
}) => {
	// Group orders by order_id
	const groupedOrders = useMemo(() => {
		const groups: Record<string, UserOrder[]> = {};

		orders.forEach((order) => {
			const orderId = order.order_id;
			if (!groups[orderId]) {
				groups[orderId] = [];
			}
			groups[orderId].push(order);
		});

		// Sort by created date (newest first)
		// We assume all items in an order have the same createdAt
		return Object.entries(groups).sort(([, itemsA], [, itemsB]) => {
			const dateA = new Date(itemsA[0].createdAt).getTime();
			const dateB = new Date(itemsB[0].createdAt).getTime();
			return dateB - dateA;
		});
	}, [orders]);

	return (
		<div className="space-y-6">
			{groupedOrders.map(([orderId, items]) => (
				<OrderCard
					key={orderId}
					orderGroup={items}
					onTrackOrder={onTrackOrder}
				/>
			))}
		</div>
	);
};
