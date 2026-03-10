'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import MetricCard from '@/components/shared/MetricCard';
import { DateRangePicker, DateRange as DateRangeType } from '@/components/analytics/DateRangePicker';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { OrderFunnelChart } from '@/components/vendor/analytics/OrderFunnelChart';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Clock,
  XCircle,
  ShoppingCart,
  Package,
  AlertTriangle,
  MessageSquare,
  Download
} from 'lucide-react';
import { VendorAnalyticsService } from '@/lib/vendor/analytics-service';
import { OrderMetrics, DateRange } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function OrderAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics | null>(null);
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

  // Fetch order analytics
  useEffect(() => {
    if (!vendorId) return;

    const fetchOrderMetrics = async () => {
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
          setOrderMetrics(response.data.orders);
        } else {
          toast.error(response.error?.message || 'Failed to load order analytics');
        }
      } catch (error) {
        console.error('Error fetching order analytics:', error);
        toast.error('Failed to load order analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderMetrics();
  }, [vendorId, dateRange]);

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  const handleExport = async () => {
    if (!vendorId) return;
    
    try {
      toast.info('Preparing export...');
      const analyticsService = new VendorAnalyticsService();
      const exportRange: DateRange = {
        start: dateRange.start,
        end: dateRange.end
      };
      
      const response = await analyticsService.exportAnalytics(vendorId, {
        format: 'csv',
        dataType: 'orders',
        dateRange: exportRange
      });
      
      if (response.success && response.data) {
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-emerald-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <OrderAnalyticsSkeleton />
        </main>
      </div>
    );
  }

  if (!orderMetrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to load order analytics
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading your order data
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
          <Button
            variant="ghost"
            onClick={() => router.push('/vendor/analytics')}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analytics
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Order Performance
              </h1>
              <p className="text-gray-600 text-lg">
                Track order funnel, fulfillment metrics, and customer behavior
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

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Total Orders"
            value={orderMetrics.totalOrders.toLocaleString()}
            subtitle={`${formatChange(orderMetrics.orderChange)} vs previous period`}
            icon={<Package className="h-6 w-6 text-blue-600" />}
            variant={orderMetrics.orderChange >= 0 ? 'accent' : 'default'}
          />

          <MetricCard
            label="Avg Fulfillment Time"
            value={formatHours(orderMetrics.averageFulfillmentTime)}
            subtitle={`${formatChange(orderMetrics.fulfillmentChange)} vs previous period`}
            icon={<Clock className="h-6 w-6 text-purple-600" />}
          />

          <MetricCard
            label="Cancellation Rate"
            value={formatPercentage(orderMetrics.funnel.ordered > 0 
              ? ((orderMetrics.funnel.ordered - orderMetrics.funnel.paid) / orderMetrics.funnel.ordered) * 100 
              : 0)}
            subtitle={`${(orderMetrics.funnel.ordered - orderMetrics.funnel.paid).toLocaleString()} cancelled orders`}
            icon={<XCircle className="h-6 w-6 text-red-600" />}
            variant={(orderMetrics.funnel.ordered - orderMetrics.funnel.paid) / orderMetrics.funnel.ordered > 0.15 ? 'alert' : 'default'}
          />

          <MetricCard
            label="Abandoned Checkouts"
            value={orderMetrics.abandonedCheckouts.toLocaleString()}
            subtitle={`${formatPercentage(orderMetrics.abandonmentRate)} abandonment rate`}
            icon={<ShoppingCart className="h-6 w-6 text-orange-600" />}
          />
        </div>

        {/* Order Funnel Chart */}
        <div className="mb-8">
          <OrderFunnelChart funnel={orderMetrics.funnel} />
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Return Rate Card */}
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Return Rate</CardTitle>
                  <CardDescription>
                    Percentage of delivered orders returned
                  </CardDescription>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <Package className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {formatPercentage(orderMetrics.returnRate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round((orderMetrics.returnRate / 100) * orderMetrics.funnel.delivered).toLocaleString()} returned orders
                  </p>
                </div>
                
                {orderMetrics.returnRate > 10 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          High Return Rate
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Consider reviewing product quality, descriptions, and sizing information
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Complaint Rate Card */}
          <Card className="border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Complaint Rate</CardTitle>
                  <CardDescription>
                    Percentage of orders with complaints
                  </CardDescription>
                </div>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <MessageSquare className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-4xl font-bold text-gray-900 mb-2">
                    {formatPercentage(orderMetrics.complaintRate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    {Math.round((orderMetrics.complaintRate / 100) * orderMetrics.totalOrders).toLocaleString()} orders with complaints
                  </p>
                </div>
                
                {orderMetrics.complaintRate > 5 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          High Complaint Rate
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Review customer feedback and address common issues promptly
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cancellation Reasons */}
        {orderMetrics.cancellationReasons.length > 0 && (
          <Card className="border-gray-200 mb-8">
            <CardHeader>
              <CardTitle>Top Cancellation Reasons</CardTitle>
              <CardDescription>
                Understanding why customers cancel helps improve the experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {orderMetrics.cancellationReasons.map((reason, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 mb-1">
                        {reason.reason}
                      </p>
                      <p className="text-sm text-gray-600">
                        {reason.count.toLocaleString()} cancellations
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatPercentage(reason.percentage)}
                      </p>
                      <p className="text-xs text-gray-600">of total</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Insights and Recommendations */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orderMetrics.abandonmentRate > 30 && (
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="font-medium text-gray-900 mb-2">
                    High Cart Abandonment
                  </p>
                  <p className="text-sm text-gray-600">
                    Your abandonment rate is {formatPercentage(orderMetrics.abandonmentRate)}. 
                    Consider simplifying checkout, offering multiple payment options, or sending 
                    cart reminder emails.
                  </p>
                </div>
              )}

              {orderMetrics.averageFulfillmentTime > 72 && (
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="font-medium text-gray-900 mb-2">
                    Slow Fulfillment Time
                  </p>
                  <p className="text-sm text-gray-600">
                    Your average fulfillment time is {formatHours(orderMetrics.averageFulfillmentTime)}. 
                    Faster fulfillment improves customer satisfaction and product rankings.
                  </p>
                </div>
              )}

              {(orderMetrics.funnel.ordered - orderMetrics.funnel.paid) / orderMetrics.funnel.ordered > 0.15 && (
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="font-medium text-gray-900 mb-2">
                    High Order Cancellation
                  </p>
                  <p className="text-sm text-gray-600">
                    More than 15% of orders are being cancelled. Review cancellation reasons 
                    and address the most common issues.
                  </p>
                </div>
              )}

              {orderMetrics.returnRate > 10 && (
                <div className="p-4 bg-white rounded-lg border border-blue-200">
                  <p className="font-medium text-gray-900 mb-2">
                    High Return Rate
                  </p>
                  <p className="text-sm text-gray-600">
                    Your return rate is {formatPercentage(orderMetrics.returnRate)}. 
                    Ensure product descriptions, images, and sizing information are accurate.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Skeleton loading component
function OrderAnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div>
        <Skeleton className="h-10 w-32 mb-4" />
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

      {/* Performance Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
