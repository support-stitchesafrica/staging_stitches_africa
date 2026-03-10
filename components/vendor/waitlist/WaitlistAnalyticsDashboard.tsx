"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Users,
  Eye,
  Mail,
  MousePointer,
  DollarSign,
  Calendar,
  MapPin,
  Loader2,
  Download,
  RefreshCw,
} from "lucide-react";
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
  Area,
  AreaChart,
} from "recharts";
import { VendorWaitlistAnalytics, CollectionWaitlistAnalytics } from "@/lib/vendor/waitlist-analytics-service";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface WaitlistAnalyticsDashboardProps {
  vendorId: string;
  collectionId?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function WaitlistAnalyticsDashboard({ vendorId, collectionId }: WaitlistAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<VendorWaitlistAnalytics | CollectionWaitlistAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [vendorId, collectionId, period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const periodDays = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      const endDate = new Date();
      const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

      const url = collectionId
        ? `/api/vendor/waitlists/${collectionId}/analytics?periodStart=${startDate.toISOString()}&periodEnd=${endDate.toISOString()}`
        : `/api/vendor/waitlists/analytics?vendorId=${vendorId}&periodStart=${startDate.toISOString()}&periodEnd=${endDate.toISOString()}`;

      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        throw new Error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
  };

  const handleExport = () => {
    if (!analytics) return;
    
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `waitlist-analytics-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Analytics exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
            <p className="text-gray-500">Analytics data will appear once you have collection activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isVendorAnalytics = 'totalCollections' in analytics;
  const vendorAnalytics = isVendorAnalytics ? analytics as VendorWaitlistAnalytics : null;
  const collectionAnalytics = !isVendorAnalytics ? analytics as CollectionWaitlistAnalytics : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            {collectionId ? 'Collection performance metrics' : 'Comprehensive waitlist performance'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {vendorAnalytics && (
          <>
            <MetricCard
              title="Total Collections"
              value={vendorAnalytics.totalCollections}
              icon={<Users className="h-5 w-5" />}
              color="blue"
            />
            <MetricCard
              title="Total Subscriptions"
              value={vendorAnalytics.totalSubscriptions}
              icon={<TrendingUp className="h-5 w-5" />}
              color="green"
            />
            <MetricCard
              title="Total Views"
              value={vendorAnalytics.totalViews}
              icon={<Eye className="h-5 w-5" />}
              color="purple"
            />
            <MetricCard
              title="Avg Conversion Rate"
              value={`${vendorAnalytics.averageConversionRate.toFixed(1)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              color="amber"
            />
          </>
        )}
        
        {collectionAnalytics && (
          <>
            <MetricCard
              title="Total Views"
              value={collectionAnalytics.totalViews}
              icon={<Eye className="h-5 w-5" />}
              color="blue"
            />
            <MetricCard
              title="Total Subscriptions"
              value={collectionAnalytics.totalSubscriptions}
              icon={<Users className="h-5 w-5" />}
              color="green"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${collectionAnalytics.conversionRate.toFixed(1)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              color="purple"
            />
            <MetricCard
              title="Email Open Rate"
              value={`${collectionAnalytics.emailMetrics.openRate.toFixed(1)}%`}
              icon={<Mail className="h-5 w-5" />}
              color="amber"
            />
          </>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
          {vendorAnalytics && <TabsTrigger value="collections">Collections</TabsTrigger>}
          {collectionAnalytics && <TabsTrigger value="subscribers">Subscribers</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {vendorAnalytics && (
            <>
              {/* Activity Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Over Time</CardTitle>
                  <CardDescription>Views and subscriptions trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={vendorAnalytics.recentActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="subscriptions"
                        stackId="2"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Collections */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Collections</CardTitle>
                  <CardDescription>Collections ranked by subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={vendorAnalytics.topCollections.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="collectionName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="subscriptions" fill="#3b82f6" />
                      <Bar dataKey="views" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {collectionAnalytics && (
            <>
              {/* Subscriptions Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>Subscriptions Over Time</CardTitle>
                  <CardDescription>Daily subscription trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={collectionAnalytics.subscriptionsByDate}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Email Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Performance</CardTitle>
                  <CardDescription>Email engagement metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Mail className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {collectionAnalytics.emailMetrics.sent}
                      </p>
                      <p className="text-sm text-gray-600">Sent</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <Eye className="h-6 w-6 mx-auto mb-2 text-green-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {collectionAnalytics.emailMetrics.opened}
                      </p>
                      <p className="text-sm text-gray-600">Opened</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <MousePointer className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {collectionAnalytics.emailMetrics.clicked}
                      </p>
                      <p className="text-sm text-gray-600">Clicked</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                      <p className="text-2xl font-bold text-gray-900">
                        {collectionAnalytics.emailMetrics.clickRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-600">Click Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Engagement Tab */}
        <TabsContent value="engagement" className="space-y-6">
          {vendorAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Email Engagement</CardTitle>
                <CardDescription>Email open and click activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={vendorAnalytics.recentActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="emailOpens"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Email Opens"
                    />
                    <Line
                      type="monotone"
                      dataKey="emailClicks"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Email Clicks"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {collectionAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Detailed engagement breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Email Engagement Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-600">
                      {collectionAnalytics.emailEngagementRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MousePointer className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Click-Through Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-green-600">
                      {collectionAnalytics.clickThroughRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span className="font-medium">Conversion Rate</span>
                    </div>
                    <span className="text-2xl font-bold text-purple-600">
                      {collectionAnalytics.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Subscriptions by Source */}
            <Card>
              <CardHeader>
                <CardTitle>Subscriptions by Source</CardTitle>
                <CardDescription>Traffic source breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={
                        vendorAnalytics
                          ? vendorAnalytics.subscriptionsBySource
                          : collectionAnalytics?.subscriptionsBySource || []
                      }
                      dataKey="count"
                      nameKey="source"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {(vendorAnalytics?.subscriptionsBySource || collectionAnalytics?.subscriptionsBySource || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Location Data */}
            {vendorAnalytics && vendorAnalytics.locationData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Locations</CardTitle>
                  <CardDescription>Subscriptions by location</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {vendorAnalytics.locationData.slice(0, 5).map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">
                              {location.city ? `${location.city}, ` : ''}{location.state}, {location.country}
                            </p>
                            <p className="text-xs text-gray-500">
                              {location.percentage.toFixed(1)}% of total
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-gray-900">{location.subscriptions}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Collections Tab (Vendor Only) */}
        {vendorAnalytics && (
          <TabsContent value="collections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Collection Performance</CardTitle>
                <CardDescription>Detailed metrics for each collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendorAnalytics.topCollections.map((collection, index) => (
                    <div key={collection.collectionId} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{collection.collectionName}</h4>
                          <p className="text-sm text-gray-500">Collection ID: {collection.collectionId}</p>
                        </div>
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Subscriptions</p>
                          <p className="text-xl font-bold text-gray-900">{collection.subscriptions}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Views</p>
                          <p className="text-xl font-bold text-gray-900">{collection.views}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Conversion</p>
                          <p className="text-xl font-bold text-gray-900">
                            {collection.conversionRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Subscribers Tab (Collection Only) */}
        {collectionAnalytics && (
          <TabsContent value="subscribers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Subscribers</CardTitle>
                <CardDescription>Latest subscribers to this collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {collectionAnalytics.topSubscribers.map((subscriber, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{subscriber.fullName}</p>
                        <p className="text-sm text-gray-500">{subscriber.email}</p>
                        {subscriber.location && (
                          <p className="text-xs text-gray-400 mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {subscriber.location.state}, {subscriber.location.country}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{subscriber.source}</p>
                        <p className="text-xs text-gray-400">
                          {formatDistanceToNow(subscriber.subscribedAt, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
