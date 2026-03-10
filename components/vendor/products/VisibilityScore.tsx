'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VisibilityScoreProps {
  score: number;
  rankingPosition?: number;
  categoryRankingPosition?: number;
  change?: number;
  title?: string;
  description?: string;
  showRankingLink?: boolean;
  productId?: string;
}

export function VisibilityScore({
  score,
  rankingPosition,
  categoryRankingPosition,
  change,
  title = 'Visibility Score',
  description = 'How discoverable your product is on the platform',
  showRankingLink = false,
  productId
}: VisibilityScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-emerald-500 to-emerald-600';
    if (score >= 40) return 'from-amber-500 to-amber-600';
    return 'from-red-500 to-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 50) return 'Good';
    if (score >= 30) return 'Fair';
    return 'Poor';
  };

  const getTrendIcon = () => {
    if (!change) return <Minus className="h-4 w-4" />;
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    return <TrendingDown className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (!change) return 'text-gray-600';
    if (change > 0) return 'text-emerald-600';
    return 'text-red-600';
  };

  const getTrendLabel = () => {
    if (!change) return 'No change';
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(0)} points`;
  };

  // Calculate the angle for the gauge (0-180 degrees)
  const gaugeAngle = (score / 100) * 180;

  const router = useRouter();

  return (
    <Card className="border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-600" />
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Circular Score Display */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-48 h-48 mb-4">
            {/* Background Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              {/* Background arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="16"
                strokeDasharray="251.2 251.2"
                strokeDashoffset="125.6"
              />
              {/* Score arc */}
              <circle
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={`url(#scoreGradient-${score})`}
                strokeWidth="16"
                strokeDasharray="251.2 251.2"
                strokeDashoffset={251.2 - (251.2 * score) / 100}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              {/* Gradient definition */}
              <defs>
                <linearGradient id={`scoreGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={getScoreBgColor(score)} stopOpacity="1" />
                  <stop offset="100%" className={getScoreBgColor(score)} stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* Score Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className={`text-5xl font-bold ${getScoreColor(score)}`}>
                {score.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">out of 100</p>
            </div>
          </div>

          {/* Score Label */}
          <Badge className={`${getScoreBgColor(score)} text-white border-0 px-4 py-1`}>
            {getScoreLabel(score)}
          </Badge>

          {/* Change Indicator */}
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-3 ${getTrendColor()}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">{getTrendLabel()}</span>
              <span className="text-xs text-gray-600">vs last period</span>
            </div>
          )}
        </div>

        {/* Ranking Positions */}
        {(rankingPosition !== undefined || categoryRankingPosition !== undefined) && (
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            {rankingPosition !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Overall Rank</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{rankingPosition}
                </p>
              </div>
            )}
            {categoryRankingPosition !== undefined && (
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Category Rank</p>
                <p className="text-2xl font-bold text-gray-900">
                  #{categoryRankingPosition}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Score Explanation */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            What does this mean?
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed">
            {score >= 70 && (
              "Your product has excellent visibility! It's likely to appear in top search results and category pages."
            )}
            {score >= 40 && score < 70 && (
              "Your product has good visibility but there's room for improvement. Focus on boosting key ranking factors."
            )}
            {score < 40 && (
              "Your product's visibility needs improvement. Review the ranking factors and implement the recommendations to increase discoverability."
            )}
          </p>
        </div>

        {/* Ranking Details Link */}
        {showRankingLink && productId && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => router.push(`/vendor/products/${productId}/ranking`)}
          >
            View Detailed Ranking Analysis
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
