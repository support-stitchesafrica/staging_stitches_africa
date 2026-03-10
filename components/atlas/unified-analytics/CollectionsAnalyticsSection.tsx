'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  Eye, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  MapPin, 
  Package,
  RefreshCw,
  Download,
  ExternalLink,
  DollarSign,
  Layers
} from 'lucide-react';
import { AtlasRole, ROLE_PERMISSIONS } from '@/lib/atlas/types';
import { DateRange } from '@/lib/atlas/unified-analytics/types';
import LoadingSpinner from '@/components/LoadingSpinner';

interface CollectionsAnalyticsSectionProps {
  dateRange: DateRange;
  userRole: AtlasRole;
}

interface CollectionsDashboardData {
  totalCollections: number;
  totalViews: number;
  totalAddToCarts: number;
  totalPurchases: number;
  totalRevenue: number;
  topCollections: {
    collectionId: string;
    collectionName: string;
    views: number;
    purchases: number;
    revenue: number;
  }[];
  recentActivity: {
    date: string;
    views: number;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }[];
  topProducts: {
    productId: string;
    productName: string;
    collectionId: string;
    collectionName: string;
    addToCarts: number;
    purchases: number;
    revenue: number;
  }[];
  topCustomers: {
    userId: string;
    userName?: string;
    userEmail?: string;
    collectionsViewed: number;
    totalPurchases: number;
    totalSpent: number;
    location?: {
      country: string;
      state: string;
    };
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const CollectionsAnalyticsSection: React.FC<CollectionsAnalyticsSectionProps> = ({
  dateRange,
  userRole
}) => {
  const [data, setData] = useState<CollectionsDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [viewMoreSection, setViewMoreSection] = useState<string | null>(null);

  // Check if user has access to collections analytics
  const hasAccess = ROLE_PERMISSIONS[userRole]?.dashboards.includes('/atlas/collections-analytics');

  // Fetch analytics data
  const fetchAnalytics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      const params = new URLSearchParams();
      params.append('type', 'dashboard');
      if (dateRange?.from) params.append('startDate', dateRange.from.toISOString());
      if (dateRange?.to) params.append('endDate', dateRange.to.toISOString());

      const response = await fetch(`/api/collections/analytics?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchAnalytics();
    }
  }, [dateRange, hasAccess]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!hasAccess) return;
    
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [dateRange, hasAccess]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      // Create export data
      const exportData = {
        timestamp: new Date().toISOString(),
        period: {
          start: dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          end: dateRange?.to || new Date()
        },
        data
      };

      const blob = new Blob([
        format === 'csv' 
          ? convertToCSV(exportData) 
          : JSON.stringify(exportData, null, 2)
      ], { 
        type: format === 'csv' ? 'text/csv' : 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `collections-analytics-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const convertToCSV = (data: any): string => {
    // Simple CSV conversion for collections data
    const headers = ['Collection Name', 'Views', 'Purchases', 'Revenue'];
    const rows = data.data?.topCollections?.map((collection: any) => [
      collection.collectionName,
      collection.views,
      collection.purchases,
      collection.revenue.toFixed(2)
    ]) || [];
    
    return [headers, ...rows]
      .map(row => row.map((field: any) => `"${field}"`).join(','))
      .join('\n');
  };

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              You don't have permission to access collections analytics. 
              Contact your administrator if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading collections analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchAnalytics()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  // Check if we have any real data
  const hasRealData = data.totalViews > 0 || data.totalAddToCarts > 0 || data.totalPurchases > 0;

  // Prepare chart data
  const activityChartData = data.recentActivity.map(activity => ({
    date: new Date(activity.date).toLocaleDateString(),
    views: activity.views,
    addToCarts: activity.addToCarts,
    purchases: activity.purchases,
    revenue: activity.revenue
  }));

  const collectionsChartData = data.topCollections.slice(0, 8).map(collection => ({
    name: collection.collectionName.length > 20 
      ? collection.collectionName.substring(0, 20) + '...' 
      : collection.collectionName,
    views: collection.views,
    purchases: collection.purchases,
    revenue: collection.revenue
  }));

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Layers className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Collections Analytics</h2>
            <p className="text-gray-600">Track collection performance and user engagement</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchAnalytics(true)}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => handleExport('csv')}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Live Data Indicator */}
      <div className={`p-4 rounded-lg border ${hasRealData 
        ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' 
        : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${hasRealData 
            ? 'bg-green-500 animate-pulse' 
            : 'bg-yellow-500'
          }`}></div>
          <span className={`text-sm font-medium ${hasRealData 
            ? 'text-green-900' 
            : 'text-yellow-900'
          }`}>
            {hasRealData ? 'Live Data' : 'Getting Started'}
          </span>
        </div>
        <p className={`text-sm ${hasRealData 
          ? 'text-green-700' 
          : 'text-yellow-700'
        }`}>
          {hasRealData 
            ? 'Real-time analytics with automatic refresh every 60 seconds. Includes collection views, user engagement, and purchase tracking.'
            : 'No collection analytics data yet. Start by visiting collection pages or implementing tracking to see real-time data here.'
          }
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalCollections.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Active collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Collection page views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Add to Cart</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalAddToCarts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Items added from collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Items purchased from collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Revenue from collections
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="overview"
            className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="collections"
            className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            Collections
          </TabsTrigger>
          <TabsTrigger 
            value="products"
            className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            Products
          </TabsTrigger>
          <TabsTrigger 
            value="customers"
            className="data-[state=active]:bg-white data-[state=active]:text-black data-[state=active]:shadow-sm"
          >
            Customers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {hasRealData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Daily collection engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={activityChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="views" stackId="1" stroke="#0088FE" fill="#0088FE" />
                      <Area type="monotone" dataKey="addToCarts" stackId="1" stroke="#00C49F" fill="#00C49F" />
                      <Area type="monotone" dataKey="purchases" stackId="1" stroke="#FFBB28" fill="#FFBB28" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Collections Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Collections by Revenue</CardTitle>
                  <CardDescription>Best performing collections</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={collectionsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#8884D8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-600" />
                  Getting Started with Collections Analytics
                </CardTitle>
                <CardDescription>
                  Start collecting real-time analytics data for your product collections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">What We Track</h4>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-purple-500" />
                        Collection page views and engagement
                      </li>
                      <li className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        Product views within collections
                      </li>
                      <li className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-green-500" />
                        Add to cart events from collections
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        Purchase conversions and revenue
                      </li>
                      <li className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        User location and demographics
                      </li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">How to Start</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>1. Visit collection pages to generate view events</p>
                      <p>2. Click on products within collections</p>
                      <p>3. Add collection products to cart</p>
                      <p>4. Complete purchases from collections</p>
                      <p className="text-purple-600 font-medium">
                        Analytics will appear here automatically!
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    <strong>Current Status:</strong> Found {data.totalCollections} collections in the system. 
                    Start interacting with collections to see analytics data.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Collections</CardTitle>
                <CardDescription>Best performing collections by revenue and engagement</CardDescription>
              </div>
              {data.topCollections.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMoreSection(viewMoreSection === 'collections' ? null : 'collections')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {viewMoreSection === 'collections' ? 'Show Less' : 'View More'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {data.topCollections.length > 0 ? (
                <div className="space-y-3">
                  {data.topCollections
                    .slice(0, viewMoreSection === 'collections' ? data.topCollections.length : 5)
                    .map((collection, index) => (
                    <div key={collection.collectionId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{collection.collectionName}</p>
                          <p className="text-sm text-gray-600">ID: {collection.collectionId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${collection.revenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {collection.views} views • {collection.purchases} purchases
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Collection Data Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Collection performance data will appear here once users start viewing and interacting with collections.
                  </p>
                  <p className="text-sm text-gray-500">
                    Found {data.totalCollections} collections in the system ready for tracking.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Products from Collections</CardTitle>
                <CardDescription>Best selling products across all collections</CardDescription>
              </div>
              {data.topProducts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMoreSection(viewMoreSection === 'products' ? null : 'products')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {viewMoreSection === 'products' ? 'Show Less' : 'View More'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {data.topProducts.length > 0 ? (
                <div className="space-y-3">
                  {data.topProducts
                    .slice(0, viewMoreSection === 'products' ? data.topProducts.length : 8)
                    .map((product, index) => (
                    <div key={`${product.productId}-${product.collectionId}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-gray-600">
                            From: {product.collectionName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${product.revenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {product.addToCarts} carts • {product.purchases} purchases
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Product Data Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Product performance data from collections will appear here once users start interacting with products.
                  </p>
                  <p className="text-sm text-gray-500">
                    Start by viewing products within collections to generate analytics data.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Most active customers in collections</CardDescription>
              </div>
              {data.topCustomers.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMoreSection(viewMoreSection === 'customers' ? null : 'customers')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {viewMoreSection === 'customers' ? 'Show Less' : 'View More'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {data.topCustomers.length > 0 ? (
                <div className="space-y-3">
                  {data.topCustomers
                    .slice(0, viewMoreSection === 'customers' ? data.topCustomers.length : 10)
                    .map((customer, index) => (
                    <div key={customer.userId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {(customer.userName || customer.userEmail || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {customer.userName || customer.userEmail || `User ${customer.userId.slice(-6)}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {customer.location ? `${customer.location.state}, ${customer.location.country}` : 'Location unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${customer.totalSpent.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {customer.collectionsViewed} collections • {customer.totalPurchases} purchases
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Customer Data Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Customer analytics data will appear here once users start viewing and purchasing from collections.
                  </p>
                  <p className="text-sm text-gray-500">
                    Customer interactions with collections will be tracked automatically.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};