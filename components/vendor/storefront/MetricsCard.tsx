'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  loading?: boolean;
}

export function MetricsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  description,
  className,
  loading = false
}: MetricsCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-3 w-3 text-muted-foreground" />;
    }
    if (change > 0) {
      return <TrendingUp className="h-3 w-3 text-green-600" />;
    }
    return <TrendingDown className="h-3 w-3 text-red-600" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) {
      return 'text-muted-foreground';
    }
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground flex-shrink-0">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold">{formatValue(value)}</div>
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
          {change !== undefined && (
            <>
              {getTrendIcon()}
              <span className={getTrendColor()}>
                {Math.abs(change).toFixed(1)}%
              </span>
            </>
          )}
          <span className="text-muted-foreground text-xs truncate">
            {changeLabel || description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

interface MetricsGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MetricsGrid({ children, className }: MetricsGridProps) {
  return (
    <div className={cn("grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </div>
  );
}