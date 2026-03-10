"use client"

import { FastDashboardWrapper } from "@/components/atlas/FastDashboardWrapper";
import { lazy, Suspense } from "react";
import { DashboardSkeleton } from "@/components/ui/optimized-loader";

// Lazy load the optimized TrafficDashboard for better performance
const OptimizedTrafficDashboard = lazy(() => import("@/components/dashboards/OptimizedTrafficDashboard"));

const Traffic = () => {
    return (
        <FastDashboardWrapper
            title="Traffic Dashboard"
            subtitle="Chinedu/Priscilla/BI Analyst (Marketing)"
        >
            <Suspense fallback={<DashboardSkeleton />}>
                <OptimizedTrafficDashboard />
            </Suspense>
        </FastDashboardWrapper>
    );
};

export default Traffic;
