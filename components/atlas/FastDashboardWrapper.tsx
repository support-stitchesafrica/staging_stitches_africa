'use client';

import React, { Suspense } from 'react';
import { AnalyticsHeader } from "@/components/analytics/AnalyticsHeader";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { useDateRange } from "@/contexts/DateRangeContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PerformanceMonitor } from "./PerformanceMonitor";

interface FastDashboardWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showDatePicker?: boolean;
}

// Ultra-fast loading skeleton with immediate appearance - prevents content flash
const FastSkeleton = () => (
  <div className="space-y-4 sm:space-y-6">
    {/* Top Row Skeleton - appears instantly */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div>
                <div className="w-20 h-3 bg-gray-200 rounded mb-2"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
    
    {/* Charts Row Skeleton - appears instantly */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm animate-pulse">
          <div className="w-32 h-4 bg-gray-200 rounded mb-4"></div>
          <div className="w-full h-64 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
    
    {/* Session & Cart Metrics Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm animate-pulse">
          <div className="w-20 h-3 bg-gray-200 rounded mb-2"></div>
          <div className="w-16 h-6 bg-gray-200 rounded mb-1"></div>
          <div className="w-12 h-3 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
    
    {/* Bottom Lists Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm animate-pulse">
          <div className="w-32 h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="flex justify-between items-center">
                <div className="w-32 h-3 bg-gray-200 rounded"></div>
                <div className="w-16 h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const FastDashboardWrapper: React.FC<FastDashboardWrapperProps> = ({
  title,
  subtitle,
  children,
  showDatePicker = true
}) => {
  const router = useRouter();
  const { dateRange, setDateRange, setComparisonEnabled } = useDateRange();
  const [showDatePickerState, setShowDatePickerState] = useState(false);

  const handleLogout = () => {
    router.push('/atlas/auth');
  };

  return (
    <PerformanceMonitor componentName={`Dashboard-${title}`}>
      <div className="space-y-6 page-transition">
        <AnalyticsHeader
          title={title}
          subtitle={subtitle}
          dateRange={dateRange}
          onDateRangeClick={showDatePicker ? () => setShowDatePickerState(!showDatePickerState) : undefined}
          onLogout={handleLogout}
        />

        {showDatePicker && showDatePickerState && (
          <div className="flex justify-end">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => {
                setDateRange(range as any);
                setShowDatePickerState(false);
              }}
              showComparison={true}
              onComparisonToggle={setComparisonEnabled}
            />
          </div>
        )}

        <Suspense fallback={<FastSkeleton />}>
          {children}
        </Suspense>
      </div>
    </PerformanceMonitor>
  );
};