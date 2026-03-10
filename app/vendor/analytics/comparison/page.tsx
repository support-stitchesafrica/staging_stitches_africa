'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ComparisonMetricCard } from '@/components/vendor/shared/ComparisonMetricCard';
import { YearOverYearChart } from '@/components/vendor/analytics/YearOverYearChart';
import { DateRangePicker } from '@/components/vendor/shared/DateRangePicker';
import { YearOverYearComparison } from '@/types/vendor-analytics';
import { DateRange as ReactDayPickerDateRange } from 'react-day-picker';
import { 
  DollarSign, 
  ShoppingCart, 
  TrendingUp, 
  Users,
  Calendar
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModernNavbar } from '@/components/vendor/modern-navbar';

export default function ComparisonPage() {
  const { user } = useAuth();
  const [pickerDateRange, setPickerDateRange] = useState<ReactDayPickerDateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [yoyData, setYoyData] = useState<YearOverYearComparison[]>([]);

  useEffect(() => {
    if (user?.uid && pickerDateRange?.from && pickerDateRange?.to) {
      loadComparisonData();
    }
  }, [user, pickerDateRange]);

  const loadComparisonData = async () => {
    if (!user?.uid || !pickerDateRange?.from || !pickerDateRange?.to) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/vendor/analytics/comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: user.uid,
          dateRange: {
            start: pickerDateRange.from.toISOString(),
            end: pickerDateRange.to.toISOString(),
            preset: 'custom'
          },
          type: 'both'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }

      const data = await response.json();
      setComparisonData(data.periodComparison);
      setYoyData(data.yearOverYear);
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <ModernNavbar />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Comparison</h1>
          <p className="text-gray-600 mt-1">
            Compare your metrics across different time periods
          </p>
        </div>
        <DateRangePicker
          value={pickerDateRange}
          onChange={setPickerDateRange}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="period" className="space-y-6">
        <TabsList>
          <TabsTrigger value="period">
            <Calendar className="h-4 w-4 mr-2" />
            Period Comparison
          </TabsTrigger>
          <TabsTrigger value="yoy">
            <TrendingUp className="h-4 w-4 mr-2" />
            Year-over-Year
          </TabsTrigger>
        </TabsList>

        {/* Period Comparison */}
        <TabsContent value="period" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <ComparisonMetricCard
              title="Total Revenue"
              value={comparisonData?.current?.sales?.totalRevenue || 0}
              comparison={comparisonData?.comparisons?.revenue}
              icon={DollarSign}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-100"
              currency="USD"
              loading={loading}
            />

            <ComparisonMetricCard
              title="Total Orders"
              value={comparisonData?.current?.orders?.totalOrders || 0}
              comparison={comparisonData?.comparisons?.orders}
              icon={ShoppingCart}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              loading={loading}
            />

            <ComparisonMetricCard
              title="Average Order Value"
              value={comparisonData?.current?.sales?.averageOrderValue || 0}
              comparison={comparisonData?.comparisons?.averageOrderValue}
              icon={TrendingUp}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              currency="USD"
              loading={loading}
            />

            <ComparisonMetricCard
              title="Cancellation Rate"
              value={`${(comparisonData?.current?.sales?.cancellationRate || 0).toFixed(1)}%`}
              comparison={comparisonData?.comparisons?.cancellationRate}
              icon={Users}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
              loading={loading}
            />
          </div>

          {/* Detailed Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Period-over-Period Analysis</CardTitle>
              <CardDescription>
                Detailed comparison with the previous period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <ComparisonRow
                    label="Revenue"
                    current={comparisonData?.current?.sales?.totalRevenue || 0}
                    previous={comparisonData?.previous?.sales?.totalRevenue || 0}
                    formatter={formatCurrency}
                  />
                  <ComparisonRow
                    label="Orders"
                    current={comparisonData?.current?.orders?.totalOrders || 0}
                    previous={comparisonData?.previous?.orders?.totalOrders || 0}
                    formatter={(v) => v.toFixed(0)}
                  />
                  <ComparisonRow
                    label="Average Order Value"
                    current={comparisonData?.current?.sales?.averageOrderValue || 0}
                    previous={comparisonData?.previous?.sales?.averageOrderValue || 0}
                    formatter={formatCurrency}
                  />
                  <ComparisonRow
                    label="Cancellation Rate"
                    current={comparisonData?.current?.sales?.cancellationRate || 0}
                    previous={comparisonData?.previous?.sales?.cancellationRate || 0}
                    formatter={(v) => `${v.toFixed(1)}%`}
                    invertColors
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Year-over-Year Comparison */}
        <TabsContent value="yoy" className="space-y-6">
          <YearOverYearChart
            data={yoyData}
            title="Revenue Year-over-Year"
            description="Compare revenue performance across years"
            valueFormatter={formatCurrency}
            loading={loading}
          />

          {/* YoY Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Year-over-Year Summary</CardTitle>
              <CardDescription>
                Growth trends across multiple years
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-32 animate-pulse rounded bg-gray-100" />
              ) : yoyData.length > 0 ? (
                <div className="space-y-4">
                  {yoyData.map((year, index) => (
                    <div key={year.year} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-semibold text-gray-900">{year.year}</p>
                        <p className="text-sm text-gray-600">{formatCurrency(year.value)}</p>
                      </div>
                      {index > 0 && (
                        <div className={`text-sm font-medium ${
                          year.change > 0 ? 'text-green-600' : 
                          year.change < 0 ? 'text-red-600' : 
                          'text-gray-600'
                        }`}>
                          {year.change > 0 ? '+' : ''}{year.change.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No year-over-year data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ComparisonRow({
  label,
  current,
  previous,
  formatter,
  invertColors = false
}: {
  label: string;
  current: number;
  previous: number;
  formatter: (value: number) => string;
  invertColors?: boolean;
}) {
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    return ((current - previous) / previous) * 100;
  };
  
  const change = calculatePercentageChange(current, previous);
  const isPositive = invertColors ? change < 0 : change > 0;
  
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <div className="flex items-center gap-4 mt-1 text-sm">
          <span className="text-gray-600">
            Current: <span className="font-semibold">{formatter(current)}</span>
          </span>
          <span className="text-gray-400">
            Previous: {formatter(previous)}
          </span>
        </div>
      </div>
      <div className={`text-sm font-semibold ${
        isPositive ? 'text-green-600' : 
        change < 0 ? 'text-red-600' : 
        'text-gray-600'
      }`}>
        {change > 0 ? '+' : ''}{change.toFixed(1)}%
      </div>
    </div>
  );
}
