"use client";

import { useMemo, useEffect, useCallback } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Area,
	AreaChart,
} from "recharts";
import { Download, Smartphone, Globe, Target, ArrowRight } from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
	getUserAnalytics,
	getWebSignupCount,
} from "@/services/installAnalytics";
import {
	getTopViewedProducts,
} from "@/services/productAnalytics";
import {
	getTopSearchTerms,
} from "@/services/searchAnalytics";
import {
	getUsersByCountry,
} from "@/services/userLocationAnalytics";
import {
	getAverageSessionTime,
	getTotalAppUsage,
	formatSessionTime,
} from "@/services/sessionAnalytics";
import {
	getCartAnalytics,
	getTopCartProducts,
} from "@/services/cartAnalytics";
import {
	getActiveUsersStats,
	getDailyActiveUsersTrend,
	formatGenderDistribution,
} from "@/services/activeUserAnalytics";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { analytics, trackAsyncOperation } from "@/lib/analytics";
import { useCachedData } from "@/lib/utils/cache-utils";
import { AnalyticsCardSkeleton, ChartSkeleton } from "@/components/ui/optimized-loader";

// Skeleton component for metrics
const MetricSkeleton = () => (
	<div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm animate-pulse">
		<div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
		<div className="w-16 h-8 bg-gray-200 rounded mb-1"></div>
		<div className="w-12 h-3 bg-gray-200 rounded"></div>
	</div>
);

