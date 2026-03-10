/**
 * Analytics Dashboard with React Query
 * Implements real-time data updates
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import MetricCard from '@/components/shared/MetricCard';
import { DateRangePicker, DateRange as DateRangeType } from '@/components/analytics/DateRangePicker';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { RecommendationsWidget } from '@/components/vendor/analytics/RecommendationsWidget';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  ArrowUpRight,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  Target,
  RefreshCw,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { DateRange } from '@/types/vendor-analytics';
import { toast } from 'sonner';
import { MobileBottomNav } from '@/components/vendor/shared/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useVendorAnalytics,
  useExportAnalytics,
  useRecentOrders,
  useVendorNotifications,
  useInvalidateVendorQueries,
} from '@/lib/vendor/useVendorAnalyticsQuery';

export default function AnalyticsDashboardWithQuery() {
  const isMobile = useIsMobile();
  const router = useRouter();
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

  // React Query hooks - Requirement 10.2: Real-time updates
  const analyticsRange: DateRange = {
    start: dateRange.start,
    end: dateRange.end,
    preset: '30days'
  };

  const {
    data: analytics,
    isLoading,
    error,
    isFetching,
    dataUpdatedAt,
  } = useVendorAnalytics(vendorId || '', analyticsRange);

  // Requirement 10.5: Immediate reflection of new orders
  const {
    data: recentOrders,
    isFetching: isFetchingOrders,
  } = useRecentOrders(vendorId || '');

  // Real-time notifications
  const {
    data: notifications,
    isFetching: isFetchingNotifications,
  } = useVendorNotifications(vendorId || '');

  // Export mutation
  const exportMutation = useExportAnalytics(vendorId || '');

  // Manual refresh mutation
  const invalidateMutation = useInvalidateVendorQueries();

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  const handleExport = async () => {
    if (!vendorId || !analytics) return;
    
    try {
      toast.info('Preparing export...');
      const exportRange: DateRange = {
        start: dateRange.start,
        end: dateRange.end
      };
      
      const result = await exportMutation.mutateAsync({
        format: 'csv',
        dataType: 'sales',
        dateRange: exportRange
      });
      
      if (result) {
        // Create download link
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Export downloaded successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleManualRefresh = async () => {
    if (!vendorId) return;
    
    try {
      await invalidateMutation.mutateAsync(vendorId);
      toast.success('Data refreshed');
    } catch (error) {
      toast.error('Failed to refresh data');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NGN',
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

  // Format last update time
  const getLastUpdateText = () => {
    if (!dataUpdatedAt) return '';
    const seconds = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (seconds < 60) return `Updated ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Updated ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `Updated ${hours}h ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnalyticsDashboardSkeleton />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to load analytics
            </h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'There was an error loading your analytics data'}
            </p>
            <Button onClick={handleManualRefresh}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const { sales, orders, products, customers, payouts } = analytics;

  // Count unread notifications
  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1 sm:mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Analytics Dashboard
                </h1>
                {/* Real-time indicator - Requirement 10.2 */}
                <div className="flex items-center gap-2">
                  {isFetching ? (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Updating
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                      <Wifi className="h-3 w-3 mr-1" />
                      Live
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                  Track your business performance and insights
                </p>
                {dataUpdatedAt && (
                  <span className="text-xs text-gray-500">
                    • {getLastUpdateText()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                showComparison={false}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={invalidateMutation.isPending}
                className="border-gray-300 hover:bg-gray-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${invalidateMutation.isPending ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {!isMobile && (
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={exportMutation.isPending}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* New Orders Alert - Requirement 10.5 */}
        {recentOrders && recentOrders.length > 0 && (
          <Card className="border-blue-200 bg-blue-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">
                      {recentOrders.length} new order{recentOrders.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-blue-700">
                      Just received - analytics updated in real-time
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/vendor/orders')}
                  className="border-blue-300 hover:bg-blue-100"
                >
                  View Orders
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Badge */}
        {unreadCount > 0 && (
          <Card className="border-amber-200 bg-amber-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">
                      {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-amber-700">
                      You have pending alerts and updates
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/vendor/notifications')}
                  className="border-amber-300 hover:bg-amber-100"
                >
                  View All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(sales.totalRevenue)}
            subtitle={
              <div className="flex items-center gap-1">
                {getTrendIcon(sales.revenueChange)}
                <span className={getTrendColor(sales.revenueChange)}>
                  {formatPercentage(sales.revenueChange)} vs previous period
                </span>
              </div>
            }
            icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
            variant={sales.revenueChange >= 0 ? 'accent' : 'default'}
          />

          <MetricCard
            label="Total Orders"
            value={orders.totalOrders.toLocaleString()}
            subtitle={
              <div className="flex items-center gap-1">
                {getTrendIcon(orders.orderChange)}
                <span className={getTrendColor(orders.orderChange)}>
                  {formatPercentage(orders.orderChange)} vs previous period
                </span>
              </div>
            }
            icon={<ShoppingBag className="h-6 w-6 text-blue-600" />}
          />

          <MetricCard
            label="Active Products"
            value={products.activeProducts.toLocaleString()}
            subtitle={`${products.totalProducts} total products`}
            icon={<Package className="h-6 w-6 text-purple-600" />}
          />

          <MetricCard
            label="Total Customers"
            value={customers.totalCustomers.toLocaleString()}
            subtitle={`${customers.newCustomers} new this period`}
            icon={<Users className="h-6 w-6 text-orange-600" />}
          />
        </div>

        {/* Rest of the dashboard content... */}
        {/* (Keep the existing quick links, recommendations, etc.) */}

        {/* Recommendations Widget */}
        {vendorId && (
          <div className="mb-8">
            <RecommendationsWidget vendorId={vendorId} maxItems={3} />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

// Skeleton loading component
function AnalyticsDashboardSkeleton() {
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
            <CardContent className="p-6">
              <Skeleton className="h-6 w-6 mb-2" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-32 mb-1" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
