'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FulfillmentMetrics } from '@/types/vendor-analytics';
import {
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface FulfillmentScoreCardProps {
  metrics: FulfillmentMetrics;
  loading?: boolean;
}

export function FulfillmentScoreCard({ metrics, loading = false }: FulfillmentScoreCardProps) {
  if (loading) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>Loading fulfillment metrics...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours.toFixed(0)}h`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.8) return 'bg-emerald-50';
    if (score >= 0.6) return 'bg-amber-50';
    return 'bg-red-50';
  };

  const getScoreBorderColor = (score: number) => {
    if (score >= 0.8) return 'border-emerald-200';
    if (score >= 0.6) return 'border-amber-200';
    return 'border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Improvement';
  };

  const scorePercentage = Math.round(metrics.fulfillmentScore * 100);
  const scoreColor = getScoreColor(metrics.fulfillmentScore);
  const scoreBgColor = getScoreBgColor(metrics.fulfillmentScore);
  const scoreBorderColor = getScoreBorderColor(metrics.fulfillmentScore);
  const scoreLabel = getScoreLabel(metrics.fulfillmentScore);

  return (
    <Card className={`border-2 ${scoreBorderColor}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Fulfillment Performance</CardTitle>
            <CardDescription>
              Overall score based on speed and reliability
            </CardDescription>
          </div>
          <div className={`p-3 rounded-xl ${scoreBgColor} border ${scoreBorderColor}`}>
            <Zap className={`h-6 w-6 ${scoreColor}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Score */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Overall Score
                </p>
                <p className={`text-5xl font-bold ${scoreColor}`}>
                  {scorePercentage}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-lg font-semibold ${scoreColor}`}>
                  {scoreLabel}
                </p>
                <p className="text-sm text-gray-600">
                  out of 100
                </p>
              </div>
            </div>
            <Progress 
              value={scorePercentage} 
              className="h-3"
            />
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Average Fulfillment Time */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600 uppercase">
                  Avg Time
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatHours(metrics.averageFulfillmentTime)}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Order to delivery
              </p>
            </div>

            {/* On-Time Delivery Rate */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <p className="text-xs font-medium text-gray-600 uppercase">
                  On-Time Rate
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.onTimeDeliveryRate.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Delivered on time
              </p>
            </div>

            {/* Fastest Fulfillment */}
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-700 uppercase">
                  Fastest
                </p>
              </div>
              <p className="text-2xl font-bold text-emerald-900">
                {formatHours(metrics.fastestFulfillment)}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Best performance
              </p>
            </div>

            {/* Slowest Fulfillment */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <p className="text-xs font-medium text-red-700 uppercase">
                  Slowest
                </p>
              </div>
              <p className="text-2xl font-bold text-red-900">
                {formatHours(metrics.slowestFulfillment)}
              </p>
              <p className="text-xs text-red-700 mt-1">
                Needs attention
              </p>
            </div>
          </div>

          {/* Delayed Orders */}
          {metrics.delayedOrders > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {metrics.delayedOrders} Delayed {metrics.delayedOrders === 1 ? 'Order' : 'Orders'}
                  </p>
                  <p className="text-xs text-gray-700">
                    These orders took longer than expected to fulfill. 
                    Consider optimizing your fulfillment process to improve customer satisfaction.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {metrics.fulfillmentScore < 0.8 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                💡 Improvement Tips
              </p>
              <ul className="space-y-1 text-xs text-gray-700">
                {metrics.averageFulfillmentTime > 72 && (
                  <li>• Reduce average fulfillment time to under 3 days</li>
                )}
                {metrics.onTimeDeliveryRate < 90 && (
                  <li>• Aim for 90%+ on-time delivery rate</li>
                )}
                {metrics.delayedOrders > 5 && (
                  <li>• Review and optimize your fulfillment workflow</li>
                )}
                <li>• Faster fulfillment improves product rankings and customer satisfaction</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
