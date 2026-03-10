'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InventoryForecast as InventoryForecastType } from '@/types/vendor-analytics';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Calendar,
  ShoppingCart,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InventoryForecastProps {
  forecasts: InventoryForecastType[];
  loading?: boolean;
}

export function InventoryForecast({ forecasts, loading = false }: InventoryForecastProps) {
  const router = useRouter();

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Loading forecasts...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (forecasts.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Inventory Forecast</CardTitle>
          <CardDescription>
            30-day demand predictions for your products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Forecast Data
            </h3>
            <p className="text-gray-600">
              Add products to see inventory forecasts
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by urgency (days until stockout)
  const sortedForecasts = [...forecasts].sort((a, b) => 
    a.daysUntilStockout - b.daysUntilStockout
  );

  // Categorize forecasts
  const criticalForecasts = sortedForecasts.filter(f => f.daysUntilStockout < 7);
  const warningForecasts = sortedForecasts.filter(f => f.daysUntilStockout >= 7 && f.daysUntilStockout < 14);
  const healthyForecasts = sortedForecasts.filter(f => f.daysUntilStockout >= 14);

  const handleViewProduct = (productId: string) => {
    router.push(`/vendor/products/${productId}/analytics`);
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 mb-1">
                  Critical
                </p>
                <p className="text-3xl font-bold text-red-900">
                  {criticalForecasts.length}
                </p>
                <p className="text-xs text-red-600 mt-1">
                  &lt; 7 days stock
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700 mb-1">
                  Warning
                </p>
                <p className="text-3xl font-bold text-amber-900">
                  {warningForecasts.length}
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  7-14 days stock
                </p>
              </div>
              <Package className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-700 mb-1">
                  Healthy
                </p>
                <p className="text-3xl font-bold text-emerald-900">
                  {healthyForecasts.length}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  &gt; 14 days stock
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Forecasts */}
      {criticalForecasts.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">
                Critical - Reorder Now ({criticalForecasts.length})
              </CardTitle>
            </div>
            <CardDescription>
              These products will run out within 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalForecasts.map((forecast, index) => (
                <ForecastCard 
                  key={index} 
                  forecast={forecast} 
                  variant="critical"
                  onViewProduct={handleViewProduct}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Forecasts */}
      {warningForecasts.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              <CardTitle>
                Plan Ahead ({warningForecasts.length})
              </CardTitle>
            </div>
            <CardDescription>
              Consider reordering these products soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warningForecasts.slice(0, 5).map((forecast, index) => (
                <ForecastCard 
                  key={index} 
                  forecast={forecast} 
                  variant="warning"
                  onViewProduct={handleViewProduct}
                />
              ))}
              {warningForecasts.length > 5 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  + {warningForecasts.length - 5} more products
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Healthy Forecasts - Show top 3 */}
      {healthyForecasts.length > 0 && (
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <CardTitle>
                Healthy Stock Levels ({healthyForecasts.length})
              </CardTitle>
            </div>
            <CardDescription>
              These products have adequate inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {healthyForecasts.slice(0, 3).map((forecast, index) => (
                <ForecastCard 
                  key={index} 
                  forecast={forecast} 
                  variant="healthy"
                  onViewProduct={handleViewProduct}
                />
              ))}
              {healthyForecasts.length > 3 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  + {healthyForecasts.length - 3} more products with healthy stock
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ForecastCardProps {
  forecast: InventoryForecastType;
  variant: 'critical' | 'warning' | 'healthy';
  onViewProduct: (productId: string) => void;
}

function ForecastCard({ forecast, variant, onViewProduct }: ForecastCardProps) {
  const variantConfig = {
    critical: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeVariant: 'destructive' as const,
      textColor: 'text-red-900'
    },
    warning: {
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      badgeVariant: 'default' as const,
      textColor: 'text-amber-900'
    },
    healthy: {
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      badgeVariant: 'secondary' as const,
      textColor: 'text-emerald-900'
    }
  };

  const config = variantConfig[variant];
  const isIncreasing = forecast.seasonalityFactor > 1.0;

  return (
    <div className={`p-4 ${config.bgColor} rounded-lg border ${config.borderColor}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className={`font-semibold ${config.textColor} truncate`}>
              {forecast.productName}
            </h4>
            {isIncreasing ? (
              <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <TrendingDown className="h-4 w-4 text-gray-400 shrink-0" />
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Package className="h-3 w-3 text-gray-600" />
                <p className="text-xs text-gray-600">Current Stock</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {forecast.currentStock}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 text-gray-600" />
                <p className="text-xs text-gray-600">Days Left</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {forecast.daysUntilStockout === Infinity 
                  ? '∞' 
                  : Math.floor(forecast.daysUntilStockout)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <ShoppingCart className="h-3 w-3 text-gray-600" />
                <p className="text-xs text-gray-600">Daily Sales</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {forecast.averageDailySales.toFixed(1)}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-gray-600" />
                <p className="text-xs text-gray-600">Reorder Qty</p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {forecast.recommendedReorderQuantity}
              </p>
            </div>
          </div>

          {forecast.seasonalityFactor !== 1.0 && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {isIncreasing ? '📈' : '📉'} 
                {' '}
                {forecast.seasonalityFactor > 1.0 ? 'Increasing' : 'Decreasing'} demand
                {' '}
                ({(forecast.seasonalityFactor * 100).toFixed(0)}%)
              </Badge>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewProduct(forecast.productId)}
          className="shrink-0"
        >
          View
        </Button>
      </div>
    </div>
  );
}
