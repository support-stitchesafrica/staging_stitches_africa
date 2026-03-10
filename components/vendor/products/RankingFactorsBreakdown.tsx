'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RankingFactors } from '@/types/vendor-analytics';
import {
  MousePointer,
  ShoppingCart,
  Star,
  Truck,
  AlertCircle,
  Package,
  DollarSign,
  Heart,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight
} from 'lucide-react';

interface RankingFactorsBreakdownProps {
  factors: RankingFactors;
  previousFactors?: RankingFactors;
  showComparison?: boolean;
  onFactorClick?: (factorName: string) => void;
}

export function RankingFactorsBreakdown({
  factors,
  previousFactors,
  showComparison = false,
  onFactorClick
}: RankingFactorsBreakdownProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-emerald-600';
    if (score >= 0.4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.7) return 'bg-emerald-500';
    if (score >= 0.4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Very Good';
    if (score >= 0.5) return 'Good';
    if (score >= 0.3) return 'Fair';
    return 'Poor';
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getImpactLevel = (weight: number) => {
    if (weight >= 15) return 'High Impact';
    if (weight >= 10) return 'Medium Impact';
    return 'Low Impact';
  };

  const getImpactColor = (weight: number) => {
    if (weight >= 15) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (weight >= 10) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const rankingFactorsList = [
    {
      key: 'ctr',
      label: 'Click-Through Rate',
      value: factors.ctr,
      previousValue: previousFactors?.ctr,
      icon: MousePointer,
      weight: 15,
      description: 'Percentage of impressions that result in clicks',
      tips: [
        'Use high-quality, eye-catching product images',
        'Write compelling product titles',
        'Ensure accurate product categorization'
      ]
    },
    {
      key: 'conversionRate',
      label: 'Conversion Rate',
      value: factors.conversionRate,
      previousValue: previousFactors?.conversionRate,
      icon: ShoppingCart,
      weight: 20,
      description: 'Percentage of views that result in purchases',
      tips: [
        'Optimize product descriptions with detailed information',
        'Ensure competitive pricing',
        'Add multiple product images showing different angles',
        'Respond quickly to customer inquiries'
      ]
    },
    {
      key: 'rating',
      label: 'Customer Rating',
      value: factors.rating,
      previousValue: previousFactors?.rating,
      icon: Star,
      weight: 15,
      description: 'Average customer rating (normalized to 0-1 scale)',
      tips: [
        'Maintain high product quality',
        'Address negative reviews promptly',
        'Encourage satisfied customers to leave reviews',
        'Ensure product descriptions match actual items'
      ]
    },
    {
      key: 'fulfillmentSpeed',
      label: 'Fulfillment Speed',
      value: factors.fulfillmentSpeed,
      previousValue: previousFactors?.fulfillmentSpeed,
      icon: Truck,
      weight: 15,
      description: 'How quickly orders are processed and delivered',
      tips: [
        'Process orders within 24 hours',
        'Use reliable shipping partners',
        'Update order status promptly',
        'Communicate delivery timelines clearly'
      ]
    },
    {
      key: 'complaintScore',
      label: 'Complaint Score',
      value: factors.complaintScore,
      previousValue: previousFactors?.complaintScore,
      icon: AlertCircle,
      weight: 10,
      description: 'Customer satisfaction score (higher is better)',
      tips: [
        'Resolve customer issues quickly',
        'Maintain clear communication',
        'Ensure product quality control',
        'Offer fair return/exchange policies'
      ]
    },
    {
      key: 'stockHealth',
      label: 'Stock Health',
      value: factors.stockHealth,
      previousValue: previousFactors?.stockHealth,
      icon: Package,
      weight: 10,
      description: 'Inventory availability and management',
      tips: [
        'Maintain adequate stock levels',
        'Set up low-stock alerts',
        'Update inventory regularly',
        'Avoid frequent stockouts'
      ]
    },
    {
      key: 'priceCompetitiveness',
      label: 'Price Competitiveness',
      value: factors.priceCompetitiveness,
      previousValue: previousFactors?.priceCompetitiveness,
      icon: DollarSign,
      weight: 10,
      description: 'How competitive your pricing is compared to similar products',
      tips: [
        'Research competitor pricing',
        'Offer value for money',
        'Consider promotional pricing',
        'Highlight unique product features'
      ]
    },
    {
      key: 'engagementSignals',
      label: 'Engagement Signals',
      value: factors.engagementSignals,
      previousValue: previousFactors?.engagementSignals,
      icon: Heart,
      weight: 5,
      description: 'Customer engagement through wishlists, shares, and interactions',
      tips: [
        'Encourage social sharing',
        'Create shareable product content',
        'Engage with customer reviews',
        'Run promotional campaigns'
      ]
    }
  ];

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle>Ranking Factors Breakdown</CardTitle>
        <CardDescription>
          Detailed analysis of factors affecting your product's ranking
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-6">
          {rankingFactorsList.map((factor) => {
            const Icon = factor.icon;
            const percentage = factor.value * 100;
            const scoreColor = getScoreColor(factor.value);
            const change = factor.previousValue 
              ? ((factor.value - factor.previousValue) / factor.previousValue) * 100
              : 0;

            return (
              <div
                key={factor.key}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      factor.value >= 0.7
                        ? 'bg-emerald-50'
                        : factor.value >= 0.4
                        ? 'bg-amber-50'
                        : 'bg-red-50'
                    }`}>
                      <Icon className={`h-5 w-5 ${scoreColor}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {factor.label}
                        </h4>
                        <Badge variant="outline" className={getImpactColor(factor.weight)}>
                          {getImpactLevel(factor.weight)}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        {factor.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className={`text-2xl font-bold ${scoreColor}`}>
                      {percentage.toFixed(1)}%
                    </p>
                    <Badge className={`${getScoreBgColor(factor.value)} text-white border-0 text-xs mt-1`}>
                      {getScoreLabel(factor.value)}
                    </Badge>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getScoreBgColor(factor.value)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                {/* Weight and Change */}
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">
                      Weight: <span className="font-semibold text-gray-900">{factor.weight}%</span>
                    </span>
                    <span className="text-gray-600">
                      Contribution: <span className="font-semibold text-gray-900">
                        {((factor.value * factor.weight) / 100 * 100).toFixed(1)} points
                      </span>
                    </span>
                  </div>

                  {showComparison && factor.previousValue !== undefined && change !== 0 && (
                    <div className={`flex items-center gap-1 ${getChangeColor(change)}`}>
                      {change > 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span className="font-semibold">
                        {change > 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                      <span className="text-gray-600">vs last period</span>
                    </div>
                  )}
                </div>

                {/* Improvement Tips */}
                {factor.value < 0.7 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2 mb-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <h5 className="text-xs font-semibold text-blue-900">
                        How to Improve
                      </h5>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {factor.tips.map((tip, index) => (
                        <li key={index} className="text-xs text-blue-800 list-disc">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Button */}
                {onFactorClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={() => onFactorClick(factor.key)}
                  >
                    View Detailed Analysis
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Summary */}
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Overall Ranking Score
          </h4>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-700">
              Your product's overall ranking score is calculated by combining all factors 
              based on their respective weights.
            </p>
            <div className="text-right ml-4">
              <p className={`text-4xl font-bold ${getScoreColor(factors.overallScore / 100)}`}>
                {factors.overallScore.toFixed(0)}
              </p>
              <p className="text-xs text-gray-600">out of 100</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
