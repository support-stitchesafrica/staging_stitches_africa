"use client";

import React from "react";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useAtlasAuth } from "@/contexts/AtlasAuthContext";
import { NotificationAnalyticsSection } from "@/components/atlas/unified-analytics/NotificationAnalyticsSection";
import LoadingSpinner from "@/components/LoadingSpinner";

/**
 * Notification Analytics page
 * Displays push notification performance metrics and campaign insights
 */
export default function NotificationAnalyticsPage() {
	const { dateRange } = useDateRange();
	const { atlasUser, loading } = useAtlasAuth();

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<LoadingSpinner />
			</div>
		);
	}

	if (!atlasUser) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<p className="text-ga-secondary">Please log in to access this page.</p>
			</div>
		);
	}

	// Convert date range to the format expected by analytics section
	const analyticsDateRange = {
		from: dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
		to: dateRange.to || new Date(),
	};

	return (
		<NotificationAnalyticsSection
			dateRange={analyticsDateRange}
			userRole={atlasUser.role}
		/>
	);
}
