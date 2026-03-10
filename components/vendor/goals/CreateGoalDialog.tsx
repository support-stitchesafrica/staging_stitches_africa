'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PerformanceGoal } from '@/types/vendor-analytics';
import { goalTrackingService } from '@/lib/vendor/goal-tracking-service';

interface CreateGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGoalCreated: (goal: PerformanceGoal) => void;
  vendorId: string;
}

export function CreateGoalDialog({
  open,
  onOpenChange,
  onGoalCreated,
  vendorId
}: CreateGoalDialogProps) {
  const [metric, setMetric] = useState<PerformanceGoal['metric']>('revenue');
  const [targetValue, setTargetValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!targetValue || !deadline) {
      setError('Please fill in all fields');
      return;
    }

    const target = parseFloat(targetValue);
    if (isNaN(target) || target <= 0) {
      setError('Target value must be a positive number');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future');
      return;
    }

    setLoading(true);

    try {
      const goal = await goalTrackingService.createGoal(
        vendorId,
        metric,
        target,
        deadlineDate
      );

      onGoalCreated(goal);
      onOpenChange(false);
      
      // Reset form
      setMetric('revenue');
      setTargetValue('');
      setDeadline('');
    } catch (err) {
      setError('Failed to create goal. Please try again.');
      console.error('Error creating goal:', err);
    } finally {
      setLoading(false);
    }
  };

  const getMetricPlaceholder = () => {
    switch (metric) {
      case 'revenue':
        return '100000';
      case 'orders':
        return '50';
      case 'conversion_rate':
        return '5.0';
      case 'rating':
        return '4.5';
      case 'fulfillment_time':
        return '24';
      default:
        return '';
    }
  };

  const getMetricUnit = () => {
    switch (metric) {
      case 'revenue':
        return '$';
      case 'orders':
        return 'orders';
      case 'conversion_rate':
        return '%';
      case 'rating':
        return 'stars';
      case 'fulfillment_time':
        return 'hours';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Performance Goal</DialogTitle>
            <DialogDescription>
              Set a target for a specific metric to track your progress over time.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="metric">Metric</Label>
              <Select value={metric} onValueChange={(value) => setMetric(value as PerformanceGoal['metric'])}>
                <SelectTrigger id="metric">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="conversion_rate">Conversion Rate</SelectItem>
                  <SelectItem value="rating">Average Rating</SelectItem>
                  <SelectItem value="fulfillment_time">Fulfillment Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target">Target Value</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="target"
                  type="number"
                  step="any"
                  placeholder={getMetricPlaceholder()}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500 min-w-[60px]">
                  {getMetricUnit()}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
