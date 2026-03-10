"use client"

import { FastDashboardWrapper } from "@/components/atlas/FastDashboardWrapper";
import { lazy, Suspense } from "react";
import { analytics, useAnalytics } from "@/lib/analytics";
import { useEffect } from "react";
import { LoadingSpinner, AnalyticsCardSkeleton } from "@/components/ui/optimized-loader";

// Lazy load the UserDashboard component for better performance
const UserDashboard = lazy(() => import("@/components/dashboards/UserDashboard"));

const Index = () => {
    const { trackInteraction } = useAnalytics('AtlasDashboard');

    useEffect(() => {
        // Track page view
        analytics.trackPageView('/atlas', 'Atlas Dashboard');
    }, []);

    return (
        <FastDashboardWrapper
            title="Atlas Dashboard"
            subtitle="Business Intelligence & Analytics"
        >
            <Suspense fallback={
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <AnalyticsCardSkeleton key={i} />
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-lg border p-6">
                                <div className="h-64 bg-gray-100 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            }>
                <UserDashboard />
            </Suspense>
        </FastDashboardWrapper>
    );
};

export default Index;
