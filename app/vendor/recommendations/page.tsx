/**
 * Vendor Recommendations Dashboard
 * Displays actionable recommendations for improving store performance
 * Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5
 */

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRecommendations } from '@/lib/vendor/useRecommendations';
import { RecommendationCard } from '@/components/vendor/shared/RecommendationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Package, 
  Store, 
  Truck, 
  Lightbulb,
  ArrowRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function RecommendationsPage() {
  const { user } = useAuth();
  const vendorId = user?.uid;

  const { data: recommendations, isLoading, error } = useRecommendations(vendorId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <p>Failed to load recommendations. Please try again later.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    productRecommendations = [],
    storeRecommendations = [],
    fulfillmentRecommendations = [],
    trendingOpportunities = []
  } = recommendations || {};

  const totalRecommendations = 
    productRecommendations.length + 
    storeRecommendations.length + 
    fulfillmentRecommendations.length;

  const highPriorityCount = [
    ...productRecommendations,
    ...storeRecommendations,
    ...fulfillmentRecommendations
  ].filter(r => r.priority === 'high').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recommendations</h1>
          <p className="text-muted-foreground mt-1">
            Actionable insights to improve your store performance
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{totalRecommendations}</p>
                <p className="text-xs text-muted-foreground">Total Recommendations</p>
              </div>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{highPriorityCount}</p>
                <p className="text-xs text-muted-foreground">High Priority</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* No recommendations state */}
      {totalRecommendations === 0 && trendingOpportunities.length === 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-medium">Great job! Your store is performing well.</p>
            </div>
            <p className="text-sm text-green-600 mt-2">
              We'll notify you when we identify opportunities for improvement.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({totalRecommendations})
          </TabsTrigger>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products ({productRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="store">
            <Store className="h-4 w-4 mr-2" />
            Store ({storeRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="fulfillment">
            <Truck className="h-4 w-4 mr-2" />
            Fulfillment ({fulfillmentRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="trending">
            <TrendingUp className="h-4 w-4 mr-2" />
            Opportunities ({trendingOpportunities.length})
          </TabsTrigger>
        </TabsList>

        {/* All Recommendations */}
        <TabsContent value="all" className="space-y-4">
          {highPriorityCount > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                High Priority
              </h2>
              <div className="space-y-3">
                {productRecommendations
                  .filter(r => r.priority === 'high')
                  .map((rec, idx) => (
                    <RecommendationCard
                      key={`product-${idx}`}
                      type="improvement"
                      priority={rec.priority}
                      title={rec.title}
                      description={rec.description}
                      impact={rec.impact}
                      actionUrl={rec.actionUrl}
                      actionLabel="View Product"
                    />
                  ))}
                {storeRecommendations
                  .filter(r => r.priority === 'high')
                  .map((rec, idx) => (
                    <RecommendationCard
                      key={`store-${idx}`}
                      type="improvement"
                      priority={rec.priority}
                      title={rec.title}
                      description={rec.description}
                      impact={rec.impact}
                      actionUrl={rec.actionUrl}
                      actionLabel="View Details"
                    />
                  ))}
                {fulfillmentRecommendations
                  .filter(r => r.priority === 'high')
                  .map((rec, idx) => (
                    <RecommendationCard
                      key={`fulfillment-${idx}`}
                      type="warning"
                      priority={rec.priority}
                      title={rec.title}
                      description={rec.description}
                      impact={rec.impact}
                      actionUrl="/vendor/analytics/orders"
                      actionLabel="View Orders"
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Medium and Low Priority */}
          {totalRecommendations > highPriorityCount && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Other Recommendations</h2>
              <div className="space-y-3">
                {[...productRecommendations, ...storeRecommendations, ...fulfillmentRecommendations]
                  .filter(r => r.priority !== 'high')
                  .map((rec, idx) => (
                    <RecommendationCard
                      key={`other-${idx}`}
                      type="info"
                      priority={rec.priority}
                      title={rec.title}
                      description={rec.description}
                      impact={rec.impact}
                      actionUrl={'actionUrl' in rec ? rec.actionUrl : undefined}
                      actionLabel="View Details"
                    />
                  ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Product Recommendations */}
        <TabsContent value="products" className="space-y-4">
          {productRecommendations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No product recommendations at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {productRecommendations.map((rec, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                            {rec.priority}
                          </Badge>
                          <Badge variant="outline">{rec.type}</Badge>
                        </div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <CardDescription className="mt-1">{rec.productName}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{rec.description}</p>
                    {rec.metrics && (
                      <div className="bg-muted p-3 rounded-md mb-3">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Current</p>
                            <p className="font-semibold">{rec.metrics.currentValue.toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Target</p>
                            <p className="font-semibold">{rec.metrics.targetValue}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Impact</p>
                            <p className="font-semibold text-green-600">{rec.metrics.potentialImpact}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-green-600 font-medium">{rec.impact}</p>
                      <Button asChild size="sm">
                        <Link href={rec.actionUrl}>
                          View Product <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Store Recommendations */}
        <TabsContent value="store" className="space-y-4">
          {storeRecommendations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No store recommendations at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {storeRecommendations.map((rec, idx) => (
                <RecommendationCard
                  key={idx}
                  type="improvement"
                  priority={rec.priority}
                  title={rec.title}
                  description={rec.description}
                  impact={rec.impact}
                  actionUrl={rec.actionUrl}
                  actionLabel="View Details"
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Fulfillment Recommendations */}
        <TabsContent value="fulfillment" className="space-y-4">
          {fulfillmentRecommendations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <Truck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No fulfillment recommendations at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {fulfillmentRecommendations.map((rec, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">{rec.type}</Badge>
                    </div>
                    <CardTitle className="text-lg">{rec.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{rec.description}</p>
                    <div className="bg-muted p-3 rounded-md mb-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current</p>
                          <p className="font-semibold">{rec.currentMetric.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Target</p>
                          <p className="font-semibold text-green-600">{rec.targetMetric}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-green-600 font-medium">{rec.impact}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Trending Opportunities */}
        <TabsContent value="trending" className="space-y-4">
          {trendingOpportunities.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No trending opportunities at this time</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {trendingOpportunities.map((opp, idx) => (
                <Card key={idx} className="hover:shadow-md transition-shadow border-green-200">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {opp.type.replace('_', ' ')}
                      </Badge>
                      {opp.category && (
                        <Badge variant="secondary">{opp.category}</Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">{opp.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-3">{opp.description}</p>
                    <div className="bg-green-50 p-3 rounded-md mb-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Growth Rate</p>
                          <p className="font-semibold text-green-600">
                            +{(opp.metrics.growthRate * 100).toFixed(0)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Demand Increase</p>
                          <p className="font-semibold">{opp.metrics.demandIncrease}</p>
                        </div>
                        {opp.metrics.competitorCount > 0 && (
                          <div>
                            <p className="text-muted-foreground">Competitors</p>
                            <p className="font-semibold">{opp.metrics.competitorCount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {opp.actionUrl && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={opp.actionUrl}>
                          Explore <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
