'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CalendarIcon, 
  Download, 
  Eye, 
  ShoppingCart, 
  Users, 
  TrendingUp,
  Clock,
  MousePointer
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MetricsCard, MetricsGrid } from './MetricsCard';
import { TrendCharts } from './TrendCharts';
import { 
  storefrontAnalyticsService, 
  type StorefrontAnalyticsData, 
  type DateRange 
} from '@/lib/storefront/analytics-service';

interface AnalyticsDashboardProps {
  storefrontId: string;
  className?: string;
}

export function AnalyticsDashboard({ storefrontId, className }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<StorefrontAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [storefrontId, dateRange]);

  const loadAnalyticsData = async () => {
    if (!dateRange.from || !dateRange.to) return;

    try {
      setLoading(true);
      setError(null);

      // Use real Firebase analytics service
      const data = await storefrontAnalyticsService.getAnalytics(storefrontId, {
        start: dateRange.from,
        end: dateRange.to
      });

      setAnalyticsData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!dateRange.from || !dateRange.to) return;

    try {
      setExporting(true);
      
      // Use real Firebase analytics service for export
      const exportData = await storefrontAnalyticsService.exportAnalytics(
        storefrontId,
        {
          start: dateRange.from,
          end: dateRange.to
        },
        exportFormat
      );
      
      // Create and download file
      const blob = new Blob([exportData], { 
        type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storefront-analytics-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (error) {
    return (
      <div className={cn("p-8", className)}>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading analytics</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
              <Button onClick={loadAnalyticsData} className="mt-4">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Date Range and Export */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Storefront Analytics</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Track your storefront performance and customer engagement
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-full sm:w-[280px] lg:w-[300px] justify-start text-left font-normal text-xs sm:text-sm",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={window.innerWidth < 768 ? 1 : 2}
              />
            </PopoverContent>
          </Popover>

          {/* Export Controls */}
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={exportFormat} onValueChange={(value: 'csv' | 'json') => setExportFormat(value)}>
              <SelectTrigger className="w-20 sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleExport} 
              disabled={exporting || !analyticsData}
              className="flex-1 sm:flex-none"
              size="default"
            >
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
              <span className="sm:hidden">{exporting ? '...' : 'Export'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <MetricsGrid>
        <MetricsCard
          title="Page Views"
          value={analyticsData?.pageViews || 0}
          icon={<Eye />}
          description="Total storefront visits"
          loading={loading}
        />
        <MetricsCard
          title="Product Views"
          value={analyticsData?.productViews || 0}
          icon={<MousePointer />}
          description="Individual product views"
          loading={loading}
        />
        <MetricsCard
          title="Cart Adds"
          value={analyticsData?.cartAdds || 0}
          icon={<ShoppingCart />}
          description="Products added to cart"
          loading={loading}
        />
        <MetricsCard
          title="Unique Visitors"
          value={analyticsData?.uniqueVisitors || 0}
          icon={<Users />}
          description="Distinct visitors"
          loading={loading}
        />
      </MetricsGrid>

      {/* Secondary Metrics */}
      <MetricsGrid className="sm:grid-cols-2 lg:grid-cols-3">
        <MetricsCard
          title="Conversion Rate"
          value={analyticsData ? `${analyticsData.conversionRate}%` : '0%'}
          icon={<TrendingUp />}
          description="Cart adds / Product views"
          loading={loading}
        />
        <MetricsCard
          title="Avg. Session Duration"
          value={analyticsData ? formatDuration(analyticsData.sessionData.averageSessionDuration) : '0s'}
          icon={<Clock />}
          description="Time spent on storefront"
          loading={loading}
        />
        <MetricsCard
          title="Pages per Session"
          value={analyticsData?.sessionData.pagesPerSession || 0}
          icon={<Eye />}
          description="Average pages viewed"
          loading={loading}
          className="sm:col-span-2 lg:col-span-1"
        />
      </MetricsGrid>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
          <CardDescription>
            Products with the most views and engagement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-6 bg-muted animate-pulse rounded" />
                    <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                    <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                    <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : analyticsData?.topProducts.length ? (
            <div className="space-y-3">
              {analyticsData.topProducts.map((product, index) => (
                <div key={product.productId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    <Badge variant="secondary" className="flex-shrink-0">#{index + 1}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">{product.productName}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {product.conversionRate.toFixed(1)}% conversion rate
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
                    <div className="text-center">
                      <p className="font-medium">{product.views}</p>
                      <p className="text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{product.cartAdds}</p>
                      <p className="text-muted-foreground">Cart Adds</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No product data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Visual Trend Charts */}
      <TrendCharts 
        dailyStats={analyticsData?.dailyStats || []}
        loading={loading}
      />

      {/* Daily Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Activity Summary</CardTitle>
          <CardDescription>
            Recent daily breakdown of page views, product views, and cart additions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="w-16 h-4 bg-muted animate-pulse rounded" />
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-4 bg-muted animate-pulse rounded" />
                    <div className="w-12 h-4 bg-muted animate-pulse rounded" />
                    <div className="w-12 h-4 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : analyticsData?.dailyStats.length ? (
            <div className="space-y-3">
              {analyticsData.dailyStats.slice(-14).map((day) => {
                const maxValue = Math.max(
                  ...analyticsData.dailyStats.map(d => Math.max(d.pageViews, d.productViews, d.cartAdds))
                );
                
                return (
                  <div key={day.date} className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {format(new Date(day.date), 'MMM dd')}
                      </span>
                      <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-blue-600">{day.pageViews} views</span>
                        <span className="text-green-600">{day.productViews} products</span>
                        <span className="text-orange-600">{day.cartAdds} cart adds</span>
                      </div>
                    </div>
                    <div className="flex gap-1 h-2">
                      <div 
                        className="bg-blue-500 rounded-sm" 
                        style={{ 
                          width: `${maxValue > 0 ? (day.pageViews / maxValue) * 100 : 0}%`,
                          minWidth: day.pageViews > 0 ? '2px' : '0'
                        }}
                      />
                      <div 
                        className="bg-green-500 rounded-sm" 
                        style={{ 
                          width: `${maxValue > 0 ? (day.productViews / maxValue) * 100 : 0}%`,
                          minWidth: day.productViews > 0 ? '2px' : '0'
                        }}
                      />
                      <div 
                        className="bg-orange-500 rounded-sm" 
                        style={{ 
                          width: `${maxValue > 0 ? (day.cartAdds / maxValue) * 100 : 0}%`,
                          minWidth: day.cartAdds > 0 ? '2px' : '0'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No daily activity data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Session Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Session Insights</CardTitle>
          <CardDescription>
            Understanding visitor behavior and engagement patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center p-4 border rounded-lg">
                  <div className="w-16 h-8 bg-muted animate-pulse rounded mx-auto mb-2" />
                  <div className="w-24 h-4 bg-muted animate-pulse rounded mx-auto" />
                </div>
              ))}
            </div>
          ) : analyticsData ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl sm:text-2xl font-bold">
                  {formatDuration(analyticsData.sessionData.averageSessionDuration)}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Average Session Duration</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="text-xl sm:text-2xl font-bold">
                  {analyticsData.sessionData.bounceRate.toFixed(1)}%
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Bounce Rate</p>
              </div>
              <div className="text-center p-4 border rounded-lg sm:col-span-2 lg:col-span-1">
                <div className="text-xl sm:text-2xl font-bold">
                  {analyticsData.sessionData.pagesPerSession.toFixed(1)}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Pages per Session</p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}