const UserDashboard = () => {
	const { dateRange } = useDateRange();
	const router = useRouter();
	
	// Track page view
	useEffect(() => {
		analytics.trackPageView('/atlas/dashboard', 'Atlas User Dashboard');
	}, []);

	// Calculate number of days in the selected range
	const daysDiff = useMemo(() => {
		return (
			Math.ceil(
				(dateRange.end.getTime() - dateRange.start.getTime()) /
					(1000 * 60 * 60 * 24)
			) + 1
		);
	}, [dateRange]);

	// Stabilize date range values to prevent infinite re-renders
	const dateRangeStart = useMemo(() => dateRange.start.toISOString(), [dateRange.start]);
	const dateRangeEnd = useMemo(() => dateRange.end.toISOString(), [dateRange.end]);
	const stableDaysDiff = useMemo(() => daysDiff, [daysDiff]);

	// Memoize fetcher functions to prevent infinite re-renders
	const coreMetricsFetcher = useCallback(() => trackAsyncOperation(async () => {
		const [analytics, webSignupCount] = await Promise.all([
			getUserAnalytics(),
			getWebSignupCount(),
		]);
		return {
			totalUsers: analytics.totalUsers,
			installCounts: analytics.installCounts,
			webSignup: webSignupCount,
		};
	}, 'core-metrics-load'), []);

	// Use cached data for better performance
	const {
		data: coreMetrics,
		loading: coreLoading
	} = useCachedData(
		'atlas-core-metrics',
		coreMetricsFetcher,
		2 * 60 * 1000 // 2 minutes cache
	);

	const userEngagementFetcher = useCallback(() => trackAsyncOperation(async () => {
		const startDate = new Date(dateRangeStart);
		const endDate = new Date(dateRangeEnd);
		
		const [
			sessionTime,
			totalAppUsage,
			activeUsers,
			activeUsersTrendData,
		] = await Promise.all([
			getAverageSessionTime(startDate, endDate),
			getTotalAppUsage(startDate, endDate),
			getActiveUsersStats(30),
			getDailyActiveUsersTrend(stableDaysDiff),
		]);
		return {
			avgSessionTime: sessionTime,
			totalSessionTime: totalAppUsage.total_hours * 3600,
			activeUsersStats: activeUsers,
			activeUsersTrend: activeUsersTrendData,
		};
	}, 'engagement-data-load'), [dateRangeStart, dateRangeEnd, stableDaysDiff]);

	const {
		data: userEngagementData,
		loading: engagementLoading
	} = useCachedData(
		`atlas-engagement-${dateRangeStart}-${dateRangeEnd}`,
		userEngagementFetcher,
		5 * 60 * 1000 // 5 minutes cache
	);

	const productSearchFetcher = useCallback(() => trackAsyncOperation(async () => {
		const startDate = new Date(dateRangeStart);
		const endDate = new Date(dateRangeEnd);
		
		const [products, searches, locations] = await Promise.all([
			getTopViewedProducts(10, startDate, endDate),
			getTopSearchTerms(10, startDate, endDate),
			getUsersByCountry(),
		]);
		return {
			topProducts: products,
			topSearches: searches,
			locationData: locations.slice(0, 12),
		};
	}, 'product-search-data-load'), [dateRangeStart, dateRangeEnd]);

	const {
		data: productSearchData,
		loading: productSearchLoading
	} = useCachedData(
		`atlas-products-search-${dateRangeStart}-${dateRangeEnd}`,
		productSearchFetcher,
		10 * 60 * 1000 // 10 minutes cache
	);

	const cartDataFetcher = useCallback(() => trackAsyncOperation(async () => {
		const [cartStats, cartProducts] = await Promise.all([
			getCartAnalytics(),
			getTopCartProducts(10),
		]);
		return {
			cartAnalytics: cartStats,
			topCartItems: cartProducts,
		};
	}, 'cart-data-load'), []);

	const {
		data: cartData,
		loading: cartLoading
	} = useCachedData(
		'atlas-cart-data',
		cartDataFetcher,
		15 * 60 * 1000 // 15 minutes cache
	);

	// Early return for initial loading state - prevents showing overview before data loads
	// This must be in the render section, not after hooks
	const shouldShowLoadingSkeleton = coreLoading;

	// Calculate total downloads (Google Play + App Store + Web Signup)
	const totalDownloads = useMemo(() => {
		if (!coreMetrics) return 0;
		return coreMetrics.installCounts.android + coreMetrics.installCounts.ios;
	}, [coreMetrics]);

	// Calculate progress towards 60-day target
	const TARGET_VALUE = 50000;
	const targetProgress = useMemo(() => {
		const progress = (totalDownloads / TARGET_VALUE) * 100;
		const remaining = TARGET_VALUE - totalDownloads;
		return {
			percentage: Math.min(progress, 100),
			remaining: remaining > 0 ? remaining : 0,
			achieved: totalDownloads >= TARGET_VALUE,
		};
	}, [totalDownloads]);

	// Use real active users trend data, or generate fallback if empty
	const activeUsersData = useMemo(() => {
		if (userEngagementData?.activeUsersTrend && userEngagementData.activeUsersTrend.length > 0) {
			return userEngagementData.activeUsersTrend;
		}
		return Array.from({ length: daysDiff }, (_, i) => ({
			day: i + 1,
			users: 0,
			date: "",
		}));
	}, [userEngagementData?.activeUsersTrend, daysDiff]);

	// GA color palette for charts
	const gaColors = [
		"#1A73E8",
		"#0F9D58",
		"#F9AB00",
		"#EA4335",
		"#9334E6",
		"#00ACC1",
		"#FF6D00",
		"#7CB342",
		"#C2185B",
		"#5E35B1",
		"#00897B",
		"#FDD835",
	];

	// Transform location data for pie chart
	const locationChartData = useMemo(() => {
		if (!productSearchData?.locationData) return [];
		return productSearchData.locationData.map((loc) => ({
			name: loc.country,
			value: loc.count,
		}));
	}, [productSearchData?.locationData]);

	// Optimized click handlers - removed unused handleViewAllClick

	// Loading states for different data batches
	const isLoadingBatch1 = engagementLoading;
	const isLoadingBatch2 = productSearchLoading;
	const isLoadingBatch3 = cartLoading;

	// Show loading skeleton if core data is still loading
	if (shouldShowLoadingSkeleton) {
		return (
			<div className="space-y-4 sm:space-y-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
					{Array.from({ length: 5 }).map((_, i) => (
						<AnalyticsCardSkeleton key={i} />
					))}
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					{Array.from({ length: 2 }).map((_, i) => (
						<ChartSkeleton key={i} />
					))}
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
					{Array.from({ length: 4 }).map((_, i) => (
						<AnalyticsCardSkeleton key={i} />
					))}
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					{Array.from({ length: 3 }).map((_, i) => (
						<ChartSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Top Row - Download Metrics (Load First) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
				{coreLoading || !coreMetrics ? (
					Array.from({ length: 5 }).map((_, i) => (
						<AnalyticsCardSkeleton key={i} />
					))
				) : (
					<>
						<MetricCardGA
							label="Total Downloads"
							value={totalDownloads}
							format="number"
							change={12.5}
							trend="up"
							icon={<Smartphone className="w-5 h-5" />}
							isLoading={false}
						/>
						<MetricCardGA
							label="Google Play Downloads"
							value={coreMetrics.installCounts.android}
							format="number"
							change={8.3}
							trend="up"
							icon={<Download className="w-5 h-5" />}
							isLoading={false}
						/>
						<MetricCardGA
							label="App Store Downloads"
							value={coreMetrics.installCounts.ios}
							format="number"
							change={15.7}
							trend="up"
							icon={<Download className="w-5 h-5" />}
							isLoading={false}
						/>
						<MetricCardGA
							label="Web Signup"
							value={coreMetrics.webSignup}
							format="number"
							change={5.2}
							trend="up"
							icon={<Globe className="w-5 h-5" />}
							isLoading={false}
						/>
						<div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-2">
									<div className="p-2 rounded-lg bg-gray-50">
										<Target className="w-5 h-5 text-blue-600" />
									</div>
									<div>
										<p className="text-xs sm:text-sm text-gray-600 font-medium">
											60-Day Target
										</p>
										<p className="text-xl sm:text-2xl font-bold text-gray-900">
											{TARGET_VALUE.toLocaleString()}
										</p>
									</div>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="space-y-2">
								<div className="flex justify-between items-center text-xs sm:text-sm">
									<span className="text-gray-600">
										{targetProgress.percentage.toFixed(1)}% Complete
									</span>
									<span
										className={`font-semibold ${
											targetProgress.achieved
												? "text-green-600"
												: targetProgress.percentage >= 80
												? "text-yellow-600"
												: "text-gray-600"
										}`}
									>
										{targetProgress.achieved
											? "🎉 Target Reached!"
											: `${targetProgress.remaining.toLocaleString()} to go`}
									</span>
								</div>
								<div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
									<div
										className={`h-full rounded-full transition-all duration-500 ${
											targetProgress.achieved
												? "bg-green-600"
												: targetProgress.percentage >= 80
												? "bg-yellow-500"
												: "bg-blue-600"
										}`}
										style={{
											width: `${targetProgress.percentage}%`,
										}}
									/>
								</div>
								<p className="text-xs text-gray-500">
									Current: {totalDownloads.toLocaleString()} downloads
								</p>
							</div>
						</div>
					</>
				)}
			</div>

			{/* Middle Row - Active Users & Location */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{isLoadingBatch1 ? (
					<>
						<ChartSkeleton />
						<ChartSkeleton />
					</>
				) : (
					<>
						<ChartCard
							title="Active Users"
							subtitle={`Distribution by Preference: ${formatGenderDistribution(
								userEngagementData?.activeUsersStats || { 
									totalActiveUsers: 0, 
									genderDistribution: { male: 0, female: 0, unisex: 0, kids: 0, other: 0 },
									percentages: { male: 0, female: 0, unisex: 0, kids: 0, other: 0 }
								}
							)}`}
							height={400}
						>
							<div className="mb-4">
								<p className="text-5xl font-bold">
									{userEngagementData?.activeUsersStats?.totalActiveUsers?.toLocaleString() || '0'}
								</p>
								<p className="text-sm text-gray-500">
									Active in Last 30 Days
								</p>
							</div>
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={activeUsersData}>
										<defs>
											<linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3} />
												<stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="#e5e7eb"
										/>
										<XAxis
											dataKey="day"
											stroke="#6b7280"
											fontSize={12}
										/>
										<YAxis stroke="#6b7280" fontSize={12} />
										<Tooltip
											contentStyle={{
												backgroundColor: "white",
												border: "1px solid #e5e7eb",
												borderRadius: "8px",
												boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
											}}
										/>
										<Area
											type="monotone"
											dataKey="users"
											stroke="#1A73E8"
											strokeWidth={2}
											fill="url(#colorUsers)"
											dot={false}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</ChartCard>

						{isLoadingBatch2 ? (
							<ChartSkeleton />
						) : (
							<ChartCard title="Registered Users Location" height={400}>
								{locationChartData.length === 0 ? (
									<div className="h-80 flex items-center justify-center">
										<p className="text-gray-500">No location data available</p>
									</div>
								) : (
									<div className="h-80">
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie
													data={locationChartData}
													cx="50%"
													cy="50%"
													innerRadius={60}
													outerRadius={100}
													paddingAngle={2}
													dataKey="value"
													label={({ name, value }) => `${name} ${value}`}
												>
													{locationChartData.map((_, index) => (
														<Cell
															key={`cell-${index}`}
															fill={gaColors[index % gaColors.length]}
														/>
													))}
												</Pie>
												<Tooltip
													contentStyle={{
														backgroundColor: "white",
														border: "1px solid #e5e7eb",
														borderRadius: "8px",
														boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
													}}
												/>
											</PieChart>
										</ResponsiveContainer>
									</div>
								)}
							</ChartCard>
						)}
					</>
				)}
			</div>

			{/* Session & Cart Metrics */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				{isLoadingBatch1 ? (
					<>
						<MetricSkeleton />
						{isLoadingBatch3 && (
							<>
								<MetricSkeleton />
								<MetricSkeleton />
								<MetricSkeleton />
							</>
						)}
					</>
				) : (
					<>
						<div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
							<div className="space-y-4">
								<div>
									<p className="text-xs sm:text-sm text-gray-600 mb-1">
										Session Time
									</p>
								</div>

								{/* Average Session Time */}
								<div className="space-y-1 pb-3 border-b border-gray-200">
									<p className="text-xs text-gray-600">
										Average Session Time
									</p>
									<p className="text-xl sm:text-2xl font-bold text-gray-900">
										{userEngagementData?.avgSessionTime && userEngagementData.avgSessionTime > 0
											? formatSessionTime(userEngagementData.avgSessionTime * 60)
											: "No data"}
									</p>
									<div className="flex items-center gap-1 text-xs text-green-600">
										<span>↑</span>
										<span>5.3%</span>
									</div>
								</div>

								{/* Total Session Time */}
								<div className="space-y-1">
									<p className="text-xs text-gray-600">
										Total Session Time
									</p>
									<p className="text-xl sm:text-2xl font-bold text-gray-900">
										{userEngagementData?.totalSessionTime && userEngagementData.totalSessionTime > 0
											? formatSessionTime(userEngagementData.totalSessionTime)
											: "No data"}
									</p>
									<div className="flex items-center gap-1 text-xs text-green-600">
										<span>↑</span>
										<span>8.1%</span>
									</div>
								</div>
							</div>
						</div>
						{isLoadingBatch3 ? (
							<>
								<MetricSkeleton />
								<MetricSkeleton />
								<MetricSkeleton />
							</>
						) : (
							<>
								<MetricCardGA
									label="Average Cart Value"
									value={cartData?.cartAnalytics?.averageCartValue || 0}
									format="currency"
									change={8.7}
									trend="up"
									isLoading={false}
								/>
								<MetricCardGA
									label="Abandoned Cart No."
									value={cartData?.cartAnalytics?.abandonedCartCount || 0}
									format="number"
									change={-3.2}
									trend="down"
									isLoading={false}
								/>
								<MetricCardGA
									label="Abandoned Cart Value"
									value={cartData?.cartAnalytics?.abandonedCartValue || 0}
									format="currency"
									change={-5.1}
									trend="down"
									isLoading={false}
								/>
							</>
						)}
					</>
				)}
			</div>

			{/* Bottom Row - Lists */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
				{isLoadingBatch2 ? (
					<>
						<ChartSkeleton />
						<ChartSkeleton />
						{isLoadingBatch3 && <ChartSkeleton />}
					</>
				) : (
					<>
						<ChartCard
							title="Top Viewed Items"
							actions={
								<Button
									variant="ghost"
									size="sm"
									onClick={() => router.push("/atlas/top-viewed")}
									className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700"
								>
									View All
									<ArrowRight className="h-3 w-3 ml-1" />
								</Button>
							}
						>
							<div className="space-y-2 max-h-[400px] overflow-y-auto">
								{!productSearchData?.topProducts || productSearchData.topProducts.length === 0 ? (
									<div className="flex items-center justify-center py-8">
										<p className="text-gray-500">No product views yet</p>
									</div>
								) : (
									productSearchData.topProducts.map((item: any, index: number) => (
										<div
											key={item.product_id}
											className={`
                        flex justify-between items-center p-3 rounded-lg
                        transition-colors hover:bg-gray-50
                        ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      `}
										>
											<div className="flex-1 min-w-0">
												<span className="text-sm font-medium text-gray-900 block truncate">
													{index + 1}. {item.product_title}
												</span>
												{item.vendor_name && (
													<span className="text-xs text-gray-500">
														{item.vendor_name}
													</span>
												)}
											</div>
											<span className="text-sm text-gray-600 font-semibold ml-2">
												{item.total_views.toLocaleString()} views
											</span>
										</div>
									))
								)}
							</div>
						</ChartCard>

						<ChartCard
							title="Top 10 Searched Items"
							actions={
								<Button
									variant="ghost"
									size="sm"
									onClick={() => router.push("/atlas/top-searched")}
									className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700"
								>
									View All
									<ArrowRight className="h-3 w-3 ml-1" />
								</Button>
							}
						>
							<div className="space-y-2 max-h-[400px] overflow-y-auto">
								{!productSearchData?.topSearches || productSearchData.topSearches.length === 0 ? (
									<div className="flex items-center justify-center py-8">
										<p className="text-gray-500">No search data yet</p>
									</div>
								) : (
									productSearchData.topSearches.map((item: any, index: number) => (
										<div
											key={item.normalized_term}
											className={`
                        flex justify-between items-center p-3 rounded-lg
                        transition-colors hover:bg-gray-50
                        ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      `}
										>
											<div className="flex-1 min-w-0">
												<span className="text-sm font-medium text-gray-900 block truncate">
													{index + 1}. {item.search_term}
												</span>
												{item.avg_results > 0 && (
													<span className="text-xs text-gray-500">
														Avg. {item.avg_results} results
													</span>
												)}
											</div>
											<span className="text-sm text-gray-600 font-semibold ml-2">
												{item.search_count.toLocaleString()} searches
											</span>
										</div>
									))
								)}
							</div>
						</ChartCard>

						{isLoadingBatch3 ? (
							<ChartSkeleton />
						) : (
							<ChartCard
								title="Popular Cart Items"
								actions={
									<Button
										variant="ghost"
										size="sm"
										onClick={() => router.push("/atlas/popular-cart-items")}
										className="text-xs h-7 px-2 text-blue-600 hover:text-blue-700"
									>
										View All
										<ArrowRight className="h-3 w-3 ml-1" />
									</Button>
								}
							>
								<div className="space-y-2 max-h-[400px] overflow-y-auto">
									{!cartData?.topCartItems || cartData.topCartItems.length === 0 ? (
										<div className="flex items-center justify-center py-8">
											<p className="text-gray-500">No cart items yet</p>
										</div>
									) : (
										cartData.topCartItems.map((item: any, index: number) => (
											<div
												key={item.product_id}
												className={`
                        flex justify-between items-center p-3 rounded-lg
                        transition-colors hover:bg-gray-50
                        ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      `}
											>
												<div className="flex-1 min-w-0">
													<span className="text-sm font-medium text-gray-900 block truncate">
														{index + 1}. {item.title}
													</span>
													<span className="text-xs text-gray-500">
														${item.total_value.toFixed(2)} total value
													</span>
												</div>
												<span className="text-sm text-gray-600 font-semibold ml-2">
													{item.count} {item.count === 1 ? "cart" : "carts"}
												</span>
											</div>
										))
									)}
								</div>
							</ChartCard>
						)}
					</>
				)}
			</div>
		</div>
	);
};

export default UserDashboard;
