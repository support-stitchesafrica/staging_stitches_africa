"use client";

import React, { useState, useEffect } from "react";
import { AtlasRole, ROLE_PERMISSIONS } from "@/lib/atlas/types";
import { DateRange } from "@/lib/atlas/unified-analytics/types";
import {
	notificationAnalyticsService,
	NotificationMetrics,
	CampaignMetrics,
	PlatformBreakdown,
	SourceBreakdown,
	NotificationEvent,
} from "@/lib/atlas/unified-analytics/services/notification-analytics-service";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	AlertCircle,
	Bell,
	Send,
	MousePointer,
	Percent,
	Smartphone,
	Monitor,
	Clock,
	TrendingUp,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	Legend,
} from "recharts";

export interface NotificationAnalyticsSectionProps {
	dateRange: DateRange;
	userRole: AtlasRole;
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

/**
 * Notification Analytics Section for Atlas Dashboard
 * Displays push notification metrics, campaign performance, and platform breakdown
 */
export const NotificationAnalyticsSection: React.FC<
	NotificationAnalyticsSectionProps
> = ({ dateRange, userRole }) => {
	const [loading, setLoading] = useState(true);
	const [isAuthorized, setIsAuthorized] = useState(false);
	const [metrics, setMetrics] = useState<NotificationMetrics | null>(null);
	const [campaigns, setCampaigns] = useState<CampaignMetrics[]>([]);
	const [platformBreakdown, setPlatformBreakdown] =
		useState<PlatformBreakdown | null>(null);
	const [sourceBreakdown, setSourceBreakdown] =
		useState<SourceBreakdown | null>(null);
	const [recentNotifications, setRecentNotifications] = useState<
		NotificationEvent[]
	>([]);
	const [error, setError] = useState<string | null>(null);

	// Check if user has access to notification analytics
	const hasAccess = ROLE_PERMISSIONS[userRole]?.dashboards.includes(
		"/atlas/notification-analytics"
	);

	useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			setError(null);

			// Check access
			if (!hasAccess) {
				setIsAuthorized(false);
				setLoading(false);
				return;
			}

			setIsAuthorized(true);

			try {
				const analyticsDateRange = {
					from: dateRange.from,
					to: dateRange.to,
				};

				// Load all data in parallel
				const [
					metricsData,
					campaignsData,
					platformData,
					sourceData,
					recentData,
				] = await Promise.all([
					notificationAnalyticsService.getNotificationMetrics(
						analyticsDateRange
					),
					notificationAnalyticsService.getCampaignList(analyticsDateRange),
					notificationAnalyticsService.getPlatformBreakdown(analyticsDateRange),
					notificationAnalyticsService.getSourceBreakdown(analyticsDateRange),
					notificationAnalyticsService.getRecentNotifications(20),
				]);

				setMetrics(metricsData);
				setCampaigns(campaignsData);
				setPlatformBreakdown(platformData);
				setSourceBreakdown(sourceData);
				setRecentNotifications(recentData);
			} catch (err) {
				console.error("Error loading notification analytics:", err);
				setError("Failed to load notification analytics data");
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [dateRange, hasAccess]);

	// Loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<LoadingSpinner />
					<p className="text-ga-secondary mt-4">
						Loading notification analytics...
					</p>
				</div>
			</div>
		);
	}

	// Access denied state
	if (!isAuthorized) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Alert className="max-w-md" variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>
						You don&apos;t have permission to access notification analytics.
						Contact your administrator if you need access.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<Alert className="max-w-md" variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			</div>
		);
	}

	// Prepare chart data
	const platformChartData = platformBreakdown
		? [
				{
					name: "iOS",
					delivered: platformBreakdown.ios.delivered,
					opened: platformBreakdown.ios.opened,
				},
				{
					name: "Android",
					delivered: platformBreakdown.android.delivered,
					opened: platformBreakdown.android.opened,
				},
		  ]
		: [];

	const sourceChartData = sourceBreakdown
		? [
				{
					name: "Dashboard",
					value:
						sourceBreakdown.onesignal_dashboard.delivered +
						sourceBreakdown.onesignal_dashboard.opened,
				},
				{
					name: "Backend",
					value:
						sourceBreakdown.backend.delivered + sourceBreakdown.backend.opened,
				},
				{
					name: "Automation",
					value:
						sourceBreakdown.automation.delivered +
						sourceBreakdown.automation.opened,
				},
		  ].filter((item) => item.value > 0)
		: [];

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2 bg-purple-100 rounded-lg">
					<Bell className="w-6 h-6 text-purple-600" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-ga-primary">
						Notification Analytics
					</h1>
					<p className="text-ga-secondary">
						Push notification performance metrics and campaign insights
					</p>
				</div>
			</div>

			{/* Overview Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-ga-secondary">
							Total Delivered
						</CardTitle>
						<Send className="h-4 w-4 text-blue-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-ga-primary">
							{metrics?.totalDelivered.toLocaleString() || 0}
						</div>
						<p className="text-xs text-ga-secondary mt-1">
							Notifications sent to devices
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-ga-secondary">
							Total Opened
						</CardTitle>
						<MousePointer className="h-4 w-4 text-green-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-ga-primary">
							{metrics?.totalOpened.toLocaleString() || 0}
						</div>
						<p className="text-xs text-ga-secondary mt-1">
							Users who clicked notifications
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium text-ga-secondary">
							Click-Through Rate
						</CardTitle>
						<Percent className="h-4 w-4 text-purple-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-ga-primary">
							{metrics?.ctr.toFixed(2) || 0}%
						</div>
						<p className="text-xs text-ga-secondary mt-1">
							Opened / Delivered ratio
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Platform Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-ga-primary">
							<Smartphone className="h-5 w-5" />
							Platform Breakdown
						</CardTitle>
					</CardHeader>
					<CardContent>
						{platformChartData.length > 0 ? (
							<ResponsiveContainer width="100%" height={250}>
								<BarChart data={platformChartData}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="name" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar dataKey="delivered" fill="#3B82F6" name="Delivered" />
									<Bar dataKey="opened" fill="#10B981" name="Opened" />
								</BarChart>
							</ResponsiveContainer>
						) : (
							<div className="flex items-center justify-center h-[250px] text-ga-secondary">
								No platform data available
							</div>
						)}
					</CardContent>
				</Card>

				{/* Source Distribution */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-ga-primary">
							<Monitor className="h-5 w-5" />
							Source Distribution
						</CardTitle>
					</CardHeader>
					<CardContent>
						{sourceChartData.length > 0 ? (
							<ResponsiveContainer width="100%" height={250}>
								<PieChart>
									<Pie
										data={sourceChartData}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={80}
										fill="#8884d8"
										paddingAngle={5}
										dataKey="value"
										label={({ name, percent }) =>
											`${name} ${(percent * 100).toFixed(0)}%`
										}
									>
										{sourceChartData.map((_, index) => (
											<Cell
												key={`cell-${index}`}
												fill={COLORS[index % COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div className="flex items-center justify-center h-[250px] text-ga-secondary">
								No source data available
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Campaign Performance Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-ga-primary">
						<TrendingUp className="h-5 w-5" />
						Campaign Performance
					</CardTitle>
				</CardHeader>
				<CardContent>
					{campaigns.length > 0 ? (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-ga">
										<th className="text-left py-3 px-4 font-medium text-ga-secondary">
											Campaign ID
										</th>
										<th className="text-right py-3 px-4 font-medium text-ga-secondary">
											Delivered
										</th>
										<th className="text-right py-3 px-4 font-medium text-ga-secondary">
											Opened
										</th>
										<th className="text-right py-3 px-4 font-medium text-ga-secondary">
											CTR
										</th>
										<th className="text-right py-3 px-4 font-medium text-ga-secondary">
											Latest Activity
										</th>
									</tr>
								</thead>
								<tbody>
									{campaigns.slice(0, 10).map((campaign) => (
										<tr
											key={campaign.campaignId}
											className="border-b border-ga hover:bg-ga-surface"
										>
											<td className="py-3 px-4 font-medium text-ga-primary">
												{campaign.campaignId}
											</td>
											<td className="text-right py-3 px-4 text-ga-secondary">
												{campaign.delivered.toLocaleString()}
											</td>
											<td className="text-right py-3 px-4 text-ga-secondary">
												{campaign.opened.toLocaleString()}
											</td>
											<td className="text-right py-3 px-4">
												<span
													className={`font-medium ${
														campaign.ctr >= 10
															? "text-green-600"
															: campaign.ctr >= 5
															? "text-yellow-600"
															: "text-ga-secondary"
													}`}
												>
													{campaign.ctr.toFixed(2)}%
												</span>
											</td>
											<td className="text-right py-3 px-4 text-ga-secondary">
												{formatDate(campaign.latestDate)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : (
						<div className="flex items-center justify-center py-12 text-ga-secondary">
							No campaign data available for the selected period
						</div>
					)}
				</CardContent>
			</Card>

			{/* Recent Notifications */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-ga-primary">
						<Clock className="h-5 w-5" />
						Recent Notifications
					</CardTitle>
				</CardHeader>
				<CardContent>
					{recentNotifications.length > 0 ? (
						<div className="space-y-3">
							{recentNotifications.slice(0, 10).map((notification) => (
								<div
									key={notification.id}
									className="flex items-start gap-4 p-3 rounded-lg bg-ga-surface hover:bg-ga-surface/80 transition-colors"
								>
									<div
										className={`p-2 rounded-lg ${
											notification.eventType === "open"
												? "bg-green-100"
												: "bg-blue-100"
										}`}
									>
										{notification.eventType === "open" ? (
											<MousePointer className="w-4 h-4 text-green-600" />
										) : (
											<Send className="w-4 h-4 text-blue-600" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<p className="font-medium text-ga-primary truncate">
												{notification.title || "Untitled Notification"}
											</p>
											<span
												className={`text-xs px-2 py-0.5 rounded-full ${
													notification.eventType === "open"
														? "bg-green-100 text-green-700"
														: "bg-blue-100 text-blue-700"
												}`}
											>
												{notification.eventType}
											</span>
										</div>
										<p className="text-sm text-ga-secondary truncate">
											{notification.content || "No content"}
										</p>
										<div className="flex items-center gap-3 mt-1 text-xs text-ga-secondary">
											<span className="capitalize">
												{notification.platform}
											</span>
											{notification.campaignId && (
												<span>Campaign: {notification.campaignId}</span>
											)}
											<span>{formatDate(notification.createdAt)}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex items-center justify-center py-12 text-ga-secondary">
							No recent notifications found
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
};
