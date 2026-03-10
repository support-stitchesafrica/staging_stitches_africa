/**
 * Real-Time Metrics Component
 * Displays real-time metrics from shop activities
 * 
 * Validates: Requirements 22.2, 22.3
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  ShoppingCart, 
  TrendingUp,
  Activity,
  Users,
  DollarSign
} from 'lucide-react';

interface RealTimeMetricsProps {
  views: number;
  uniqueViews: number;
  addToCartCount: number;
  addToCartRate: number;
  conversionRate: number;
  cartConversionRate: number;
  salesCount: number;
  revenue: number;
}

export function RealTimeMetrics({
  views,
  uniqueViews,
  addToCartCount,
  addToCartRate,
  conversionRate,
  cartConversionRate,
  salesCount,
  revenue
}: RealTimeMetricsProps) {
  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            <CardTitle>Real-Time Activity Metrics</CardTitle>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
            Live Data
          </Badge>
        </div>
        <CardDescription>
          Metrics calculated from actual customer interactions in the shops section
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Views */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{views.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Users className="h-3 w-3" />
              <span>{uniqueViews.toLocaleString()} unique viewers</span>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Add to Cart</p>
                <p className="text-2xl font-bold text-gray-900">{addToCartCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <TrendingUp className="h-3 w-3" />
              <span>{formatPercentage(addToCartRate)} of views</span>
            </div>
          </div>

          {/* Purchases */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Purchases</p>
                <p className="text-2xl font-bold text-gray-900">{salesCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <TrendingUp className="h-3 w-3" />
              <span>{formatCurrency(revenue)} revenue</span>
            </div>
          </div>

          {/* View to Purchase Conversion */}
          <div className="p-4 bg-white rounded-lg border border-emerald-200">
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">View → Purchase</p>
              <p className="text-2xl font-bold text-emerald-600">
                {formatPercentage(conversionRate)}
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Conversion rate from views to purchases
            </p>
          </div>

          {/* Cart to Purchase Conversion */}
          <div className="p-4 bg-white rounded-lg border border-purple-200">
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Cart → Purchase</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatPercentage(cartConversionRate)}
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Conversion rate from cart to purchases
            </p>
          </div>

          {/* Average Order Value */}
          <div className="p-4 bg-white rounded-lg border border-blue-200">
            <div className="mb-2">
              <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(salesCount > 0 ? revenue / salesCount : 0)}
              </p>
            </div>
            <p className="text-xs text-gray-600">
              Average revenue per purchase
            </p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-900">
              <strong>Real-time data:</strong> These metrics are calculated from actual customer 
              activities tracked in the shops section, including product views, cart additions, 
              and purchases. Data updates within 30 seconds of customer interactions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
