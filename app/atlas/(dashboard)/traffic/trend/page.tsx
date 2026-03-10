"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { useDateRange } from "@/contexts/DateRangeContext";
import TrafficTrendDetailView from "@/components/traffic/TrafficTrendDetailView";

const TrafficTrendDetail = () => {
    const router = useRouter();
    const { dateRange, setDateRange, setComparisonEnabled } = useDateRange();
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleLogout = () => {
        router.push('/atlas/auth');
    };

    return (
        <div className="space-y-6 page-transition">
            <AnalyticsHeader
                title="Traffic Trend Analysis"
                subtitle="Detailed traffic patterns and time-based insights"
                dateRange={dateRange}
                onDateRangeClick={() => setShowDatePicker(!showDatePicker)}
                onLogout={handleLogout}
                showBackButton={true}
                onBack={() => router.push('/atlas/traffic')}
            />

            {showDatePicker && (
                <div className="flex justify-end">
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) => {
                            setDateRange(range);
                            setShowDatePicker(false);
                        }}
                        showComparison={true}
                        onComparisonToggle={setComparisonEnabled}
                    />
                </div>
            )}

            <TrafficTrendDetailView />
        </div>
    );
};

export default TrafficTrendDetail;