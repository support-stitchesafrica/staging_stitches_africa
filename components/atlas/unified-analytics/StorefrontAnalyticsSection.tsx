'use client';

import React, { useState, useEffect } from 'react';
import { AtlasRole } from '@/lib/atlas/types';
import { DateRange, StorefrontAnalyticsData } from '@/lib/atlas/unified-analytics/types';
import { clientStorefrontAnalyticsService } from '@/lib/atlas/unified-analytics/services/client-storefront-analytics-service';
import  LoadingSpinner  from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Store, Eye, ShoppingCart, Clock, Users, TrendingUp, BarChart3, ArrowUpDown, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export interface StorefrontAnalyticsSectionProps {
  dateRange: DateRange;
  userRole: AtlasRole;
}

/**
 * Presents aggregated storefront performance data
 * Shows storefront metrics, customer journey, and session analytics
 */
export const StorefrontAnalyticsSection: React.FC<StorefrontAnalyticsSectionProps> = ({
  dateRange,
  userRole
}) => {
  const [data, setData] = useState<StorefrontAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'performance' | 'conversion' | 'revenue'>('performance');
  const [sortBy, setSortBy] = useState<'views' | 'conversions' | 'conversionRate' | 'revenue'>('views');

  useEffect(() => {
    loadStorefrontAnalytics();
    
    // Set up real-time subscription
    const unsubscribe = clientStorefrontAnalyticsService.subscribeToStorefrontUpdates(
      dateRange,
      (updatedData) => {
        setData(updatedData);
      }
    );

    // Cleanup subscription on unmount or dependency change
    return () => {
      unsubscribe();
    };
  }, [dateRange, userRole]);

  const loadStorefrontAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the client StorefrontAnalyticsService to get real data
      const analyticsData = await clientStorefrontAnalyticsService.getStorefrontPerformanceMetrics(dateRange);
      
      setData(analyticsData);
      
      // Show success message for real-time data
      toast.success('Storefront analytics loaded', {
        description: 'Real-time data successfully retrieved.'
      });
    } catch (err) {
      console.error('Error loading storefront analytics:', err);
      setError('Failed to load storefront analytics data');
      
      toast.error('Failed to load storefront analytics', {
        description: 'Please check your connection and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getSortedStorefronts = () => {
    if (!data) return [];
    
    return [...data.topPerformingStorefronts].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'conversions':
          return b.conversions - a.conversions;
        case 'conversionRate':
          return b.conversionRate - a.conversionRate;
        case 'revenue':
          return b.revenue - a.revenue;
        default:
          return 0;
      }
    });
  };

  const getPerformanceInsights = () => {
    if (!data) return [];
    
    const insights = [];
    
    // High bounce rate insight
    if (data.sessionAnalytics.bounceRate > 0.5) {
      insights.push({
        type: 'warning',
        title: 'High Bounce Rate Detected',
        description: `Bounce rate of ${(data.sessionAnalytics.bounceRate * 100).toFixed(1)}% indicates visitors are leaving quickly`,
        recommendation: 'Improve page loading speed and content relevance'
      });
    }
    
    // Low conversion rate insight
    if (data.averageConversionRate < 0.03) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Average conversion rate of ${(data.averageConversionRate * 100).toFixed(1)}% is below industry standards`,
        recommendation: 'Optimize checkout process and product presentation'
      });
    }
    
    // Good performance insight
    if (data.sessionAnalytics.pagesPerSession > 4) {
      insights.push({
        type: 'success',
        title: 'Strong User Engagement',
        description: `Users view ${data.sessionAnalytics.pagesPerSession.toFixed(1)} pages per session on average`,
        recommendation: 'Leverage this engagement to increase conversions'
      });
    }
    
    return insights;
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success('Export functionality will be implemented in the next phase');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-ga-primary mb-2">
          Error Loading Data
        </h2>
        <p className="text-ga-secondary mb-4">
          {error || 'Unable to load storefront analytics data'}
        </p>
        <button
          onClick={loadStorefrontAnalytics}
          className="px-4 py-2 bg-ga-blue text-white rounded-lg hover:bg-ga-blue/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ga-primary">Storefront Analytics</h1>
        <p className="text-ga-secondary">
          Performance metrics and customer behavior across all storefronts
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storefronts</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalStorefronts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.aggregatedViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.aggregatedConversions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.averageConversionRate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(data.sessionAnalytics.averageSessionDuration)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data.sessionAnalytics.bounceRate * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages per Session</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.sessionAnalytics.pagesPerSession.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New vs Returning</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-sm">
                <span className="font-semibold">{data.sessionAnalytics.newVsReturningVisitors.new.toLocaleString()}</span> new
              </div>
              <div className="text-sm">
                <span className="font-semibold">{data.sessionAnalytics.newVsReturningVisitors.returning.toLocaleString()}</span> returning
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Storefronts */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Storefronts</CardTitle>
          <CardDescription>
            Storefronts ranked by views, conversions, and revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topPerformingStorefronts.map((storefront, index) => (
              <div key={storefront.storefrontId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-ga-blue/10 text-ga-blue rounded-full font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium text-ga-primary">{storefront.storefrontName}</h3>
                    <p className="text-sm text-ga-secondary">
                      {storefront.views.toLocaleString()} views • {storefront.conversions} conversions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-ga-primary">
                    ${storefront.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-ga-secondary">
                    {(storefront.conversionRate * 100).toFixed(1)}% conversion
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Journey Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Journey Funnel</CardTitle>
          <CardDescription>
            How visitors progress through the purchase funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.customerJourneyMetrics.map((stage, index) => {
              const isLast = index === data.customerJourneyMetrics.length - 1;
              const stageNames = {
                landing: 'Landing Page',
                browsing: 'Product Browsing',
                cart: 'Add to Cart',
                checkout: 'Checkout Process',
                purchase: 'Purchase Complete'
              };
              
              return (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-ga-primary capitalize">
                          {stageNames[stage.stage]}
                        </h3>
                        <p className="text-sm text-ga-secondary">
                          {stage.visitors.toLocaleString()} visitors
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-ga-primary">
                        {(stage.conversionRate * 100).toFixed(1)}%
                      </div>
                      {!isLast && (
                        <div className="text-sm text-red-600">
                          -{(stage.dropOffRate * 100).toFixed(1)}% drop-off
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Funnel visualization bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${stage.conversionRate * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Comparison Tools */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storefront Performance Comparison</CardTitle>
              <CardDescription>
                Compare storefronts across different metrics and identify optimization opportunities
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="views">Views</SelectItem>
                  <SelectItem value="conversions">Conversions</SelectItem>
                  <SelectItem value="conversionRate">Conversion Rate</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getSortedStorefronts().map((storefront, index) => {
              const isTopPerformer = index < 3;
              const conversionRateColor = storefront.conversionRate > 0.03 ? 'text-green-600' : 
                                        storefront.conversionRate > 0.02 ? 'text-yellow-600' : 'text-red-600';
              
              return (
                <div key={storefront.storefrontId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                      isTopPerformer ? 'bg-ga-blue/10 text-ga-blue' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-ga-primary flex items-center">
                        {storefront.storefrontName}
                        {isTopPerformer && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Top Performer
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-ga-secondary">
                        <span>{storefront.views.toLocaleString()} views</span>
                        <span>•</span>
                        <span>{storefront.conversions} conversions</span>
                        <span>•</span>
                        <span className={conversionRateColor}>
                          {(storefront.conversionRate * 100).toFixed(1)}% rate
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-ga-primary">
                      ${storefront.revenue.toLocaleString()}
                    </div>
                    <div className="text-sm text-ga-secondary">
                      Revenue
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights and Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights & Recommendations</CardTitle>
          <CardDescription>
            AI-powered insights to help optimize storefront performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getPerformanceInsights().map((insight, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' : 'border-l-green-500 bg-green-50'
              }`}>
                <div className="flex items-start space-x-3">
                  {insight.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-medium ${
                      insight.type === 'warning' ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      {insight.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      insight.type === 'warning' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      {insight.description}
                    </p>
                    <p className={`text-sm mt-2 font-medium ${
                      insight.type === 'warning' ? 'text-yellow-800' : 'text-green-800'
                    }`}>
                      Recommendation: {insight.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {getPerformanceInsights().length === 0 && (
              <div className="text-center py-8 text-ga-secondary">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>All performance metrics are within optimal ranges</p>
                <p className="text-sm">Keep up the great work!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};