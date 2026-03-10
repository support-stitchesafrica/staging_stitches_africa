'use client';

/**
 * Suggested Bundles Component
 * 
 * Displays AI-generated bundle suggestions based on purchase patterns
 * Requirement 18.2: Suggest potential product bundles
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Sparkles } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatUSD } from '@/lib/utils/currency';

interface SuggestedBundlesProps {
  vendorId: string;
}

export function SuggestedBundles({ vendorId }: SuggestedBundlesProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [products, setProducts] = useState<Map<string, any>>(new Map());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendorId) {
      fetchData();
    }
  }, [vendorId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch bundling insights
      const insightsResponse = await fetch(`/api/vendor/bundling/insights?vendorId=${vendorId}`);
      if (!insightsResponse.ok) {
        throw new Error('Failed to fetch bundling insights');
      }
      const insightsData = await insightsResponse.json();
      
      // Fetch product details
      const productsResponse = await fetch(`/api/vendor/products?vendorId=${vendorId}`);
      if (!productsResponse.ok) {
        throw new Error('Failed to fetch products');
      }
      const productsData = await productsResponse.json();
      
      // Create product map for quick lookup
      const productMap = new Map();
      productsData.forEach((product: any) => {
        productMap.set(product.id, product);
      });
      
      setInsights(insightsData.data || []);
      setProducts(productMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 70) return 'High Confidence';
    if (confidence >= 50) return 'Medium Confidence';
    return 'Low Confidence';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error</CardTitle>
          <CardDescription className="text-red-600">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Collect all bundles from all products
  const allBundles: any[] = [];
  insights.forEach((insight) => {
    insight.suggestedBundles.forEach((bundle: any) => {
      allBundles.push({
        ...bundle,
        anchorProduct: insight.productName,
        anchorProductId: insight.productId
      });
    });
  });

  // Sort by confidence
  allBundles.sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>AI-Generated Bundle Suggestions</CardTitle>
          </div>
          <CardDescription>
            Based on customer purchase patterns and product relationships
          </CardDescription>
        </CardHeader>
      </Card>

      {allBundles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No bundle suggestions available yet. Complete more orders to generate bundle recommendations.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {allBundles.slice(0, 10).map((bundle, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      Bundle #{index + 1}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {bundle.products.length} products
                    </CardDescription>
                  </div>
                  <Badge className={getConfidenceColor(bundle.confidence)}>
                    {getConfidenceLabel(bundle.confidence)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Products in Bundle:</p>
                  <div className="space-y-1">
                    {bundle.products.map((productId: string) => {
                      const product = products.get(productId);
                      return (
                        <div key={productId} className="flex items-center gap-2 text-sm">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span>{product?.name || 'Unknown Product'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Revenue</p>
                    <p className="text-lg font-bold">
                      {formatUSD(bundle.estimatedRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Confidence Score</p>
                    <p className="text-lg font-bold">
                      {bundle.confidence.toFixed(0)}%
                    </p>
                  </div>
                </div>

                {bundle.confidence >= 70 && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                      <p className="text-xs text-green-700">
                        High-confidence bundle! Consider creating a special offer for these products together.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
