"use client";

import React, { useMemo, memo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	LineChart,
	Line,
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
	BarChart,
	Bar,
	Legend,
} from "recharts";
import {
	Instagram,
	Facebook,
	Globe,
	Edit2,
	Save,
	X,
	ChevronDown,
	ChevronRight,
	ArrowRight,
	Users,
	TrendingUp,
	DollarSign,
	Gift,
} from "lucide-react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCachedData } from "@/lib/utils/cache-utils";
import { DashboardSkeleton } from "@/components/ui/optimized-loader";

// Import services with dynamic imports for better code splitting
const webTrafficServices = () => import("@/services/webTrafficAnalytics");
const userLocationServices = () => import("@/services/userLocationAnalytics");
const socialMediaServices = () => import("@/services/socialMediaMetrics");
const referralServices = () => import("@/services/referralAnalytics");

// Type definitions
interface TrafficByPage {
	page_url: string;
	page_title: string;
	hits: number;
}

interface CountryData {
	country: string;
	count: number;
}

interface TrafficByCountryState {
	country: string;
	countryHits: number;
	states: Array<{ state: string; hits: number }>;
}

interface SocialMediaMetrics {
	instagram: Array<{ label: string; value: string }>;
	tiktok: Array<{ label: string; value: string }>;
	linkedin: Array<{ label: string; value: string }>;
	x: Array<{ label: string; value: string }>;
}

interface ReferralStats {
	totalReferrals: number;
	activeReferrals: number;
	totalRevenue: number;
	totalPointsEarned: number;
	totalSignups: number;
	totalPurchases: number;
}

interface TopReferrer {
	referrerId: string;
	referrerName?: string;
	referralCode?: string;
	totalReferrals: number;
	totalRevenue: number;
	totalPoints: number;
}

interface ReferralTrend {
	date: string;
	signups: number;
	transactions: number;
}

interface ReferralTransactionType {
	type: string;
	count: number;
	totalPoints: number;
}

