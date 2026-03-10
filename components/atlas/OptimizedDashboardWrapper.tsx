'use client';

import React, { Suspense, lazy } from 'react';
import { AnalyticsHeader } from '@/components/analytics/AnalyticsHeader';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { useDateRange } from '@/contexts/DateRangeContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Enhanced loading skeleton for better UX
const DashboardSkeleton = () => (
  <div className="space-y-4 sm:space-y-6 animate-pulse">
    {/* Header skeleton */}
    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    
    {/* Metrics row skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
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
    
    {/* Charts row skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
          <div className="w-32 h-4 bg-gray-200 rounded mb-4"></div>
          <div className="w-full h-64 bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

interface OptimizedDashboardWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  showDatePicker?: boolean;
}

export const OptimizedDashboardWrapper: React.FC<OptimizedDashboardWrapperProps> = ({
  title,
  subtitle,
  children,
  showDatePicker = true
}) => {
  const router = useRouter();
  const { dateRange, setDateRange, setComparisonEnabled } = useDateRange();
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);

  const handleLogout = () => {
    router.push('/atlas/auth');
  };

  return (
    <div className="space-y-6 page-transition">
      <AnalyticsHeader
        title={title}
        subtitle={subtitle}
        dateRange={dateRange}
        onDateRangeClick={showDatePicker ? () => setShowDatePickerModal(!showDatePickerModal) : undefined}
        onLogout={handleLogout}
      />

      {showDatePicker && showDatePickerModal && (
        <div className="flex justify-end">
          <DateRangePicker
            value={dateRange}
            onChange={(range) => {
              setDateRange(range as any);
              setShowDatePickerModal(false);
            }}
            showComparison={true}
            onComparisonToggle={setComparisonEnabled}
          />
        </div>
      )}

      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </div>
  );
};