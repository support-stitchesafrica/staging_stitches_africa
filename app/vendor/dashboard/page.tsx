"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import {
	TrendingUp,
	Package,
	DollarSign,
	ShoppingBag,
	Calendar,
	User,
	ArrowUpRight,
	Plus,
	Eye,
	MoreHorizontal,
	Star,
	Clock,
	CheckCircle,
	Grid3X3,
	List,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getTailorWorks } from "@/vendor-services/getTailorWorks";
import { toast } from "sonner";
import { getTailorSalesSummary } from "@/vendor-services/TailorOrders";
import {
	getTailorProfile,
	TailorProfile,
} from "@/vendor-services/tailorProfile";
import { getTailorKyc, TailorKyc } from "@/vendor-services/tailorService";
import { TailorWork } from "@/vendor-services/types";
import Link from "next/link";

const getStatusColor = (status: string) => {
	switch (status) {
		case "Completed":
			return "bg-green-50 text-green-700 border-green-200";
		case "In Progress":
			return "bg-blue-50 text-blue-700 border-blue-200";
		case "Ready":
			return "bg-purple-50 text-purple-700 border-purple-200";
		case "Measuring":
			return "bg-amber-50 text-amber-700 border-amber-200";
		default:
			return "bg-gray-50 text-gray-700 border-gray-200";
	}
};

import { useStrictVendorAuth } from "@/hooks/useStrictVendorAuth";

