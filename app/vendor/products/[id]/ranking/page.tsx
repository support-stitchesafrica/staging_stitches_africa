'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ModernNavbar } from '@/components/vendor/modern-navbar';
import { VisibilityScore } from '@/components/vendor/products/VisibilityScore';
import { RankingFactorsBreakdown } from '@/components/vendor/products/RankingFactorsBreakdown';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Target,
  Lightbulb,
  AlertCircle,
  Download,
  RefreshCw,
  Info
} from 'lucide-react';
import { ProductRanking } from '@/types/vendor-analytics';
import { ProductRankingService } from '@/lib/vendor/product-ranking-service';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Product {
  product_id: string;
  title: string;
  category: string;
  tailor_id: string;
}

export default function ProductRankingPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ranking, setRanking] = useState<ProductRanking | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  const rankingService = new ProductRankingService();

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

  // Fetch product data
  useEffect(() => {
    if (!params.id) return;

    const fetchProduct = async () => {
      try {
        const productDoc = await getDoc(doc(db, 'staging_tailor_works', params.id as string));
        
        if (productDoc.exists()) {
          const productData = productDoc.data();
          setProduct({
            product_id: productDoc.id,
            title: productData.title || productData.name || 'Untitled Product',
            category: productData.category || 'Uncategorized',
            tailor_id: productData.tailor_id || productData.tailorId
          });
        } else {
          toast.error('Product not found');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product data');
      }
    };

    fetchProduct();
  }, [params.id]);

  // Fetch product ranking
  useEffect(() => {
    if (!vendorId || !params.id || !product) return;

    const fetchRanking = async () => {
      setLoading(true);
      try {
        const response = await rankingService.getProductRanking(
          params.id as string,
          vendorId
        );
        
        if (response.success && response.data) {
          setRanking(response.data);
        } else {
          toast.error(response.error?.message || 'Failed to load ranking data');
        }
      } catch (error) {
        console.error('Error fetching ranking:', error);
        toast.error('Failed to load product ranking');
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [vendorId, params.id, product]);

  const handleRefresh = async () => {
    if (!vendorId || !params.id || !product) return;

    setRefreshing(true);
    try {
      const response = await rankingService.getProductRanking(
        params.id as string,
        vendorId
      );
      
      if (response.success && response.data) {
        setRanking(response.data);
        await rankingService.saveRanking(response.data);
        toast.success('Ranking data refreshed successfully');
      } else {
        toast.error(response.error?.message || 'Failed to refresh ranking data');
      }
    } catch (error) {
      console.error('Error refreshing ranking:', error);
      toast.error('Failed to refresh ranking data');
    } finally {
      setRefreshing(false);
    }
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-5 w-5 text-emerald-600" />;
    if (change < 0) return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (change < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getTrendLabel = (change: number) => {
    if (change > 0) return `Improved by ${change} positions`;
    if (change < 0) return `Dropped by ${Math.abs(change)} positions`;
    return 'No change in position';
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <RankingPageSkeleton />
        </main>
      </div>
    );
  }

  if (!ranking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ModernNavbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Unable to load ranking data
            </h3>
            <p className="text-gray-600 mb-4">
              There was an error loading ranking information for this product
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
            Back to Product Analytics
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  Product Ranking
                </h1>
                <Badge className="bg-purple-50 text-purple-700 border-purple-200">
                  <Award className="h-3 w-3 mr-1" />
                  Ranking Analysis
                </Badge>
              </div>
              <p className="text-gray-600 text-lg">
                {product.title} • {product.category}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Ranking Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Overall Ranking Position */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Award className="h-5 w-5 text-purple-600" />
                {ranking.change !== 0 && (
                  <Badge className={getTrendColor(ranking.change)}>
                    {getTrendIcon(ranking.change)}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">Overall Ranking</p>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                #{ranking.rankingPosition}
              </p>
              <p className="text-xs text-gray-600">
                {getTrendLabel(ranking.change)}
              </p>
            </CardContent>
          </Card>

          {/* Category Ranking Position */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <Target className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">Category Ranking</p>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                #{ranking.categoryRankingPosition}
              </p>
              <p className="text-xs text-gray-600">
                in {ranking.category}
              </p>
            </CardContent>
          </Card>

          {/* Visibility Score */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-1">Visibility Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold text-emerald-600">
                  {ranking.visibilityScore}
                </p>
                <span className="text-sm text-gray-600">/ 100</span>
              </div>
              <p className="text-xs text-gray-600">
                Product discoverability
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Ranking Change Explanation */}
        {ranking.changeExplanation && (
          <Card className={`mb-8 ${
            ranking.change > 0
              ? 'border-emerald-200 bg-emerald-50'
              : ranking.change < 0
              ? 'border-red-200 bg-red-50'
              : 'border-gray-200 bg-gray-50'
          }`}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className={`h-5 w-5 ${
                  ranking.change > 0
                    ? 'text-emerald-600'
                    : ranking.change < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
                }`} />
                <CardTitle>Ranking Change Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className={`text-sm ${
                ranking.change > 0
                  ? 'text-emerald-900'
                  : ranking.change < 0
                  ? 'text-red-900'
                  : 'text-gray-900'
              }`}>
                {ranking.changeExplanation}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Visibility Score Visualization */}
        <div className="mb-8">
          <VisibilityScore
            score={ranking.visibilityScore}
            rankingPosition={ranking.rankingPosition}
            categoryRankingPosition={ranking.categoryRankingPosition}
            change={ranking.change}
          />
        </div>

        {/* Ranking Factors Breakdown */}
        <div className="mb-8">
          <RankingFactorsBreakdown
            factors={ranking.factors}
            showComparison={false}
          />
        </div>

        {/* Recommendations */}
        {ranking.recommendations.length > 0 && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-600" />
                <CardTitle>Actionable Recommendations</CardTitle>
              </div>
              <CardDescription>
                Specific steps to improve your product's ranking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ranking.recommendations.map((recommendation, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 font-medium mb-1">
                        {recommendation}
                      </p>
                      <p className="text-xs text-gray-600">
                        Implementing this recommendation can help improve your ranking position
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Last Updated */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Last updated: {new Date(ranking.lastUpdated).toLocaleString()}
        </div>
      </main>
    </div>
  );
}

// Skeleton loading component
function RankingPageSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-32 mb-4" />
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-6 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-gray-200">
            <CardHeader className="pb-3">
              <Skeleton className="h-5 w-5" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-10 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