const OptimizedTrafficDashboard = () => {
	const { dateRange } = useDateRange();
	const router = useRouter();

	// Calculate number of days in the selected range
	const daysDiff = useMemo(() => {
		return Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
	}, [dateRange]);

	// GA color palette for charts
	const gaColors = useMemo(() => [
		"#1A73E8", "#0F9D58", "#F9AB00", "#EA4335", "#9334E9", "#F97316",
		"#06B6D4", "#84CC16", "#EF4444", "#14B8A6", "#8B5CF6", "#F59E0B",
	], []);

	// Optimized data fetching with caching - Core metrics (load first)
	const {
		data: coreMetrics,
		loading: coreLoading
	} = useCachedData(
		`traffic-core-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`,
		async () => {
			const services = await webTrafficServices();
			const locationServices = await userLocationServices();
			
			const [webHits, locations] = await Promise.all([
				services.getCumulativeWebHits(dateRange.start, dateRange.end),
				locationServices.getUsersByCountry(),
			]);
			
			return {
				totalWebHits: webHits,
				locationData: locations.slice(0, 12)
			};
		},
		2 * 60 * 1000 // 2 minutes cache
	);

	// Traffic trend data (load second)
	const {
		data: trafficTrendData,
		loading: trendLoading
	} = useCachedData(
		`traffic-trend-${daysDiff}`,
		async () => {
			if (daysDiff <= 0) return [];
			
			const services = await webTrafficServices();
			const trend = await services.getDailyTrafficTrend(daysDiff);
			
			return trend.map((item) => ({
				day: item.day,
				users: item.hits,
				date: item.date,
			}));
		},
		10 * 60 * 1000 // 10 minutes cache
	);

	// Secondary data (load third)
	const {
		data: secondaryData,
		loading: secondaryLoading
	} = useCachedData(
		`traffic-secondary-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`,
		async () => {
			const services = await webTrafficServices();
			
			const [pages, browsers, countryStates] = await Promise.all([
				services.getTopPages(10, dateRange.start, dateRange.end),
				services.getTopBrowsers(10, dateRange.start, dateRange.end),
				services.getTrafficByCountryAndState(dateRange.start, dateRange.end),
			]);
			
			return {
				topPages: pages,
				topBrowsers: browsers,
				countryStateData: countryStates.slice(0, 10)
			};
		},
		5 * 60 * 1000 // 5 minutes cache
	);

	// Social media data (load fourth)
	const {
		data: socialMetrics,
		loading: socialLoading
	} = useCachedData(
		'traffic-social-metrics',
		async () => {
			const services = await socialMediaServices();
			return await services.getSocialMediaMetrics();
		},
		30 * 60 * 1000 // 30 minutes cache
	);

	// Referral data (load last - lowest priority)
	const {
		data: referralData,
		loading: referralLoading
	} = useCachedData(
		`traffic-referral-${dateRange.start.toISOString()}-${dateRange.end.toISOString()}`,
		async () => {
			const services = await referralServices();
			
			const [
				referralStatsData,
				topReferrersData,
				referralTrendData,
				transactionTypes,
				totalUsers,
			] = await Promise.all([
				services.getReferralStats(dateRange.start, dateRange.end),
				services.getTopReferrers(10, dateRange.start, dateRange.end),
				services.getReferralTrend(30, dateRange.start, dateRange.end),
				services.getReferralTransactionTypes(dateRange.start, dateRange.end),
				services.getTotalReferralUsers(),
			]);
			
			return {
				referralStats: referralStatsData,
				topReferrers: topReferrersData,
				referralTrend: referralTrendData,
				referralTransactionTypes: transactionTypes,
				totalReferralUsers: totalUsers
			};
		},
		15 * 60 * 1000 // 15 minutes cache
	);

	// Extract data from cached results with fallbacks
	const totalWebHits = coreMetrics?.totalWebHits || 0;
	const locationData = coreMetrics?.locationData || [];
	const topPages = secondaryData?.topPages || [];
	const topBrowsers = secondaryData?.topBrowsers || [];
	const countryStateData = secondaryData?.countryStateData || [];
	const trafficTrend = trafficTrendData || [];
	const referralStats = referralData?.referralStats || {
		totalReferrals: 0,
		activeReferrals: 0,
		totalRevenue: 0,
		totalPointsEarned: 0,
		totalSignups: 0,
		totalPurchases: 0,
	};
	const topReferrers = referralData?.topReferrers || [];
	const referralTrendArray = referralData?.referralTrend || [];
	const referralTransactionTypes = referralData?.referralTransactionTypes || [];
	const totalReferralUsers = referralData?.totalReferralUsers || 0;
	const socialMetricsData = socialMetrics || {
		instagram: [],
		tiktok: [],
		linkedin: [],
		x: [],
	};

	// Memoized calculations
	const locationChartData = useMemo(() => {
		return locationData.map((loc, index) => ({
			name: loc.country,
			value: loc.count,
			color: gaColors[index % gaColors.length],
		}));
	}, [locationData, gaColors]);

	const activeUsersData = useMemo(() => {
		if (trafficTrend.length > 0) {
			return trafficTrend;
		}
		return Array.from({ length: daysDiff }, (_, i) => ({
			day: i + 1,
			users: 0,
			date: "",
		}));
	}, [trafficTrend, daysDiff]);

	const hitsSparklineData = useMemo(() => [45000, 46200, 47100, 48500, 49200, 50000], []);

	// Early return for initial loading state
	if (coreLoading) {
		return <DashboardSkeleton />;
	}

	// Social Card Component
	const SocialCard = ({
		platform,
		icon: Icon,
		iconColor,
		metrics,
	}: {
		platform: string;
		icon: any;
		iconColor: string;
		metrics: { label: string; value: string }[];
	}) => (
		<div className="bg-ga-background border border-ga rounded-lg p-4 sm:p-6 shadow-ga-card hover:shadow-ga-card-hover transition-ga-base transition-shadow relative">
			<div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
				<Icon
					className="w-6 h-6 sm:w-8 sm:h-8 shrink-0"
					style={{ color: iconColor }}
				/>
				<h3 className="text-base sm:text-lg font-semibold text-ga-primary font-ga truncate">
					{platform}
				</h3>
			</div>
			<div className="space-y-2 text-xs sm:text-sm">
				{metrics.length > 0 ? (
					metrics.map((metric, idx) => (
						<div key={idx} className="flex justify-between items-center gap-2">
							<span className="text-ga-secondary truncate">
								{metric.label}:
							</span>
							<span className="font-semibold text-ga-primary tabular-nums shrink-0">
								{metric.value}
							</span>
						</div>
					))
				) : (
					<p className="text-ga-secondary text-xs">
						No metrics configured.
					</p>
				)}
			</div>
		</div>
	);

	// Icon components
	const LinkedInIcon = () => (
		<svg
			viewBox="0 0 24 24"
			className="w-6 h-6 sm:w-8 sm:h-8"
			fill="currentColor"
		>
			<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
		</svg>
	);

	const XIcon = () => (
		<svg
			viewBox="0 0 24 24"
			className="w-6 h-6 sm:w-8 sm:h-8"
			fill="currentColor"
		>
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
		</svg>
	);

	const TikTokIcon = () => (
		<svg
			viewBox="0 0 24 24"
			className="w-6 h-6 sm:w-8 sm:h-8"
			fill="currentColor"
		>
			<path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
		</svg>
	);

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Top Row - Cumulative Hits and Location Chart */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				<MetricCardGA
					label="Cumulative Website Hits"
					value={totalWebHits}
					format="number"
					change={8.3}
					trend="up"
					sparklineData={hitsSparklineData}
					icon={<Globe className="w-5 h-5" />}
					className="lg:col-span-1"
					isLoading={false}
					onClick={() => router.push('/atlas/traffic/website-hits')}
				/>

				<ChartCard
					title="Registered Users Location"
					subtitle="Distribution by country"
					height={280}
					onClick={() => router.push('/atlas/traffic/location')}
				>
					{locationChartData.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p className="text-muted-foreground">No location data available</p>
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={locationChartData}
									cx="50%"
									cy="50%"
									innerRadius={50}
									outerRadius={90}
									paddingAngle={2}
									dataKey="value"
									label={({ name, value }) => `${name} ${value}`}
								>
									{locationChartData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
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

			{/* Website Traffic Chart */}
			<ChartCard
				title="Website Traffic (Daily)"
				subtitle="Page views over the selected date range"
				height={320}
				onClick={() => router.push('/atlas/traffic/trend')}
			>
				{trendLoading ? (
					<div className="h-full flex items-center justify-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					</div>
				) : (
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={activeUsersData}>
							<defs>
								<linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor="rgb(26, 115, 232)"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="rgb(26, 115, 232)"
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
								stroke="hsl(var(--ga-secondary))"
								style={{ fontSize: "12px" }}
							/>
							<YAxis
								stroke="hsl(var(--ga-secondary))"
								style={{ fontSize: "12px" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: "hsl(var(--ga-background))",
									border: "1px solid hsl(var(--ga-border))",
									borderRadius: "8px",
									boxShadow: "0 2px 6px 2px rgba(60,64,67,.15)",
								}}
							/>
							<Area
								type="monotone"
								dataKey="users"
								stroke="rgb(26, 115, 232)"
								strokeWidth={2}
								fill="url(#colorUsers)"
								dot={false}
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</ChartCard>

			{/* Top Pages and Browsers Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				<ChartCard
					title="Top Pages Visited"
					subtitle="Most viewed pages on your website"
					actions={
						<Link
							href="/atlas/traffic/pages"
							className="flex items-center gap-1 text-xs sm:text-sm text-ga-secondary hover:text-ga-primary transition-colors font-medium"
						>
							See All
							<ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
						</Link>
					}
				>
					{secondaryLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
						</div>
					) : topPages.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">No page data available</p>
						</div>
					) : (
						<div className="space-y-2 max-h-[400px] overflow-y-auto">
							{topPages.map((page, index) => (
								<div
									key={page.page_url}
									className={`
                    flex justify-between items-center p-3 rounded-lg
                    transition-colors hover:bg-ga-surface
                    ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
                  `}
								>
									<div className="flex-1 min-w-0">
										<span className="text-sm font-medium text-ga-primary block truncate">
											{index + 1}. {page.page_title}
										</span>
										<span className="text-xs text-muted-foreground truncate block">
											{page.page_url}
										</span>
									</div>
									<span className="text-sm text-ga-secondary font-semibold ml-2 shrink-0">
										{page.hits.toLocaleString()} views
									</span>
								</div>
							))}
						</div>
					)}
				</ChartCard>

				<ChartCard title="Top Browsers" subtitle="Browser usage distribution">
					{secondaryLoading ? (
						<div className="flex items-center justify-center py-8">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
						</div>
					) : topBrowsers.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">No browser data available</p>
						</div>
					) : (
						<div className="space-y-2 max-h-[400px] overflow-y-auto">
							{topBrowsers.map((browser, index) => (
								<div
									key={browser.browser}
									className={`
                    flex justify-between items-center p-3 rounded-lg
                    transition-colors hover:bg-ga-surface
                    ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
                  `}
								>
									<div className="flex-1 min-w-0">
										<span className="text-sm font-medium text-ga-primary block truncate">
											{index + 1}. {browser.browser}
										</span>
										<span className="text-xs text-muted-foreground">
											{browser.percentage.toFixed(1)}% of traffic
										</span>
									</div>
									<span className="text-sm text-ga-secondary font-semibold ml-2 shrink-0">
										{browser.hits.toLocaleString()} hits
									</span>
								</div>
							))}
						</div>
					)}
				</ChartCard>
			</div>

			{/* Social Media Cards */}
			<div 
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 cursor-pointer"
				onClick={() => router.push('/atlas/traffic/social')}
			>
				{socialLoading ? (
					Array.from({ length: 4 }).map((_, i) => (
						<div key={i} className="bg-white border rounded-lg p-4 animate-pulse">
							<div className="h-6 bg-gray-200 rounded mb-2"></div>
							<div className="h-4 bg-gray-200 rounded mb-1"></div>
							<div className="h-4 bg-gray-200 rounded"></div>
						</div>
					))
				) : (
					<>
						<SocialCard
							platform="Instagram"
							icon={Instagram}
							iconColor="#E1306C"
							metrics={socialMetricsData.instagram}
						/>
						<SocialCard
							platform="TikTok"
							icon={TikTokIcon}
							iconColor="#000000"
							metrics={socialMetricsData.tiktok}
						/>
						<SocialCard
							platform="LinkedIn"
							icon={LinkedInIcon}
							iconColor="#0A66C2"
							metrics={socialMetricsData.linkedin}
						/>
						<SocialCard
							platform="X"
							icon={XIcon}
							iconColor="#000000"
							metrics={socialMetricsData.x}
						/>
					</>
				)}
			</div>

			{/* Referral Analytics Section - Load Last */}
			{!referralLoading && referralData && (
				<div className="space-y-4 sm:space-y-6">
					<h2 className="text-xl sm:text-2xl font-semibold text-ga-primary">
						Referral Analytics
					</h2>

					{/* Referral Metrics Cards */}
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
						<MetricCardGA
							label="Total Referrals"
							value={referralStats.totalReferrals}
							format="number"
							icon={<Users className="w-5 h-5" />}
							isLoading={false}
						/>
						<MetricCardGA
							label="Active Referrals"
							value={referralStats.activeReferrals}
							format="number"
							icon={<TrendingUp className="w-5 h-5" />}
							isLoading={false}
						/>
						<MetricCardGA
							label="Total Revenue"
							value={referralStats.totalRevenue}
							format="currency"
							icon={<DollarSign className="w-5 h-5" />}
							isLoading={false}
						/>
						<MetricCardGA
							label="Total Points Earned"
							value={referralStats.totalPointsEarned}
							format="number"
							icon={<Gift className="w-5 h-5" />}
							isLoading={false}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

// Memoized export for better performance
const MemoizedOptimizedTrafficDashboard = memo(OptimizedTrafficDashboard);
MemoizedOptimizedTrafficDashboard.displayName = 'OptimizedTrafficDashboard';

export default MemoizedOptimizedTrafficDashboard;