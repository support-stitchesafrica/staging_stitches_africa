'use client';

/**
 * Bundling Overview Component
 * 
 * Displays overall bundling statistics
 * Requirement 18.3: Show average items per order
 * Requirement 18.4: Display cross-sell conversion rates
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, TrendingUp, Package } from 'lucide-react';

interface BundlingOverviewProps {
  stats: {
    averageItemsPerOrder: number;
    overallCrossSellRate: number;
    topBundleOpportunities: any[];
  } | null;
}

export function BundlingOverview({ stats }: BundlingOverviewProps) {
  if (!stats) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <p className="text-sm text-blue-900">
            No bundling insights available yet. Complete more orders to see bundling opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasData = stats.averageItemsPerOrder > 0 || stats.overallCrossSellRate > 0 || stats.topBundleOpportunities.length > 0;

  if (!hasData) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <p className="text-sm text-blue-900">
            No bundling insights available yet. Complete more orders to see bundling opportunities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Average Items Per Order
          </CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.averageItemsPerOrder.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            Items per completed order
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cross-Sell Conversion Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.overallCrossSellRate.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Orders with multiple products
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Bundle Opportunities
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.topBundleOpportunities.length}
          </div>
          <p className="text-xs text-muted-foreground">
            High-confidence bundles identified
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
