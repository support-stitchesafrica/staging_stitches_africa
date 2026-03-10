"use client";

import React, { useEffect, useState } from "react";
import {
	fetchAnalyticsOverview,
	AnalyticsOverviewResponse,
} from "@/lib/services/AnalyticsService";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
	BarChart,
	Bar,
	Cell,
	PieChart,
	Pie,
} from "recharts";
import {
	ArrowDownRight,
	ArrowUpRight,
	Users,
	Activity,
	MousePointerClick,
	Eye,
	UserPlus,
	UserCheck,
} from "lucide-react";
import { toast } from "sonner";

// --- Components ---

const MetricCard = ({
	title,
	value,
	previousValue,
	icon: Icon,
	formatter = (val: number) => val.toLocaleString(),
}: {
	title: string;
	value: number;
	previousValue: number;
	icon: React.ElementType;
	formatter?: (val: number) => string;
}) => {
	const diff = value - previousValue;
	const percentage = previousValue ? (diff / previousValue) * 100 : 0;
	const isPositive = diff >= 0;

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{formatter(value)}</div>
				<p className="text-xs text-muted-foreground flex items-center mt-1">
					{isPositive ? (
						<ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
					) : (
						<ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
					)}
					<span className={isPositive ? "text-green-500" : "text-red-500"}>
						{Math.abs(percentage).toFixed(1)}%
					</span>
					<span className="ml-1">from previous period</span>
				</p>
			</CardContent>
		</Card>
	);
};

export const AnalyticsDashboard = () => {
	const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const loadData = async () => {
			try {
				const result = await fetchAnalyticsOverview();
				console.log("Analytics Data:", result);
				setData(result);
			} catch (error) {
				console.error("Failed to load analytics:", error);
				toast.error("Failed to load analytics data.");
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
					{[...Array(4)].map((_, i) => (
						<div
							key={i}
							className="h-32 rounded-xl bg-gray-100 animate-pulse"
						/>
					))}
				</div>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
					<div className="col-span-4 h-96 rounded-xl bg-gray-100 animate-pulse" />
					<div className="col-span-3 h-96 rounded-xl bg-gray-100 animate-pulse" />
				</div>
			</div>
		);
	}

	if (!data) return <div>No data available</div>;

	// Calculate Funnel Drop-off Rate
	const signupDropOffRate =
		data.signupStart > 0
			? ((data.signupStart - data.signupComplete) / data.signupStart) * 100
			: 0;

	const signupCompletionRate =
		data.signupStart > 0 ? (data.signupComplete / data.signupStart) * 100 : 0;

	const funnelData = [
		{ name: "Started", value: data.signupStart, fill: "#3b82f6" },
		{ name: "Completed", value: data.signupComplete, fill: "#22c55e" },
	];

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<MetricCard
					title="Daily Active Users"
					value={data.dau}
					previousValue={data.previousDau}
					icon={Users}
				/>
				<MetricCard
					title="Monthly Active Users"
					value={data.mau}
					previousValue={data.previousMau}
					icon={Users}
				/>
				<MetricCard
					title="Sessions"
					value={data.sessions}
					previousValue={data.previousSessions}
					icon={Activity}
				/>
				<MetricCard
					title="Page Views"
					value={data.pageViews}
					previousValue={data.previousPageViews}
					icon={Eye}
				/>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Traffic Trend</CardTitle>
						<CardDescription>
							Daily sessions over the last 30 days
						</CardDescription>
					</CardHeader>
					<CardContent className="pl-2">
						<ResponsiveContainer width="100%" height={350}>
							<AreaChart data={data.trafficTrend}>
								<defs>
									<linearGradient
										id="colorSessions"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
										<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
									</linearGradient>
								</defs>
								<XAxis
									dataKey="date"
									stroke="#888888"
									fontSize={12}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) => {
										// value format YYYYMMDD
										if (value.length === 8) {
											return `${value.substring(4, 6)}/${value.substring(
												6,
												8
											)}`;
										}
										return value;
									}}
								/>
								<YAxis
									stroke="#888888"
									fontSize={12}
									tickLine={false}
									axisLine={false}
									tickFormatter={(value) => `${value}`}
								/>
								<CartesianGrid strokeDasharray="3 3" vertical={false} />
								<Tooltip />
								<Area
									type="monotone"
									dataKey="sessions"
									stroke="#3b82f6"
									fillOpacity={1}
									fill="url(#colorSessions)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Signup Funnel</CardTitle>
						<CardDescription>
							Drop-off Rate:{" "}
							<span className="font-bold text-red-500">
								{signupDropOffRate.toFixed(1)}%
							</span>
							<br />
							Completion Rate:{" "}
							<span className="font-bold text-green-500">
								{signupCompletionRate.toFixed(1)}%
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={350}>
							<BarChart
								data={funnelData}
								layout="vertical"
								margin={{ left: 40 }}
							>
								<XAxis type="number" hide />
								<YAxis dataKey="name" type="category" width={80} />
								<Tooltip />
								<Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
									{funnelData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.fill} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
				<Card className="col-span-4">
					<CardHeader>
						<CardTitle>Top Pages</CardTitle>
						<CardDescription>
							Most visited pages in the last 30 days
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{data.topPages
								.filter(
									(page) =>
										!["(unknown)", "(not set)"].includes(page.title) &&
										!["(unknown)", "(not set)"].includes(page.path)
								)
								.sort((a, b) => b.views - a.views)
								.slice(0, 5)
								.map((page, i) => (
									<div key={i} className="flex items-center">
										<div className="ml-4 space-y-1">
											<p className="text-sm font-medium leading-none">
												{page.title}
											</p>
											<p className="text-sm text-muted-foreground">
												{page.path}
											</p>
										</div>
										<div className="ml-auto font-medium">
											{page.views.toLocaleString()} views
										</div>
									</div>
								))}
						</div>
					</CardContent>
				</Card>

				<Card className="col-span-3">
					<CardHeader>
						<CardTitle>Traffic Sources</CardTitle>
						<CardDescription>Where your users are coming from</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{data.trafficSources.map((source, i) => (
								<div key={i} className="flex items-center justify-between">
									<span className="text-sm font-medium">{source.source}</span>
									<span className="text-sm font-bold">
										{source.sessions.toLocaleString()}
									</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
