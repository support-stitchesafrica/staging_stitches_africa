'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  currency?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  description,
  change,
  changeLabel,
  icon: Icon,
  iconColor = 'text-emerald-600',
  iconBgColor = 'bg-emerald-100',
  trend,
  currency,
  loading = false,
  className
}: MetricCardProps) {
  // Auto-detect trend from change if not explicitly provided
  const effectiveTrend = trend || (change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : undefined);

  const formatValue = (val: string | number) => {
    if (typeof val === 'number' && currency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return val;
  };

  const formatChange = (val: number) => {
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)}%`;
  };

  const getTrendIcon = () => {
    switch (effectiveTrend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      case 'neutral':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (effectiveTrend) {
      case 'up':
        return 'text-emerald-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
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
    <Card className={cn('border-gray-200', className)}>
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
        <div className="space-y-2">
          <p className="text-3xl font-bold text-gray-900">
            {formatValue(value)}
          </p>
          
          {(change !== undefined || changeLabel) && (
            <div className="flex items-center gap-2">
              {change !== undefined && (
                <div className={cn('flex items-center gap-1 text-sm font-medium', getTrendColor())}>
                  {getTrendIcon()}
                  <span>{formatChange(change)}</span>
                </div>
              )}
              {changeLabel && (
                <span className="text-sm text-gray-600">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
