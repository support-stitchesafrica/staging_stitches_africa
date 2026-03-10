'use client';

/**
 * Complementary Products Component
 * 
 * Displays complementary product relationships across the store
 * Requirement 18.5: Highlight complementary product relationships
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatUSD } from '@/lib/utils/currency';

interface ComplementaryProductsProps {
  vendorId: string;
}

export function ComplementaryProducts({ vendorId }: ComplementaryProductsProps) {
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendorId) {
      fetchRelationships();
    }
  }, [vendorId]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/bundling/complementary?vendorId=${vendorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch complementary products');
      }

      const data = await response.json();
      
      // Convert Map to array for rendering
      const relationshipsArray: any[] = [];
      if (data.data) {
        Object.entries(data.data).forEach(([productId, pairs]: [string, any]) => {
          if (pairs && pairs.length > 0) {
            relationshipsArray.push({
              productId,
              productName: pairs[0]?.productName || 'Unknown',
              complementaryProducts: pairs
            });
          }
        });
      }
      
      setRelationships(relationshipsArray);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = (frequency: number) => {
    if (frequency >= 10) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (frequency >= 5) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStrengthLabel = (frequency: number) => {
    if (frequency >= 10) return 'Strong';
    if (frequency >= 5) return 'Moderate';
    return 'Weak';
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            <CardTitle>Product Relationship Network</CardTitle>
          </div>
          <CardDescription>
            Discover which products work well together based on customer purchase behavior
          </CardDescription>
        </CardHeader>
      </Card>

      {relationships.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No complementary product relationships found yet. This data will appear as customers make purchases.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {relationships.map((relationship) => (
            <Card key={relationship.productId} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-lg">{relationship.productName}</CardTitle>
                <CardDescription>
                  {relationship.complementaryProducts.length} complementary product
                  {relationship.complementaryProducts.length !== 1 ? 's' : ''} identified
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {relationship.complementaryProducts.map((product: any, index: number) => (
                    <div
                      key={product.productId}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            #{index + 1}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            Purchased together {product.frequency} times
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatUSD(product.revenue)}
                          </p>
                          <p className="text-xs text-muted-foreground">Total Revenue</p>
                        </div>
                        <Badge className={getStrengthColor(product.frequency)}>
                          {getStrengthLabel(product.frequency)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                {relationship.complementaryProducts.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">
                      💡 Marketing Tip
                    </p>
                    <p className="text-sm text-blue-700">
                      Consider featuring these products together in your store, creating combo deals, 
                      or suggesting them as "Complete the Look" recommendations.
                    </p>
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
