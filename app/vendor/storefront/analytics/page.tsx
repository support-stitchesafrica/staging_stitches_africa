/**
 * Storefront Analytics Page
 *
 * Interface for viewing storefront performance metrics
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
 */

"use client";

import React, { useState, useEffect } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
	BarChart3,
	Eye,
	ShoppingCart,
	TrendingUp,
	Download,
	Calendar,
	ArrowLeft,
} from "lucide-react";
import { getStorefrontConfig } from "@/lib/storefront/client-storefront-service";

export default function StorefrontAnalyticsPage() {
	const [vendorId, setVendorId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [dateRange, setDateRange] = useState("7d");

	useEffect(() => {
		// Get vendor ID from localStorage (in a real app, this would come from auth context)
		const storedVendorId = localStorage.getItem("tailorUID");
		setVendorId(storedVendorId);
		setIsLoading(false);
	}, []);

	const [analytics, setAnalytics] = useState<{
		totalViews: number;
		uniqueVisitors: number;
		conversionRate: number;
		averageSessionDuration: string;
		topProducts: Array<{
			id: string;
			name: string;
			views: number;
			conversions: number;
		}>;
		dailyViews: Array<{ date: string; views: number; conversions: number }>;
	}>({
		totalViews: 0,
		uniqueVisitors: 0,
		conversionRate: 0,
		averageSessionDuration: "0m 0s",
		topProducts: [],
		dailyViews: [],
	});

	// Fetch real analytics data
	useEffect(() => {
		if (vendorId) {
			fetchAnalyticsData();
		}
	}, [vendorId, dateRange]);

	const fetchAnalyticsData = async () => {
		try {
			setIsLoading(true);

			// Use vendorId directly as storefrontId since that's what the API expects
			const storefrontId = vendorId!;

			// 2. Calculate date range
			const end = new Date();
			const start = new Date();

			switch (dateRange) {
				case "7d":
					start.setDate(end.getDate() - 7);
					break;
				case "30d":
					start.setDate(end.getDate() - 30);
					break;
				case "90d":
					start.setDate(end.getDate() - 90);
					break;
				default:
					start.setDate(end.getDate() - 7);
			}

			// 3. Fetch analytics
			const queryParams = new URLSearchParams({
				storefrontId,
				startDate: start.toISOString(),
				endDate: end.toISOString(),
			});

			console.log(`📊 Fetching analytics for vendor: ${vendorId} (storefrontId: ${storefrontId})`);
			const response = await fetch(`/api/storefront/analytics?${queryParams}`);

			if (!response.ok) {
				throw new Error("Failed to fetch analytics data");
			}

			const data = await response.json();
			console.log('📈 Analytics data received:', data);

			// 4. Transform API data to UI state
			setAnalytics({
				totalViews: data.pageViews || 0,
				uniqueVisitors: data.uniqueVisitors || 0,
				conversionRate: data.conversionRate || 0,
				averageSessionDuration: formatDuration(
					data.sessionData?.averageSessionDuration || 0
				),
				topProducts: (data.topProducts || []).map((p: any) => ({
					id: p.productId,
					name: p.productName,
					views: p.views,
					conversions: p.cartAdds, // Using cart adds as a proxy for conversions or actual sales if available
				})),
				dailyViews: (data.dailyStats || [])
					.map((d: any) => ({
						date: d.date,
						views: d.pageViews,
						conversions: d.cartAdds,
					}))
					.sort(
						(a: any, b: any) =>
							new Date(b.date).getTime() - new Date(a.date).getTime()
					),
			});
		} catch (error) {
			console.error("Error fetching analytics:", error);
			// Keep showing empty state/zeros on error for now, or could set an error state
		} finally {
			setIsLoading(false);
		}
	};

	const formatDuration = (seconds: number) => {
		const m = Math.floor(seconds / 60);
		const s = Math.round(seconds % 60);
		return `${m}m ${s}s`;
	};

	const handleExportData = () => {
		// Create CSV content
		const csvContent = [
			["Date", "Views", "Conversions"],
			...analytics.dailyViews.map((day) => [
				day.date,
				day.views,
				day.conversions,
			]),
		]
			.map((row) => row.join(","))
			.join("\n");

		// Create and download file
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `storefront-analytics-${dateRange}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading analytics...</p>
				</div>
			</div>
		);
	}

	if (!vendorId) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
						<div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
							<BarChart3 className="w-6 h-6 text-yellow-600" />
						</div>
						<h3 className="text-lg font-medium text-yellow-900 mb-2">
							Authentication Required
						</h3>
						<p className="text-yellow-700">
							Please log in to access storefront analytics.
						</p>
						<button
							onClick={() => (window.location.href = "/vendor/login")}
							className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
						>
							Go to Login
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-6">
					<Link
						href="/vendor/storefront"
						className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Storefront
					</Link>
				</div>
				{/* Navigation breadcrumb */}
				<nav className="mb-8">
					<ol className="flex items-center space-x-2 text-sm text-gray-500">
						<li>
							<a href="/vendor/dashboard" className="hover:text-gray-700">
								Dashboard
							</a>
						</li>
						<li>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</li>
						<li>
							<a href="/vendor/storefront" className="hover:text-gray-700">
								Storefront
							</a>
						</li>
						<li>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</li>
						<li className="text-gray-900 font-medium">Analytics</li>
					</ol>
				</nav>

				{/* Header */}
				<div className="flex justify-between items-center mb-8">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							Storefront Analytics
						</h1>
						<p className="text-gray-600">
							Track your storefront performance and customer behavior
						</p>
					</div>

					<div className="flex gap-3">
						<select
							value={dateRange}
							onChange={(e) => setDateRange(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm"
						>
							<option value="7d">Last 7 days</option>
							<option value="30d">Last 30 days</option>
							<option value="90d">Last 90 days</option>
						</select>

						<Button onClick={handleExportData} variant="outline">
							<Download className="w-4 h-4 mr-2" />
							Export CSV
						</Button>
					</div>
				</div>

				{/* Key Metrics */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">Total Views</CardTitle>
							<Eye className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.totalViews.toLocaleString()}
							</div>
							<p className="text-xs text-muted-foreground">
								+12% from last period
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Unique Visitors
							</CardTitle>
							<TrendingUp className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.uniqueVisitors.toLocaleString()}
							</div>
							<p className="text-xs text-muted-foreground">
								+8% from last period
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Conversion Rate
							</CardTitle>
							<ShoppingCart className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.conversionRate}%
							</div>
							<p className="text-xs text-muted-foreground">
								+0.5% from last period
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								Avg. Session
							</CardTitle>
							<Calendar className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{analytics.averageSessionDuration}
							</div>
							<p className="text-xs text-muted-foreground">
								+15s from last period
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Charts and Tables */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* Daily Views Chart */}
					<Card>
						<CardHeader>
							<CardTitle>Daily Views & Conversions</CardTitle>
							<CardDescription>
								Track your storefront performance over time
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{analytics.dailyViews.length > 0 ? (
									analytics.dailyViews.map((day, index) => (
										<div
											key={day.date}
											className="flex items-center justify-between"
										>
											<span className="text-sm text-gray-600">
												{new Date(day.date).toLocaleDateString()}
											</span>
											<div className="flex items-center gap-4">
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
													<span className="text-sm">{day.views} views</span>
												</div>
												<div className="flex items-center gap-2">
													<div className="w-2 h-2 bg-green-500 rounded-full"></div>
													<span className="text-sm">
														{day.conversions} conversions
													</span>
												</div>
											</div>
										</div>
									))
								) : (
									<div className="text-center py-8 text-gray-500">
										<BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
										<p>No analytics data available yet</p>
										<p className="text-sm">
											Data will appear once your storefront receives traffic
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Top Products */}
					<Card>
						<CardHeader>
							<CardTitle>Top Performing Products</CardTitle>
							<CardDescription>
								Products with the most views and conversions
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{analytics.topProducts.length > 0 ? (
									analytics.topProducts.map((product, index) => (
										<div
											key={product.id}
											className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
										>
											<div>
												<p className="font-medium text-sm">{product.name}</p>
												<p className="text-xs text-gray-600">
													{product.views} views
												</p>
											</div>
											<div className="text-right">
												<p className="font-medium text-sm text-green-600">
													{product.conversions} sales
												</p>
												<p className="text-xs text-gray-600">
													{(
														(product.conversions / product.views) *
														100
													).toFixed(1)}
													% rate
												</p>
											</div>
										</div>
									))
								) : (
									<div className="text-center py-8 text-gray-500">
										<ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
										<p>No product analytics available yet</p>
										<p className="text-sm">
											Data will appear once customers view your products
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Conversion Funnel */}
				<Card className="mt-6">
					<CardHeader>
						<CardTitle>Conversion Funnel</CardTitle>
						<CardDescription>
							Track customer journey from visit to purchase
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
								<div className="flex items-center gap-3">
									<Eye className="w-5 h-5 text-blue-600" />
									<span className="font-medium">Page Views</span>
								</div>
								<div className="text-right">
									<p className="font-bold text-lg">{analytics.totalViews}</p>
									<p className="text-sm text-gray-600">100%</p>
								</div>
							</div>

							<div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
								<div className="flex items-center gap-3">
									<ShoppingCart className="w-5 h-5 text-purple-600" />
									<span className="font-medium">Product Views</span>
								</div>
								<div className="text-right">
									<p className="font-bold text-lg">579</p>
									<p className="text-sm text-gray-600">46.4%</p>
								</div>
							</div>

							<div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
								<div className="flex items-center gap-3">
									<TrendingUp className="w-5 h-5 text-orange-600" />
									<span className="font-medium">Add to Cart</span>
								</div>
								<div className="text-right">
									<p className="font-bold text-lg">87</p>
									<p className="text-sm text-gray-600">7.0%</p>
								</div>
							</div>

							<div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
								<div className="flex items-center gap-3">
									<BarChart3 className="w-5 h-5 text-green-600" />
									<span className="font-medium">Purchases</span>
								</div>
								<div className="text-right">
									<p className="font-bold text-lg">40</p>
									<p className="text-sm text-gray-600">3.2%</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Setup Notice */}
				<Card className="mt-6 border-blue-200 bg-blue-50">
					<CardContent className="pt-6">
						<div className="flex items-start gap-3">
							<BarChart3 className="w-5 h-5 text-blue-600 mt-0.5" />
							<div>
								<h3 className="font-medium text-blue-900 mb-1">
									Analytics Setup
								</h3>
								<p className="text-sm text-blue-800 mb-3">
									This is demo data. To see real analytics, ensure your
									storefront is published and receiving traffic.
								</p>
								<div className="flex gap-2">
									<Button size="sm" asChild>
										<a href="/vendor/storefront/settings">
											Configure Storefront
										</a>
									</Button>
									<Button size="sm" variant="outline" asChild>
										<a href="/vendor/storefront/pixels">Setup Tracking</a>
									</Button>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
