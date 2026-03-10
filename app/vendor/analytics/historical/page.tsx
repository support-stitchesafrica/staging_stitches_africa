/**
 * Historical Analytics Page
 * Displays 12-month historical data with seasonal patterns and trends
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { HistoricalDataView } from '@/components/vendor/analytics/HistoricalDataView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { ModernNavbar } from '@/components/vendor/modern-navbar';

export default function HistoricalAnalyticsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Please log in to view analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <ModernNavbar />
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Historical Analytics</h1>
        <p className="text-gray-600">
          View 12-month historical data, seasonal patterns, and year-over-year comparisons
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-medium">12-Month Access</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Access data from the past 12 months for comprehensive analysis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <CardTitle className="text-sm font-medium">Seasonal Patterns</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Identify high and low seasons to optimize your business strategy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm font-medium">Year-over-Year</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Compare performance across years to track growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-sm font-medium">Custom Ranges</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-600">
              Compare any two custom date ranges for detailed insights
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Data View */}
      <HistoricalDataView vendorId={user.uid} />

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">About Historical Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>Data Retention:</strong> Historical data is maintained for 12 months for compliance and analysis purposes.
          </p>
          <p>
            <strong>Seasonal Patterns:</strong> Patterns are automatically detected based on quarterly and monthly trends.
          </p>
          <p>
            <strong>Cumulative Metrics:</strong> View running totals to understand overall growth trajectory.
          </p>
          <p>
            <strong>Custom Comparisons:</strong> Compare any two date ranges within the 12-month window.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
