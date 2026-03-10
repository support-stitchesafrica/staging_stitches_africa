"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { useDateRange } from "@/contexts/DateRangeContext";
import LogisticsDashboard from "@/components/dashboards/LogisticsDashboard";

const Logistics = () =>
{
    const router = useRouter();
    const { dateRange, setDateRange, setComparisonEnabled } = useDateRange();
    const [showDatePicker, setShowDatePicker] = useState(false);

    const handleLogout = () =>
    {
        router.push('/atlas/auth');
    };

    return (
        <div className="space-y-6 page-transition">
            <AnalyticsHeader
                title="Logistics Dashboard"
                subtitle="Chinedu/BI Analyst (Logistics)"
                dateRange={dateRange}
                onDateRangeClick={() => setShowDatePicker(!showDatePicker)}
                onLogout={handleLogout}
            />

            {showDatePicker && (
                <div className="flex justify-end">
                    <DateRangePicker
                        value={dateRange}
                        onChange={(range) =>
                        {
                            setDateRange(range);
                            setShowDatePicker(false);
                        }}
                        showComparison={true}
                        onComparisonToggle={setComparisonEnabled}
                    />
                </div>
            )}

            <LogisticsDashboard />
        </div>
    );
};

export default Logistics;
