'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Target
} from 'lucide-react';
import { VendorAnalytics, DateRange } from '@/types/vendor-analytics';
import { toast } from 'sonner';
import { useVendorAnalytics } from '@/lib/vendor/useVendorAnalytics';
import { IndexBuildingNotice } from '@/components/vendor/analytics/IndexBuildingNotice';
import { MobileBottomNav } from '@/components/vendor/shared/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { VendorAnalyticsService } from '@/lib/vendor/analytics-service';

export default function AnalyticsDashboard() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
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

  // Use the existing optimized hook
  const { data: vendorData, loading: vendorLoading, error: vendorError } = useVendorAnalytics(vendorId || '');

  // Debug logging
  useEffect(() => {
    console.log('🔍 Analytics Debug:', {
      vendorId,
      hasVendorData: !!vendorData,
      vendorLoading,
      vendorError,
      vendorData
    });
  }, [vendorId, vendorData, vendorLoading, vendorError]);

  // Fetch analytics data
  useEffect(() => {
    if (!vendorId) {
      console.log('⚠️ No vendor ID');
      return;
    }
    
    if (vendorLoading) {
      console.log('⏳ Still loading vendor data...');
      return;
    }
    
    if (vendorError) {
      console.error('❌ Vendor data error:', vendorError);
      setLoading(false);
      return;
    }
    
    if (!vendorData) {
      console.log('⚠️ No vendor data yet');
      return;
    }

    console.log('✅ Vendor data received, transforming...', vendorData);
    setLoading(true);
    try {
      // Transform the data from useVendorAnalytics to match VendorAnalytics type
      const transformedAnalytics: VendorAnalytics = {
        vendorId,
        period: {
          start: dateRange.start,
          end: dateRange.end,
          preset: '30days'
        },
        sales: {
          totalRevenue: vendorData.metrics.totalRevenue,
          revenueChange: 0, // Calculate from previous period if needed
          averageOrderValue: vendorData.metrics.averageOrderValue,
          aovChange: 0,
          topCategories: [],
          revenueByProduct: [],
          salesTrend: [],
          completedOrders: vendorData.metrics.completedOrders,
          cancelledOrders: vendorData.metrics.cancelledOrders,
          cancellationRate: (vendorData.metrics.cancelledOrders / vendorData.metrics.totalOrders) * 100 || 0,
          paymentMethods: []
        },
        orders: {
          totalOrders: vendorData.metrics.totalOrders,
          orderChange: 0,
          funnel: {
            viewed: 0,
            addedToCart: 0,
            ordered: vendorData.metrics.totalOrders,
            paid: vendorData.metrics.completedOrders,
            delivered: vendorData.metrics.completedOrders
          },
          averageFulfillmentTime: 0,
          fulfillmentChange: 0,
          cancellationReasons: [],
          abandonedCheckouts: 0,
          abandonmentRate: 0,
          returnRate: 0,
          complaintRate: 0
        },
        products: {
          totalProducts: vendorData.metrics.totalProducts,
          activeProducts: vendorData.products.length,
          outOfStock: vendorData.products.filter(p => (p.stock || 0) === 0).length,
          lowStock: vendorData.products.filter(p => (p.stock || 0) > 0 && (p.stock || 0) < 10).length,
          topPerformers: [],
          underPerformers: [],
          trendingProducts: []
        },
        customers: {
          totalCustomers: vendorData.metrics.totalCustomers,
          newCustomers: 0,
          returningCustomers: 0,
          frequentBuyers: 0,
          highValueCustomers: 0,
          segments: [],
          locationInsights: [],
          purchaseBehavior: [],
          averageLifetimeValue: 0,
          ratingTrends: []
        },
        payouts: {
          pendingBalance: vendorData.metrics.pendingBalance,
          availableBalance: vendorData.metrics.availableBalance,
          nextPayoutDate: new Date(),
          nextPayoutAmount: 0,
          totalEarnings: vendorData.metrics.totalRevenue,
          totalFees: 0,
          payoutHistory: [],
          calendar: []
        },
        store: {
          engagementScore: 0,
          searchAppearances: 0,
          profileVisits: 0,
          followerCount: 0,
          categoryPerformance: [],
          rankingVsSimilarStores: 0,
          suggestions: []
        },
        updatedAt: new Date()
      };

      console.log('✅ Analytics transformed:', transformedAnalytics);
      setAnalytics(transformedAnalytics);
    } catch (error) {
      console.error('❌ Error transforming analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [vendorId, vendorData, dateRange, vendorLoading]);

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  const handleExport = async () => {
    if (!vendorId || !analytics) return;
    
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
          <AnalyticsDashboardSkeleton />
        </main>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <IndexBuildingNotice 
            onRetry={() => {
              setRetrying(true);
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }}
            isRetrying={retrying}
          />
          <div className="text-center py-8">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Your basic vendor data is still available in other sections
              </p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/vendor/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { sales, orders, products, customers, payouts } = analytics;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                Track your business performance and insights
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                showComparison={false}
              />
              {!isMobile && (
                <Button
                  variant="outline"
                  onClick={handleExport}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <MetricCard
            label="Total Revenue"
            value={formatCurrency(sales.totalRevenue)}
            subtitle={`${formatPercentage(sales.revenueChange)} vs previous period`}
            icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
            variant={sales.revenueChange >= 0 ? 'accent' : 'default'}
          />

          <MetricCard
            label="Total Orders"
            value={orders.totalOrders.toLocaleString()}
            subtitle={`${formatPercentage(orders.orderChange)} vs previous period`}
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

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Order Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(sales.averageOrderValue)}
                </p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(sales.aovChange)}
                  <span className={`text-sm ${getTrendColor(sales.aovChange)}`}>
                    {formatPercentage(sales.aovChange)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Fulfillment Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {orders.averageFulfillmentTime.toFixed(1)}h
                </p>
                <div className="flex items-center gap-1">
                  {getTrendIcon(-orders.fulfillmentChange)}
                  <span className={`text-sm ${getTrendColor(-orders.fulfillmentChange)}`}>
                    {formatPercentage(orders.fulfillmentChange)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cancellation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {sales.cancellationRate.toFixed(1)}%
                </p>
                <span className="text-sm text-gray-600">
                  {sales.cancelledOrders} cancelled
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/analytics/sales')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Sales Analytics</CardTitle>
              <CardDescription>
                View detailed sales trends, revenue breakdown, and top products
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/analytics/orders')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Order Performance</CardTitle>
              <CardDescription>
                Track order funnel, fulfillment metrics, and cancellations
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/analytics/activities')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Activity Analytics</CardTitle>
              <CardDescription>
                Real-time customer activity tracking and conversion insights
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/products')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                  <Package className="h-6 w-6 text-purple-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Product Analytics</CardTitle>
              <CardDescription>
                Analyze product performance, rankings, and visibility
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/customers')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Customer Insights</CardTitle>
              <CardDescription>
                Understand customer segments, behavior, and lifetime value
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/payouts')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Payouts</CardTitle>
              <CardDescription>
                View payout history, balance, and transaction details
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/analytics/payments')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Payment Insights</CardTitle>
              <CardDescription>
                Analyze payment methods, success rates, and customer preferences
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/inventory')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <PieChart className="h-6 w-6 text-amber-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Inventory</CardTitle>
              <CardDescription>
                Monitor stock levels, alerts, and fulfillment performance
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/analytics/store')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <Activity className="h-6 w-6 text-indigo-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Store Visibility</CardTitle>
              <CardDescription>
                Track your marketplace presence and performance rankings
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/analytics/comparison')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                  <Calendar className="h-6 w-6 text-cyan-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Comparisons</CardTitle>
              <CardDescription>
                Compare performance across periods and years
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => router.push('/vendor/goals')}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-pink-50 border border-pink-200">
                  <Target className="h-6 w-6 text-pink-600" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">Goals</CardTitle>
              <CardDescription>
                Set and track performance goals for your business
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations Widget */}
        {vendorId && (
          <div className="mb-8">
            <RecommendationsWidget vendorId={vendorId} maxItems={3} />
          </div>
        )}

        {/* Pending Actions */}
        {(products.lowStock > 0 || products.outOfStock > 0) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg">Pending Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {products.outOfStock > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                    <div>
                      <p className="font-medium text-gray-900">
                        {products.outOfStock} products out of stock
                      </p>
                      <p className="text-sm text-gray-600">
                        These products are not visible to customers
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/vendor/inventory/alerts')}
                    >
                      View
                    </Button>
                  </div>
                )}
                {products.lowStock > 0 && (
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                    <div>
                      <p className="font-medium text-gray-900">
                        {products.lowStock} products low on stock
                      </p>
                      <p className="text-sm text-gray-600">
                        Restock soon to avoid running out
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/vendor/inventory/alerts')}
                    >
                      View
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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

      {/* Secondary Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Links Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
