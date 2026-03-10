"use client";

import { useMemo, useState, useEffect } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import { DataTableGA, ColumnDef } from "@/components/analytics/DataTableGA";
import {
	ComposedChart,
	Line,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import { ShoppingCart, DollarSign, TrendingUp, Users } from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
	getTopVisitedVendors,
	type VendorVisitData,
} from "@/services/vendorAnalytics";
import {
	getOrderAnalytics,
	getTopSellingVendors,
	getTopSellingProducts,
	getSalesByRegion,
	getDailyOrdersTrend,
	type OrderAnalytics,
	type TopVendor,
	type TopProduct,
	type RegionalSales,
} from "@/services/orderAnalytics";
import {
	getTotalVendorsOnboarded,
	getVendorsWithProducts,
} from "@/services/vendorOnboardingAnalytics";

interface VendorData {
	name: string;
	value: string;
	amount?: number;
}

interface ProductData {
	name: string;
	value: string;
	sales?: number;
}

const VendorSalesDashboard = () => {
	const { dateRange } = useDateRange();
	const [topVisitedVendorsData, setTopVisitedVendorsData] = useState<
		VendorData[]
	>([]);
	const [loading, setLoading] = useState(true);
	const [orderAnalytics, setOrderAnalytics] = useState<OrderAnalytics>({
		totalOrders: 0,
		totalSales: 0,
		averageOrderValue: 0,
	});
	const [totalVendors, setTotalVendors] = useState(0);
	const [vendorsWithProducts, setVendorsWithProducts] = useState(0);
	const [topSellingVendorsData, setTopSellingVendorsData] = useState<
		TopVendor[]
	>([]);
	const [topSellingProductsData, setTopSellingProductsData] = useState<
		TopProduct[]
	>([]);
	const [regionalSalesData, setRegionalSalesData] = useState<RegionalSales[]>(
		[]
	);
	const [ordersTrend, setOrdersTrend] = useState<
		Array<{ day: number; orders: number; sales: number; date: string }>
	>([]);

	// Calculate number of days in the selected range
	const daysDiff = useMemo(() => {
		return (
			Math.ceil(
				(dateRange.end.getTime() - dateRange.start.getTime()) /
					(1000 * 60 * 60 * 24)
			) + 1
		);
	}, [dateRange]);

	// Fetch all vendor analytics from Firebase
	useEffect(() => {
		const fetchAnalytics = async () => {
			setLoading(true);
			try {
				// Fetch all analytics data in parallel
				const [
					visitedVendors,
					ordersData,
					vendorsCount,
					vendorsWithProductsCount,
					sellingVendors,
					sellingProducts,
					regionalSales,
				] = await Promise.all([
					getTopVisitedVendors(10, dateRange.start, dateRange.end),
					getOrderAnalytics(dateRange.start, dateRange.end),
					getTotalVendorsOnboarded(),
					getVendorsWithProducts(),
					getTopSellingVendors(5, dateRange.start, dateRange.end),
					getTopSellingProducts(10, dateRange.start, dateRange.end),
					getSalesByRegion(dateRange.start, dateRange.end),
				]);

				// Transform visited vendors data
				const transformedVisitedData: VendorData[] = visitedVendors.map(
					(vendor) => ({
						name: vendor.vendor_name,
						value: vendor.total_visits.toString(),
						amount: vendor.total_visits,
					})
				);

				setTopVisitedVendorsData(transformedVisitedData);
				setOrderAnalytics(ordersData);
				setTotalVendors(vendorsCount);
				setVendorsWithProducts(vendorsWithProductsCount);
				setTopSellingVendorsData(sellingVendors);
				setTopSellingProductsData(sellingProducts);
				setRegionalSalesData(regionalSales);
			} catch (error) {
				console.error("Error fetching vendor analytics:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchAnalytics();
	}, [dateRange]); // Re-fetch when date range changes

	// Fetch orders trend when date range changes
	useEffect(() => {
		const fetchTrend = async () => {
			try {
				const trend = await getDailyOrdersTrend(daysDiff);
				setOrdersTrend(trend);
			} catch (error) {
				console.error("Error fetching orders trend:", error);
			}
		};

		if (daysDiff > 0) {
			fetchTrend();
		}
	}, [daysDiff]);

	// Use real orders trend data
	const ordersData = useMemo(() => {
		if (ordersTrend.length > 0) {
			return ordersTrend;
		}
		// Fallback while loading
		return Array.from({ length: daysDiff }, (_, i) => ({
			day: i + 1,
			orders: 0,
			sales: 0,
			date: "",
		}));
	}, [ordersTrend, daysDiff]);

	// GA color palette
	const gaColors = {
		blue: "#1A73E8",
		green: "#0F9D58",
		orange: "#F9AB00",
		red: "#EA4335",
		purple: "#9334E9",
		teal: "#06B6D4",
		pink: "#EC4899",
		yellow: "#EAB308",
	};

	// Transform regional sales data for pie chart
	const salesByRegion = useMemo(() => {
		const colors = [
			gaColors.blue,
			gaColors.green,
			gaColors.orange,
			gaColors.purple,
			gaColors.teal,
			gaColors.pink,
			gaColors.yellow,
			gaColors.red,
		];
		return regionalSalesData.slice(0, 8).map((region, index) => ({
			name: region.country,
			value: region.total_sales,
			label: new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(region.total_sales),
			color: colors[index % colors.length],
		}));
	}, [regionalSalesData, gaColors]);

	// Transform top selling vendors for table
	const topSellingVendors: VendorData[] = useMemo(() => {
		return topSellingVendorsData.map((vendor) => ({
			name: vendor.tailor_name,
			value: vendor.order_count.toString(),
			amount: vendor.total_sales,
		}));
	}, [topSellingVendorsData]);

	// Transform top selling products for table
	const topSellingProducts: ProductData[] = useMemo(() => {
		return topSellingProductsData.map((product) => ({
			name: product.title,
			value: new Intl.NumberFormat("en-US", {
				style: "currency",
				currency: "USD",
			}).format(product.total_sales),
			sales: product.units_sold,
		}));
	}, [topSellingProductsData]);

	// Column definitions for DataTableGA
	const vendorColumns: ColumnDef<VendorData>[] = [
		{
			key: "name",
			header: "Vendor Name",
			accessor: (row) => (
				<span
					className="font-medium block truncate max-w-[200px]"
					title={row.name}
				>
					{row.name}
				</span>
			),
			sortable: true,
		},
		{
			key: "amount",
			header: "Amount Grossed",
			accessor: (row) => (
				<span className="text-ga-secondary whitespace-nowrap">
					${row.amount?.toLocaleString() || row.value}
				</span>
			),
			sortable: true,
		},
	];

	const visitedVendorColumns: ColumnDef<VendorData>[] = [
		{
			key: "name",
			header: "Vendor Name",
			accessor: (row) => (
				<span
					className="font-medium block truncate max-w-[200px]"
					title={row.name}
				>
					{row.name}
				</span>
			),
			sortable: true,
		},
		{
			key: "amount",
			header: "Visits",
			accessor: (row) => (
				<span className="text-ga-secondary whitespace-nowrap">
					{row.amount?.toLocaleString() || row.value}
				</span>
			),
			sortable: true,
		},
	];

	const productColumns: ColumnDef<ProductData>[] = [
		{
			key: "name",
			header: "Product Name",
			accessor: (row) => (
				<span
					className="font-medium block truncate max-w-[250px]"
					title={row.name}
				>
					{row.name}
				</span>
			),
			sortable: true,
		},
		{
			key: "sales",
			header: "Units Sold",
			accessor: (row) => (
				<span className="text-ga-secondary whitespace-nowrap">
					{row.sales?.toLocaleString() || row.value}
				</span>
			),
			sortable: true,
		},
	];

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Top Row - Metrics with GA styling */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
				<MetricCardGA
					label="Number of Merch/vendors Onboarded"
					value={loading ? 0 : totalVendors}
					format="number"
					icon={<Users className="w-5 h-5" />}
					change={12.5}
					trend="up"
					isLoading={loading}
				/>
				<MetricCardGA
					label="Vendors with Products"
					value={loading ? 0 : vendorsWithProducts}
					format="number"
					icon={<Users className="w-5 h-5" />}
					change={8.1}
					trend="up"
					isLoading={loading}
				/>
				<MetricCardGA
					label="Total Orders"
					value={loading ? 0 : orderAnalytics.totalOrders}
					format="number"
					icon={<ShoppingCart className="w-5 h-5" />}
					change={8.3}
					trend="up"
					isLoading={loading}
				/>
				<MetricCardGA
					label="Total Sales"
					value={loading ? 0 : orderAnalytics.totalSales}
					format="currency"
					icon={<DollarSign className="w-5 h-5" />}
					change={15.7}
					trend="up"
					isLoading={loading}
				/>
				<MetricCardGA
					label="Average Order Value (AOV)"
					value={loading ? 0 : orderAnalytics.averageOrderValue}
					format="currency"
					icon={<TrendingUp className="w-5 h-5" />}
					change={5.2}
					trend="up"
					isLoading={loading}
				/>
			</div>

			{/* Middle Row - Data Tables */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				<div>
					<h3 className="text-lg font-semibold text-ga-primary mb-3 font-ga">
						Top Selling Vendors (amount Grossed)
					</h3>
					{loading ? (
						<div className="flex items-center justify-center h-64">
							<div className="animate-pulse space-y-3 w-full">
								{[...Array(5)].map((_, i) => (
									<div
										key={i}
										className="flex justify-between p-3 bg-ga-surface rounded"
									>
										<div className="h-4 bg-ga-border rounded w-1/3"></div>
										<div className="h-4 bg-ga-border rounded w-1/4"></div>
									</div>
								))}
							</div>
						</div>
					) : topSellingVendors.length > 0 ? (
						<DataTableGA
							columns={vendorColumns}
							data={topSellingVendors}
							pagination={false}
						/>
					) : (
						<div className="flex items-center justify-center h-64 text-ga-secondary">
							<p>No vendor sales data available</p>
						</div>
					)}
				</div>
				<div>
					<h3 className="text-lg font-semibold text-ga-primary mb-3 font-ga">
						Top Visited Vendors (Visits)
					</h3>
					{loading ? (
						<div className="flex items-center justify-center h-64">
							<div className="animate-pulse space-y-3 w-full">
								{[...Array(5)].map((_, i) => (
									<div
										key={i}
										className="flex justify-between p-3 bg-ga-surface rounded"
									>
										<div className="h-4 bg-ga-border rounded w-1/3"></div>
										<div className="h-4 bg-ga-border rounded w-1/4"></div>
									</div>
								))}
							</div>
						</div>
					) : topVisitedVendorsData.length > 0 ? (
						<DataTableGA
							columns={visitedVendorColumns}
							data={topVisitedVendorsData}
							pagination={false}
						/>
					) : (
						<div className="flex items-center justify-center h-64 text-ga-secondary">
							<p>No vendor visit data available</p>
						</div>
					)}
				</div>
				<div>
					<h3 className="text-lg font-semibold text-ga-primary mb-3 font-ga">
						Top Selling Products
					</h3>
					{loading ? (
						<div className="flex items-center justify-center h-64">
							<div className="animate-pulse space-y-3 w-full">
								{[...Array(10)].map((_, i) => (
									<div
										key={i}
										className="flex justify-between p-3 bg-ga-surface rounded"
									>
										<div className="h-4 bg-ga-border rounded w-1/3"></div>
										<div className="h-4 bg-ga-border rounded w-1/4"></div>
									</div>
								))}
							</div>
						</div>
					) : topSellingProducts.length > 0 ? (
						<DataTableGA
							columns={productColumns}
							data={topSellingProducts}
							pagination={false}
						/>
					) : (
						<div className="flex items-center justify-center h-64 text-ga-secondary">
							<p>No product sales data available</p>
						</div>
					)}
				</div>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				<ChartCard title="Order (Count) and Sales" height={320}>
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart data={ordersData}>
							<defs>
								<linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor={gaColors.blue}
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor={gaColors.blue}
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								strokeDasharray="3 3"
								stroke="hsl(var(--ga-border))"
							/>
							<XAxis
								dataKey="day"
								stroke="hsl(var(--ga-text-secondary))"
								style={{ fontSize: "12px" }}
							/>
							<YAxis
								yAxisId="left"
								stroke="hsl(var(--ga-text-secondary))"
								style={{ fontSize: "12px" }}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								stroke="hsl(var(--ga-text-secondary))"
								style={{ fontSize: "12px" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--ga-background))",
									border: "1px solid hsl(var(--ga-border))",
									borderRadius: "8px",
									boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
								}}
								labelStyle={{ color: "hsl(var(--ga-text-primary))" }}
							/>
							<Legend wrapperStyle={{ fontSize: "14px" }} />
							<Bar
								yAxisId="right"
								dataKey="sales"
								fill={gaColors.blue}
								radius={[4, 4, 0, 0]}
								name="Sales ($)"
							/>
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="orders"
								stroke={gaColors.green}
								strokeWidth={3}
								dot={{ fill: gaColors.green, r: 4 }}
								activeDot={{ r: 6 }}
								name="Order Count"
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</ChartCard>

				<ChartCard title="Sales by Regions" height={320}>
					{loading || salesByRegion.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p className="text-muted-foreground">
								{loading
									? "Loading regional sales..."
									: "No regional sales data"}
							</p>
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={salesByRegion}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={120}
									paddingAngle={2}
									dataKey="value"
									label={({ name, label }) => `${name}: ${label}`}
									labelLine={{ stroke: "hsl(var(--ga-text-secondary))" }}
								>
									{salesByRegion.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									formatter={(value: number) => `$${value.toLocaleString()}`}
									contentStyle={{
										backgroundColor: "hsl(var(--ga-background))",
										border: "1px solid hsl(var(--ga-border))",
										borderRadius: "8px",
										boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					)}
				</ChartCard>
			</div>
		</div>
	);
};

export default VendorSalesDashboard;
