'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  TrendingUp,
  AlertTriangle,
  Info,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type RecommendationType = 'improvement' | 'opportunity' | 'warning' | 'info';
export type RecommendationPriority = 'high' | 'medium' | 'low';

interface RecommendationCardProps {
  title: string;
  description: string;
  type?: RecommendationType;
  priority?: RecommendationPriority;
  impact?: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissable?: boolean;
  className?: string;
}

const typeConfig: Record<RecommendationType, {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBgColor: string;
  borderColor: string;
}> = {
  improvement: {
    icon: Lightbulb,
    iconColor: 'text-blue-600',
    iconBgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  opportunity: {
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBgColor: 'bg-amber-100',
    borderColor: 'border-amber-200'
  },
  info: {
    icon: Info,
    iconColor: 'text-gray-600',
    iconBgColor: 'bg-gray-100',
    borderColor: 'border-gray-200'
  }
};

const priorityConfig: Record<RecommendationPriority, {
  label: string;
  color: string;
}> = {
  high: {
    label: 'High Priority',
    color: 'bg-red-100 text-red-700 border-red-200'
  },
  medium: {
    label: 'Medium Priority',
    color: 'bg-amber-100 text-amber-700 border-amber-200'
  },
  low: {
    label: 'Low Priority',
    color: 'bg-blue-100 text-blue-700 border-blue-200'
  }
};

export function RecommendationCard({
  title,
  description,
  type = 'improvement',
  priority = 'medium',
  impact,
  actionLabel = 'Take Action',
  actionUrl,
  onAction,
  onDismiss,
  dismissable = true,
  className
}: RecommendationCardProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  const priorityInfo = priorityConfig[priority];

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionUrl) {
      window.location.href = actionUrl;
    }
  };

  return (
    <Card className={cn('border-l-4', config.borderColor, className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={cn('p-2 rounded-lg mt-0.5', config.iconBgColor)}>
              <Icon className={cn('h-5 w-5', config.iconColor)} />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{title}</CardTitle>
                <Badge
                  variant="outline"
                  className={cn('text-xs', priorityInfo.color)}
                >
                  {priorityInfo.label}
                </Badge>
              </div>
              <CardDescription className="text-sm">
                {description}
              </CardDescription>
            </div>
          </div>
          {dismissable && onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="h-8 w-8 shrink-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {impact && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm font-medium text-gray-700 mb-1">
                Expected Impact
              </p>
              <p className="text-sm text-gray-600">{impact}</p>
            </div>
          )}
          {(onAction || actionUrl) && (
            <Button
              onClick={handleAction}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RecommendationListProps {
  recommendations: Array<Omit<RecommendationCardProps, 'onDismiss'> & { id: string }>;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function RecommendationList({
  recommendations,
  onDismiss,
  className
}: RecommendationListProps) {
  if (recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Lightbulb className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            No recommendations at this time
          </p>
          <p className="text-sm text-gray-600 max-w-md">
            You're doing great! Keep up the good work and check back later for new insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {recommendations.map((recommendation) => (
        <RecommendationCard
          key={recommendation.id}
          {...recommendation}
          onDismiss={onDismiss ? () => onDismiss(recommendation.id) : undefined}
        />
      ))}
    </div>
  );
}
