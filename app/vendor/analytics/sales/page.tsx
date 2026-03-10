'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { DateRangePicker, DateRange as DateRangeType } from '@/components/analytics/DateRangePicker';
import { SalesTrendChart } from '@/components/vendor/analytics/SalesTrendChart';
import { RevenueBreakdown } from '@/components/vendor/analytics/RevenueBreakdown';
import { TopProductsTable } from '@/components/vendor/analytics/TopProductsTable';
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  AlertCircle,
  Activity
} from 'lucide-react';
import { VendorAnalyticsService } from '@/lib/vendor/analytics-service';
import { DateRange, SalesMetrics } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function SalesAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeType>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  });

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('tailorToken');
    const id = localStorage.getItem('tailorUID');
    
    if (!token) {
      router.push('/vendor');
      return;
    }
    
    setVendorId(id);
  }, [router]);

  // Fetch sales analytics data
  useEffect(() => {
    if (!vendorId) return;

    const fetchSalesAnalytics = async () => {
      setLoading(true);
      try {
        const analyticsService = new VendorAnalyticsService();
        const analyticsRange: DateRange = {
          start: dateRange.start,
          end: dateRange.end,
          preset: '30days'
        };
        
        const response = await analyticsService.getVendorAnalytics(vendorId, analyticsRange);
        
        if (response.success && response.data) {
          setSalesMetrics(response.data.sales);
        } else {
          toast.error(response.error?.message || 'Failed to load sales analytics');
        }
      } catch (error) {
        console.error('Error fetching sales analytics:', error);
        toast.error('Failed to load sales analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesAnalytics();
  }, [vendorId, dateRange]);

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  const handleExport = async () => {
    if (!vendorId || !salesMetrics) return;
    
    try {
      toast.info('Preparing export...');
      const analyticsService = new VendorAnalyticsService();
      const exportRange: DateRange = {
        start: dateRange.start,
        end: dateRange.end
      };
      
      const response = await analyticsService.exportAnalytics(vendorId, {
        format: 'csv',
        dataType: 'sales',
        dateRange: exportRange
      });
      
      if (response.success && response.data) {
        // Create download link
        const url = URL.createObjectURL(response.data.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = response.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Export downloaded successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SalesAnalyticsSkeleton />
        </main>
      </div>
    );
  }

  if (!salesMetrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to load sales analytics
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading your sales data
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/vendor/analytics')}
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analytics
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sales Analytics
              </h1>
              <p className="text-gray-600 text-lg">
                Detailed sales performance and revenue insights
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                showComparison={false}
              />
              <Button
                variant="outline"
                onClick={handleExport}
                className="border-gray-300 hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesMetrics.totalRevenue)}
                </p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(salesMetrics.revenueChange)}
                  <span className={`text-sm ${getTrendColor(salesMetrics.revenueChange)}`}>
                    {formatPercentage(salesMetrics.revenueChange)} vs previous period
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Average Order Value
                </CardTitle>
                <ShoppingBag className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(salesMetrics.averageOrderValue)}
                </p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(salesMetrics.aovChange)}
                  <span className={`text-sm ${getTrendColor(salesMetrics.aovChange)}`}>
                    {formatPercentage(salesMetrics.aovChange)} vs previous period
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Completed Orders
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {salesMetrics.completedOrders.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  Successfully delivered
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Cancellation Rate
                </CardTitle>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {salesMetrics.cancellationRate.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  {salesMetrics.cancelledOrders} cancelled orders
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Trend Chart */}
        <div className="mb-8">
          <SalesTrendChart
            data={salesMetrics.salesTrend}
            title="Sales Trend"
            description="Daily revenue performance over the selected period"
            showArea={true}
            height={400}
          />
        </div>

        {/* Revenue Breakdown and Top Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <RevenueBreakdown
            categories={salesMetrics.topCategories}
            title="Revenue by Category"
            description="Sales distribution across product categories"
            height={350}
          />

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Distribution of payment methods used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {salesMetrics.paymentMethods.length > 0 ? (
                  salesMetrics.paymentMethods.map((method, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {method.method}
                        </p>
                        <p className="text-xs text-gray-600">
                          {method.count} transactions • {method.successRate.toFixed(1)}% success rate
                        </p>
                      </div>
                      <div className="text-right ml-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {formatCurrency(method.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-600">
                          {method.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No payment method data available
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products Table */}
        <div className="mb-8">
          <TopProductsTable
            products={salesMetrics.revenueByProduct}
            title="Top Performing Products"
            description="Products ranked by revenue contribution"
            maxItems={10}
          />
        </div>
      </main>
    </div>
  );
}

// Skeleton loading component
function SalesAnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>

      {/* Two Column Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
