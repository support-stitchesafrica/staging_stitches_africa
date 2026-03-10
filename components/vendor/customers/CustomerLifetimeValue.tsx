"use client";

import { CustomerSegment, AnonymizedCustomer } from "@/types/vendor-analytics";
import { TrendingUp, DollarSign, ShoppingBag, Users } from "lucide-react";
import { formatUSD } from "@/lib/utils/currency";

interface CustomerLifetimeValueProps {
	segment: CustomerSegment;
	customers: AnonymizedCustomer[];
}

export function CustomerLifetimeValue({ segment, customers }: CustomerLifetimeValueProps) {
	// Calculate additional metrics
	const totalOrders = customers.reduce((sum, c) => sum + c.orderCount, 0);
	const avgLifetimeValue = customers.length > 0
		? customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length
		: 0;

	// Sort customers by lifetime value
	const topCustomers = [...customers]
		.sort((a, b) => b.lifetimeValue - a.lifetimeValue)
		.slice(0, 5);

	// Calculate value distribution
	const valueRanges = [
		{ label: '$0-10k', min: 0, max: 10000, count: 0 },
		{ label: '$10k-50k', min: 10000, max: 50000, count: 0 },
		{ label: '$50k-100k', min: 50000, max: 100000, count: 0 },
		{ label: '$100k+', min: 100000, max: Infinity, count: 0 }
	];

	customers.forEach(customer => {
		const range = valueRanges.find(r => customer.lifetimeValue >= r.min && customer.lifetimeValue < r.max);
		if (range) range.count++;
	});

	const maxCount = Math.max(...valueRanges.map(r => r.count));

	return (
		<div className="space-y-6">
			{/* Key Metrics */}
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				<div className="bg-gray-50 rounded-lg p-4">
					<div className="flex items-center space-x-2 mb-2">
						<Users className="h-4 w-4 text-gray-600" />
						<span className="text-xs text-gray-600">Customers</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">
						{segment.count.toLocaleString()}
					</p>
				</div>

				<div className="bg-gray-50 rounded-lg p-4">
					<div className="flex items-center space-x-2 mb-2">
						<DollarSign className="h-4 w-4 text-gray-600" />
						<span className="text-xs text-gray-600">Total Revenue</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">
						{formatUSD(segment.totalRevenue)}
					</p>
				</div>

				<div className="bg-gray-50 rounded-lg p-4">
					<div className="flex items-center space-x-2 mb-2">
						<TrendingUp className="h-4 w-4 text-gray-600" />
						<span className="text-xs text-gray-600">Avg LTV</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">
						{formatUSD(avgLifetimeValue)}
					</p>
				</div>

				<div className="bg-gray-50 rounded-lg p-4">
					<div className="flex items-center space-x-2 mb-2">
						<ShoppingBag className="h-4 w-4 text-gray-600" />
						<span className="text-xs text-gray-600">Total Orders</span>
					</div>
					<p className="text-2xl font-bold text-gray-900">
						{totalOrders.toLocaleString()}
					</p>
				</div>
			</div>

			{/* Value Distribution */}
			<div>
				<h4 className="text-sm font-semibold text-gray-900 mb-3">
					Lifetime Value Distribution
				</h4>
				<div className="space-y-3">
					{valueRanges.map((range, index) => {
						const percentage = customers.length > 0 ? (range.count / customers.length) * 100 : 0;
						const barWidth = maxCount > 0 ? (range.count / maxCount) * 100 : 0;

						return (
							<div key={index} className="space-y-1">
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-700 font-medium">{range.label}</span>
									<span className="text-gray-600">
										{range.count} ({percentage.toFixed(1)}%)
									</span>
								</div>
								<div className="relative h-6 bg-gray-100 rounded overflow-hidden">
									<div
										className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500"
										style={{ width: `${barWidth}%` }}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</div>

			{/* Top Customers */}
			{topCustomers.length > 0 && (
				<div>
					<h4 className="text-sm font-semibold text-gray-900 mb-3">
						Top 5 Customers by Lifetime Value
					</h4>
					<div className="space-y-2">
						{topCustomers.map((customer, index) => (
							<div
								key={customer.customerId}
								className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
							>
								<div className="flex items-center space-x-3">
									<div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
										{index + 1}
									</div>
									<div>
										<p className="text-sm font-medium text-gray-900 font-mono">
											{customer.customerId.substring(0, 12)}...
										</p>
										<p className="text-xs text-gray-600">
											{customer.location.city}, {customer.location.state}
										</p>
									</div>
								</div>
								<div className="text-right">
									<p className="text-sm font-bold text-gray-900">
										{formatUSD(customer.lifetimeValue)}
									</p>
									<p className="text-xs text-gray-600">
										{customer.orderCount} order{customer.orderCount !== 1 ? 's' : ''}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Insights */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
				<h4 className="text-sm font-semibold text-blue-900 mb-2">
					💡 Insights
				</h4>
				<ul className="space-y-1 text-sm text-blue-800">
					<li>
						• Average order value: {formatUSD(segment.averageOrderValue)}
					</li>
					<li>
						• Average purchase frequency: {segment.averagePurchaseFrequency.toFixed(1)} orders per customer
					</li>
					<li>
						• This segment represents {segment.percentage.toFixed(1)}% of your customer base
					</li>
					{segment.totalRevenue > 0 && (
						<li>
							• Contributing {formatUSD(segment.totalRevenue)} in total revenue
						</li>
					)}
				</ul>
			</div>
		</div>
	);
}
