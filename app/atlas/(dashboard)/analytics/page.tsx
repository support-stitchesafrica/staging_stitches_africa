"use client";

import { FastDashboardWrapper } from "@/components/atlas/FastDashboardWrapper";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function AnalyticsPage() {
	return (
		<FastDashboardWrapper
			title="Analytics Overview"
			subtitle="Monitor key metrics, traffic trends, and user engagement."
			showDatePicker={false}
		>
			<AnalyticsDashboard />
		</FastDashboardWrapper>
	);
}
