'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
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
  Area,
  AreaChart
} from 'recharts';
import { 
  Eye, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  MapPin, 
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface EnhancedBogoAnalyticsProps {
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface ComprehensiveAnalyticsData {
  totalActivePromos: number;
  totalViews: number;
  totalAddToCarts: number;
  totalRedemptions: number;
  locationData: {
    country: string;
    state: string;
    city?: string;
    viewCount: number;
    addToCartCount: number;
    redemptionCount: number;
  }[];
  customerList: {
    userId: string;
    email?: string;
    name?: string;
    location?: {
      country: string;
      state: string;
      city?: string;
    };
    viewCount: number;
    addToCartCount: number;
    redemptionCount: number;
    totalSpent: number;
    firstView: Date;
    lastActivity: Date;
  }[];
  conversionFunnel: {
    views: number;
    addToCarts: number;
    redemptions: number;
    viewToCartRate: number;
    cartToRedemptionRate: number;
    overallConversionRate: number;
  };
  topPerformingMappings: {
    mappingId: string;
    mainProductName: string;
    redemptions: number;
    revenue: number;
  }[];
  recentActivity: {
    date: string;
    redemptions: number;
    revenue: number;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const EnhancedBogoAnalytics: React.FC<EnhancedBogoAnalyticsProps> = ({
  dateRange
}) => {
  const [data, setData] = useState<ComprehensiveAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMapping, setSelectedMapping] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch comprehensive analytics data
  const fetchAnalytics = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      else setLoading(true);
      
      setError(null);

      const params = new URLSearchParams();
      
      // Validate and format dates
      if (dateRange?.start) {
        const startDate = new Date(dateRange.start);
        if (!isNaN(startDate.getTime())) {
          params.append('startDate', startDate.toISOString());
        } else {
          console.warn('Invalid start date:', dateRange.start);
        }
      }
      
      if (dateRange?.end) {
        const endDate = new Date(dateRange.end);
        if (!isNaN(endDate.getTime())) {
          params.append('endDate', endDate.toISOString());
        } else {
          console.warn('Invalid end date:', dateRange.end);
        }
      }
      
      if (selectedMapping !== 'all') params.append('mappingId', selectedMapping);
      params.append('type', 'comprehensive');

      console.log('Fetching BOGO analytics with params:', params.toString());

      const response = await fetch(`/api/bogo/analytics?${params}`);
      const result = await response.json();

      console.log('BOGO analytics response:', result);

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch analytics data');
      }
    } catch (err) {
      console.error('BOGO analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Network error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedMapping]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [dateRange, selectedMapping]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const exportData = {
        action: 'export',
        format,
        dateRange: {
          start: dateRange?.start?.toISOString() || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: dateRange?.end?.toISOString() || new Date().toISOString()
        },
        includeDetails: true
      };

      const response = await fetch('/api/bogo/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Create download link
        const blob = new Blob([result.data], { 
          type: format === 'csv' ? 'text/csv' : 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `bogo-analytics.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Loading comprehensive BOGO analytics...</p>
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

  // Prepare chart data
  const funnelData = [
    { name: 'Views', value: data.conversionFunnel.views, color: '#0088FE' },
    { name: 'Add to Cart', value: data.conversionFunnel.addToCarts, color: '#00C49F' },
    { name: 'Redemptions', value: data.conversionFunnel.redemptions, color: '#FFBB28' }
  ];

  const locationChartData = data.locationData.slice(0, 10).map(location => ({
    name: `${location.city || location.state}, ${location.country}`,
    views: location.viewCount,
    carts: location.addToCartCount,
    redemptions: location.redemptionCount
  }));

  const activityChartData = data.recentActivity.map(activity => ({
    date: new Date(activity.date).toLocaleDateString(),
    redemptions: activity.redemptions,
    revenue: activity.revenue
  }));

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced BOGO Analytics</h2>
          <p className="text-gray-600">Real-time tracking and comprehensive insights</p>
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
          
          <Select value={selectedMapping} onValueChange={setSelectedMapping}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select promotion" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Promotions</SelectItem>
              {data.topPerformingMappings.map(mapping => (
                <SelectItem key={mapping.mappingId} value={mapping.mappingId}>
                  {mapping.mainProductName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {data.totalActivePromos} active promotions
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
              {data.conversionFunnel.viewToCartRate.toFixed(1)}% conversion from views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redemptions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRedemptions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.conversionFunnel.overallConversionRate.toFixed(1)}% overall conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customerList.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Unique users with activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey through BOGO promotions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={funnelData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Daily redemptions and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="redemptions" stackId="1" stroke="#0088FE" fill="#0088FE" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Location Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Locations by Activity</CardTitle>
                <CardDescription>Geographic distribution of BOGO engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={locationChartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#0088FE" />
                    <Bar dataKey="carts" fill="#00C49F" />
                    <Bar dataKey="redemptions" fill="#FFBB28" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Location Table */}
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Detailed breakdown by region</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.locationData.slice(0, 15).map((location, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {location.city ? `${location.city}, ` : ''}{location.state}
                          </p>
                          <p className="text-sm text-gray-600">{location.country}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{location.redemptionCount} redemptions</p>
                        <p className="text-sm text-gray-600">{location.viewCount} views</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Most active users in BOGO promotions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data.customerList.slice(0, 20).map((customer, index) => (
                  <div key={customer.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {(customer.name || customer.email || 'U').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {customer.name || customer.email || `User ${customer.userId.slice(-6)}`}
                        </p>
                        <p className="text-sm text-gray-600">
                          {customer.location ? `${customer.location.city || customer.location.state}, ${customer.location.country}` : 'Location unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${customer.totalSpent.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {customer.redemptionCount} redemptions • {customer.viewCount} views
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Promotions</CardTitle>
              <CardDescription>Best performing BOGO campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topPerformingMappings.map((mapping, index) => (
                  <div key={mapping.mappingId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{mapping.mainProductName}</p>
                        <p className="text-sm text-gray-600">ID: {mapping.mappingId}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${mapping.revenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{mapping.redemptions} redemptions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};