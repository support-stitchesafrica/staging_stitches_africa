/**
 * Traffic Dashboard Component
 * 
 * Displays web traffic analytics including page views, visitors, countries, and trends.
 * Integrates with webTrafficAnalytics service for real-time data.
 * 
 * Requirements: 5.2, 14.5, 16.2, 16.3
 */

'use client';

import React, { memo, useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Globe, 
  Monitor,
  Smartphone,
  Tablet,
  TrendingUp,
  Calendar
} from 'lucide-react';
import StatsCard from '../StatsCard';
import DashboardCard from '../DashboardCard';
import {
  getWebTrafficStats,
  getTrafficByCountry,
  getTopPages,
  getTrafficByDevice,
  getDailyTrafficTrend,
  getTopBrowsers,
  TrafficByCountry,
  TrafficByPage
} from '@/services/webTrafficAnalytics';

interface TrafficData {
  stats: {
    totalHits: number;
    uniqueVisitors: number;
    uniqueSessions: number;
  };
  countries: TrafficByCountry[];
  topPages: TrafficByPage[];
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
    other: number;
  };
  dailyTrend: Array<{
    day: number;
    hits: number;
    date: string;
  }>;
  topBrowsers: Array<{
    browser: string;
    hits: number;
    percentage: number;
  }>;
}

export default function TrafficDashboard() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all'>('30d');

  useEffect(() => {
    async function fetchTrafficData() {
      try {
        setLoading(true);
        setError(null);

        // Calculate date range
        let startDate: Date | undefined;
        let endDate: Date | undefined;
        
        if (dateRange !== 'all') {
          endDate = new Date();
          startDate = new Date();
          startDate.setDate(startDate.getDate() - (dateRange === '7d' ? 7 : 30));
        }

        const [
          stats,
          countries,
          topPages,
          deviceBreakdown,
          dailyTrend,
          topBrowsers
        ] = await Promise.all([
          getWebTrafficStats(),
          getTrafficByCountry(),
          getTopPages(10, startDate, endDate),
          getTrafficByDevice(),
          getDailyTrafficTrend(dateRange === '7d' ? 7 : 30),
          getTopBrowsers(5, startDate, endDate)
        ]);

        setData({
          stats,
          countries: countries.slice(0, 10),
          topPages,
          deviceBreakdown,
          dailyTrend,
          topBrowsers
        });
      } catch (err) {
        console.error('Error fetching traffic data:', err);
        setError('Failed to load traffic analytics');
      } finally {
        setLoading(false);
      }
    }

    fetchTrafficData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-48"></div>
          <div className="h-10 bg-gray-200 animate-pulse rounded w-32"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <DashboardCard title="Error" description={error}>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </DashboardCard>
    );
  }

  if (!data) return null;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const totalDeviceHits = Object.values(data.deviceBreakdown).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traffic Analytics</h1>
          <p className="text-gray-600 mt-1">Website visits and user behavior</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                dateRange === range
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          value={formatNumber(data.stats.totalHits)}
          label="Total Page Views"
          icon={Eye}
          variant="primary"
        />
        
        <StatsCard
          value={formatNumber(data.stats.uniqueVisitors)}
          label="Unique Visitors"
          icon={Users}
          variant="success"
        />
        
        <StatsCard
          value={formatNumber(data.stats.uniqueSessions)}
          label="Sessions"
          icon={TrendingUp}
          variant="purple"
        />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <DashboardCard
          title="Top Countries"
          description="Traffic by country"
          icon={Globe}
        >
          <div className="space-y-3">
            {data.countries.slice(0, 8).map((country, index) => (
              <div key={country.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {country.country}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatNumber(country.hits)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {country.visitors} visitors
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Top Pages */}
        <DashboardCard
          title="Top Pages"
          description="Most visited pages"
          icon={Eye}
        >
          <div className="space-y-3">
            {data.topPages.slice(0, 8).map((page, index) => (
              <div key={page.page_url} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {page.page_title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {page.page_url}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-900 ml-2">
                  {formatNumber(page.hits)}
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Device Breakdown */}
        <DashboardCard
          title="Device Types"
          description="Traffic by device"
          icon={Monitor}
        >
          <div className="space-y-4">
            {Object.entries(data.deviceBreakdown).map(([device, count]) => {
              const percentage = totalDeviceHits > 0 ? (count / totalDeviceHits) * 100 : 0;
              const Icon = device === 'desktop' ? Monitor : device === 'mobile' ? Smartphone : device === 'tablet' ? Tablet : Monitor;
              
              return (
                <div key={device} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {device}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatNumber(count)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>

        {/* Top Browsers */}
        <DashboardCard
          title="Top Browsers"
          description="Most used browsers"
          icon={Globe}
        >
          <div className="space-y-3">
            {data.topBrowsers.map((browser, index) => (
              <div key={browser.browser} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-4">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {browser.browser}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatNumber(browser.hits)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {browser.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Traffic Trend */}
      <DashboardCard
        title="Traffic Trend"
        description={`Daily page views over the last ${dateRange === '7d' ? '7 days' : dateRange === '30d' ? '30 days' : 'period'}`}
        icon={Calendar}
      >
        <div className="mt-4">
          <div className="flex items-end justify-between h-32 gap-1">
            {data.dailyTrend.map((day, index) => {
              const maxHits = Math.max(...data.dailyTrend.map(d => d.hits));
              const height = maxHits > 0 ? (day.hits / maxHits) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '2px' }}
                    title={`${day.date}: ${formatNumber(day.hits)} views`}
                  />
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-left">
                    {day.date}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">
              Total: {formatNumber(data.dailyTrend.reduce((sum, day) => sum + day.hits, 0))} page views
            </span>
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}

export default memo(TrafficDashboard);