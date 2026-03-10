/**
 * AI Assistant Analytics Dashboard
 * 
 * Displays analytics and metrics for the AI shopping assistant
 * Shows engagement, conversions, and usage statistics
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, TrendingUp, MessageCircle, ShoppingCart, Users, Clock, Target, Eye, Zap, Activity, BarChart3 } from 'lucide-react';
import { useDateRange } from '@/contexts/DateRangeContext';

interface AnalyticsSummary {
  totalSessions: number;
  totalInteractions: number;
  totalConversions: number;
  conversionRate: number;
  averageMessagesPerSession: number;
  averageSessionDuration: number;
  totalRevenue: number;
  topProducts: Array<{ productId: string; count: number }>;
  topVendors: Array<{ vendorId: string; count: number }>;
}

interface RecentSession {
  sessionId: string;
  userId?: string;
  startedAt: Date;
  lastMessageAt: Date;
  messageCount: number;
  conversions: number;
  totalConversionValue: number;
  isActive: boolean;
}

interface ProductConversionRate {
  productId: string;
  shown: number;
  converted: number;
  conversionRate: number;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [productConversions, setProductConversions] = useState<ProductConversionRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { dateRange } = useDateRange();

  useEffect(() => {
    loadAllAnalytics();
  }, [dateRange]);

  const loadAllAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[AnalyticsDashboard] Loading analytics with date range:', dateRange);

      // Build query params with date range
      const params = new URLSearchParams({ type: 'summary' });
      
      // Add date range filtering
      if (dateRange?.start) {
        params.append('startDate', dateRange.start.toISOString());
      }
      
      if (dateRange?.end) {
        params.append('endDate', dateRange.end.toISOString());
      }

      console.log('[AnalyticsDashboard] Fetching from API...');

      // Load all analytics data in parallel
      const [summaryRes, sessionsRes, conversionsRes] = await Promise.all([
        fetch(`/api/ai-assistant/analytics?${params.toString()}`),
        fetch(`/api/ai-assistant/analytics?type=recent-sessions&limit=10`),
        fetch(`/api/ai-assistant/analytics?type=product-conversion-rates`),
      ]);
      
      console.log('[AnalyticsDashboard] API responses:', {
        summary: summaryRes.status,
        sessions: sessionsRes.status,
        conversions: conversionsRes.status,
      });

      if (!summaryRes.ok || !sessionsRes.ok || !conversionsRes.ok) {
        throw new Error('Failed to load analytics');
      }

      const [summaryData, sessionsData, conversionsData] = await Promise.all([
        summaryRes.json(),
        sessionsRes.json(),
        conversionsRes.json(),
      ]);

      console.log('[AnalyticsDashboard] Parsed responses:', {
        summaryData,
        sessionsCount: sessionsData?.data?.length,
        conversionsCount: conversionsData?.data?.length,
      });

      if (summaryData.success) {
        console.log('[AnalyticsDashboard] Setting analytics:', summaryData.data);
        setAnalytics(summaryData.data);
      } else {
        console.error('[AnalyticsDashboard] Summary data not successful:', summaryData);
      }

      if (sessionsData.success) {
        console.log('[AnalyticsDashboard] Setting recent sessions:', sessionsData.data.length);
        setRecentSessions(sessionsData.data.map((s: any) => ({
          ...s,
          startedAt: new Date(s.startedAt),
          lastMessageAt: new Date(s.lastMessageAt),
        })));
      } else {
        console.error('[AnalyticsDashboard] Sessions data not successful:', sessionsData);
      }

      if (conversionsData.success) {
        console.log('[AnalyticsDashboard] Setting product conversions:', conversionsData.data.length);
        setProductConversions(conversionsData.data.slice(0, 10));
      } else {
        console.error('[AnalyticsDashboard] Conversions data not successful:', conversionsData);
      }
    } catch (err) {
      console.error('[AnalyticsDashboard] Error loading analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadAllAnalytics}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8 text-center text-gray-500">
        No analytics data available
      </div>
    );
  }

  const activeSessions = recentSessions.filter(s => s.isActive).length;
  const avgRevenuePerConversion = analytics.totalConversions > 0 
    ? analytics.totalRevenue / analytics.totalConversions 
    : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSessions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {activeSessions} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalInteractions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.averageMessagesPerSession.toFixed(1)} avg per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.conversionRate.toFixed(1)}% conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(avgRevenuePerConversion)} avg per conversion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(analytics.averageSessionDuration)}</div>
            <p className="text-xs text-muted-foreground">
              Time spent per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.totalSessions > 0 
                ? ((analytics.totalInteractions / analytics.totalSessions) * 100).toFixed(1) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Interaction to session ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Sessions with conversions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Latest AI assistant conversations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent sessions</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.slice(0, 5).map((session) => (
                <div key={session.sessionId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        Session {session.sessionId.slice(0, 8)}...
                      </p>
                      {session.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {session.messageCount} messages • {session.conversions} conversions
                      {session.totalConversionValue > 0 && ` • ${formatCurrency(session.totalConversionValue)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.lastMessageAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.lastMessageAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Engagement Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Product Conversion Performance */}
        {productConversions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Conversion Performance</CardTitle>
              <CardDescription>Products with highest conversion rates from AI recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {productConversions.slice(0, 5).map((product, index) => (
                  <div key={product.productId} className="flex items-center gap-4 p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-sm font-medium text-green-700">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.productId}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.shown} shown • {product.converted} converted
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">
                        {product.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Engagement Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Quality</CardTitle>
            <CardDescription>Measuring conversation effectiveness</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Session Completion Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sessions with conversions
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.conversionRate.toFixed(1)}%
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Avg Messages to Convert</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Efficiency metric
                  </p>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {analytics.totalConversions > 0
                    ? (analytics.totalInteractions / analytics.totalConversions).toFixed(1)
                    : 0}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Active Session Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently engaged users
                  </p>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {recentSessions.length > 0
                    ? ((activeSessions / recentSessions.length) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Avg Value per Session</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Revenue generation
                  </p>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.totalSessions > 0
                    ? formatCurrency(analytics.totalRevenue / analytics.totalSessions)
                    : formatCurrency(0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {analytics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Most frequently added to cart from AI assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.topProducts.slice(0, 5).map((product, index) => {
                const maxCount = analytics.topProducts[0]?.count || 1;
                const percentage = (product.count / maxCount) * 100;
                
                return (
                  <div key={product.productId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-xs font-medium text-purple-700">
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{product.productId}</span>
                      </div>
                      <span className="text-sm font-bold">{product.count} conversions</span>
                    </div>
                    <div className="ml-9">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Vendors */}
      {analytics.topVendors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
            <CardDescription>Most successful vendors through AI assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.topVendors.slice(0, 5).map((vendor, index) => (
                <div key={vendor.vendorId} className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{vendor.vendorId}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{vendor.count}</span>
                    <span className="text-xs text-muted-foreground ml-1">conversions</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Assistant Impact Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            AI Assistant Impact
          </CardTitle>
          <CardDescription>Overall performance and business impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <p className="text-xs font-medium text-muted-foreground">Products Shown</p>
              </div>
              <p className="text-2xl font-bold">
                {productConversions.reduce((sum, p) => sum + p.shown, 0).toLocaleString()}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <p className="text-xs font-medium text-muted-foreground">Avg Conversion Rate</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {productConversions.length > 0
                  ? (productConversions.reduce((sum, p) => sum + p.conversionRate, 0) / productConversions.length).toFixed(1)
                  : 0}%
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <p className="text-xs font-medium text-muted-foreground">Revenue per Session</p>
              </div>
              <p className="text-2xl font-bold">
                {analytics.totalSessions > 0
                  ? formatCurrency(analytics.totalRevenue / analytics.totalSessions)
                  : formatCurrency(0)}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageCircle className="h-4 w-4 text-orange-600" />
                <p className="text-xs font-medium text-muted-foreground">Messages to Conversion</p>
              </div>
              <p className="text-2xl font-bold">
                {analytics.totalConversions > 0
                  ? (analytics.totalInteractions / analytics.totalConversions).toFixed(1)
                  : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
