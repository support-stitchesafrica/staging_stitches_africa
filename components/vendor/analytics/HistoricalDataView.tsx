/**
 * Historical Data View Component
 * Displays 12-month historical data with seasonal patterns and trends
 * Validates: Requirements 16.1, 16.2, 16.3, 16.4, 16.5
 */

"use client";

import React, { useState } from 'react';
import {
  useHistoricalData,
  useCumulativeMetrics,
  useDateRangeComparison,
  getDateRangePresets,
  isDateRangeValid
} from '@/lib/vendor/useHistoricalData';
import { DateRange } from '@/types/vendor-analytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { formatUSD } from '@/lib/utils/currency';

interface HistoricalDataViewProps {
  vendorId: string;
}

export function HistoricalDataView({ vendorId }: HistoricalDataViewProps) {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'customers' | 'products'>('revenue');
  const [viewMode, setViewMode] = useState<'historical' | 'cumulative' | 'comparison'>('historical');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangePresets()['Last 12 Months']);
  const [comparisonRange1, setComparisonRange1] = useState<DateRange | null>(null);
  const [comparisonRange2, setComparisonRange2] = useState<DateRange | null>(null);

  // Fetch historical data
  const { data: historicalData, loading: historicalLoading, error: historicalError } = useHistoricalData(
    vendorId,
    selectedMetric
  );

  // Fetch cumulative metrics
  const { data: cumulativeData, loading: cumulativeLoading } = useCumulativeMetrics(
    vendorId,
    dateRange,
    selectedMetric as 'revenue' | 'orders' | 'customers'
  );

  // Fetch comparison data
  const { data: comparisonData, loading: comparisonLoading } = useDateRangeComparison(
    vendorId,
    comparisonRange1,
    comparisonRange2
  );

  const metricLabels = {
    revenue: 'Revenue',
    orders: 'Orders',
    customers: 'Customers',
    products: 'Products'
  };

  const metricFormats = {
    revenue: (value: number) => formatUSD(value),
    orders: (value: number) => value.toLocaleString(),
    customers: (value: number) => value.toLocaleString(),
    products: (value: number) => value.toLocaleString()
  };

  const formatValue = (value: number) => metricFormats[selectedMetric](value);

  const getTrendIcon = (trend: 'high' | 'medium' | 'low') => {
    switch (trend) {
      case 'high':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'low':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'high' | 'medium' | 'low') => {
    switch (trend) {
      case 'high':
        return 'text-green-600 bg-green-50';
      case 'low':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (historicalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (historicalError) {
    return (
      <div className="text-center text-red-600 p-4">
        <p>Error loading historical data: {historicalError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {Object.entries(metricLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedMetric === key ? 'default' : 'outline'}
              onClick={() => setSelectedMetric(key as any)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === 'historical' ? 'default' : 'outline'}
            onClick={() => setViewMode('historical')}
          >
            Historical
          </Button>
          <Button
            variant={viewMode === 'cumulative' ? 'default' : 'outline'}
            onClick={() => setViewMode('cumulative')}
          >
            Cumulative
          </Button>
          <Button
            variant={viewMode === 'comparison' ? 'default' : 'outline'}
            onClick={() => setViewMode('comparison')}
          >
            Compare
          </Button>
        </div>
      </div>

      {/* Historical View */}
      {viewMode === 'historical' && historicalData && (
        <div className="space-y-6">
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>12-Month {metricLabels[selectedMetric]} Trend</CardTitle>
              <CardDescription>Historical data for the past 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData.dataPoints}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => formatValue(value)}
                  />
                  <Tooltip
                    formatter={(value: number) => formatValue(value)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name={metricLabels[selectedMetric]}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Seasonal Patterns */}
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Patterns</CardTitle>
              <CardDescription>Identify high and low seasons for your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {historicalData.seasonalPatterns.map((pattern, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getTrendColor(pattern.trend)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{pattern.period}</span>
                      {getTrendIcon(pattern.trend)}
                    </div>
                    <div className="text-2xl font-bold">
                      {formatValue(pattern.averageValue)}
                    </div>
                    <div className="text-sm capitalize mt-1">
                      {pattern.trend} season
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Year-over-Year Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Year-over-Year Comparison</CardTitle>
              <CardDescription>Compare performance across years</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={historicalData.yearOverYearComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => formatValue(value)} />
                  <Tooltip formatter={(value: number) => formatValue(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name={metricLabels[selectedMetric]} />
                </BarChart>
              </ResponsiveContainer>

              {historicalData.yearOverYearComparison.length >= 2 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Year-over-Year Change:</span>
                    <span className={`text-lg font-bold ${
                      historicalData.yearOverYearComparison[0].change >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {historicalData.yearOverYearComparison[0].change >= 0 ? '+' : ''}
                      {historicalData.yearOverYearComparison[0].change.toFixed(2)}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cumulative View */}
      {viewMode === 'cumulative' && (
        <Card>
          <CardHeader>
            <CardTitle>Cumulative {metricLabels[selectedMetric]}</CardTitle>
            <CardDescription>Running total over time</CardDescription>
          </CardHeader>
          <CardContent>
            {cumulativeLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cumulativeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => formatValue(value)} />
                  <Tooltip formatter={(value: number) => formatValue(value)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name={`Cumulative ${metricLabels[selectedMetric]}`}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison View */}
      {viewMode === 'comparison' && (
        <Card>
          <CardHeader>
            <CardTitle>Custom Date Range Comparison</CardTitle>
            <CardDescription>Compare two custom date ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Date Range Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Range 1</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {comparisonRange1?.start ? format(comparisonRange1.start, 'PPP') : 'Start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={comparisonRange1?.start}
                          onSelect={(date) => date && setComparisonRange1({ ...comparisonRange1!, start: date })}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {comparisonRange1?.end ? format(comparisonRange1.end, 'PPP') : 'End date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={comparisonRange1?.end}
                          onSelect={(date) => date && setComparisonRange1({ ...comparisonRange1!, end: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Range 2</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {comparisonRange2?.start ? format(comparisonRange2.start, 'PPP') : 'Start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={comparisonRange2?.start}
                          onSelect={(date) => date && setComparisonRange2({ ...comparisonRange2!, start: date })}
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {comparisonRange2?.end ? format(comparisonRange2.end, 'PPP') : 'End date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={comparisonRange2?.end}
                          onSelect={(date) => date && setComparisonRange2({ ...comparisonRange2!, end: date })}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Comparison Results */}
              {comparisonLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : comparisonData ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {Object.entries(comparisonData.changes).map(([key, change]) => (
                    <div key={key} className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-600 capitalize mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-2xl font-bold mb-2">
                        {formatValue(comparisonData.range1[key as keyof typeof comparisonData.range1] as number)}
                      </div>
                      <div className={`text-sm font-medium ${
                        change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Select two date ranges to compare
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
