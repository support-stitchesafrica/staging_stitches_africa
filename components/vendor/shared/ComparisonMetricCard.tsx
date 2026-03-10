'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ComparisonMetrics } from '@/types/vendor-analytics';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ComparisonMetricCardProps {
  title: string;
  value: string | number;
  comparison?: ComparisonMetrics;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  currency?: string;
  loading?: boolean;
  className?: string;
  showPreviousValue?: boolean;
}

export function ComparisonMetricCard({
  title,
  value,
  comparison,
  description,
  icon: Icon,
  iconColor = 'text-emerald-600',
  iconBgColor = 'bg-emerald-100',
  currency,
  loading = false,
  className,
  showPreviousValue = true
}: ComparisonMetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number' && currency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    if (typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  const formatChange = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: ComparisonMetrics['trend']) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      case 'stable':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: ComparisonMetrics['trend']) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 bg-emerald-50';
      case 'down':
        return 'text-red-600 bg-red-50';
      case 'stable':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <Card className={cn('border-gray-200', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            {Icon && (
              <div className={cn('p-2 rounded-lg', iconBgColor)}>
                <div className="h-5 w-5 animate-pulse rounded bg-gray-300" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 w-32 animate-pulse rounded bg-gray-200 mb-2" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-gray-200 hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-600">
            {title}
          </CardTitle>
          {Icon && (
            <div className={cn('p-2 rounded-lg', iconBgColor)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          )}
        </div>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-3xl font-bold text-gray-900">
            {formatValue(value)}
          </p>
          
          {comparison && (
            <div className="space-y-2">
              <div className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium',
                getTrendColor(comparison.trend)
              )}>
                {getTrendIcon(comparison.trend)}
                <span>{formatChange(comparison.change)}</span>
              </div>

              {showPreviousValue && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-gray-500 cursor-help">
                        <Info className="h-3 w-3" />
                        <span>vs previous period</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="space-y-1">
                        <p className="font-medium">Previous: {formatValue(comparison.previous)}</p>
                        <p className="text-xs text-gray-400">
                          {comparison.trend === 'up' ? 'Increased' : 
                           comparison.trend === 'down' ? 'Decreased' : 
                           'No change'} by {Math.abs(comparison.change).toFixed(1)}%
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
