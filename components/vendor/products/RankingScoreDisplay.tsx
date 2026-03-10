'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RankingFactors } from '@/types/vendor-analytics';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  MousePointer,
  ShoppingCart,
  Star,
  Truck,
  AlertCircle,
  Package,
  DollarSign,
  Heart
} from 'lucide-react';

interface RankingScoreDisplayProps {
  factors: RankingFactors;
  title?: string;
  description?: string;
  showDetails?: boolean;
}

export function RankingScoreDisplay({
  factors,
  title = 'Ranking Score',
  description = 'Product ranking factors breakdown',
  showDetails = true
}: RankingScoreDisplayProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-emerald-600';
    if (score >= 0.4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 0.7) return 'bg-emerald-50 border-emerald-200';
    if (score >= 0.4) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.7) return 'Excellent';
    if (score >= 0.4) return 'Good';
    return 'Needs Improvement';
  };

  const rankingFactorsList = [
    {
      label: 'Click-Through Rate',
      value: factors.ctr,
      icon: MousePointer,
      weight: 15,
      description: 'How often people click on your product'
    },
    {
      label: 'Conversion Rate',
      value: factors.conversionRate,
      icon: ShoppingCart,
      weight: 20,
      description: 'Percentage of views that result in sales'
    },
    {
      label: 'Rating',
      value: factors.rating / 5, // Normalize to 0-1
      icon: Star,
      weight: 15,
      description: 'Average customer rating'
    },
    {
      label: 'Fulfillment Speed',
      value: factors.fulfillmentSpeed,
      icon: Truck,
      weight: 15,
      description: 'How quickly you deliver orders'
    },
    {
      label: 'Complaint Score',
      value: factors.complaintScore,
      icon: AlertCircle,
      weight: 10,
      description: 'Customer complaint rate (lower is better)'
    },
    {
      label: 'Stock Health',
      value: factors.stockHealth,
      icon: Package,
      weight: 10,
      description: 'Inventory availability'
    },
    {
      label: 'Price Competitiveness',
      value: factors.priceCompetitiveness,
      icon: DollarSign,
      weight: 10,
      description: 'How competitive your pricing is'
    },
    {
      label: 'Engagement Signals',
      value: factors.engagementSignals,
      icon: Heart,
      weight: 5,
      description: 'Wishlists, shares, and other engagement'
    }
  ];

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 mb-1">Overall Score</p>
            <div className="flex items-center gap-2">
              <p className={`text-3xl font-bold ${getScoreColor(factors.overallScore / 100)}`}>
                {factors.overallScore.toFixed(0)}
              </p>
              <span className="text-gray-600">/100</span>
            </div>
            <Badge className={getScoreBgColor(factors.overallScore / 100)}>
              {getScoreLabel(factors.overallScore / 100)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent>
          <div className="space-y-4">
            {rankingFactorsList.map((factor) => {
              const Icon = factor.icon;
              const percentage = factor.value * 100;
              const scoreColor = getScoreColor(factor.value);

              return (
                <div key={factor.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${scoreColor}`} />
                      <span className="text-sm font-medium text-gray-900">
                        {factor.label}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {factor.weight}%
                      </Badge>
                    </div>
                    <span className={`text-sm font-semibold ${scoreColor}`}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          factor.value >= 0.7
                            ? 'bg-emerald-500'
                            : factor.value >= 0.4
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-600">{factor.description}</p>
                </div>
              );
            })}
          </div>

          {/* Score Interpretation */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              How Ranking Works
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your product's ranking score determines its visibility in search results and category pages. 
              Higher scores mean better placement. Focus on improving factors with lower scores to boost 
              your overall ranking.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
