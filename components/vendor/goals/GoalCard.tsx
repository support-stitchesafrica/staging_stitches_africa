'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PerformanceGoal } from '@/types/vendor-analytics';
import { goalTrackingService } from '@/lib/vendor/goal-tracking-service';
import { Calendar, Target, TrendingUp, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoalCardProps {
  goal: PerformanceGoal;
  onEdit?: (goal: PerformanceGoal) => void;
  onDelete?: (goalId: string) => void;
  className?: string;
}

export function GoalCard({ goal, onEdit, onDelete, className }: GoalCardProps) {
  const daysRemaining = goalTrackingService.getDaysRemaining(goal.deadline);
  const statusColor = goalTrackingService.getStatusColor(goal.status);
  const statusLabel = goalTrackingService.getStatusLabel(goal.status);
  const metricName = goalTrackingService.getMetricDisplayName(goal.metric);
  const formattedCurrent = goalTrackingService.formatMetricValue(goal.metric, goal.currentValue);
  const formattedTarget = goalTrackingService.formatMetricValue(goal.metric, goal.targetValue);

  const getProgressColor = () => {
    if (goal.status === 'achieved') return 'bg-green-500';
    if (goal.status === 'at_risk') return 'bg-yellow-500';
    if (goal.status === 'missed') return 'bg-red-500';
    return 'bg-blue-500';
  };

  return (
    <Card className={cn('border-gray-200 hover:shadow-md transition-shadow', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <CardTitle className="text-base font-semibold">
                {metricName} Goal
              </CardTitle>
            </div>
            <Badge className={cn('text-xs', statusColor)}>
              {statusLabel}
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(goal)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(goal.id)}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold">{goal.progress.toFixed(1)}%</span>
          </div>
          <Progress 
            value={Math.min(goal.progress, 100)} 
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
        </div>

        {/* Current vs Target */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Current</p>
            <p className="text-lg font-bold text-gray-900">{formattedCurrent}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500">Target</p>
            <p className="text-lg font-bold text-gray-900">{formattedTarget}</p>
          </div>
        </div>

        {/* Deadline */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {daysRemaining > 0 
                ? `${daysRemaining} days remaining`
                : daysRemaining === 0
                ? 'Due today'
                : `${Math.abs(daysRemaining)} days overdue`
              }
            </span>
          </div>
          
          {goal.status === 'on_track' && goal.progress > 0 && (
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>On pace</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
