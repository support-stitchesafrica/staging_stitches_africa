/**
 * Individual Referrer Details Page for Atlas Dashboard
 * Detailed analytics for a specific referrer
 * Optimized with performance monitoring, caching, and lazy loading
 */

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	ArrowLeft,
	Users,
	DollarSign,
	TrendingUp,
	Download,
	MousePointer,
	Calendar,
	Mail,
	Copy,
	ExternalLink,
	Activity,
} from "lucide-react";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	BarChart,
	Bar,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	ReferralAnalyticsService,
	ReferralDetails,
} from "@/lib/atlas/unified-analytics/services/referral-analytics-service";
import { ReferralCartActivity } from "@/components/referral/dashboard/ReferralCartActivity";
import {
	LoadingSpinner,
	AnalyticsCardSkeleton,
} from "@/components/ui/optimized-loader";
import { useCachedData, cacheKeys, preloadData } from "@/lib/utils/cache-utils";
import { useAnalytics } from "@/lib/analytics";
import { usePerformanceMonitor } from "@/lib/utils/performance-utils";
import { toast } from "sonner";

// Optimized metric card component with React.memo
const MetricCard = React.memo<{
	title: string;
	value: string | number;
	icon: React.ReactNode;
	color: string;
	loading?: boolean;
}>(
	({ title, value, icon, color, loading }) => {
		if (loading) {
			return <AnalyticsCardSkeleton />;
		}

		return (
			<Card className="bg-white border border-gray-200 shadow-sm">
				<CardContent className="p-4 sm:p-6">
					<div className="flex items-center space-x-3">
						<div className={`p-2 rounded-lg ${color}`}>{icon}</div>
						<div>
							<p className="text-sm font-medium text-gray-600">{title}</p>
							<p className="text-2xl font-bold text-gray-900">
								{typeof value === "number" ? value.toLocaleString() : value}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.title === nextProps.title &&
			prevProps.value === nextProps.value &&
			prevProps.loading === nextProps.loading
		);
	}
);

MetricCard.displayName = "MetricCard";

// Optimized referrals table component with virtualization for large lists
const ReferralsTable = React.memo<{
	referrals: any[];
	loading: boolean;
}>(
	({ referrals, loading }) => {
		if (loading) {
			return (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div
							key={i}
							className="animate-pulse flex items-center space-x-4 p-4"
						>
							<div className="w-10 h-10 bg-gray-200 rounded-full"></div>
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-gray-200 rounded w-3/4"></div>
								<div className="h-3 bg-gray-200 rounded w-1/2"></div>
							</div>
							<div className="w-20 h-4 bg-gray-200 rounded"></div>
						</div>
					))}
				</div>
			);
		}

		if (referrals.length === 0) {
			return (
				<div className="text-center py-8">
					<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						No Referrals Yet
					</h3>
					<p className="text-gray-600">
						This referrer hasn't made any successful referrals yet.
					</p>
				</div>
			);
		}

		// Show only first 10 referrals for performance, with option to load more
		const displayReferrals = referrals.slice(0, 10);

		return (
			<div className="space-y-2">
				{displayReferrals.map((referral, index) => {
					// Handle both Firestore Timestamp and regular Date objects
					const signUpDate = referral.signUpDate?.toDate
						? referral.signUpDate.toDate()
						: referral.signUpDate instanceof Date
						? referral.signUpDate
						: referral.createdAt?.toDate
						? referral.createdAt.toDate()
						: new Date();

					return (
						<div
							key={referral.id}
							className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors duration-150"
						>
							<div className="flex items-center space-x-4">
								<div className="flex-shrink-0">
									<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
										<span className="text-sm font-semibold text-blue-600">
											{referral.refereeName?.charAt(0)?.toUpperCase() || "U"}
										</span>
									</div>
								</div>
								<div className="min-w-0 flex-1">
									<p className="text-sm font-medium text-gray-900">
										{referral.refereeName || "Unknown User"}
									</p>
									<p className="text-sm text-gray-500">
										{referral.refereeEmail || "No email provided"}
									</p>
									<div className="flex items-center space-x-2 mt-1">
										<Badge
											variant={
												referral.status === "converted"
													? "default"
													: referral.status === "active"
													? "secondary"
													: "outline"
											}
											className="text-xs"
										>
											{referral.status || "active"}
										</Badge>
										<span className="text-xs text-gray-400">
											{referral.totalPurchases || 0} purchases
										</span>
									</div>
								</div>
							</div>
							<div className="text-right">
								<p className="text-sm font-semibold text-gray-900">
									${(referral.totalSpent || 0).toLocaleString()}
								</p>
								<p className="text-xs text-gray-500">
									{signUpDate.toLocaleDateString()}
								</p>
							</div>
						</div>
					);
				})}
				{referrals.length > 10 && (
					<div className="text-center py-4">
						<p className="text-sm text-gray-500">
							Showing 10 of {referrals.length} referrals
						</p>
					</div>
				)}
			</div>
		);
	},
	(prevProps, nextProps) => {
		return (
			prevProps.referrals.length === nextProps.referrals.length &&
			prevProps.loading === nextProps.loading
		);
	}
);

