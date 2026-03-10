"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { CustomerSegmentCard } from "@/components/vendor/customers/CustomerSegmentCard";
import { LocationHeatmap } from "@/components/vendor/customers/LocationHeatmap";
import { PurchaseBehaviorChart } from "@/components/vendor/customers/PurchaseBehaviorChart";
import { CustomerLifetimeValue } from "@/components/vendor/customers/CustomerLifetimeValue";
import { Users, MapPin, TrendingUp, DollarSign, Download, Calendar } from "lucide-react";
import { useEffect, useState } from "react";
import { CustomerInsightsService } from "@/lib/vendor/customer-insights-service";
import { CustomerSegment, LocationData, AnonymizedCustomer, DateRange } from "@/types/vendor-analytics";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CustomerInsightsPage() {
	const { user } = useAuth();
	const [loading, setLoading] = useState(true);
	const [segments, setSegments] = useState<CustomerSegment[]>([]);
	const [locationData, setLocationData] = useState<LocationData[]>([]);
	const [customers, setCustomers] = useState<AnonymizedCustomer[]>([]);
	const [dateRange, setDateRange] = useState<DateRange['preset']>('30days');
	const [activeTab, setActiveTab] = useState<"overview" | "segments" | "locations" | "behavior">("overview");

	const customerInsightsService = new CustomerInsightsService();

	useEffect(() => {
		if (user?.uid) {
			fetchCustomerInsights();
		}
	}, [user, dateRange]);

	const fetchCustomerInsights = async () => {
		if (!user?.uid) return;

		setLoading(true);
		try {
			const range = getDateRangeFromPreset(dateRange);

			// Fetch all customer insights data
			const [segmentsResult, locationsResult, customersResult] = await Promise.all([
				customerInsightsService.segmentCustomers(user.uid, range),
				customerInsightsService.getLocationInsights(user.uid, range),
				customerInsightsService.getAnonymizedCustomers(user.uid, range)
			]);

			if (segmentsResult.success && segmentsResult.data) {
				setSegments(segmentsResult.data);
			}

			if (locationsResult.success && locationsResult.data) {
				setLocationData(locationsResult.data);
			}

			if (customersResult.success && customersResult.data) {
				setCustomers(customersResult.data);
			}
		} catch (error) {
			console.error('Error fetching customer insights:', error);
			toast.error('Failed to load customer insights');
		} finally {
			setLoading(false);
		}
	};

	const getDateRangeFromPreset = (preset: DateRange['preset']): DateRange => {
		const end = new Date();
		const start = new Date();

		switch (preset) {
			case 'today':
				start.setHours(0, 0, 0, 0);
				break;
			case '7days':
				start.setDate(start.getDate() - 7);
				break;
			case '30days':
				start.setDate(start.getDate() - 30);
				break;
			case '90days':
				start.setDate(start.getDate() - 90);
				break;
			default:
				start.setDate(start.getDate() - 30);
		}

		return { start, end, preset };
	};

	const totalCustomers = segments.reduce((sum, seg) => sum + seg.count, 0);
	const totalRevenue = segments.reduce((sum, seg) => sum + seg.totalRevenue, 0);
	const avgLifetimeValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

	return (
		<div className="min-h-screen bg-gray-50">
			<ModernNavbar />

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
						<div className="mb-6 lg:mb-0">
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								Customer Insights
							</h1>
							<p className="text-gray-600 text-lg">
								Understand your customers with anonymized data and behavioral insights
							</p>
						</div>
						<div className="flex items-center space-x-4">
							<Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange['preset'])}>
								<SelectTrigger className="w-40">
									<Calendar className="h-4 w-4 mr-2" />
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="today">Today</SelectItem>
									<SelectItem value="7days">Last 7 Days</SelectItem>
									<SelectItem value="30days">Last 30 Days</SelectItem>
									<SelectItem value="90days">Last 90 Days</SelectItem>
								</SelectContent>
							</Select>
							<Button variant="outline">
								<Download className="h-4 w-4 mr-2" />
								Export
							</Button>
						</div>
					</div>
				</div>

				{/* Summary Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<Card className="border-gray-200">
						<CardHeader className="pb-3">
							<CardDescription className="flex items-center text-gray-600">
								<Users className="h-4 w-4 mr-2" />
								Total Customers
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-gray-900">
								{loading ? "..." : totalCustomers.toLocaleString()}
							</div>
							<p className="text-sm text-gray-500 mt-1">
								Across all segments
							</p>
						</CardContent>
					</Card>

					<Card className="border-gray-200">
						<CardHeader className="pb-3">
							<CardDescription className="flex items-center text-gray-600">
								<DollarSign className="h-4 w-4 mr-2" />
								Total Revenue
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-gray-900">
								{loading ? "..." : `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
							</div>
							<p className="text-sm text-gray-500 mt-1">
								From all customers
							</p>
						</CardContent>
					</Card>

					<Card className="border-gray-200">
						<CardHeader className="pb-3">
							<CardDescription className="flex items-center text-gray-600">
								<TrendingUp className="h-4 w-4 mr-2" />
								Avg Lifetime Value
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-gray-900">
								{loading ? "..." : `$${avgLifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
							</div>
							<p className="text-sm text-gray-500 mt-1">
								Per customer
							</p>
						</CardContent>
					</Card>

					<Card className="border-gray-200">
						<CardHeader className="pb-3">
							<CardDescription className="flex items-center text-gray-600">
								<MapPin className="h-4 w-4 mr-2" />
								Locations
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="text-3xl font-bold text-gray-900">
								{loading ? "..." : locationData.length}
							</div>
							<p className="text-sm text-gray-500 mt-1">
								Cities served
							</p>
						</CardContent>
					</Card>
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
					<TabsList className="grid w-full max-w-2xl grid-cols-4 mb-6">
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="segments">Segments</TabsTrigger>
						<TabsTrigger value="locations">Locations</TabsTrigger>
						<TabsTrigger value="behavior">Behavior</TabsTrigger>
					</TabsList>

					<TabsContent value="overview" className="mt-0">
						<div className="space-y-6">
							{/* Customer Segments */}
							<Card className="border-gray-200">
								<CardHeader>
									<CardTitle>Customer Segments</CardTitle>
									<CardDescription>
										Distribution of customers by purchase behavior
									</CardDescription>
								</CardHeader>
								<CardContent>
									{loading ? (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											{Array.from({ length: 4 }).map((_, i) => (
												<div key={i} className="animate-pulse">
													<div className="h-32 bg-gray-200 rounded" />
												</div>
											))}
										</div>
									) : (
										<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
											{segments.map((segment) => (
												<CustomerSegmentCard
													key={segment.type}
													segment={segment}
												/>
											))}
										</div>
									)}
								</CardContent>
							</Card>

							{/* Location Insights */}
							<Card className="border-gray-200">
								<CardHeader>
									<CardTitle>Top Locations</CardTitle>
									<CardDescription>
										Geographic distribution of your customers
									</CardDescription>
								</CardHeader>
								<CardContent>
									{loading ? (
										<div className="h-64 bg-gray-200 rounded animate-pulse" />
									) : (
										<LocationHeatmap locations={locationData.slice(0, 10)} />
									)}
								</CardContent>
							</Card>
						</div>
					</TabsContent>

					<TabsContent value="segments" className="mt-0">
						<div className="space-y-6">
							{loading ? (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{Array.from({ length: 4 }).map((_, i) => (
										<Card key={i} className="animate-pulse">
											<CardHeader>
												<div className="h-6 bg-gray-200 rounded w-1/2 mb-2" />
												<div className="h-4 bg-gray-200 rounded w-3/4" />
											</CardHeader>
											<CardContent>
												<div className="space-y-3">
													<div className="h-20 bg-gray-200 rounded" />
													<div className="h-16 bg-gray-200 rounded" />
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{segments.map((segment) => (
										<Card key={segment.type} className="border-gray-200">
											<CardHeader>
												<CardTitle className="capitalize">{segment.type} Customers</CardTitle>
												<CardDescription>
													{segment.count} customers ({segment.percentage.toFixed(1)}% of total)
												</CardDescription>
											</CardHeader>
											<CardContent>
												<CustomerLifetimeValue
													segment={segment}
													customers={customers.filter(c => c.segment === segment.type)}
												/>
											</CardContent>
										</Card>
									))}
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value="locations" className="mt-0">
						<Card className="border-gray-200">
							<CardHeader>
								<CardTitle>Geographic Distribution</CardTitle>
								<CardDescription>
									Customer locations and revenue by city
								</CardDescription>
							</CardHeader>
							<CardContent>
								{loading ? (
									<div className="h-96 bg-gray-200 rounded animate-pulse" />
								) : (
									<LocationHeatmap locations={locationData} showDetails />
								)}
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="behavior" className="mt-0">
						<Card className="border-gray-200">
							<CardHeader>
								<CardTitle>Purchase Behavior</CardTitle>
								<CardDescription>
									Analyze customer purchase patterns and preferences
								</CardDescription>
							</CardHeader>
							<CardContent>
								{loading ? (
									<div className="h-96 bg-gray-200 rounded animate-pulse" />
								) : (
									<PurchaseBehaviorChart customers={customers} />
								)}
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>
			</main>
		</div>
	);
}
