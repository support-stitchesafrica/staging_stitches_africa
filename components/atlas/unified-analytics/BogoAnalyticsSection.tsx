"use client";

import React, { useState, useEffect } from "react";
import { AtlasRole, ROLE_PERMISSIONS } from "@/lib/atlas/types";
import { DateRange } from "@/lib/atlas/unified-analytics/types";
import { BogoDashboard } from "@/components/bogo/BogoDashboard";
import { AnalyticsDashboard } from "@/components/bogo/AnalyticsDashboard";
import { EnhancedBogoAnalytics } from "./EnhancedBogoAnalytics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, BarChart3 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export interface BogoAnalyticsSectionProps {
	dateRange: DateRange;
	userRole: AtlasRole;
}

/**
 * Enhanced BOGO Promotions Management and Analytics Section for Atlas
 * Integrates comprehensive real-time analytics with role-based access control
 * Features:
 * - Real-time tracking data
 * - Location and user analytics
 * - Product view and conversion tracking
 * - Customer journey insights
 * Validates: Requirements 1.1, 1.2, 1.4, 6.1
 */
export const BogoAnalyticsSection: React.FC<BogoAnalyticsSectionProps> = ({
	dateRange,
	userRole,
}) => {
	const [loading, setLoading] = useState(true);
	const [isAuthorized, setIsAuthorized] = useState(false);

	// Check if user has access to BOGO analytics
	const hasAccess = ROLE_PERMISSIONS[userRole]?.dashboards.includes(
		"/atlas/bogo-analytics"
	);

	useEffect(() => {
		// Simulate loading check
		const checkAccess = async () => {
			setLoading(true);

			// Remove artificial delay for faster loading
			setIsAuthorized(hasAccess);
			setLoading(false);
		};

		checkAccess();
	}, [userRole, hasAccess]);

	// Loading state
	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<LoadingSpinner />
					<p className="text-ga-secondary mt-4">Checking permissions...</p>
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
						You don't have permission to access BOGO analytics. Contact your
						administrator if you need access.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	// Convert DateRange to the format expected by EnhancedBogoAnalytics
	const enhancedDateRange = dateRange
		? {
				start: new Date(dateRange.from),
				end: new Date(dateRange.to),
		  }
		: undefined;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="p-2 bg-blue-100 rounded-lg">
					<TrendingUp className="w-6 h-6 text-blue-600" />
				</div>
				<div>
					<h1 className="text-2xl font-bold text-ga-primary">
						Enhanced BOGO Analytics
					</h1>
					<p className="text-ga-secondary">
						Real-time tracking, user insights, and comprehensive promotional
						analytics
					</p>
				</div>
			</div>

			{/* Enhanced BOGO Dashboard with Tabs */}
			<Tabs defaultValue="enhanced" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="enhanced" className="flex items-center gap-2">
						<BarChart3 className="w-4 h-4" />
						Enhanced Analytics
					</TabsTrigger>
					<TabsTrigger value="management">Promotion Management</TabsTrigger>
					<TabsTrigger value="legacy">Legacy Analytics</TabsTrigger>
				</TabsList>

				<TabsContent value="enhanced" className="space-y-6">
					<div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
						<div className="flex items-center gap-2 mb-2">
							<div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
							<span className="text-sm font-medium text-blue-900">
								Live Data
							</span>
						</div>
						<p className="text-sm text-blue-700">
							Real-time analytics with automatic refresh every 30 seconds.
							Includes location tracking, user journey analysis, and conversion
							insights.
						</p>
					</div>
					<EnhancedBogoAnalytics dateRange={enhancedDateRange} />
				</TabsContent>

				<TabsContent value="management" className="space-y-6">
					<BogoDashboard />
				</TabsContent>

				<TabsContent value="legacy" className="space-y-6">
					<div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
						<p className="text-sm text-yellow-800">
							<strong>Legacy Analytics:</strong> This is the original analytics
							dashboard. For enhanced features including real-time tracking and
							location data, use the Enhanced Analytics tab.
						</p>
					</div>
					<AnalyticsDashboard />
				</TabsContent>
			</Tabs>
		</div>
	);
};