function ModernDashboardContent() {
	const router = useRouter();
	const { isAuthenticated, isLoading: authLoading } = useStrictVendorAuth();

	const searchParams = useSearchParams();
	const [tailorName, setTailorName] = useState("Tailor");
	const [tailorId, setTailorId] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [profile, setProfile] = useState<Partial<TailorProfile>>({});
	const [kyc, setKyc] = useState<TailorKyc | null>(null);
	const [salesSummary, setSalesSummary] = useState({
		totalItemsSold: 0,
		totalRevenue: 0,
		orderCount: 0,
	});
	const [works, setWorks] = useState<TailorWork[]>([]);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [analyticsData, setAnalyticsData] = useState<any>(null);
	const tailorUID =
		typeof window !== "undefined" ? localStorage.getItem("tailorUID") : null;

	// Handle Stripe onboarding redirect (now from vendor/settings)
	useEffect(() => {
		const stripeOnboarding = searchParams.get("stripe_onboarding");

		if (stripeOnboarding === "success") {
			toast.success(
				"Stripe account connected successfully! Refreshing your account details...",
				{
					duration: 5000,
				},
			);
			// Dispatch event to trigger StripeConnectAccount refresh
			window.dispatchEvent(new Event("stripe_onboarding_complete"));
			// Clean up URL after a brief delay
			setTimeout(() => {
				router.replace("/vendor/dashboard");
			}, 1000);
		} else if (stripeOnboarding === "refresh") {
			toast.info(
				"Your Stripe account is still being set up. Please complete your setup to enable payouts.",
			);
			// Dispatch event to trigger StripeConnectAccount refresh
			window.dispatchEvent(new Event("stripe_onboarding_refresh"));
			// Clean up URL
			router.replace("/vendor/dashboard");
		}
	}, [searchParams, router]);

	// Also handle Stripe onboarding redirect from vendor/settings page
	useEffect(() => {
		const stripeOnboarding = searchParams.get("stripe_onboarding");

		if (stripeOnboarding) {
			// Dispatch events for the settings page to handle
			if (stripeOnboarding === "success") {
				window.dispatchEvent(new Event("stripe_onboarding_complete"));
			} else if (stripeOnboarding === "refresh") {
				window.dispatchEvent(new Event("stripe_onboarding_refresh"));
			}
		}
	}, [searchParams]);

	useEffect(() => {
		const name = localStorage.getItem("tailorName") || "Tailor";
		const id = localStorage.getItem("tailorUID");

		setTailorName(name);
		setTailorId(id);
	}, []);

	useEffect(() => {
		if (!tailorId) return;
		const fetchSales = async () => {
			const summary = await getTailorSalesSummary(tailorId);
			setSalesSummary(summary);
		};
		fetchSales();
	}, [tailorId]);

	// Fetch analytics data
	useEffect(() => {
		if (!tailorId) return;

		const fetchAnalytics = async () => {
			try {
				const { getVendorAnalytics } =
					await import("@/lib/vendor/useVendorAnalytics");
				const analytics = await getVendorAnalytics(tailorId);
				setAnalyticsData(analytics);

				// Update sales summary with real data
				setSalesSummary({
					totalItemsSold: analytics.metrics.completedOrders,
					totalRevenue: analytics.metrics.totalRevenue,
					orderCount: analytics.metrics.totalOrders,
				});
			} catch (error) {
				console.error("Failed to fetch analytics:", error);
			}
		};

		fetchAnalytics();
	}, [tailorId]);

	useEffect(() => {
		const fetchWorks = async () => {
			const result = await getTailorWorks();
			if (result.success) {
				setWorks(result.data as TailorWork[]);
			} else {
				toast.error(result.message);
			}
		};
		fetchWorks();
	}, []);

	useEffect(() => {
		const fetchProfile = async () => {
			setLoading(true);
			const res = await getTailorProfile(tailorUID as string);
			if (res.success) {
				setProfile(res.data as any);
			}
			setLoading(false);
		};

		if (tailorUID) fetchProfile();
	}, [tailorUID]);

	useEffect(() => {
		const fetchKyc = async () => {
			if (!tailorUID) return;
			const kycRes = await getTailorKyc(tailorUID);
			if (kycRes) setKyc(kycRes);
		};

		fetchKyc();
	}, [tailorUID]);

	const metrics = [
		{
			title: "Total Revenue",
			value: `$${(analyticsData?.metrics?.totalRevenue || 0).toLocaleString(
				"en-US",
				{
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				},
			)}`,
			change: "+12.5%",
			changeType: "positive",
			icon: DollarSign,
			color: "text-emerald-600",
			bgColor: "bg-emerald-50",
			borderColor: "border-emerald-200",
		},
		{
			title: "Products Sold",
			value: salesSummary.totalItemsSold.toString(),
			change: "+8.2%",
			changeType: "positive",
			icon: TrendingUp,
			color: "text-blue-600",
			bgColor: "bg-blue-50",
			borderColor: "border-blue-200",
		},
		{
			title: "Active Products",
			value: works.length.toString(),
			change: "+3",
			changeType: "positive",
			icon: Package,
			color: "text-purple-600",
			bgColor: "bg-purple-50",
			borderColor: "border-purple-200",
		},
		{
			title: "Total Orders",
			value: salesSummary.orderCount.toString(),
			change: "+15.3%",
			changeType: "positive",
			icon: ShoppingBag,
			color: "text-orange-600",
			bgColor: "bg-orange-50",
			borderColor: "border-orange-200",
		},
	];

	// If auth is loading or not authenticated, show loading or nothing (redirect handled by hook)
	if (authLoading || !isAuthenticated) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-center space-y-4">
					<div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
					<p className="text-gray-600">Verifying session...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<ModernNavbar />
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Welcome Section */}
				<div className="mb-8">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
						<div className="mb-6 lg:mb-0">
							<h1 className="text-3xl font-bold text-gray-900 mb-2">
								Welcome back,{" "}
								<span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
									{profile.brand_name || tailorName}
								</span>
							</h1>
							<p className="text-gray-600 text-lg">
								Here's what's happening with your business today
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-3">
							<Button
								variant="outline"
								onClick={() => router.push("/vendor/orders")}
								className="border-gray-300 hover:bg-gray-50"
							>
								<ShoppingBag className="h-4 w-4 mr-2" />
								View Orders
							</Button>
							<Button
								onClick={() => router.push("/vendor/products/create")}
								className="bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white shadow-lg"
							>
								<Plus className="h-4 w-4 mr-2" />
								Create Product
							</Button>
						</div>
					</div>
				</div>

				{/* Metrics Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					{metrics.map((metric, index) => (
						<Card
							key={index}
							className={`border ${metric.borderColor} hover:shadow-lg transition-all duration-200`}
						>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<p className="text-sm font-medium text-gray-600 mb-1">
											{metric.title}
										</p>
										<p className="text-2xl font-bold text-gray-900 mb-2">
											{metric.value}
										</p>
										<div className="flex items-center">
											<ArrowUpRight className="h-3 w-3 text-emerald-600 mr-1" />
											<span className="text-sm font-medium text-emerald-600">
												{metric.change}
											</span>
											<span className="text-sm text-gray-500 ml-1">
												vs last month
											</span>
										</div>
									</div>
									<div
										className={`p-3 rounded-xl ${metric.bgColor} ${metric.borderColor} border`}
									>
										<metric.icon className={`h-6 w-6 ${metric.color}`} />
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Quick Links Section */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
					<Card
						className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
						onClick={() => router.push("/vendor/analytics")}
					>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
									<TrendingUp className="h-6 w-6 text-emerald-600" />
								</div>
								<ArrowUpRight className="h-5 w-5 text-gray-400" />
							</div>
						</CardHeader>
						<CardContent>
							<CardTitle className="text-lg mb-2">
								Analytics Dashboard
							</CardTitle>
							<CardDescription>
								View comprehensive business analytics and insights
							</CardDescription>
						</CardContent>
					</Card>

					<Card
						className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
						onClick={() => router.push("/vendor/waitlists")}
					>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
									<Package className="h-6 w-6 text-blue-600" />
								</div>
								<ArrowUpRight className="h-5 w-5 text-gray-400" />
							</div>
						</CardHeader>
						<CardContent>
							<CardTitle className="text-lg mb-2">
								Collection Waitlists
							</CardTitle>
							<CardDescription>
								Create and manage collection waitlists to gauge demand
							</CardDescription>
						</CardContent>
					</Card>

					<Card
						className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
						onClick={() => router.push("/vendor/analytics/activities")}
					>
						<CardHeader>
							<div className="flex items-center justify-between">
								<div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
									<Eye className="h-6 w-6 text-indigo-600" />
								</div>
								<ArrowUpRight className="h-5 w-5 text-gray-400" />
							</div>
						</CardHeader>
						<CardContent>
							<CardTitle className="text-lg mb-2">Activity Analytics</CardTitle>
							<CardDescription>
								Track real-time customer activities and conversions
							</CardDescription>
						</CardContent>
					</Card>
				</div>

				{/* Products Section */}
				<Card className="border-gray-200 shadow-sm">
					<CardHeader className="pb-4">
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-xl font-semibold text-gray-900">
									Recent Products
								</CardTitle>
								<CardDescription className="text-gray-600">
									Your latest creations and their performance
								</CardDescription>
							</div>
							<div className="flex items-center space-x-3">
								<div className="flex items-center border border-gray-300 rounded-md">
									<Button
										variant={viewMode === "list" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("list")}
										className="rounded-r-none border-0"
									>
										<List className="h-4 w-4" />
									</Button>
									<Button
										variant={viewMode === "grid" ? "default" : "ghost"}
										size="sm"
										onClick={() => setViewMode("grid")}
										className="rounded-l-none border-0"
									>
										<Grid3X3 className="h-4 w-4" />
									</Button>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => router.push("/vendor/products")}
									className="text-gray-600 hover:text-gray-900"
								>
									View all
									<ArrowUpRight className="h-4 w-4 ml-1" />
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{works.length === 0 ? (
							<div className="p-12 text-center">
								<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<Package className="h-8 w-8 text-gray-400" />
								</div>
								<h3 className="text-lg font-medium text-gray-900 mb-2">
									No products yet
								</h3>
								<p className="text-gray-600 mb-4">
									Start by creating your first product
								</p>
								<Button
									onClick={() => router.push("/vendor/products/create")}
									className="bg-gradient-to-r from-gray-900 to-gray-700 text-white"
								>
									<Plus className="h-4 w-4 mr-2" />
									Create Product
								</Button>
							</div>
						) : viewMode === "list" ? (
							<div className="divide-y divide-gray-100">
								{works.slice(0, 6).map((work) => (
									<div
										key={work.id}
										className="p-6 hover:bg-gray-50 transition-colors duration-200"
									>
										<div className="flex items-center space-x-4">
											<div className="relative">
												<div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
													{work?.images && work.images.length > 0 ? (
														<img
															src={work.images[0]}
															alt={work.title}
															className="w-full h-full object-cover"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center">
															<Package className="h-6 w-6 text-gray-400" />
														</div>
													)}
												</div>
												{work.is_verified && (
													<div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
														<CheckCircle className="h-3 w-3 text-white" />
													</div>
												)}
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between mb-1">
													<h3 className="font-semibold text-gray-900 truncate">
														{work.title}
													</h3>
													<Badge
														className={
															work.is_verified
																? "bg-emerald-50 text-emerald-700 border-emerald-200"
																: "bg-amber-50 text-amber-700 border-amber-200"
														}
													>
														{work.is_verified ? "Live" : "Draft"}
													</Badge>
												</div>
												<div className="flex items-center justify-between">
													<div className="flex items-center space-x-4 text-sm text-gray-600">
														<span className="flex items-center">
															<User className="h-3 w-3 mr-1" />
															{work.category || "Uncategorized"}
														</span>
														<span className="flex items-center">
															<Package className="h-3 w-3 mr-1" />
															Stock: {work.wear_quantity || 0}
														</span>
													</div>
													<div className="flex items-center space-x-2">
														<span className="font-semibold text-gray-900">
															{new Intl.NumberFormat("en-US", {
																style: "currency",
																currency: work.price?.currency ?? "USD",
															}).format(work.price?.base ?? 0)}
														</span>
														<Button
															variant="ghost"
															size="sm"
															onClick={() =>
																router.push(`/vendor/products/${work.id}`)
															}
															className="h-8 w-8 p-0"
														>
															<Eye className="h-4 w-4" />
														</Button>
													</div>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
									{works.slice(0, 8).map((work) => (
										<div
											key={work.id}
											className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200"
										>
											<div className="relative">
												<div className="aspect-square bg-gray-100">
													{work?.images && work.images.length > 0 ? (
														<img
															src={work.images[0]}
															alt={work.title}
															className="w-full h-full object-cover"
														/>
													) : (
														<div className="w-full h-full flex items-center justify-center">
															<Package className="h-12 w-12 text-gray-400" />
														</div>
													)}
												</div>
												{work.is_verified && (
													<div className="absolute top-3 right-3 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
														<CheckCircle className="h-4 w-4 text-white" />
													</div>
												)}
												<div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
											</div>

											<div className="p-4">
												<div className="flex items-center justify-between mb-2">
													<Badge
														className={
															work.is_verified
																? "bg-emerald-50 text-emerald-700 border-emerald-200"
																: "bg-amber-50 text-amber-700 border-amber-200"
														}
													>
														{work.is_verified ? "Live" : "Draft"}
													</Badge>
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															router.push(`/vendor/products/${work.id}`)
														}
														className=" h-8 w-8 p-0"
													>
														<Eye className="h-4 w-4" />
													</Button>
												</div>

												<h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
													{work.title}
												</h3>
												<p className="text-sm text-gray-600 mb-2">
													{work.category || "Uncategorized"}
												</p>

												<div className="flex items-center justify-between">
													<span className="text-sm text-gray-500">
														Stock: {work.wear_quantity || 0}
													</span>
													<span className="font-semibold text-gray-900">
														{new Intl.NumberFormat("en-US", {
															style: "currency",
															currency: work.price?.currency ?? "USD",
														}).format(work.price?.base ?? 0)}
													</span>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
}

export default function ModernDashboard() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center">
					<div className="text-center space-y-4">
						<div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin mx-auto"></div>
						<p className="text-gray-600">Loading dashboard...</p>
					</div>
				</div>
			}
		>
			<ModernDashboardContent />
		</Suspense>
	);
}
