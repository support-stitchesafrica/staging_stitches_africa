'use client';

import React, { useEffect, useState } from 'react';
import { PerformanceService, PerformanceTrend } from '@/lib/marketing/performance-service';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';

interface PerformanceTrendsProps {
  userId?: string;
  teamId?: string;
  periodType?: 'month' | 'week';
  periodsCount?: number;
  title?: string;
}

export default function PerformanceTrends({ 
  userId, 
  teamId, 
  periodType = 'month',
  periodsCount = 6,
  title = 'Performance Trends'
}: PerformanceTrendsProps) {
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTrends();
  }, [userId, teamId, periodType, periodsCount]);

  const loadTrends = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await PerformanceService.calculatePerformanceTrends(
        userId,
        teamId,
        periodType,
        periodsCount
      );
      setTrends(data);
    } catch (err) {
      console.error('Error loading performance trends:', err);
      setError('Failed to load performance trends');
    } finally {
      setLoading(false);
    }
  };

  const formatPeriod = (period: string) => {
    if (periodType === 'month') {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } else {
      return period; // Week format: 2024-W01
    }
  };

  const getMaxValue = () => {
    if (trends.length === 0) return 100;
    return Math.max(...trends.map(t => t.totalAssignments), 10);
  };

  const getBarHeight = (value: number) => {
    const max = getMaxValue();
    return `${(value / max) * 100}%`;
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="animate-pulse">
          <div className="h-48 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-6 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadTrends}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (trends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="text-center py-8 text-gray-500">
          No performance trend data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Last {periodsCount} {periodType}s
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Bar Chart */}
        <div className="mb-6">
          <div className="flex items-end justify-between h-48 gap-2">
            {trends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col justify-end h-full">
                  {/* Completed Assignments Bar */}
                  <div
                    className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600"
                    style={{ height: getBarHeight(trend.completedAssignments) }}
                    title={`${trend.completedAssignments} completed`}
                  ></div>
                  {/* Total Assignments Bar (lighter) */}
                  <div
                    className="w-full bg-blue-200 transition-all hover:bg-blue-300"
                    style={{ 
                      height: getBarHeight(trend.totalAssignments - trend.completedAssignments) 
                    }}
                    title={`${trend.totalAssignments} total`}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between gap-2 mt-2">
            {trends.map((trend, index) => (
              <div key={index} className="flex-1 text-center">
                <div className="text-xs text-gray-600 truncate">
                  {formatPeriod(trend.period)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span className="text-gray-600">In Progress</span>
          </div>
        </div>

        {/* Metrics Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-700">Period</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">Total</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">Completed</th>
                <th className="px-4 py-2 text-right font-medium text-gray-700">Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trends.map((trend, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-900">
                    {formatPeriod(trend.period)}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    {trend.totalAssignments}
                  </td>
                  <td className="px-4 py-2 text-right text-green-600 font-medium">
                    {trend.completedAssignments}
                  </td>
                  <td className={`px-4 py-2 text-right font-medium ${getConversionColor(trend.conversionRate)}`}>
                    {trend.conversionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {trends.reduce((sum, t) => sum + t.totalAssignments, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Assignments</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {trends.reduce((sum, t) => sum + t.completedAssignments, 0)}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {(trends.reduce((sum, t) => sum + t.conversionRate, 0) / trends.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg Conversion</div>
          </div>
        </div>
      </div>
    </div>
  );
}
