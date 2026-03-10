'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { InventoryAlert } from '@/types/vendor-analytics';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReturnRateAlertsProps {
  alerts: InventoryAlert[];
  loading?: boolean;
}

export function ReturnRateAlerts({ alerts, loading = false }: ReturnRateAlertsProps) {
  const router = useRouter();

  // Filter for high return rate alerts only
  const returnAlerts = alerts.filter(alert => alert.type === 'high_return_rate');

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Loading return rate data...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (returnAlerts.length === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-emerald-900">
              Return Rates Healthy
            </CardTitle>
          </div>
          <CardDescription className="text-emerald-700">
            No products with high return rates detected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <Package className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-emerald-900 mb-2">
              Great Job!
            </h3>
            <p className="text-emerald-700">
              Your products have healthy return rates. Keep maintaining quality!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleViewProduct = (productId: string) => {
    router.push(`/vendor/products/${productId}/analytics`);
  };

  // Extract return rate from message (e.g., "High return rate (18.5%)")
  const extractReturnRate = (message: string): number => {
    const match = message.match(/\((\d+\.?\d*)%\)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Sort by return rate (highest first)
  const sortedAlerts = [...returnAlerts].sort((a, b) => {
    const rateA = extractReturnRate(a.message);
    const rateB = extractReturnRate(b.message);
    return rateB - rateA;
  });

  return (
    <Card className="border-orange-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <CardTitle>
            High Return Rate Products ({returnAlerts.length})
          </CardTitle>
        </div>
        <CardDescription>
          Products with return rates above 15% threshold
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Alert Banner */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Action Required
                </p>
                <p className="text-xs text-gray-700">
                  High return rates can indicate issues with product quality, sizing, 
                  descriptions, or images. Review these products and consider improvements.
                </p>
              </div>
            </div>
          </div>

          {/* Return Rate Cards */}
          <div className="space-y-3">
            {sortedAlerts.map((alert, index) => {
              const returnRate = extractReturnRate(alert.message);
              const severity = returnRate > 25 ? 'critical' : 'warning';
              
              return (
                <ReturnRateCard
                  key={index}
                  alert={alert}
                  returnRate={returnRate}
                  severity={severity}
                  onViewProduct={handleViewProduct}
                />
              );
            })}
          </div>

          {/* Recommendations */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                💡 How to Reduce Return Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Improve Product Images:</strong> Use high-quality photos from multiple angles
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Accurate Descriptions:</strong> Provide detailed, honest product descriptions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Size Guides:</strong> Include comprehensive sizing information and charts
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Quality Control:</strong> Inspect products before shipping
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>Customer Feedback:</strong> Review return reasons and address common issues
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

interface ReturnRateCardProps {
  alert: InventoryAlert;
  returnRate: number;
  severity: 'critical' | 'warning';
  onViewProduct: (productId: string) => void;
}

function ReturnRateCard({ alert, returnRate, severity, onViewProduct }: ReturnRateCardProps) {
  const isCritical = severity === 'critical';
  const bgColor = isCritical ? 'bg-red-50' : 'bg-orange-50';
  const borderColor = isCritical ? 'border-red-200' : 'border-orange-200';
  const textColor = isCritical ? 'text-red-900' : 'text-orange-900';
  const progressColor = isCritical ? 'bg-red-600' : 'bg-orange-600';

  return (
    <div className={`p-4 ${bgColor} rounded-lg border ${borderColor}`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold ${textColor} truncate`}>
              {alert.productName}
            </h4>
            <Badge variant={isCritical ? 'destructive' : 'default'} className="shrink-0">
              {returnRate.toFixed(1)}%
            </Badge>
          </div>
          <p className="text-sm text-gray-600">
            {alert.message}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewProduct(alert.productId)}
          className="shrink-0"
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          View
        </Button>
      </div>

      {/* Return Rate Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Return Rate</span>
          <span className="font-medium text-gray-900">
            {returnRate.toFixed(1)}% of orders
          </span>
        </div>
        <div className="relative">
          <Progress 
            value={Math.min(returnRate, 100)} 
            className="h-2"
          />
          {/* Threshold marker at 15% */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400"
            style={{ left: '15%' }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 whitespace-nowrap">
              15% threshold
            </div>
          </div>
        </div>
      </div>

      {/* Severity Indicator */}
      {isCritical && (
        <div className="mt-3 flex items-center gap-2 text-xs text-red-700">
          <AlertTriangle className="h-3 w-3" />
          <span className="font-medium">
            Critical: Return rate exceeds 25%
          </span>
        </div>
      )}
    </div>
  );
}
