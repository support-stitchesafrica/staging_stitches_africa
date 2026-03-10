'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangePicker, DateRange as DateRangeType } from '@/components/analytics/DateRangePicker';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { MobileBottomNav } from '@/components/vendor/shared/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { analyticsProcessor } from '@/lib/analytics/analytics-processor';
import { ShopActivity } from '@/types/shop-activities';
import {
  Eye,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  Users,
  Package,
  ArrowRight,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface ActivityStats {
  totalViews: number;
  totalAddToCarts: number;
  totalPurchases: number;
  totalRevenue: number;
  conversionRate: number;
  addToCartRate: number;
  cartConversionRate: number;
}

interface ActivityTrend {
  date: string;
  views: number;
  addToCarts: number;
  purchases: number;
}

interface RecentActivity extends ShopActivity {
  productName?: string;
}

export default function ActivityAnalyticsDashboard() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeType>(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(start.getDate() - 6); // Last 7 days
    start.setHours(0, 0, 0, 0);
    return { start, end };
  });

  const [stats, setStats] = useState<ActivityStats>({
    totalViews: 0,
    totalAddToCarts: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    conversionRate: 0,
    addToCartRate: 0,
    cartConversionRate: 0
  });

  const [trendData, setTrendData] = useState<ActivityTrend[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [selectedActivityType, setSelectedActivityType] = useState<'all' | 'view' | 'add_to_cart' | 'purchase'>('all');

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

  // Fetch activity data
  useEffect(() => {
    if (!vendorId) return;

    const fetchActivityData = async () => {
      setLoading(true);
      try {
        // Fetch vendor analytics summary
        const summary = await analyticsProcessor.processVendorActivities(vendorId, {
          start: dateRange.start,
          end: dateRange.end
        });

        // Update stats
        setStats({
          totalViews: summary.totalViews,
          totalAddToCarts: summary.totalAddToCarts,
          totalPurchases: summary.totalPurchases,
          totalRevenue: summary.totalRevenue,
          conversionRate: summary.conversionRate,
          addToCartRate: summary.totalViews > 0 ? (summary.totalAddToCarts / summary.totalViews) * 100 : 0,
          cartConversionRate: summary.totalAddToCarts > 0 ? (summary.totalPurchases / summary.totalAddToCarts) * 100 : 0
        });

        // Generate trend data (daily breakdown)
        const trends = await generateTrendData(vendorId, dateRange);
        setTrendData(trends);

        // Fetch recent activities
        const activities = await fetchRecentActivities(vendorId, 20);
        setRecentActivities(activities);

      } catch (error) {
        console.error('Failed to fetch activity data:', error);
        toast.error('Failed to load activity data');
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [vendorId, dateRange]);

  const generateTrendData = async (vendorId: string, range: DateRangeType): Promise<ActivityTrend[]> => {
    const trends: ActivityTrend[] = [];
    const daysDiff = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(range.start);
      date.setDate(date.getDate() + i);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const daySummary = await analyticsProcessor.processVendorActivities(vendorId, {
        start: dayStart,
        end: dayEnd
      });

      trends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        views: daySummary.totalViews,
        addToCarts: daySummary.totalAddToCarts,
        purchases: daySummary.totalPurchases
      });
    }

    return trends;
  };

  const fetchRecentActivities = async (vendorId: string, limit: number): Promise<RecentActivity[]> => {
    // This would fetch from Firestore in a real implementation
    // For now, return empty array
    return [];
  };

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  const handleExport = async () => {
    toast.info('Preparing export...');
    // Export logic would go here
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'add_to_cart':
        return <ShoppingCart className="h-4 w-4" />;
      case 'purchase':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'view':
        return 'bg-blue-100 text-blue-700';
      case 'add_to_cart':
        return 'bg-purple-100 text-purple-700';
      case 'purchase':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case 'view':
        return 'Product View';
      case 'add_to_cart':
        return 'Added to Cart';
      case 'purchase':
        return 'Purchase';
      case 'remove_from_cart':
        return 'Removed from Cart';
      case 'search':
        return 'Search';
      default:
        return type;
    }
  };

  // Prepare funnel data
  const funnelData = [
    { name: 'Views', value: stats.totalViews, fill: '#3b82f6' },
    { name: 'Add to Cart', value: stats.totalAddToCarts, fill: '#8b5cf6' },
    { name: 'Purchases', value: stats.totalPurchases, fill: '#10b981' }
  ];

  // Prepare breakdown data for pie chart
  const breakdownData = [
    { name: 'Views', value: stats.totalViews, color: '#3b82f6' },
    { name: 'Add to Cart', value: stats.totalAddToCarts, color: '#8b5cf6' },
    { name: 'Purchases', value: stats.totalPurchases, color: '#10b981' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ActivityDashboardSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <ModernNavbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Activity Analytics
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Real-time customer activity tracking and insights
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Views
                </CardTitle>
                <div className="p-2 rounded-lg bg-blue-50">
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalViews.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Product page views
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Add to Cart
                </CardTitle>
                <div className="p-2 rounded-lg bg-purple-50">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalAddToCarts.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatPercentage(stats.addToCartRate)} of views
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Purchases
                </CardTitle>
                <div className="p-2 rounded-lg bg-green-50">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalPurchases.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {formatPercentage(stats.conversionRate)} conversion
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Revenue
                </CardTitle>
                <div className="p-2 rounded-lg bg-emerald-50">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                From tracked activities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                View to Cart Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {formatPercentage(stats.addToCartRate)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalAddToCarts} of {stats.totalViews} views
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Cart to Purchase Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {formatPercentage(stats.cartConversionRate)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalPurchases} of {stats.totalAddToCarts} carts
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Overall Conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {formatPercentage(stats.conversionRate)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalPurchases} of {stats.totalViews} views
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Activity Trend Chart */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Activity Trends</CardTitle>
              <CardDescription>
                Daily breakdown of customer activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Views"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="addToCarts" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    name="Add to Cart"
                    dot={{ fill: '#8b5cf6', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="purchases" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Purchases"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Breakdown */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle>Activity Breakdown</CardTitle>
              <CardDescription>
                Distribution by activity type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <Card className="border-gray-200 mb-6">
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>
              Customer journey from view to purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Visual Funnel */}
              <div className="flex flex-col gap-2">
                <div className="relative">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-3">
                      <Eye className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Product Views</p>
                        <p className="text-sm text-gray-600">Initial interest</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalViews.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">100%</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 z-10">
                    <ArrowRight className="h-6 w-6 text-gray-400 rotate-90" />
                  </div>
                </div>

                <div className="relative ml-8">
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-3">
                      <ShoppingCart className="h-6 w-6 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Add to Cart</p>
                        <p className="text-sm text-gray-600">Intent to purchase</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">
                        {stats.totalAddToCarts.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPercentage(stats.addToCartRate)}
                      </p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 z-10">
                    <ArrowRight className="h-6 w-6 text-gray-400 rotate-90" />
                  </div>
                </div>

                <div className="ml-16">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Purchases</p>
                        <p className="text-sm text-gray-600">Completed orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {stats.totalPurchases.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatPercentage(stats.conversionRate)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Funnel Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    Drop-off: View to Cart
                  </p>
                  <p className="text-2xl font-bold text-amber-700">
                    {formatPercentage(100 - stats.addToCartRate)}
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    {(stats.totalViews - stats.totalAddToCarts).toLocaleString()} customers didn't add to cart
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-900 mb-1">
                    Drop-off: Cart to Purchase
                  </p>
                  <p className="text-2xl font-bold text-red-700">
                    {formatPercentage(100 - stats.cartConversionRate)}
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    {(stats.totalAddToCarts - stats.totalPurchases).toLocaleString()} abandoned carts
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Activity Feed */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Real-time Activity Feed</CardTitle>
                <CardDescription>
                  Recent customer interactions with your products
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Activity className="h-3 w-3 mr-1 animate-pulse" />
                  Live
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedActivityType} onValueChange={(value: any) => setSelectedActivityType(value)}>
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="view">Views</TabsTrigger>
                <TabsTrigger value="add_to_cart">Cart</TabsTrigger>
                <TabsTrigger value="purchase">Purchases</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedActivityType} className="space-y-3">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">No recent activities</p>
                    <p className="text-sm text-gray-500">
                      Activities will appear here as customers interact with your products
                    </p>
                  </div>
                ) : (
                  recentActivities
                    .filter(activity => selectedActivityType === 'all' || activity.type === selectedActivityType)
                    .map((activity, index) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {getActivityLabel(activity.type)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.productName || `Product ${activity.productId?.substring(0, 8)}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(activity.timestamp.toDate()).toLocaleTimeString()}
                            </span>
                          </div>
                          {activity.metadata.price && (
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {formatCurrency(activity.metadata.price)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Insights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Key Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  View Performance
                </p>
                <p className="text-sm text-blue-700">
                  Your products received {stats.totalViews.toLocaleString()} views in the selected period.
                  {stats.totalViews > 100 && " Great visibility!"}
                </p>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Cart Engagement
                </p>
                <p className="text-sm text-purple-700">
                  {formatPercentage(stats.addToCartRate)} of viewers added products to cart.
                  {stats.addToCartRate > 5 ? " Above average!" : " Consider improving product descriptions."}
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-1">
                  Conversion Success
                </p>
                <p className="text-sm text-green-700">
                  {formatPercentage(stats.conversionRate)} conversion rate from views to purchases.
                  {stats.conversionRate > 2 ? " Excellent performance!" : " Room for improvement."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.addToCartRate < 5 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    Improve Add-to-Cart Rate
                  </p>
                  <p className="text-sm text-amber-700">
                    Your add-to-cart rate is below average. Consider improving product images, descriptions, and pricing.
                  </p>
                </div>
              )}

              {stats.cartConversionRate < 30 && stats.totalAddToCarts > 0 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-900 mb-1">
                    Reduce Cart Abandonment
                  </p>
                  <p className="text-sm text-red-700">
                    Many customers are abandoning their carts. Review your checkout process and shipping costs.
                  </p>
                </div>
              )}

              {stats.conversionRate > 2 && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Strong Performance
                  </p>
                  <p className="text-sm text-green-700">
                    Your conversion rate is excellent! Keep up the good work with product quality and customer service.
                  </p>
                </div>
              )}

              {stats.totalViews < 50 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Increase Visibility
                  </p>
                  <p className="text-sm text-blue-700">
                    Your products need more visibility. Optimize titles, tags, and consider promotional campaigns.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

// Skeleton loading component
function ActivityDashboardSkeleton() {
  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Metrics Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Funnel Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>

      {/* Activity Feed Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
