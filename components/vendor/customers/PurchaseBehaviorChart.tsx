"use client";

import { AnonymizedCustomer } from "@/types/vendor-analytics";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ShoppingBag } from "lucide-react";
import { formatUSD } from "@/lib/utils/currency";

interface PurchaseBehaviorChartProps {
	customers: AnonymizedCustomer[];
}

export function PurchaseBehaviorChart({ customers }: PurchaseBehaviorChartProps) {
	if (customers.length === 0) {
		return (
			<div className="text-center py-12 text-gray-500">
				<ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
				<p>No purchase behavior data available</p>
			</div>
		);
	}

	// Aggregate purchase data by category
	const categoryData = new Map<string, { count: number; revenue: number }>();

	customers.forEach(customer => {
		customer.purchaseHistory.forEach(purchase => {
			const category = purchase.category || 'Uncategorized';
			if (!categoryData.has(category)) {
				categoryData.set(category, { count: 0, revenue: 0 });
			}
			const data = categoryData.get(category)!;
			data.count += 1;
			data.revenue += purchase.amount;
		});
	});

	// Convert to chart data
	const categoryChartData = Array.from(categoryData.entries())
		.map(([category, data]) => ({
			category,
			orders: data.count,
			revenue: data.revenue,
			avgOrderValue: data.revenue / data.count
		}))
		.sort((a, b) => b.revenue - a.revenue)
		.slice(0, 10); // Top 10 categories

	// Order frequency distribution
	const orderFrequencyData = [
		{ range: '1 order', count: customers.filter(c => c.orderCount === 1).length },
		{ range: '2-4 orders', count: customers.filter(c => c.orderCount >= 2 && c.orderCount <= 4).length },
		{ range: '5-9 orders', count: customers.filter(c => c.orderCount >= 5 && c.orderCount <= 9).length },
		{ range: '10+ orders', count: customers.filter(c => c.orderCount >= 10).length }
	].filter(d => d.count > 0);

	// Lifetime value distribution
	const lifetimeValueRanges = [
		{ range: '$0-10k', min: 0, max: 10000 },
		{ range: '$10k-50k', min: 10000, max: 50000 },
		{ range: '$50k-100k', min: 50000, max: 100000 },
		{ range: '$100k+', min: 100000, max: Infinity }
	];

	const lifetimeValueData = lifetimeValueRanges.map(range => ({
		range: range.range,
		count: customers.filter(c => c.lifetimeValue >= range.min && c.lifetimeValue < range.max).length
	})).filter(d => d.count > 0);

	const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

	return (
		<div className="space-y-8">
			{/* Category Performance */}
			<div>
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					Top Categories by Revenue
				</h3>
				<ResponsiveContainer width="100%" height={300}>
					<BarChart data={categoryChartData}>
						<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
						<XAxis
							dataKey="category"
							tick={{ fill: '#6b7280', fontSize: 12 }}
							angle={-45}
							textAnchor="end"
							height={80}
						/>
						<YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
						<Tooltip
							contentStyle={{
								backgroundColor: '#fff',
								border: '1px solid #e5e7eb',
								borderRadius: '8px',
								padding: '12px'
							}}
							formatter={(value: number, name: string) => {
								if (name === 'revenue') {
									return [formatUSD(value), 'Revenue'];
								}
								if (name === 'avgOrderValue') {
									return [formatUSD(value), 'Avg Order Value'];
								}
								return [value, name];
							}}
						/>
						<Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Order Frequency Distribution */}
				<div>
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Order Frequency Distribution
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<PieChart>
							<Pie
								data={orderFrequencyData}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={({ range, percent }) => `${range}: ${(percent * 100).toFixed(0)}%`}
								outerRadius={80}
								fill="#8884d8"
								dataKey="count"
							>
								{orderFrequencyData.map((entry, index) => (
									<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
								))}
							</Pie>
							<Tooltip
								contentStyle={{
									backgroundColor: '#fff',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									padding: '12px'
								}}
							/>
						</PieChart>
					</ResponsiveContainer>
				</div>

				{/* Lifetime Value Distribution */}
				<div>
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						Customer Lifetime Value Distribution
					</h3>
					<ResponsiveContainer width="100%" height={250}>
						<BarChart data={lifetimeValueData}>
							<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
							<XAxis
								dataKey="range"
								tick={{ fill: '#6b7280', fontSize: 12 }}
							/>
							<YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
							<Tooltip
								contentStyle={{
									backgroundColor: '#fff',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									padding: '12px'
								}}
								formatter={(value: number) => [value, 'Customers']}
							/>
							<Bar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			{/* Summary Stats */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
				<div className="text-center">
					<p className="text-2xl font-bold text-gray-900">
						{(customers.reduce((sum, c) => sum + c.orderCount, 0) / customers.length).toFixed(1)}
					</p>
					<p className="text-sm text-gray-600">Avg Orders per Customer</p>
				</div>
				<div className="text-center">
					<p className="text-2xl font-bold text-gray-900">
						{formatUSD(customers.reduce((sum, c) => sum + c.averageOrderValue, 0) / customers.length)}
					</p>
					<p className="text-sm text-gray-600">Avg Order Value</p>
				</div>
				<div className="text-center">
					<p className="text-2xl font-bold text-gray-900">
						{formatUSD(customers.reduce((sum, c) => sum + c.lifetimeValue, 0) / customers.length)}
					</p>
					<p className="text-sm text-gray-600">Avg Lifetime Value</p>
				</div>
			</div>
		</div>
	);
}
