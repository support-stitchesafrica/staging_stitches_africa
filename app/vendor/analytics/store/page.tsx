'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import MetricCard from '@/components/shared/MetricCard';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { DateRangePicker, DateRange as DateRangeType } from '@/components/analytics/DateRangePicker';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Eye,
  Users,
  Search,
  Star,
  Award,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowUpRight,
  Target,
  Activity,
  BarChart3
} from 'lucide-react';
import { VendorAnalyticsService } from '@/lib/vendor/analytics-service';
import { DateRange, StoreMetrics } from '@/types/vendor-analytics';
import { toast } from 'sonner';

export default function StoreVisibilityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [storeMetrics, setStoreMetrics] = useState<StoreMetrics | null>(null);
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

  // Fetch store metrics data
  useEffect(() => {
    if (!vendorId) return;

    const fetchStoreMetrics = async () => {
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
          setStoreMetrics(response.data.store);
        } else {
          toast.error(response.error?.message || 'Failed to load store metrics');
        }
      } catch (error) {
        console.error('Error fetching store metrics:', error);
        toast.error('Failed to load store metrics data');
      } finally {
        setLoading(false);
      }
    };

    fetchStoreMetrics();
  }, [vendorId, dateRange]);

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  const getEngagementScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getEngagementScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 90) return 'Top 10%';
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Top 50%';
    return 'Below Average';
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <Info className="h-4 w-4" />;
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <StoreVisibilitySkeleton />
        </main>
      </div>
    );
  }

  if (!storeMetrics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to load store metrics
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading your store visibility data
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
                Store Visibility
              </h1>
              <p className="text-gray-600 text-lg">
                Track your marketplace presence and performance
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                showComparison={false}
              />
            </div>
          </div>
        </div>

        {/* Store Engagement Score */}
        <Card className="border-gray-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Store Engagement Score</CardTitle>
                <CardDescription className="text-base mt-1">
                  Overall measure of your store's performance and customer interaction
                </CardDescription>
              </div>
              <Award className="h-12 w-12 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-end gap-4">
                <div className={`text-6xl font-bold ${getEngagementScoreColor(storeMetrics.engagementScore)}`}>
                  {storeMetrics.engagementScore}
                </div>
                <div className="pb-2">
                  <Badge variant="outline" className={`${getEngagementScoreColor(storeMetrics.engagementScore)} border-current`}>
                    {getEngagementScoreLabel(storeMetrics.engagementScore)}
                  </Badge>
                </div>
              </div>
              <Progress 
                value={storeMetrics.engagementScore} 
                className="h-3"
              />
              <p className="text-sm text-gray-600">
                Your store is performing {getEngagementScoreLabel(storeMetrics.engagementScore).toLowerCase()} compared to marketplace standards
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Key Visibility Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            label="Search Appearances"
            value={storeMetrics.searchAppearances.toLocaleString()}
            subtitle="Times your products appeared in search"
            icon={<Search className="h-6 w-6 text-blue-600" />}
          />

          <MetricCard
            label="Profile Visits"
            value={storeMetrics.profileVisits.toLocaleString()}
            subtitle="Visitors to your store page"
            icon={<Eye className="h-6 w-6 text-purple-600" />}
          />

          <MetricCard
            label="Followers"
            value={storeMetrics.followerCount.toLocaleString()}
            subtitle="Customers following your store"
            icon={<Users className="h-6 w-6 text-emerald-600" />}
          />

          <MetricCard
            label="Ranking Percentile"
            value={`${storeMetrics.rankingVsSimilarStores}%`}
            subtitle={getPercentileLabel(storeMetrics.rankingVsSimilarStores)}
            icon={<Star className="h-6 w-6 text-amber-600" />}
            variant={storeMetrics.rankingVsSimilarStores >= 75 ? 'accent' : 'default'}
          />
        </div>

        {/* Category Performance Rankings */}
        <Card className="border-gray-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>
                  Your ranking in each product category
                </CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {storeMetrics.categoryPerformance.length > 0 ? (
              <div className="space-y-4">
                {storeMetrics.categoryPerformance.map((category, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {category.category}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Rank #{category.ranking} of {category.totalVendors} vendors
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge 
                          variant="outline" 
                          className={
                            category.percentile >= 75 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : category.percentile >= 50
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }
                        >
                          Top {(100 - category.percentile).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Revenue</p>
                        <p className="text-sm font-semibold text-gray-900">
                          ${category.revenue.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Orders</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {category.orderCount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <Progress 
                      value={category.percentile} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">
                  No category performance data available yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking vs Similar Stores */}
        <Card className="border-gray-200 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Competitive Position</CardTitle>
                <CardDescription>
                  How you rank against similar stores in the marketplace
                </CardDescription>
              </div>
              <Target className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Your Position
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {getPercentileLabel(storeMetrics.rankingVsSimilarStores)}
                  </span>
                </div>
                <Progress 
                  value={storeMetrics.rankingVsSimilarStores} 
                  className="h-3"
                />
                <p className="text-xs text-gray-600 mt-2">
                  You're performing better than {storeMetrics.rankingVsSimilarStores}% of similar stores
                </p>
              </div>

              {storeMetrics.rankingVsSimilarStores < 75 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">
                        Improvement Opportunity
                      </h4>
                      <p className="text-sm text-blue-800">
                        Focus on the suggestions below to improve your ranking and reach the top 25% of stores
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {storeMetrics.rankingVsSimilarStores >= 90 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Award className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-emerald-900 mb-1">
                        Excellent Performance!
                      </h4>
                      <p className="text-sm text-emerald-800">
                        You're in the top 10% of stores. Keep up the great work!
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Store Improvement Suggestions */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Improvement Suggestions</CardTitle>
                <CardDescription>
                  Actionable recommendations to boost your store visibility
                </CardDescription>
              </div>
              <ArrowUpRight className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {storeMetrics.suggestions.length > 0 ? (
              <div className="space-y-4">
                {storeMetrics.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      suggestion.priority === 'high'
                        ? 'bg-red-50 border-red-200'
                        : suggestion.priority === 'medium'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(suggestion.priority)}`}>
                        {getPriorityIcon(suggestion.priority)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {suggestion.title}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                          >
                            {suggestion.priority.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {suggestion.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Expected Impact:</span>
                          <span className="font-medium text-gray-900">
                            {suggestion.impact}
                          </span>
                        </div>
                        {suggestion.actionUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => router.push(suggestion.actionUrl!)}
                          >
                            Take Action
                            <ArrowUpRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Great Job!
                </h3>
                <p className="text-gray-600">
                  Your store is performing well. No immediate improvements needed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Skeleton loading component
function StoreVisibilitySkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Skeleton className="h-10 w-48" />
      </div>

      {/* Engagement Score Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-32 mb-4" />
          <Skeleton className="h-3 w-full mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardContent>
      </Card>

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

      {/* Category Performance Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-3" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Suggestions Skeleton */}
      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
