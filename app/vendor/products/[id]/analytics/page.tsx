'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { VisibilityScore } from '@/components/vendor/products/VisibilityScore';
import { RankingScoreDisplay } from '@/components/vendor/products/RankingScoreDisplay';
import {
  ArrowLeft,
  Eye,
  ShoppingCart,
  TrendingUp,
  Star,
  Package,
  AlertCircle,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Download
} from 'lucide-react';
import { ProductAnalytics } from '@/types/vendor-analytics';
import { toast } from 'sonner';
import { ActivityTimeline } from '@/components/vendor/products/ActivityTimeline';
import { PeakActivityPatterns } from '@/components/vendor/products/PeakActivityPatterns';
import { RealTimeMetrics } from '@/components/vendor/products/RealTimeMetrics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProductAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<ProductAnalytics | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);

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

  // Fetch product analytics
  useEffect(() => {
    if (!vendorId || !params.id) return;

    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Set date range for last 60 days to capture more historical data
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 60);
        
        // Fetch real analytics data from API
        const response = await fetch('/api/vendor/product-analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            productId: params.id as string,
            vendorId,
            dateRange: {
              start: startDate.toISOString(),
              end: endDate.toISOString()
            }
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to fetch analytics');
        }
        
        const analyticsData = await response.json();
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to load product analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [vendorId, params.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductAnalyticsSkeleton />
        </main>
      </div>
    );
  }

  if (!analytics) {
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
              There was an error loading analytics for this product
            </p>
            <Button onClick={() => router.back()}>
              Go Back
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
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Product Analytics
                </h1>
                {analytics.isTrending && (
                  <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
              </div>
              <p className="text-gray-600 text-lg">
                Product Name: {analytics.title}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="default"
                onClick={() => router.push(`/vendor/products/${params.id}/ranking`)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Ranking Details
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Eye className="h-5 w-5 text-blue-600" />
                {analytics.viewsChange > 0 && (
                  <Badge variant="outline" className="text-emerald-600">
                    +{analytics.viewsChange.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">Total Views</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.views.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <ShoppingCart className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">Sales Count</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.salesCount.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">Revenue</p>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(analytics.revenue)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">Rating</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.averageRating.toFixed(1)}
                </p>
                <span className="text-sm text-gray-600">
                  ({analytics.reviewCount} reviews)
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-Time Activity Metrics */}
        <RealTimeMetrics
          views={analytics.views}
          uniqueViews={analytics.uniqueViews || 0}
          addToCartCount={analytics.addToCartCount || 0}
          addToCartRate={analytics.addToCartRate}
          conversionRate={analytics.conversionRate}
          cartConversionRate={analytics.cartConversionRate || 0}
          salesCount={analytics.salesCount}
          revenue={analytics.revenue}
        />

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Add to Cart Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analytics.addToCartRate)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                of viewers add to cart
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(analytics.conversionRate)}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                of viewers purchase
              </p>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Stock Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.stockLevel}
                </p>
                <Package className="h-5 w-5 text-gray-600" />
              </div>
              <p className="text-sm text-gray-600 mt-1">
                units available
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Visibility and Ranking */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <VisibilityScore
            score={analytics.visibilityScore}
            rankingPosition={analytics.rankingPosition}
            change={5}
            showRankingLink={true}
            productId={params.id as string}
          />

          <RankingScoreDisplay
            factors={analytics.rankingFactors}
            showDetails={true}
          />
        </div>

        {/* Customer Feedback */}
        <Card className="border-gray-200 mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              <CardTitle>Customer Feedback</CardTitle>
            </div>
            <CardDescription>
              Summary of customer comments and reviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <ThumbsUp className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold text-emerald-900">
                    {analytics.customerComments.positive}
                  </p>
                  <p className="text-sm text-emerald-700">Positive</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <MessageSquare className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.customerComments.neutral}
                  </p>
                  <p className="text-sm text-gray-700">Neutral</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <ThumbsDown className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-900">
                    {analytics.customerComments.negative}
                  </p>
                  <p className="text-sm text-red-700">Negative</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Common Themes
              </h4>
              <div className="flex flex-wrap gap-2">
                {analytics.customerComments.commonThemes.map((theme, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Insights Tabs */}
        <Tabs defaultValue="timeline" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
            <TabsTrigger value="patterns">Peak Activity Patterns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="mt-6">
            <ActivityTimeline 
              activities={analytics.activityTimeline || []} 
              maxHeight="600px"
            />
          </TabsContent>
          
          <TabsContent value="patterns" className="mt-6">
            <PeakActivityPatterns 
              data={analytics.peakActivityTimes || {
                peakHour: null,
                peakDay: null,
                topDevice: null,
                hourlyDistribution: [],
                dailyDistribution: [],
                deviceDistribution: []
              }} 
            />
          </TabsContent>
        </Tabs>

        {/* Recommendations */}
        {analytics.recommendations.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <CardTitle>Recommendations</CardTitle>
              </div>
              <CardDescription>
                Actionable insights to improve product performance based on real activity data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-900 flex-1">
                      {recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

// Skeleton loading component
function ProductAnalyticsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-32 mb-4" />
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-6 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