ReferralsTable.displayName = "ReferralsTable";

// Optimized activity feed component
const ActivityFeed = React.memo<{
	transactions: any[];
	loading: boolean;
}>(({ transactions, loading }) => {
	if (loading) {
		return (
			<div className="p-6">
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="animate-pulse flex items-center space-x-3">
							<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
							<div className="flex-1 space-y-1">
								<div className="h-3 bg-gray-200 rounded w-3/4"></div>
								<div className="h-2 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (!transactions.length) {
		return (
			<div className="p-6 text-center">
				<Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600 mb-2">No recent activity</p>
				<p className="text-sm text-gray-500">
					Transactions and referral activities will appear here
				</p>
			</div>
		);
	}

	// Show only recent 10 transactions for performance
	const recentTransactions = transactions.slice(0, 10);

	return (
		<div className="max-h-80 overflow-y-auto">
			<div className="space-y-2 p-4">
				{recentTransactions.map((transaction) => {
					// Handle both Firestore Timestamp and regular Date objects
					const transactionDate = transaction.createdAt?.toDate
						? transaction.createdAt.toDate()
						: transaction.createdAt instanceof Date
						? transaction.createdAt
						: new Date();

					return (
						<div
							key={transaction.id}
							className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50"
						>
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center ${
									transaction.type === "signup" ? "bg-blue-100" : "bg-green-100"
								}`}
							>
								{transaction.type === "signup" ? (
									<Users className="h-4 w-4 text-blue-600" />
								) : (
									<DollarSign className="h-4 w-4 text-green-600" />
								)}
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900 truncate">
									{transaction.description ||
										`${
											transaction.type === "signup"
												? "New referral signup"
												: "Purchase commission"
										}`}
								</p>
								<div className="flex items-center space-x-2 text-xs text-gray-500">
									<span>{transactionDate.toLocaleDateString()}</span>
									{transaction.metadata?.refereeEmail && (
										<>
											<span>•</span>
											<span>{transaction.metadata.refereeEmail}</span>
										</>
									)}
									{transaction.metadata?.orderId && (
										<>
											<span>•</span>
											<span>Order: {transaction.metadata.orderId}</span>
										</>
									)}
								</div>
							</div>
							<div className="text-right">
								<p className="text-sm font-semibold text-gray-900">
									+{transaction.points || 0} pts
								</p>
								{transaction.amount && (
									<p className="text-xs text-gray-500">
										${transaction.amount.toLocaleString()}
									</p>
								)}
							</div>
						</div>
					);
				})}
				{transactions.length > 10 && (
					<div className="text-center py-2">
						<p className="text-xs text-gray-500">
							Showing 10 of {transactions.length} activities
						</p>
					</div>
				)}
			</div>
		</div>
	);
});

ActivityFeed.displayName = "ActivityFeed";

// Click Activities List Component
const ClickActivitiesList = React.memo<{
	events: any[];
	loading: boolean;
}>(({ events, loading }) => {
	if (loading) {
		return (
			<div className="p-6">
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="animate-pulse flex items-center space-x-3">
							<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
							<div className="flex-1 space-y-1">
								<div className="h-3 bg-gray-200 rounded w-3/4"></div>
								<div className="h-2 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (!events.length) {
		return (
			<div className="p-6 text-center">
				<MousePointer className="h-12 w-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600 mb-2">No click activities</p>
				<p className="text-sm text-gray-500">
					Referral link clicks will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="max-h-80 overflow-y-auto">
			<div className="space-y-2 p-4">
				{events.slice(0, 20).map((event) => {
					const eventDate = event.createdAt?.toDate
						? event.createdAt.toDate()
						: event.createdAt instanceof Date
						? event.createdAt
						: new Date();

					return (
						<div
							key={event.id}
							className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
						>
							<div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
								<MousePointer className="h-4 w-4 text-indigo-600" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900">
									Referral Link Clicked
								</p>
								<div className="flex items-center space-x-2 text-xs text-gray-500">
									<span>{eventDate.toLocaleDateString()}</span>
									<span>•</span>
									<span>{eventDate.toLocaleTimeString()}</span>
									<span>•</span>
									<span className="capitalize">
										{event.deviceType || "Unknown"} Device
									</span>
									{event.sessionId && (
										<>
											<span>•</span>
											<span>Session: {event.sessionId.slice(-8)}</span>
										</>
									)}
								</div>
							</div>
							<div className="text-right">
								<Badge
									variant="outline"
									className="bg-indigo-50 text-indigo-700 border-indigo-200"
								>
									Click
								</Badge>
							</div>
						</div>
					);
				})}
				{events.length > 20 && (
					<div className="text-center py-2">
						<p className="text-xs text-gray-500">
							Showing 20 of {events.length} click activities
						</p>
					</div>
				)}
			</div>
		</div>
	);
});

ClickActivitiesList.displayName = "ClickActivitiesList";

// Download Activities List Component
const DownloadActivitiesList = React.memo<{
	events: any[];
	loading: boolean;
}>(({ events, loading }) => {
	if (loading) {
		return (
			<div className="p-6">
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="animate-pulse flex items-center space-x-3">
							<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
							<div className="flex-1 space-y-1">
								<div className="h-3 bg-gray-200 rounded w-3/4"></div>
								<div className="h-2 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (!events.length) {
		return (
			<div className="p-6 text-center">
				<Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600 mb-2">No download activities</p>
				<p className="text-sm text-gray-500">
					App downloads from referrals will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="max-h-80 overflow-y-auto">
			<div className="space-y-2 p-4">
				{events.slice(0, 20).map((event) => {
					const eventDate = event.createdAt?.toDate
						? event.createdAt.toDate()
						: event.createdAt instanceof Date
						? event.createdAt
						: new Date();

					return (
						<div
							key={event.id}
							className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
						>
							<div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
								<Download className="h-4 w-4 text-pink-600" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900">
									App Downloaded
								</p>
								<div className="flex items-center space-x-2 text-xs text-gray-500">
									<span>{eventDate.toLocaleDateString()}</span>
									<span>•</span>
									<span>{eventDate.toLocaleTimeString()}</span>
									<span>•</span>
									<span className="capitalize">
										{event.deviceType || "Unknown"} Device
									</span>
									{event.sessionId && (
										<>
											<span>•</span>
											<span>Session: {event.sessionId.slice(-8)}</span>
										</>
									)}
								</div>
							</div>
							<div className="text-right">
								<Badge
									variant="outline"
									className="bg-pink-50 text-pink-700 border-pink-200"
								>
									Download
								</Badge>
							</div>
						</div>
					);
				})}
				{events.length > 20 && (
					<div className="text-center py-2">
						<p className="text-xs text-gray-500">
							Showing 20 of {events.length} download activities
						</p>
					</div>
				)}
			</div>
		</div>
	);
});

DownloadActivitiesList.displayName = "DownloadActivitiesList";

// Signup Activities List Component
const SignupActivitiesList = React.memo<{
	transactions: any[];
	loading: boolean;
}>(({ transactions, loading }) => {
	if (loading) {
		return (
			<div className="p-6">
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<div key={i} className="animate-pulse flex items-center space-x-3">
							<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
							<div className="flex-1 space-y-1">
								<div className="h-3 bg-gray-200 rounded w-3/4"></div>
								<div className="h-2 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (!transactions.length) {
		return (
			<div className="p-6 text-center">
				<Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600 mb-2">No signup activities</p>
				<p className="text-sm text-gray-500">
					User signups from referrals will appear here
				</p>
			</div>
		);
	}

	return (
		<div className="max-h-80 overflow-y-auto">
			<div className="space-y-2 p-4">
				{transactions.slice(0, 20).map((transaction) => {
					const transactionDate = transaction.createdAt?.toDate
						? transaction.createdAt.toDate()
						: transaction.createdAt instanceof Date
						? transaction.createdAt
						: new Date();

					return (
						<div
							key={transaction.id}
							className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
						>
							<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
								<Users className="h-4 w-4 text-blue-600" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-gray-900">
									{transaction.description || "New User Signup"}
								</p>
								<div className="flex items-center space-x-2 text-xs text-gray-500">
									<span>{transactionDate.toLocaleDateString()}</span>
									<span>•</span>
									<span>{transactionDate.toLocaleTimeString()}</span>
									{transaction.metadata?.refereeEmail && (
										<>
											<span>•</span>
											<span>{transaction.metadata.refereeEmail}</span>
										</>
									)}
									{transaction.metadata?.refereeName && (
										<>
											<span>•</span>
											<span>{transaction.metadata.refereeName}</span>
										</>
									)}
								</div>
							</div>
							<div className="text-right">
								<div className="text-sm font-semibold text-green-600">
									+{transaction.points || 0} pts
								</div>
								<Badge
									variant="outline"
									className="bg-blue-50 text-blue-700 border-blue-200 mt-1"
								>
									Signup
								</Badge>
							</div>
						</div>
					);
				})}
				{transactions.length > 20 && (
					<div className="text-center py-2">
						<p className="text-xs text-gray-500">
							Showing 20 of {transactions.length} signup activities
						</p>
					</div>
				)}
			</div>
		</div>
	);
});

SignupActivitiesList.displayName = "SignupActivitiesList";

// Complete Activity Timeline Component
const CompleteActivityTimeline = React.memo<{
	transactions: any[];
	events: any[];
	loading: boolean;
}>(({ transactions, events, loading }) => {
	if (loading) {
		return (
			<div className="p-6">
				<div className="space-y-3">
					{Array.from({ length: 10 }).map((_, i) => (
						<div key={i} className="animate-pulse flex items-center space-x-3">
							<div className="w-8 h-8 bg-gray-200 rounded-full"></div>
							<div className="flex-1 space-y-1">
								<div className="h-3 bg-gray-200 rounded w-3/4"></div>
								<div className="h-2 bg-gray-200 rounded w-1/2"></div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	// Combine and sort all activities by date
	const allActivities = [
		...transactions.map((t) => ({
			...t,
			activityType: "transaction",
			sortDate: t.createdAt?.toDate
				? t.createdAt.toDate()
				: t.createdAt instanceof Date
				? t.createdAt
				: new Date(),
		})),
		...events.map((e) => ({
			...e,
			activityType: "event",
			sortDate: e.createdAt?.toDate
				? e.createdAt.toDate()
				: e.createdAt instanceof Date
				? e.createdAt
				: new Date(),
		})),
	].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

	if (!allActivities.length) {
		return (
			<div className="p-6 text-center">
				<Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600 mb-2">No activities yet</p>
				<p className="text-sm text-gray-500">
					All referral activities will appear here in chronological order
				</p>
			</div>
		);
	}

	const getActivityIcon = (activity: any) => {
		if (activity.activityType === "transaction") {
			return activity.type === "signup" ? (
				<Users className="h-4 w-4 text-blue-600" />
			) : (
				<DollarSign className="h-4 w-4 text-green-600" />
			);
		} else {
			return activity.eventType === "click" ? (
				<MousePointer className="h-4 w-4 text-indigo-600" />
			) : (
				<Download className="h-4 w-4 text-pink-600" />
			);
		}
	};

	const getActivityColor = (activity: any) => {
		if (activity.activityType === "transaction") {
			return activity.type === "signup" ? "bg-blue-100" : "bg-green-100";
		} else {
			return activity.eventType === "click" ? "bg-indigo-100" : "bg-pink-100";
		}
	};

	const getActivityTitle = (activity: any) => {
		if (activity.activityType === "transaction") {
			return (
				activity.description ||
				(activity.type === "signup" ? "New User Signup" : "Purchase Commission")
			);
		} else {
			return activity.eventType === "click"
				? "Referral Link Clicked"
				: "App Downloaded";
		}
	};

	const getActivityBadge = (activity: any) => {
		if (activity.activityType === "transaction") {
			return activity.type === "signup" ? (
				<Badge
					variant="outline"
					className="bg-blue-50 text-blue-700 border-blue-200"
				>
					Signup
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="bg-green-50 text-green-700 border-green-200"
				>
					Purchase
				</Badge>
			);
		} else {
			return activity.eventType === "click" ? (
				<Badge
					variant="outline"
					className="bg-indigo-50 text-indigo-700 border-indigo-200"
				>
					Click
				</Badge>
			) : (
				<Badge
					variant="outline"
					className="bg-pink-50 text-pink-700 border-pink-200"
				>
					Download
				</Badge>
			);
		}
	};

	return (
		<div className="max-h-96 overflow-y-auto">
			<div className="space-y-2 p-4">
				{allActivities.slice(0, 50).map((activity, index) => (
					<div
						key={`${activity.activityType}-${activity.id}-${index}`}
						className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
					>
						<div
							className={`w-8 h-8 rounded-full flex items-center justify-center ${getActivityColor(
								activity
							)}`}
						>
							{getActivityIcon(activity)}
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-gray-900">
								{getActivityTitle(activity)}
							</p>
							<div className="flex items-center space-x-2 text-xs text-gray-500">
								<span>{activity.sortDate.toLocaleDateString()}</span>
								<span>•</span>
								<span>{activity.sortDate.toLocaleTimeString()}</span>
								{activity.activityType === "event" && activity.deviceType && (
									<>
										<span>•</span>
										<span className="capitalize">
											{activity.deviceType} Device
										</span>
									</>
								)}
								{activity.activityType === "transaction" &&
									activity.metadata?.refereeEmail && (
										<>
											<span>•</span>
											<span>{activity.metadata.refereeEmail}</span>
										</>
									)}
								{activity.activityType === "event" && activity.sessionId && (
									<>
										<span>•</span>
										<span>Session: {activity.sessionId.slice(-8)}</span>
									</>
								)}
							</div>
						</div>
						<div className="text-right flex flex-col items-end space-y-1">
							{activity.activityType === "transaction" && activity.points && (
								<div className="text-sm font-semibold text-green-600">
									+{activity.points} pts
								</div>
							)}
							{activity.activityType === "transaction" && activity.amount && (
								<div className="text-xs text-gray-500">
									${activity.amount.toLocaleString()}
								</div>
							)}
							{getActivityBadge(activity)}
						</div>
					</div>
				))}
				{allActivities.length > 50 && (
					<div className="text-center py-2">
						<p className="text-xs text-gray-500">
							Showing 50 of {allActivities.length} total activities
						</p>
					</div>
				)}
			</div>
		</div>
	);
});

CompleteActivityTimeline.displayName = "CompleteActivityTimeline";

export default function ReferrerDetailsPage() {
	// Performance monitoring
	usePerformanceMonitor("ReferrerDetailsPage");

	const params = useParams();
	const router = useRouter();
	const { trackInteraction, trackPageView } = useAnalytics(
		"ReferrerDetailsPage"
	);
	const referrerId = params.id as string;

	// Fetch referrer details with optimized caching
	const {
		data: referrerDetails,
		loading,
		error,
		refetch,
	} = useCachedData(
		cacheKeys.analytics("referrer-details", referrerId),
		async () => {
			console.log("🔍 Fetching referrer details for ID:", referrerId);
			const result = await ReferralAnalyticsService.getReferralDetails(
				referrerId
			);
			console.log("📊 Referrer details result:", {
				referrer: result.referrer?.fullName,
				referralsCount: result.referrals?.length,
				transactionsCount: result.transactions?.length,
				eventsCount: result.events?.length,
				totalClicks: result.stats?.totalClicks,
				totalDownloads: result.stats?.totalDownloads,
				hasRealTransactions: result.transactions?.some(
					(t) => !t.id.includes("sample")
				),
				hasRealEvents: result.events?.some((e) => !e.id.includes("sample")),
			});
			return result;
		},
		5 * 60 * 1000 // 5 minutes cache
	);

	// Track page view with performance monitoring
	useEffect(() => {
		trackPageView(
			`/atlas/referral-analytics/referrer/${referrerId}`,
			"Atlas Referrer Details"
		);
	}, [trackPageView, referrerId]);

	// Preload related data for better UX
	useEffect(() => {
		if (referrerDetails) {
			// Preload referrers list in background for faster navigation
			setTimeout(() => {
				preloadData(
					cacheKeys.analytics("referrers-list", "page-1"),
					() => ReferralAnalyticsService.getReferrersList(20),
					5 * 60 * 1000
				);
			}, 2000);
		}
	}, [referrerDetails]);

	// Optimized chart data preparation with memoization
	const chartData = useMemo(() => {
		if (!referrerDetails) return [];

		// Group transactions by date with performance optimization
		const dataByDate = new Map<
			string,
			{ referrals: number; revenue: number }
		>();

		// Process transactions for chart data
		referrerDetails.transactions.forEach((transaction) => {
			const date =
				transaction.createdAt?.toDate?.()?.toISOString().split("T")[0] || "";
			if (date) {
				const existing = dataByDate.get(date) || { referrals: 0, revenue: 0 };
				if (transaction.type === "signup") {
					existing.referrals += 1;
				} else if (transaction.type === "purchase") {
					existing.revenue += transaction.amount || 0;
				}
				dataByDate.set(date, existing);
			}
		});

		// Also process referrals for additional chart data
		referrerDetails.referrals.forEach((referral) => {
			const date =
				referral.signUpDate?.toDate?.()?.toISOString().split("T")[0] ||
				referral.createdAt?.toDate?.()?.toISOString().split("T")[0] ||
				"";
			if (date) {
				const existing = dataByDate.get(date) || { referrals: 0, revenue: 0 };
				existing.referrals += 1;
				existing.revenue += referral.totalSpent || 0;
				dataByDate.set(date, existing);
			}
		});

		// If no data from transactions/referrals, show empty state
		if (dataByDate.size === 0) {
			console.log("No chart data available - showing empty state");
			return [];
		}

		const result = Array.from(dataByDate.entries())
			.map(([date, data]) => ({
				date,
				referrals: data.referrals,
				revenue: data.revenue,
				label: new Date(date).toLocaleDateString("en-US", {
					month: "short",
					day: "numeric",
				}),
			}))
			.sort((a, b) => a.date.localeCompare(b.date))
			.slice(-30); // Show only last 30 days for performance

		console.log("Chart data prepared:", result.length, "data points");
		return result;
	}, [referrerDetails]);

	// Optimized copy handler with useCallback
	const handleCopyReferralCode = useCallback(async () => {
		if (referrerDetails?.referrer.referralCode) {
			try {
				await navigator.clipboard.writeText(
					referrerDetails.referrer.referralCode
				);
				toast.success("Referral code copied to clipboard");
				trackInteraction("copy_referral_code", "click");
			} catch (error) {
				toast.error("Failed to copy referral code");
			}
		}
	}, [referrerDetails?.referrer.referralCode, trackInteraction]);

	// Optimized back handler
	const handleGoBack = useCallback(() => {
		router.back();
	}, [router]);

	if (error) {
		console.error("Referrer details error:", error);
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center max-w-md">
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Error Loading Referrer Details
					</h3>
					<p className="text-gray-600 mb-4">
						{error.message || "Failed to load referrer details"}
					</p>
					<div className="bg-gray-50 p-4 rounded-lg mb-4">
						<p className="text-sm text-gray-700 mb-2">
							<strong>Referrer ID:</strong> {referrerId}
						</p>
						<p className="text-sm text-gray-500 mb-2">
							This error usually occurs when:
						</p>
						<ul className="text-sm text-gray-500 text-left list-disc list-inside space-y-1">
							<li>The referrer ID doesn't exist in the database</li>
							<li>There's a data structure mismatch</li>
							<li>The referralUsers collection is empty</li>
							<li>Firebase connection issues</li>
						</ul>
					</div>
					<div className="space-x-2">
						<Button onClick={refetch} variant="outline">
							Refresh Data
						</Button>
						<Button onClick={handleGoBack} variant="ghost">
							Go Back
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Button
						onClick={handleGoBack}
						variant="outline"
						size="sm"
						className="gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Back
					</Button>
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							{loading
								? "Loading..."
								: referrerDetails?.referrer.fullName || "Referrer Details"}
						</h1>
						<p className="text-gray-600 mt-1">
							{loading
								? "Loading referrer information..."
								: "Detailed analytics and performance metrics"}
						</p>
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Button
						onClick={refetch}
						variant="outline"
						size="sm"
						className="gap-2"
						disabled={loading}
					>
						{loading ? "Loading..." : "Refresh Data"}
					</Button>
				</div>
			</div>

			{/* Referrer Info Card */}
			<Card className="bg-white border border-gray-200 shadow-sm">
				<CardContent className="p-6">
					{loading ? (
						<div className="animate-pulse flex items-center space-x-4">
							<div className="w-16 h-16 bg-gray-200 rounded-full"></div>
							<div className="flex-1 space-y-2">
								<div className="h-6 bg-gray-200 rounded w-1/3"></div>
								<div className="h-4 bg-gray-200 rounded w-1/2"></div>
								<div className="h-4 bg-gray-200 rounded w-1/4"></div>
							</div>
						</div>
					) : referrerDetails ? (
						<div className="flex items-center space-x-6">
							<div className="flex-shrink-0">
								<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
									<span className="text-white font-bold text-xl">
										{referrerDetails.referrer.fullName.charAt(0).toUpperCase()}
									</span>
								</div>
							</div>
							<div className="flex-1">
								<h2 className="text-xl font-bold text-gray-900 mb-1">
									{referrerDetails.referrer.fullName}
								</h2>
								<div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
									<div className="flex items-center space-x-1">
										<Mail className="h-4 w-4" />
										<span>{referrerDetails.referrer.email}</span>
									</div>
									<div className="flex items-center space-x-1">
										<Calendar className="h-4 w-4" />
										<span>
											Joined{" "}
											{referrerDetails.referrer.createdAt
												?.toDate?.()
												?.toLocaleDateString()}
										</span>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Badge variant="outline" className="font-mono">
										{referrerDetails.referrer.referralCode}
									</Badge>
									<Button
										onClick={handleCopyReferralCode}
										variant="ghost"
										size="sm"
										className="gap-1"
									>
										<Copy className="h-3 w-3" />
										Copy Code
									</Button>
									<Badge
										variant={
											referrerDetails.referrer.isActive
												? "default"
												: "secondary"
										}
									>
										{referrerDetails.referrer.isActive ? "Active" : "Inactive"}
									</Badge>
								</div>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Primary Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
				<MetricCard
					title="Total Referrals"
					value={referrerDetails?.stats.totalReferrals || 0}
					icon={<Users className="h-5 w-5 text-blue-600" />}
					color="bg-blue-100"
					loading={loading}
				/>
				<MetricCard
					title="Total Revenue"
					value={
						referrerDetails
							? `$${referrerDetails.stats.totalRevenue.toLocaleString()}`
							: "$0"
					}
					icon={<DollarSign className="h-5 w-5 text-green-600" />}
					color="bg-green-100"
					loading={loading}
				/>
				<MetricCard
					title="Total Points"
					value={referrerDetails?.stats.totalPoints || 0}
					icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
					color="bg-purple-100"
					loading={loading}
				/>
				<MetricCard
					title="Conversion Rate"
					value={
						referrerDetails
							? `${referrerDetails.stats.conversionRate.toFixed(1)}%`
							: "0%"
					}
					icon={<Activity className="h-5 w-5 text-orange-600" />}
					color="bg-orange-100"
					loading={loading}
				/>
			</div>

			{/* Secondary Metrics Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<MetricCard
					title="Total Clicks"
					value={referrerDetails?.stats.totalClicks || 0}
					icon={<MousePointer className="h-5 w-5 text-indigo-600" />}
					color="bg-indigo-100"
					loading={loading}
				/>
				<MetricCard
					title="Total Downloads"
					value={referrerDetails?.stats.totalDownloads || 0}
					icon={<Download className="h-5 w-5 text-pink-600" />}
					color="bg-pink-100"
					loading={loading}
				/>
				<MetricCard
					title="Avg Order Value"
					value={
						referrerDetails
							? `$${referrerDetails.stats.averageOrderValue.toFixed(0)}`
							: "$0"
					}
					icon={<DollarSign className="h-5 w-5 text-yellow-600" />}
					color="bg-yellow-100"
					loading={loading}
				/>
			</div>

			{/* Charts Section */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Performance Chart */}
				<Card className="bg-white border border-gray-200 shadow-sm">
					<CardHeader className="border-b border-gray-100">
						<CardTitle className="text-lg font-semibold text-gray-900">
							Performance Over Time
						</CardTitle>
					</CardHeader>
					<CardContent className="p-6">
						{loading ? (
							<div className="h-64 flex items-center justify-center">
								<LoadingSpinner />
							</div>
						) : chartData.length > 0 ? (
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={chartData}>
									<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
									<XAxis dataKey="label" stroke="#666" fontSize={12} />
									<YAxis stroke="#666" fontSize={12} />
									<Tooltip
										contentStyle={{
											backgroundColor: "white",
											border: "1px solid #e5e7eb",
											borderRadius: "8px",
											boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
										}}
									/>
									<Line
										type="monotone"
										dataKey="referrals"
										stroke="#3b82f6"
										strokeWidth={2}
										dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
										name="Referrals"
									/>
									<Line
										type="monotone"
										dataKey="revenue"
										stroke="#10b981"
										strokeWidth={2}
										dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
										name="Revenue ($)"
									/>
								</LineChart>
							</ResponsiveContainer>
						) : (
							<div className="h-64 flex items-center justify-center">
								<div className="text-center">
									<TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
									<p className="text-gray-600">No performance data available</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Recent Activity */}
				<Card className="bg-white border border-gray-200 shadow-sm">
					<CardHeader className="border-b border-gray-100">
						<CardTitle className="text-lg font-semibold text-gray-900">
							Recent Activity
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<ActivityFeed
							transactions={referrerDetails?.transactions || []}
							loading={loading}
						/>
					</CardContent>
				</Card>
			</div>

			{/* Live Cart Activity Section */}
			<div className="grid grid-cols-1">
				<ReferralCartActivity userId={referrerId} />
			</div>

			{/* Detailed Activity Sections */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Click Activities */}
				<Card className="bg-white border border-gray-200 shadow-sm">
					<CardHeader className="border-b border-gray-100">
						<CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<MousePointer className="h-5 w-5 text-indigo-600" />
							Click Activities (
							{referrerDetails?.events.filter((e) => e.eventType === "click")
								.length || 0}
							)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<ClickActivitiesList
							events={
								referrerDetails?.events.filter(
									(e) => e.eventType === "click"
								) || []
							}
							loading={loading}
						/>
					</CardContent>
				</Card>

				{/* Download Activities */}
				<Card className="bg-white border border-gray-200 shadow-sm">
					<CardHeader className="border-b border-gray-100">
						<CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
							<Download className="h-5 w-5 text-pink-600" />
							Download Activities (
							{referrerDetails?.events.filter((e) => e.eventType === "download")
								.length || 0}
							)
						</CardTitle>
					</CardHeader>
					<CardContent className="p-0">
						<DownloadActivitiesList
							events={
								referrerDetails?.events.filter(
									(e) => e.eventType === "download"
								) || []
							}
							loading={loading}
						/>
					</CardContent>
				</Card>
			</div>

			{/* Signup Activities */}
			<Card className="bg-white border border-gray-200 shadow-sm">
				<CardHeader className="border-b border-gray-100">
					<CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Users className="h-5 w-5 text-blue-600" />
						Signup Activities (
						{referrerDetails?.transactions.filter((t) => t.type === "signup")
							.length || 0}
						)
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<SignupActivitiesList
						transactions={
							referrerDetails?.transactions.filter(
								(t) => t.type === "signup"
							) || []
						}
						loading={loading}
					/>
				</CardContent>
			</Card>

			{/* Complete Activity Timeline */}
			<Card className="bg-white border border-gray-200 shadow-sm">
				<CardHeader className="border-b border-gray-100">
					<CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
						<Activity className="h-5 w-5 text-purple-600" />
						Complete Activity Timeline
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<CompleteActivityTimeline
						transactions={referrerDetails?.transactions || []}
						events={referrerDetails?.events || []}
						loading={loading}
					/>
				</CardContent>
			</Card>

			{/* Referrals List */}
			<Card className="bg-white border border-gray-200 shadow-sm">
				<CardHeader className="border-b border-gray-100">
					<CardTitle className="text-lg font-semibold text-gray-900">
						Referrals ({referrerDetails?.referrals.length || 0})
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					<ReferralsTable
						referrals={referrerDetails?.referrals || []}
						loading={loading}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
