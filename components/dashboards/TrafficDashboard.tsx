"use client";

import React, { useMemo, useState, useEffect, memo, useCallback, lazy, Suspense } from "react";
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

// Lazy load heavy chart components for better performance
const LazyPieChart = lazy(() =>
	import("recharts").then(module => ({ default: module.PieChart }))
);
const LazyAreaChart = lazy(() =>
	import("recharts").then(module => ({ default: module.AreaChart }))
);
const LazyBarChart = lazy(() =>
	import("recharts").then(module => ({ default: module.BarChart }))
);

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

// Optimized loading skeleton component
const DashboardSkeleton = memo(() => (
	<div className="space-y-4 sm:space-y-6 animate-pulse">
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
			<div className="h-64 bg-gray-200 rounded-lg"></div>
			<div className="h-64 bg-gray-200 rounded-lg"></div>
		</div>
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
			<div className="h-96 bg-gray-200 rounded-lg"></div>
			<div className="h-96 bg-gray-200 rounded-lg"></div>
		</div>
	</div>
));
DashboardSkeleton.displayName = 'DashboardSkeleton';

const TrafficDashboard = () => {
	const { dateRange } = useDateRange();
	const router = useRouter();

	// Core state
	const [loading, setLoading] = useState(true);
	const [totalWebHits, setTotalWebHits] = useState(0);

	// Location data
	const [locationData, setLocationData] = useState<CountryData[]>([]);
	const [countryStateData, setCountryStateData] = useState<TrafficByCountryState[]>([]);

	// Traffic data
	const [trafficTrend, setTrafficTrend] = useState<Array<{ day: number; users: number; date: string }>>([]);
	const [topPages, setTopPages] = useState<TrafficByPage[]>([]);
	const [topBrowsers, setTopBrowsers] = useState<Array<{ browser: string; hits: number; percentage: number }>>([]);

	// Social media state
	const [socialMetrics, setSocialMetrics] = useState<SocialMediaMetrics>({
		instagram: [],
		tiktok: [],
		linkedin: [],
		x: [],
	});

	// Dialog state
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
	const [editingMetrics, setEditingMetrics] = useState<Array<{ label: string; value: string }>>([]);
	const [isSaving, setIsSaving] = useState(false);

	// UI state
	const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());

	// Referral state
	const [referralStats, setReferralStats] = useState<ReferralStats>({
		totalReferrals: 0,
		activeReferrals: 0,
		totalRevenue: 0,
		totalPointsEarned: 0,
		totalSignups: 0,
		totalPurchases: 0,
	});
	const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
	const [referralTrend, setReferralTrend] = useState<ReferralTrend[]>([]);
	const [referralTransactionTypes, setReferralTransactionTypes] = useState<ReferralTransactionType[]>([]);
	const [totalReferralUsers, setTotalReferralUsers] = useState(0);

	// Memoized calculations
	const daysDiff = useMemo(() => {
		return Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
	}, [dateRange]);

	const gaColors = useMemo(() => [
		"#1A73E8", "#0F9D58", "#F9AB00", "#EA4335", "#9334E9", "#F97316",
		"#06B6D4", "#84CC16", "#EF4444", "#14B8A6", "#8B5CF6", "#F59E0B",
	], []);

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

	// Optimized data fetching with progressive loading
	const fetchCoreMetrics = useCallback(async () => {
		const services = await webTrafficServices();
		const locationServices = await userLocationServices();

		const [webHits, locations] = await Promise.all([
			services.getCumulativeWebHits(dateRange.start, dateRange.end),
			locationServices.getUsersByCountry(),
		]);

		setTotalWebHits(webHits);
		setLocationData(locations.slice(0, 12));
	}, [dateRange]);

	const fetchSecondaryData = useCallback(async () => {
		const services = await webTrafficServices();

		const [pages, browsers, countryStates] = await Promise.all([
			services.getTopPages(10, dateRange.start, dateRange.end),
			services.getTopBrowsers(10, dateRange.start, dateRange.end),
			services.getTrafficByCountryAndState(dateRange.start, dateRange.end),
		]);

		setTopPages(pages);
		setTopBrowsers(browsers);
		setCountryStateData(countryStates.slice(0, 10));
	}, [dateRange]);

	const fetchReferralData = useCallback(async () => {
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

		setReferralStats(referralStatsData);
		setTopReferrers(topReferrersData);
		setReferralTrend(referralTrendData);
		setReferralTransactionTypes(transactionTypes);
		setTotalReferralUsers(totalUsers);
	}, [dateRange]);

	const fetchTrafficTrend = useCallback(async () => {
		if (daysDiff <= 0) return;

		const services = await webTrafficServices();
		const trend = await services.getDailyTrafficTrend(daysDiff);

		const transformedTrend = trend.map((item) => ({
			day: item.day,
			users: item.hits,
			date: item.date,
		}));

		setTrafficTrend(transformedTrend);
	}, [daysDiff]);

	// Fetch social media metrics on mount
	useEffect(() => {
		const fetchSocialMetrics = async () => {
			try {
				const services = await socialMediaServices();
				const metrics = await services.getSocialMediaMetrics();
				setSocialMetrics(metrics);
			} catch (error) {
				console.error("Error fetching social media metrics:", error);
			}
		};

		fetchSocialMetrics();
	}, []);

	// Progressive data loading
	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				// Load core metrics first
				await fetchCoreMetrics();

				// Small delay for better UX
				await new Promise(resolve => setTimeout(resolve, 50));

				// Load secondary data
				await fetchSecondaryData();

				// Small delay before referral data
				await new Promise(resolve => setTimeout(resolve, 50));

				// Load referral data (lowest priority)
				await fetchReferralData();

			} catch (error) {
				console.error("Error fetching traffic analytics:", error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [fetchCoreMetrics, fetchSecondaryData, fetchReferralData]);

	// Fetch traffic trend separately
	useEffect(() => {
		fetchTrafficTrend().catch(console.error);
	}, [fetchTrafficTrend]);

	// Optimized callbacks
	const toggleCountry = useCallback((country: string) => {
		setExpandedCountries(prev => {
			const newExpanded = new Set(prev);
			if (newExpanded.has(country)) {
				newExpanded.delete(country);
			} else {
				newExpanded.add(country);
			}
			return newExpanded;
		});
	}, []);

	const handleEditClick = useCallback((platform: string) => {
		setEditingPlatform(platform);
		setEditingMetrics([...socialMetrics[platform as keyof SocialMediaMetrics]]);
		setIsEditDialogOpen(true);
	}, [socialMetrics]);

	const handleSaveMetrics = useCallback(async () => {
		if (!editingPlatform) return;

		setIsSaving(true);
		try {
			const services = await socialMediaServices();
			const updatedMetrics = {
				...socialMetrics,
				[editingPlatform]: editingMetrics,
			};
			await services.saveSocialMediaMetrics(updatedMetrics);
			setSocialMetrics(updatedMetrics);
			setIsEditDialogOpen(false);
			setEditingPlatform(null);

			// Dynamic import for toast
			const { toast } = await import("sonner");
			toast.success("Social media metrics saved successfully!");
		} catch (error) {
			console.error("Error saving social media metrics:", error);
			const { toast } = await import("sonner");
			toast.error("Failed to save metrics. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}, [editingPlatform, socialMetrics, editingMetrics]);

	const handleMetricChange = useCallback((
		index: number,
		field: "label" | "value",
		newValue: string
	) => {
		setEditingMetrics(prev => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [field]: newValue };
			return updated;
		});
	}, []);

	const handleAddMetric = useCallback(() => {
		setEditingMetrics(prev => [...prev, { label: "", value: "" }]);
	}, []);

	const handleRemoveMetric = useCallback((index: number) => {
		setEditingMetrics(prev => prev.filter((_, i) => i !== index));
	}, []);

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
			<span
				onClick={() => handleEditClick(platform.toLowerCase())}
				className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-ga-surface transition-colors"
				title="Edit metrics"
			>
				<Edit2 className="w-4 h-4 text-ga-secondary" />
			</span>
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
						No metrics configured. Click edit to add.
					</p>
				)}
			</div>
		</div>
	);

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

	// Early return for loading state to improve perceived performance
	if (loading) {
		return <DashboardSkeleton />;
	}

	return (
		<div className="space-y-4 sm:space-y-6">
			{/* Top Row - Cumulative Hits and Location Chart */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Subtask 7.1: Cumulative hits card with MetricCardGA */}
				<MetricCardGA
					label="Cumulative Website Hits"
					value={loading ? 0 : totalWebHits}
					format="number"
					change={8.3}
					trend="up"
					sparklineData={hitsSparklineData}
					icon={<Globe className="w-5 h-5" />}
					className="lg:col-span-1"
					isLoading={loading}
					onClick={() => router.push('/atlas/traffic/website-hits')}
				/>

				{/* Subtask 7.2: Location pie chart wrapped in ChartCard */}
				<ChartCard
					title="Registered Users Location"
					subtitle="Distribution by country"
					height={280}
					onClick={() => router.push('/atlas/traffic/location')}
				>
					{loading || locationChartData.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p className="text-muted-foreground">
								{loading
									? "Loading location data..."
									: "No location data available"}
							</p>
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

			{/* Regional Distribution - Countries and States */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Visual Chart - Countries Pie Chart */}
				<ChartCard
					title="Traffic by Country"
					subtitle="Web hits distribution by country"
					height={400}
				>
					{loading || countryStateData.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p className="text-muted-foreground">
								{loading
									? "Loading regional data..."
									: "No regional data available"}
							</p>
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={countryStateData.map((c, i) => ({
										name: c.country,
										value: c.countryHits,
										color: gaColors[i % gaColors.length],
									}))}
									cx="50%"
									cy="50%"
									innerRadius={60}
									outerRadius={100}
									paddingAngle={2}
									dataKey="value"
									label={({ name, value }) =>
										`${name}: ${value.toLocaleString()}`
									}
								>
									{countryStateData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={gaColors[index % gaColors.length]}
										/>
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

				{/* Expandable List - Countries with States */}
				<ChartCard
					title="Regional Breakdown"
					subtitle="Click to expand and see states within each country"
				>
					{loading || countryStateData.length === 0 ? (
						<div className="flex items-center justify-center py-12">
							<p className="text-muted-foreground">
								{loading
									? "Loading regional data..."
									: "No regional data available"}
							</p>
						</div>
					) : (
						<div className="space-y-2 max-h-[600px] overflow-y-auto">
							{countryStateData.map((countryData, countryIndex) => {
								const isExpanded = expandedCountries.has(countryData.country);
								const hasStates = countryData.states.length > 0;

								return (
									<div
										key={countryData.country}
										className={`
                    border border-ga rounded-lg overflow-hidden
                    transition-colors hover:bg-ga-surface/50
                    ${countryIndex % 2 === 0
												? "bg-ga-background"
												: "bg-ga-surface/30"
											}
                  `}
									>
										{/* Country Header */}
										<span
											onClick={() => toggleCountry(countryData.country)}
											className="w-full flex items-center justify-between p-4 hover:bg-ga-surface/50 transition-colors"

										>
											<div className="flex items-center gap-3 flex-1 min-w-0">
												{hasStates && (
													<div className="shrink-0">
														{isExpanded ? (
															<ChevronDown className="w-4 h-4 text-ga-secondary" />
														) : (
															<ChevronRight className="w-4 h-4 text-ga-secondary" />
														)}
													</div>
												)}
												<div className="flex-1 min-w-0 text-left">
													<div className="flex items-center gap-2">
														<span className="text-base font-semibold text-ga-primary">
															{countryData.country}
														</span>
														{hasStates && (
															<span className="text-xs text-ga-secondary">
																({countryData.states.length}{" "}
																{countryData.states.length === 1
																	? "state"
																	: "states"}
																)
															</span>
														)}
													</div>
												</div>
												<div className="flex items-center gap-4 shrink-0">
													<div className="text-right">
														<div className="text-sm font-semibold text-ga-primary">
															{countryData.countryHits.toLocaleString()}
														</div>
														<div className="text-xs text-ga-secondary">
															hits
														</div>
													</div>
												</div>
											</div>
										</span>

										{/* States List (Expandable) */}
										{hasStates && isExpanded && (
											<div className="border-t border-ga bg-ga-surface/20">
												<div className="p-2 space-y-1">
													{countryData.states
														.sort((a, b) => b.hits - a.hits)
														.map((state, stateIndex) => (
															<div
																key={state.state}
																className={`
                              flex items-center justify-between p-3 rounded-md
                              transition-colors hover:bg-ga-surface
                              ${stateIndex % 2 === 0
																		? "bg-ga-background/50"
																		: "bg-transparent"
																	}
                            `}
															>
																<div className="flex items-center gap-3 flex-1 min-w-0">
																	<div className="w-2 h-2 rounded-full bg-ga-accent shrink-0" />
																	<span className="text-sm text-ga-primary truncate">
																		{state.state}
																	</span>
																</div>
																<div className="text-right shrink-0">
																	<span className="text-sm font-semibold text-ga-secondary">
																		{state.hits.toLocaleString()}
																	</span>
																	<span className="text-xs text-ga-secondary ml-1">
																		hits
																	</span>
																</div>
															</div>
														))}
												</div>
											</div>
										)}
									</div>
								);
							})}
						</div>
					)}
				</ChartCard>
			</div>

			{/* Subtask 7.3: Website Traffic Chart with GA styling and gradient fill */}
			<ChartCard
				title="Website Traffic (Daily)"
				subtitle="Page views over the selected date range"
				height={320}
				onClick={() => router.push('/atlas/traffic/trend')}
			>
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
			</ChartCard>

			{/* Top Pages and Browsers Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Top Pages Visited */}
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
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">Loading pages...</p>
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

				{/* Top Browsers */}
				<ChartCard title="Top Browsers" subtitle="Browser usage distribution">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<p className="text-muted-foreground">Loading browsers...</p>
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

			{/* Subtask 7.4: Social Media Cards with GA styling and hover effects */}
			<div
				className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 cursor-pointer"
				onClick={() => router.push('/atlas/traffic/social')}
			>
				<SocialCard
					platform="Instagram"
					icon={Instagram}
					iconColor="#E1306C"
					metrics={socialMetrics.instagram}
				/>
				<SocialCard
					platform="TikTok"
					icon={TikTokIcon}
					iconColor="#000000"
					metrics={socialMetrics.tiktok}
				/>
				<SocialCard
					platform="LinkedIn"
					icon={LinkedInIcon}
					iconColor="#0A66C2"
					metrics={socialMetrics.linkedin}
				/>
				<SocialCard
					platform="X"
					icon={XIcon}
					iconColor="#000000"
					metrics={socialMetrics.x}
				/>
			</div>

			{/* Referral Analytics Section */}
			<div className="space-y-4 sm:space-y-6">
				<h2 className="text-xl sm:text-2xl font-semibold text-ga-primary">
					Referral Analytics
				</h2>

				{/* Referral Metrics Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
					<MetricCardGA
						label="Total Referrals"
						value={loading ? 0 : referralStats.totalReferrals}
						format="number"
						icon={<Users className="w-5 h-5" />}
						isLoading={loading}
					/>
					<MetricCardGA
						label="Active Referrals"
						value={loading ? 0 : referralStats.activeReferrals}
						format="number"
						icon={<TrendingUp className="w-5 h-5" />}
						isLoading={loading}
					/>
					<MetricCardGA
						label="Total Revenue"
						value={loading ? 0 : referralStats.totalRevenue}
						format="currency"
						icon={<DollarSign className="w-5 h-5" />}
						isLoading={loading}
					/>
					<MetricCardGA
						label="Total Points Earned"
						value={loading ? 0 : referralStats.totalPointsEarned}
						format="number"
						icon={<Gift className="w-5 h-5" />}
						isLoading={loading}
					/>
				</div>

				{/* Referral Trend Chart */}
				<ChartCard
					title="Referral Activity Trend"
					subtitle="Signups and transactions over time"
					height={320}
				>
					{loading || referralTrend.length === 0 ? (
						<div className="h-full flex items-center justify-center">
							<p className="text-muted-foreground">
								{loading
									? "Loading referral trend..."
									: "No referral trend data available"}
							</p>
						</div>
					) : (
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={referralTrend}>
								<defs>
									<linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
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
									<linearGradient
										id="colorTransactions"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="rgb(15, 157, 88)"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="rgb(15, 157, 88)"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="hsl(var(--ga-border))"
								/>
								<XAxis
									dataKey="date"
									stroke="hsl(var(--ga-secondary))"
									style={{ fontSize: "12px" }}
									tickFormatter={(value) => {
										const date = new Date(value);
										return `${date.getMonth() + 1}/${date.getDate()}`;
									}}
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
								<Legend />
								<Area
									type="monotone"
									dataKey="signups"
									stackId="1"
									stroke="rgb(26, 115, 232)"
									fill="url(#colorSignups)"
									name="Signups"
								/>
								<Area
									type="monotone"
									dataKey="transactions"
									stackId="1"
									stroke="rgb(15, 157, 88)"
									fill="url(#colorTransactions)"
									name="Transactions"
								/>
							</AreaChart>
						</ResponsiveContainer>
					)}
				</ChartCard>

				{/* Top Referrers and Transaction Types */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
					{/* Top Referrers */}
					<ChartCard
						title="Top Referrers"
						subtitle="Users with the most successful referrals"
					>
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<p className="text-muted-foreground">Loading referrers...</p>
							</div>
						) : topReferrers.length === 0 ? (
							<div className="flex items-center justify-center py-8">
								<p className="text-muted-foreground">
									No referrer data available
								</p>
							</div>
						) : (
							<div className="space-y-2 max-h-[400px] overflow-y-auto">
								{topReferrers.map((referrer, index) => (
									<div
										key={referrer.referrerId}
										className={`
                      flex justify-between items-center p-3 rounded-lg
                      transition-colors hover:bg-ga-surface
                      ${index % 2 === 0
												? "bg-ga-background"
												: "bg-ga-surface/50"
											}
                    `}
									>
										<div className="flex-1 min-w-0">
											<span className="text-sm font-medium text-ga-primary block truncate">
												{index + 1}.{" "}
												{referrer.referrerName ||
													referrer.referralCode ||
													referrer.referrerId.slice(0, 8)}
											</span>
											<div className="flex gap-3 mt-1">
												<span className="text-xs text-muted-foreground">
													{referrer.totalReferrals} referrals
												</span>
												{referrer.referralCode && (
													<span className="text-xs text-muted-foreground">
														Code: {referrer.referralCode}
													</span>
												)}
											</div>
										</div>
										<div className="text-right shrink-0 ml-2">
											<div className="text-sm font-semibold text-ga-secondary">
												${referrer.totalRevenue.toLocaleString()}
											</div>
											<div className="text-xs text-muted-foreground">
												{referrer.totalPoints} pts
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</ChartCard>

					{/* Transaction Types */}
					<ChartCard
						title="Transaction Types"
						subtitle="Breakdown of referral transaction types"
					>
						{loading ? (
							<div className="flex items-center justify-center py-8">
								<p className="text-muted-foreground">Loading transactions...</p>
							</div>
						) : referralTransactionTypes.length === 0 ? (
							<div className="flex items-center justify-center py-8">
								<p className="text-muted-foreground">
									No transaction data available
								</p>
							</div>
						) : (
							<div className="space-y-2 max-h-[400px] overflow-y-auto">
								{referralTransactionTypes.map((transaction, index) => (
									<div
										key={transaction.type}
										className={`
                      flex justify-between items-center p-3 rounded-lg
                      transition-colors hover:bg-ga-surface
                      ${index % 2 === 0
												? "bg-ga-background"
												: "bg-ga-surface/50"
											}
                    `}
									>
										<div className="flex-1 min-w-0">
											<span className="text-sm font-medium text-ga-primary block truncate">
												{index + 1}. {transaction.type}
											</span>
											<span className="text-xs text-muted-foreground">
												{transaction.count} transactions
											</span>
										</div>
										<span className="text-sm text-ga-secondary font-semibold ml-2 shrink-0">
											{transaction.totalPoints.toLocaleString()} pts
										</span>
									</div>
								))}
							</div>
						)}
					</ChartCard>
				</div>

				{/* Additional Referral Stats */}
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
					<MetricCardGA
						label="Total Referral Users"
						value={loading ? 0 : totalReferralUsers}
						format="number"
						icon={<Users className="w-5 h-5" />}
						isLoading={loading}
					/>
					<MetricCardGA
						label="Total Signups"
						value={loading ? 0 : referralStats.totalSignups}
						format="number"
						icon={<TrendingUp className="w-5 h-5" />}
						isLoading={loading}
					/>
					<MetricCardGA
						label="Total Purchases"
						value={loading ? 0 : referralStats.totalPurchases}
						format="number"
						icon={<Gift className="w-5 h-5" />}
						isLoading={loading}
					/>
				</div>
			</div>

			{/* Edit Dialog */}
			<Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							Edit{" "}
							{editingPlatform
								? editingPlatform.charAt(0).toUpperCase() +
								editingPlatform.slice(1)
								: ""}{" "}
							Metrics
						</DialogTitle>
						<DialogDescription>
							Update the social media metrics. Changes will be saved to the
							database.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{editingMetrics.map((metric, index) => (
							<div key={index} className="flex gap-2 items-end">
								<div className="flex-1">
									<Label htmlFor={`label-${index}`}>Label</Label>
									<Input
										id={`label-${index}`}
										value={metric.label}
										onChange={(e) =>
											handleMetricChange(index, "label", e.target.value)
										}
										placeholder="e.g., Cumulative Spend"
									/>
								</div>
								<div className="flex-1">
									<Label htmlFor={`value-${index}`}>Value</Label>
									<Input
										id={`value-${index}`}
										value={metric.value}
										onChange={(e) =>
											handleMetricChange(index, "value", e.target.value)
										}
										placeholder="e.g., $2,450"
									/>
								</div>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => handleRemoveMetric(index)}
									className="mb-0"
								>
									<X className="w-4 h-4" />
								</Button>
							</div>
						))}

						<Button
							type="button"
							variant="outline"
							onClick={handleAddMetric}
							className="w-full"
						>
							+ Add Metric
						</Button>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsEditDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleSaveMetrics}
							disabled={isSaving}
						>
							{isSaving ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									Saving...
								</>
							) : (
								<>
									<Save className="w-4 h-4 mr-2" />
									Save
								</>
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

// Memoized export for better performance
const MemoizedTrafficDashboard = memo(TrafficDashboard);
MemoizedTrafficDashboard.displayName = 'TrafficDashboard';

export default MemoizedTrafficDashboard;
