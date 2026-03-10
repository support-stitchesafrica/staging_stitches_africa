'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InventoryAlert } from '@/types/vendor-analytics';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Package,
  TrendingDown,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface StockAlertsListProps {
  alerts: InventoryAlert[];
  loading?: boolean;
}

export function StockAlertsList({ alerts, loading = false }: StockAlertsListProps) {
  const router = useRouter();

  const getSeverityConfig = (severity: InventoryAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          badgeVariant: 'destructive' as const
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          badgeVariant: 'default' as const
        };
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          badgeVariant: 'secondary' as const
        };
    }
  };

  const getTypeConfig = (type: InventoryAlert['type']) => {
    switch (type) {
      case 'out_of_stock':
        return {
          icon: Package,
          label: 'Out of Stock',
          color: 'text-red-600'
        };
      case 'low_stock':
        return {
          icon: TrendingDown,
          label: 'Low Stock',
          color: 'text-amber-600'
        };
      case 'high_return_rate':
        return {
          icon: Package,
          label: 'High Returns',
          color: 'text-orange-600'
        };
      case 'slow_fulfillment':
        return {
          icon: Clock,
          label: 'Slow Fulfillment',
          color: 'text-purple-600'
        };
    }
  };

  const handleViewProduct = (productId: string) => {
    router.push(`/vendor/products/${productId}/analytics`);
  };

  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Loading alerts...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Stock Alerts</CardTitle>
          <CardDescription>
            No inventory alerts at this time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
              <Package className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              All Clear!
            </h3>
            <p className="text-gray-600">
              Your inventory levels are healthy. Keep up the good work!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group alerts by severity
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const infoAlerts = alerts.filter(a => a.severity === 'info');

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">
                Critical Alerts ({criticalAlerts.length})
              </CardTitle>
            </div>
            <CardDescription className="text-red-700">
              These issues require immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert, index) => (
                <AlertCard key={index} alert={alert} onViewProduct={handleViewProduct} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle>
                Warnings ({warningAlerts.length})
              </CardTitle>
            </div>
            <CardDescription>
              Address these issues soon to prevent problems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warningAlerts.map((alert, index) => (
                <AlertCard key={index} alert={alert} onViewProduct={handleViewProduct} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <CardTitle>
                Information ({infoAlerts.length})
              </CardTitle>
            </div>
            <CardDescription>
              Helpful insights about your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {infoAlerts.map((alert, index) => (
                <AlertCard key={index} alert={alert} onViewProduct={handleViewProduct} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AlertCardProps {
  alert: InventoryAlert;
  onViewProduct: (productId: string) => void;
}

function AlertCard({ alert, onViewProduct }: AlertCardProps) {
  const severityConfig = getSeverityConfig(alert.severity);
  const typeConfig = getTypeConfig(alert.type);
  const SeverityIcon = severityConfig.icon;
  const TypeIcon = typeConfig.icon;

  return (
    <div
      className={`p-4 bg-white rounded-lg border ${severityConfig.borderColor} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${severityConfig.bgColor}`}>
            <SeverityIcon className={`h-5 w-5 ${severityConfig.color}`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 truncate">
                {alert.productName}
              </h4>
              <Badge variant={severityConfig.badgeVariant} className="shrink-0">
                {alert.severity.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <TypeIcon className={`h-4 w-4 ${typeConfig.color}`} />
              <span className="text-sm font-medium text-gray-700">
                {typeConfig.label}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              {alert.message}
            </p>
            
            {alert.currentStock !== undefined && (
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Current Stock: </span>
                  <span className="font-semibold text-gray-900">
                    {alert.currentStock} units
                  </span>
                </div>
                {alert.recommendedStock && (
                  <div>
                    <span className="text-gray-600">Recommended: </span>
                    <span className="font-semibold text-gray-900">
                      {alert.recommendedStock} units
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
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
    </div>
  );
}

function getSeverityConfig(severity: InventoryAlert['severity']) {
  switch (severity) {
    case 'critical':
      return {
        icon: AlertCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        badgeVariant: 'destructive' as const
      };
    case 'warning':
      return {
        icon: AlertTriangle,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        badgeVariant: 'default' as const
      };
    case 'info':
      return {
        icon: Info,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        badgeVariant: 'secondary' as const
      };
  }
}

function getTypeConfig(type: InventoryAlert['type']) {
  switch (type) {
    case 'out_of_stock':
      return {
        icon: Package,
        label: 'Out of Stock',
        color: 'text-red-600'
      };
    case 'low_stock':
      return {
        icon: TrendingDown,
        label: 'Low Stock',
        color: 'text-amber-600'
      };
    case 'high_return_rate':
      return {
        icon: Package,
        label: 'High Returns',
        color: 'text-orange-600'
      };
    case 'slow_fulfillment':
      return {
        icon: Clock,
        label: 'Slow Fulfillment',
        color: 'text-purple-600'
      };
  }
}
