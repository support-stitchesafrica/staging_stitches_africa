'use client';

/**
 * Frequently Bought Together Component
 * 
 * Displays products that are frequently purchased together
 * Requirement 18.1: Identify frequently bought together product combinations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatUSD } from '@/lib/utils/currency';

interface FrequentlyBoughtTogetherProps {
  vendorId: string;
}

export function FrequentlyBoughtTogether({ vendorId }: FrequentlyBoughtTogetherProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (vendorId) {
      fetchInsights();
    }
  }, [vendorId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendor/bundling/insights?vendorId=${vendorId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bundling insights');
      }

      const data = await response.json();
      setInsights(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
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
      {insights.map((insight) => (
        <Card key={insight.productId}>
          <CardHeader>
            <CardTitle className="text-lg">{insight.productName}</CardTitle>
            <CardDescription>
              Products frequently purchased with this item
            </CardDescription>
          </CardHeader>
          <CardContent>
            {insight.frequentlyBoughtWith.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No frequently bought together data available yet. This will update as more orders are completed.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Times Bought Together</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insight.frequentlyBoughtWith.map((pair: any) => (
                    <TableRow key={pair.productId}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pair.productName}</span>
                          {pair.frequency >= 5 && (
                            <Badge variant="secondary">Popular</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{pair.frequency}x</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatUSD(pair.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {insight.frequentlyBoughtWith.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Cross-Sell Opportunity
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      {insight.crossSellConversionRate.toFixed(1)}% of orders with this product include additional items. 
                      Consider creating bundles or suggesting these products together.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {insights.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No bundling insights available yet. Complete more orders to see bundling opportunities.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
