'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Download, TrendingUp, TrendingDown, Users, DollarSign, ShoppingCart, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { bogoAnalyticsService } from '@/lib/bogo/analytics-service';
import type { 
  BogoDashboardData, 
  BogoAnalytics, 
  BogoAnalyticsReport,
  AnalyticsExportOptions 
} from '@/lib/bogo/analytics-service';

interface AnalyticsDashboardProps {
  mappingId?: string; // If provided, show analytics for specific mapping
  className?: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function AnalyticsDashboard({ mappingId, className }: AnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<BogoDashboardData | null>(null);
  const [mappingAnalytics, setMappingAnalytics] = useState<BogoAnalytics | null>(null);
  const [popularCombinations, setPopularCombinations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date()
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [mappingId, dateRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (mappingId) {
        // Load analytics for specific mapping
        const analytics = await bogoAnalyticsService.getAnalytics(
          mappingId, 
          dateRange.from, 
          dateRange.to
        );
        setMappingAnalytics(analytics);
      } else {
        // Load dashboard data for all mappings
        const dashboard = await bogoAnalyticsService.getDashboardData({
          start: dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: dateRange.to || new Date()
        });
        setDashboardData(dashboard);
      }

      // Load popular combinations
      const combinations = await bogoAnalyticsService.getPopularCombinations(10, {
        start: dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: dateRange.to || new Date()
      });
      setPopularCombinations(combinations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      
      const options: AnalyticsExportOptions = {
        format: exportFormat,
        dateRange: {
          start: dateRange.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: dateRange.to || new Date()
        },
        mappingIds: mappingId ? [mappingId] : undefined,
        includeDetails: true,
        groupBy: 'day'
      };

      const result = await bogoAnalyticsService.exportAnalytics(options);
      
      if (result.success && result.data) {
        // Create and download file
        const blob = new Blob([result.data], { 
          type: exportFormat === 'json' ? 'application/json' : 'text/csv' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bogo-analytics-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error(result.error || 'Export failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {mappingId ? 'BOGO Promotion Analytics' : 'BOGO Dashboard'}
          </h2>
          <p className="text-muted-foreground">
            {mappingId ? 'Detailed analytics for this promotion' : 'Overview of all BOGO promotions'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant="outline"
                className={cn(
                  "w-[300px] justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          {/* Export Controls */}
          <Select value={exportFormat} onValueChange={(value: 'csv' | 'json' | 'xlsx') => setExportFormat(value)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="xlsx">Excel</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      {/* Analytics Content */}
      {mappingId && mappingAnalytics ? (
        <MappingAnalyticsView analytics={mappingAnalytics} />
      ) : dashboardData ? (
        <DashboardOverview data={dashboardData} />
      ) : null}

      {/* Popular Combinations */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Product Combinations</CardTitle>
          <CardDescription>
            Most redeemed main product and free product pairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularCombinations.length > 0 ? (
              popularCombinations.map((combo, index) => (
                <div key={`${combo.mainProductId}-${combo.freeProductId}`} 
                     className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{combo.mainProductName}</p>
                      <p className="text-sm text-muted-foreground">
                        + {combo.freeProductName} (Free)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{combo.redemptionCount} redemptions</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(combo.totalRevenue)} revenue
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No combinations data available for the selected period
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardOverview({ data }: { data: BogoDashboardData }) {
  return (
    <>
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeMappings}</div>
            <p className="text-xs text-muted-foreground">
              Currently running BOGO promotions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Redemptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRedemptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              BOGO promotions redeemed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(data.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From BOGO orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(data.totalRedemptions > 0 ? data.totalRevenue / data.totalRedemptions : 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per BOGO order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Promotions */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Promotions</CardTitle>
          <CardDescription>
            Promotions with the highest redemption rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topPerformingMappings.map((mapping, index) => (
              <div key={mapping.mappingId} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{mapping.mainProductName}</p>
                    <p className="text-sm text-muted-foreground">
                      {mapping.redemptions} redemptions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(mapping.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Daily redemptions and revenue over the past week
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recentActivity.map((activity) => (
              <div key={activity.date} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">
                  {format(new Date(activity.date), 'MMM dd')}
                </span>
                <div className="flex items-center gap-4 text-sm">
                  <span>{activity.redemptions} redemptions</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(activity.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Expirations */}
      {data.upcomingExpirations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Expirations</CardTitle>
            <CardDescription>
              Promotions expiring in the next 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.upcomingExpirations.map((expiration) => (
                <div key={expiration.mappingId} className="flex items-center justify-between py-2">
                  <span className="font-medium">{expiration.mainProductName}</span>
                  <Badge variant="destructive">
                    Expires {format(expiration.expiresAt, 'MMM dd')}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function MappingAnalyticsView({ analytics }: { analytics: BogoAnalytics }) {
  return (
    <>
      {/* Key Metrics for Specific Mapping */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.viewsToRedemptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Product page views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redemptions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRedemptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(analytics.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From this promotion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${analytics.averageOrderValue.toFixed(2)} avg. order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Free Product Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Free Product Selection</CardTitle>
          <CardDescription>
            Distribution of free products chosen by customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.freeProductDistribution.map((product) => (
              <div key={product.productId} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{product.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.count} selections
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${product.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {product.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Redemptions Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Redemptions</CardTitle>
          <CardDescription>
            Redemption activity over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analytics.redemptionsByDate.map((day) => (
              <div key={day.date} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">
                  {format(new Date(day.date), 'MMM dd, yyyy')}
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ 
                        width: `${Math.max(5, (day.count / Math.max(...analytics.redemptionsByDate.map(d => d.count))) * 100)}%` 
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {day.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}