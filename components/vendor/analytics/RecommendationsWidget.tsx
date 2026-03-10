/**
 * Recommendations Widget
 * Displays top recommendations on the analytics dashboard
 */

'use client';

import { useRecommendations } from '@/lib/vendor/useRecommendations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface RecommendationsWidgetProps {
  vendorId: string;
  maxItems?: number;
}

export function RecommendationsWidget({ vendorId, maxItems = 3 }: RecommendationsWidgetProps) {
  const { data: recommendations, isLoading } = useRecommendations(vendorId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations) {
    return null;
  }

  const {
    productRecommendations = [],
    storeRecommendations = [],
    fulfillmentRecommendations = [],
    trendingOpportunities = []
  } = recommendations;

  // Combine and sort by priority
  const allRecommendations = [
    ...productRecommendations.map(r => ({ ...r, source: 'product' as const })),
    ...storeRecommendations.map(r => ({ ...r, source: 'store' as const })),
    ...fulfillmentRecommendations.map(r => ({ ...r, source: 'fulfillment' as const }))
  ].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const topRecommendations = allRecommendations.slice(0, maxItems);
  const topOpportunity = trendingOpportunities[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Recommendations
            </CardTitle>
            <CardDescription>Actionable insights to improve performance</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/vendor/recommendations">
              View All <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topRecommendations.length === 0 && !topOpportunity ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recommendations at this time</p>
            <p className="text-xs mt-1">Keep up the great work!</p>
          </div>
        ) : (
          <>
            {topRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={rec.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rec.source}
                    </Badge>
                  </div>
                </div>
                <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {rec.description}
                </p>
                {rec.impact && (
                  <p className="text-xs text-green-600 font-medium mt-2">
                    {rec.impact}
                  </p>
                )}
              </div>
            ))}

            {topOpportunity && (
              <div className="p-3 border border-green-200 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <Badge variant="outline" className="bg-white text-green-700 border-green-200">
                    Opportunity
                  </Badge>
                </div>
                <h4 className="font-medium text-sm mb-1">{topOpportunity.title}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {topOpportunity.description}
                </p>
                <p className="text-xs text-green-600 font-medium mt-2">
                  +{(topOpportunity.metrics.growthRate * 100).toFixed(0)}% growth
                </p>
              </div>
            )}

            <Button asChild variant="outline" className="w-full" size="sm">
              <Link href="/vendor/recommendations">
                View All Recommendations
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
