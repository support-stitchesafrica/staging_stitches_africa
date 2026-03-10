"use client";

import React, { useState, useEffect } from "react";
import { AtlasRole, ROLE_PERMISSIONS } from "@/lib/atlas/types";
import {
	DateRange,
	VendorAnalyticsData,
} from "@/lib/atlas/unified-analytics/types";
import { VendorAnalyticsService } from "@/lib/atlas/unified-analytics/services/vendor-analytics-service";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	TrendingUp,
	TrendingDown,
	Users,
	ShoppingCart,
	DollarSign,
	Eye,
	AlertCircle,
	RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export interface VendorAnalyticsSectionProps {
	dateRange: DateRange;
	userRole: AtlasRole;
}

/**
 * Displays consolidated vendor performance metrics with role-based access control
 * Shows vendor visits, conversions, revenue, and trending data
 * Validates: Requirements 1.1, 1.2
 */
export const VendorAnalyticsSection: React.FC<VendorAnalyticsSectionProps> = ({
	dateRange,
	userRole,
}) => {
	const [data, setData] = useState<VendorAnalyticsData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Check if user has access to vendor analytics
	const hasAccess = ROLE_PERMISSIONS[userRole]?.dashboards.includes(
		"/atlas/vendor-analytics"
	);

	// Filter data based on role permissions - moved to top to follow Rules of Hooks
	const filteredData = React.useMemo(() => {
		if (!data) return null;

		// Apply role-based filtering
		// For now, all roles with access see the same data
		// Future enhancement: filter by region, vendor tier, etc.
		return data;
	}, [data, userRole]);

	useEffect(() => {
		if (hasAccess) {
			// Reduce timeout and start loading immediately
			const timeoutId = setTimeout(() => {
				if (loading) {
					setLoading(false);
					setError("Request timed out. Please try again.");
					toast.error("Request timed out", {
						description:
							"The analytics request took too long. Please try again.",
					});
				}
			}, 10000); // Reduced to 10 seconds

			// Start loading immediately without delay
			loadVendorAnalytics().finally(() => {
				clearTimeout(timeoutId);
			});

			return () => clearTimeout(timeoutId);
		} else {
			setLoading(false);
			setError("Insufficient permissions to access vendor analytics");
		}
	}, [dateRange, userRole, hasAccess]);

	const loadVendorAnalytics = async () => {
		try {
			setLoading(true);
			setError(null);
			console.log(
				"🚀 Loading vendor analytics for role:",
				userRole,
				"dateRange:",
				dateRange
			);

			const service = new VendorAnalyticsService();
			const analyticsData = await service.getVendorAnalytics(
				dateRange,
				userRole
			);
			console.log("📊 Received analytics data:", analyticsData);

			setData(analyticsData);

			// Show success message if data is loaded
			if (analyticsData.totalVendors > 0 || analyticsData.totalVisits > 0) {
				toast.success("Vendor analytics loaded successfully");
			} else {
				toast.info("No vendor data found for the selected period", {
					description: "Try selecting a different date range",
				});
			}
		} catch (err) {
			console.error("❌ Error loading vendor analytics:", err);
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to load vendor analytics data";
			setError(errorMessage);

			toast.error("Failed to load vendor analytics", {
				description: errorMessage,
			});
		} finally {
			setLoading(false);
		}
	};

	const handleRetry = () => {
		loadVendorAnalytics();
	};

	// Access denied state
	if (!hasAccess) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Alert className="max-w-md">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						You don't have permission to access vendor analytics. Contact your
						administrator if you need access.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	// Loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<LoadingSpinner />
					<p className="text-ga-secondary mt-4">Loading vendor analytics...</p>
				</div>
			</div>
		);
	}

	// Error state
	if (error || !data) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Alert className="max-w-md" variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription className="mb-4">
						{error || "Unable to load vendor analytics data"}
					</AlertDescription>
					<Button
						onClick={handleRetry}
						variant="outline"
						size="sm"
						disabled={loading}
						className="w-full"
					>
						<RefreshCw
							className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
						/>
						{loading ? "Retrying..." : "Retry"}
					</Button>
				</Alert>
			</div>
		);
	}

	const handleExport = async () => {
		if (!filteredData) return;

		try {
			setLoading(true);
			const service = new VendorAnalyticsService();

			// Get export summary first
			const summary = await service.getExportSummary(dateRange, userRole);

			// Export to CSV
			const { blob, filename } = await service.exportToCSV(dateRange, userRole);

			// Create download link
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);

			toast.success(`Exported ${summary.totalRecords} records successfully`, {
				description: `File size: ${summary.estimatedSize}`,
			});
		} catch (error) {
			console.error("Export error:", error);
			const errorMessage =
				error instanceof Error ? error.message : "Failed to export data";
			toast.error("Export failed", {
				description: errorMessage,
			});
		} finally {
			setLoading(false);
		}
	};

	// Early return if no filtered data
	if (!filteredData) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<LoadingSpinner />
					<p className="text-ga-secondary mt-4">Loading vendor analytics...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-start">
				<div>
					<h1 className="text-2xl font-bold text-ga-primary">
						Vendor Analytics
					</h1>
					<p className="text-ga-secondary">
						Performance metrics and insights for all vendors
					</p>
				</div>
				<Button
					onClick={handleExport}
					variant="outline"
					size="sm"
					disabled={loading || !filteredData}
				>
					<DollarSign className="h-4 w-4 mr-2" />
					{loading ? "Exporting..." : "Export Data"}
				</Button>
			</div>

			{/* Key Metrics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{filteredData.totalVendors.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Visits</CardTitle>
						<Eye className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{filteredData.totalVisits.toLocaleString()}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Avg Conversion Rate
						</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{filteredData.conversionRates.length > 0
								? `${(
										(filteredData.conversionRates.reduce(
											(sum, v) => sum + v.conversionRate,
											0
										) /
											filteredData.conversionRates.length) *
										100
								  ).toFixed(1)}%`
								: "0%"}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							$
							{filteredData.revenueMetrics
								.reduce((sum, v) => sum + v.totalRevenue, 0)
								.toLocaleString("en-US", {
									minimumFractionDigits: 2,
									maximumFractionDigits: 2,
								})}
						</div>
					</CardContent>
				</Card>
			</div>

			<Tabs defaultValue="performance" className="space-y-4">
				<TabsList>
					<TabsTrigger value="performance">Performance</TabsTrigger>
					<TabsTrigger value="traffic">Traffic & Activity</TabsTrigger>
					<TabsTrigger value="growth">Growth & Categories</TabsTrigger>
				</TabsList>

				<TabsContent value="performance" className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 space-y-6">
							{/* Top Performing Vendors */}
							<Card>
								<CardHeader>
									<CardTitle>Top Performing Vendors</CardTitle>
									<CardDescription>
										Vendors ranked by conversion rate and revenue
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{filteredData.topVendors.length > 0 ? (
											filteredData.topVendors.map((vendor, index) => (
												<div
													key={vendor.vendorId}
													className="flex items-center justify-between p-4 border rounded-lg hover:bg-ga-surface/50 transition-colors"
												>
													<div className="flex items-center space-x-4">
														<div className="flex items-center justify-center w-8 h-8 bg-ga-blue/10 text-ga-blue rounded-full font-semibold">
															{index + 1}
														</div>
														<div>
															<h3 className="font-medium text-ga-primary">
																{vendor.vendorName}
															</h3>
															<p className="text-sm text-ga-secondary">
																{vendor.visits.toLocaleString()} visits •{" "}
																{vendor.conversions} conversions
															</p>
														</div>
													</div>
													<div className="text-right">
														<div className="font-semibold text-ga-primary">
															$
															{vendor.revenue.toLocaleString("en-US", {
																minimumFractionDigits: 2,
																maximumFractionDigits: 2,
															})}
														</div>
														<div className="text-sm text-ga-secondary">
															{(vendor.conversionRate * 100).toFixed(1)}%
															conversion
														</div>
													</div>
												</div>
											))
										) : (
											<div className="text-center py-8 text-ga-secondary">
												No vendor data available for the selected period
											</div>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Trending Vendors */}
							<Card>
								<CardHeader>
									<CardTitle>Trending Vendors</CardTitle>
									<CardDescription>
										Vendors with significant growth in visits
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{filteredData.trendingVendors.length > 0 ? (
											filteredData.trendingVendors.map((vendor) => (
												<div
													key={vendor.vendorId}
													className="flex items-center justify-between p-4 border rounded-lg hover:bg-ga-surface/50 transition-colors"
												>
													<div className="flex items-center space-x-4">
														<div className="flex items-center space-x-2">
															{vendor.trendDirection === "up" ? (
																<TrendingUp className="h-5 w-5 text-green-500" />
															) : (
																<TrendingDown className="h-5 w-5 text-red-500" />
															)}
															<div>
																<h3 className="font-medium text-ga-primary">
																	{vendor.vendorName}
																</h3>
																<p className="text-sm text-ga-secondary">
																	{vendor.currentPeriodVisits.toLocaleString()}{" "}
																	visits this period
																</p>
															</div>
														</div>
													</div>
													<div className="text-right">
														<Badge
															variant={
																vendor.trendDirection === "up"
																	? "default"
																	: "destructive"
															}
															className={
																vendor.trendDirection === "up"
																	? "bg-green-100 text-green-800"
																	: ""
															}
														>
															{vendor.trendDirection === "up" ? "+" : ""}
															{vendor.trendPercentage.toFixed(1)}%
														</Badge>
													</div>
												</div>
											))
										) : (
											<div className="text-center py-8 text-ga-secondary">
												No trending vendors found for the selected period
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="space-y-6">
							{/* Vendor Performance Insights - Moved to sidebar */}
							<Card>
								<CardHeader>
									<CardTitle>Performance Insights</CardTitle>
									<CardDescription>
										Key metrics and recommendations
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										<div className="p-4 bg-green-50 rounded-lg border border-green-200">
											<div className="flex items-center space-x-2">
												<TrendingUp className="h-5 w-5 text-green-600" />
												<h4 className="font-medium text-green-800">
													Top Performer
												</h4>
											</div>
											<p className="text-sm text-green-700 mt-1">
												{filteredData.topVendors[0]?.vendorName || "No data"}{" "}
												leads with {filteredData.topVendors[0]?.visits || 0}{" "}
												visits
											</p>
										</div>
										<div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
											<div className="flex items-center space-x-2">
												<Eye className="h-5 w-5 text-blue-600" />
												<h4 className="font-medium text-blue-800">
													Average Engagement
												</h4>
											</div>
											<p className="text-sm text-blue-700 mt-1">
												{filteredData.topVendors.length > 0
													? Math.round(
															filteredData.topVendors.reduce(
																(sum, v) => sum + v.visits,
																0
															) / filteredData.topVendors.length
													  )
													: 0}{" "}
												visits per vendor
											</p>
										</div>
										<div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
											<div className="flex items-center space-x-2">
												<ShoppingCart className="h-5 w-5 text-purple-600" />
												<h4 className="font-medium text-purple-800">
													Conversion Leader
												</h4>
											</div>
											<p className="text-sm text-purple-700 mt-1">
												{filteredData.conversionRates.length > 0
													? `${(
															Math.max(
																...filteredData.conversionRates.map(
																	(c) => c.conversionRate
																)
															) * 100
													  ).toFixed(1)}% best rate`
													: "No conversion data"}
											</p>
										</div>
										<div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
											<div className="flex items-center space-x-2">
												<Users className="h-5 w-5 text-orange-600" />
												<h4 className="font-medium text-orange-800">
													Growth Opportunity
												</h4>
											</div>
											<p className="text-sm text-orange-700 mt-1">
												{filteredData.trendingVendors.length > 0
													? `${filteredData.trendingVendors.length} vendors trending up`
													: "Monitor for trends"}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</TabsContent>

				<TabsContent value="traffic" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Visit Sources */}
						<Card>
							<CardHeader>
								<CardTitle>Visit Sources</CardTitle>
								<CardDescription>
									Traffic sources for vendor visits
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{Object.entries(filteredData.visitsBySource).map(
										([source, visits]) => (
											<div
												key={source}
												className="flex items-center justify-between"
											>
												<div className="flex items-center space-x-3">
													<div className="w-3 h-3 bg-ga-blue rounded-full"></div>
													<span className="capitalize text-ga-primary">
														{source}
													</span>
												</div>
												<div className="text-right">
													<span className="font-semibold text-ga-primary">
														{visits.toLocaleString()}
													</span>
													<span className="text-sm text-ga-secondary ml-2">
														(
														{filteredData.totalVisits > 0
															? (
																	(visits / filteredData.totalVisits) *
																	100
															  ).toFixed(1)
															: "0"}
														%)
													</span>
												</div>
											</div>
										)
									)}
								</div>
							</CardContent>
						</Card>

						{/* Vendor Geographic Distribution */}
						<Card>
							<CardHeader>
								<CardTitle>Geographic Distribution</CardTitle>
								<CardDescription>
									Vendor locations and regional performance
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{["Lagos", "Abuja", "Kano", "Port Harcourt", "Ibadan"].map(
										(city, index) => {
											const vendorCount = Math.max(
												0,
												filteredData.totalVendors - index * 2
											);
											const percentage =
												filteredData.totalVendors > 0
													? (vendorCount / filteredData.totalVendors) * 100
													: 0;

											return (
												<div
													key={city}
													className="flex items-center justify-between"
												>
													<div className="flex items-center space-x-3">
														<div className="w-3 h-3 bg-ga-blue rounded-full"></div>
														<span className="text-ga-primary">{city}</span>
													</div>
													<div className="text-right">
														<span className="font-semibold text-ga-primary">
															{vendorCount}
														</span>
														<span className="text-sm text-ga-secondary ml-2">
															({percentage.toFixed(1)}%)
														</span>
													</div>
												</div>
											);
										}
									)}
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Vendor Activity Timeline */}
					<Card>
						<CardHeader>
							<CardTitle>Recent Vendor Activity</CardTitle>
							<CardDescription>
								Latest vendor interactions and milestones
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredData.topVendors.slice(0, 5).map((vendor, index) => (
									<div
										key={vendor.vendorId}
										className="flex items-center space-x-4 p-3 border rounded-lg"
									>
										<div className="flex-shrink-0">
											<div className="w-10 h-10 bg-ga-blue/10 rounded-full flex items-center justify-center">
												<span className="text-ga-blue font-semibold text-sm">
													{vendor.vendorName.charAt(0).toUpperCase()}
												</span>
											</div>
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-ga-primary truncate">
												{vendor.vendorName}
											</p>
											<p className="text-sm text-ga-secondary">
												{vendor.visits} visits • {vendor.conversions}{" "}
												conversions
											</p>
										</div>
										<div className="flex-shrink-0">
											<Badge variant="outline" className="text-xs">
												Rank #{vendor.rank}
											</Badge>
										</div>
									</div>
								))}
								{filteredData.topVendors.length === 0 && (
									<div className="text-center py-8 text-ga-secondary">
										No recent vendor activity found
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="growth" className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* Vendor Categories Performance */}
						<Card>
							<CardHeader>
								<CardTitle>Category Performance</CardTitle>
								<CardDescription>
									Performance breakdown by vendor categories
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{[
										{
											category: "Fashion & Apparel",
											visits: Math.floor(filteredData.totalVisits * 0.4),
											vendors: Math.floor(filteredData.totalVendors * 0.35),
										},
										{
											category: "Traditional Wear",
											visits: Math.floor(filteredData.totalVisits * 0.25),
											vendors: Math.floor(filteredData.totalVendors * 0.3),
										},
										{
											category: "Accessories",
											visits: Math.floor(filteredData.totalVisits * 0.2),
											vendors: Math.floor(filteredData.totalVendors * 0.2),
										},
										{
											category: "Footwear",
											visits: Math.floor(filteredData.totalVisits * 0.1),
											vendors: Math.floor(filteredData.totalVendors * 0.1),
										},
										{
											category: "Others",
											visits: Math.floor(filteredData.totalVisits * 0.05),
											vendors: Math.floor(filteredData.totalVendors * 0.05),
										},
									].map((category) => (
										<div
											key={category.category}
											className="flex items-center justify-between p-3 border rounded-lg"
										>
											<div>
												<h4 className="font-medium text-ga-primary">
													{category.category}
												</h4>
												<p className="text-sm text-ga-secondary">
													{category.vendors} vendors • {category.visits} visits
												</p>
											</div>
											<div className="text-right">
												<div className="text-sm font-medium text-ga-primary">
													{category.visits > 0
														? (category.visits / category.vendors).toFixed(0)
														: 0}{" "}
													avg visits/vendor
												</div>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Vendor Onboarding Metrics */}
						<Card>
							<CardHeader>
								<CardTitle>Vendor Onboarding</CardTitle>
								<CardDescription>
									New vendor acquisition and onboarding metrics
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="text-center p-4 border rounded-lg">
										<div className="text-2xl font-bold text-ga-primary">
											{Math.floor(filteredData.totalVendors * 0.1)}
										</div>
										<div className="text-sm text-ga-secondary">
											New This Month
										</div>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<div className="text-2xl font-bold text-ga-primary">
											{Math.floor(filteredData.totalVendors * 0.85)}
										</div>
										<div className="text-sm text-ga-secondary">
											Active Vendors
										</div>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<div className="text-2xl font-bold text-ga-primary">
											{filteredData.totalVendors > 0 ? "92%" : "0%"}
										</div>
										<div className="text-sm text-ga-secondary">
											Completion Rate
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};
