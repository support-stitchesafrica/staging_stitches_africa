'use client';

import React, { useState, useEffect } from 'react';
import { AtlasRole } from '@/lib/atlas/types';
import { DateRange, CrossAnalyticsInsights } from '@/lib/atlas/unified-analytics/types';
import  LoadingSpinner  from '@/components/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertCircle, CheckCircle, Target, Lightbulb, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export interface CrossAnalyticsSectionProps {
  dateRange: DateRange;
  userRole: AtlasRole;
}

/**
 * Shows cross-analytics insights and correlations
 * Displays unified performance metrics and optimization recommendations
 */
export const CrossAnalyticsSection: React.FC<CrossAnalyticsSectionProps> = ({
  dateRange,
  userRole
}) => {
  const [data, setData] = useState<CrossAnalyticsInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCrossAnalytics();
  }, [dateRange, userRole]);

  const loadCrossAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual service call
      // const service = new UnifiedAnalyticsService(...);
      // const analyticsData = await service.getCrossAnalyticsInsights(dateRange, userRole);
      
      // Mock data for now
      const mockData: CrossAnalyticsInsights = {
        vendorBogoCorrelation: {
          correlation: 0.73,
          strength: 'strong',
          significance: 0.95
        },
        storefrontVendorCorrelation: {
          correlation: 0.68,
          strength: 'moderate',
          significance: 0.89
        },
        campaignStorefrontImpact: [
          {
            campaignId: '1',
            campaignName: 'Summer Fashion BOGO',
            storefrontImpact: [
              {
                storefrontId: '1',
                storefrontName: 'Fashion Forward Store',
                impactScore: 0.85,
                revenueIncrease: 12500
              },
              {
                storefrontId: '2',
                storefrontName: 'Style Central Shop',
                impactScore: 0.72,
                revenueIncrease: 8900
              }
            ]
          },
          {
            campaignId: '2',
            campaignName: 'Weekend Special BOGO',
            storefrontImpact: [
              {
                storefrontId: '3',
                storefrontName: 'Trendy Threads Boutique',
                impactScore: 0.68,
                revenueIncrease: 6700
              }
            ]
          }
        ],
        unifiedPerformanceScore: 78.5,
        optimizationRecommendations: [
          {
            type: 'cross-analytics',
            priority: 'high',
            title: 'Leverage Strong Vendor-BOGO Correlation',
            description: 'High correlation (0.73) between vendor performance and BOGO campaign success suggests strategic opportunities',
            expectedImpact: 'Potential 20-30% increase in campaign effectiveness',
            actionItems: [
              'Target BOGO campaigns to top-performing vendors',
              'Create vendor-specific promotional strategies',
              'Analyze successful vendor-campaign combinations'
            ]
          },
          {
            type: 'storefront',
            priority: 'medium',
            title: 'Optimize Storefront-Vendor Alignment',
            description: 'Moderate correlation (0.68) indicates room for improvement in storefront-vendor synergy',
            expectedImpact: 'Potential 15-25% improvement in conversion rates',
            actionItems: [
              'Improve vendor product presentation on storefronts',
              'Enhance cross-vendor product recommendations',
              'Optimize storefront layouts for vendor discovery'
            ]
          },
          {
            type: 'bogo',
            priority: 'medium',
            title: 'Expand High-Impact Campaign Strategies',
            description: 'Summer Fashion BOGO shows strong storefront impact across multiple locations',
            expectedImpact: 'Potential 25-35% increase in campaign reach',
            actionItems: [
              'Replicate successful campaign elements',
              'Expand to additional storefronts',
              'Create seasonal campaign templates'
            ]
          }
        ]
      };

      setData(mockData);
    } catch (err) {
      console.error('Error loading cross-analytics:', err);
      setError('Failed to load cross-analytics data');
      toast.error('Failed to load cross-analytics', {
        description: 'Please try refreshing the page'
      });
    } finally {
      setLoading(false);
    }
  };

  const getCorrelationColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'weak':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold text-ga-primary mb-2">
          Error Loading Data
        </h2>
        <p className="text-ga-secondary mb-4">
          {error || 'Unable to load cross-analytics data'}
        </p>
        <button
          onClick={loadCrossAnalytics}
          className="px-4 py-2 bg-ga-blue text-white rounded-lg hover:bg-ga-blue/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ga-primary">Cross-Analytics Insights</h1>
        <p className="text-ga-secondary">
          Correlations and insights across vendor, BOGO, and storefront analytics
        </p>
      </div>

      {/* Unified Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Unified Performance Score</span>
          </CardTitle>
          <CardDescription>
            Overall performance across all analytics dimensions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold text-ga-primary">
              {data.unifiedPerformanceScore.toFixed(1)}
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${data.unifiedPerformanceScore}%` }}
                />
              </div>
              <p className="text-sm text-ga-secondary mt-2">
                Score based on weighted average of vendor, BOGO, and storefront performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor-BOGO Correlation</CardTitle>
            <CardDescription>
              Relationship between vendor performance and BOGO campaign success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Correlation Coefficient</span>
                <span className="text-2xl font-bold text-ga-primary">
                  {data.vendorBogoCorrelation.correlation.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Strength</span>
                <Badge className={getCorrelationColor(data.vendorBogoCorrelation.strength)}>
                  {data.vendorBogoCorrelation.strength}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statistical Significance</span>
                <span className="text-sm font-semibold">
                  {(data.vendorBogoCorrelation.significance * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${Math.abs(data.vendorBogoCorrelation.correlation) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storefront-Vendor Correlation</CardTitle>
            <CardDescription>
              Relationship between storefront performance and vendor success
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Correlation Coefficient</span>
                <span className="text-2xl font-bold text-ga-primary">
                  {data.storefrontVendorCorrelation.correlation.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Strength</span>
                <Badge className={getCorrelationColor(data.storefrontVendorCorrelation.strength)}>
                  {data.storefrontVendorCorrelation.strength}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statistical Significance</span>
                <span className="text-sm font-semibold">
                  {(data.storefrontVendorCorrelation.significance * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${Math.abs(data.storefrontVendorCorrelation.correlation) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Storefront Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Storefront Impact Analysis</CardTitle>
          <CardDescription>
            How BOGO campaigns affect individual storefront performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {data.campaignStorefrontImpact.map((campaign) => (
              <div key={campaign.campaignId} className="border rounded-lg p-4">
                <h3 className="font-semibold text-ga-primary mb-3">{campaign.campaignName}</h3>
                <div className="space-y-3">
                  {campaign.storefrontImpact.map((impact) => (
                    <div key={impact.storefrontId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-ga-primary">{impact.storefrontName}</h4>
                        <p className="text-sm text-ga-secondary">
                          Impact Score: {(impact.impactScore * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +${impact.revenueIncrease.toLocaleString()}
                        </div>
                        <div className="text-sm text-ga-secondary">
                          revenue increase
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>
            Data-driven recommendations to improve overall performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.optimizationRecommendations.map((recommendation, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getPriorityIcon(recommendation.priority)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-ga-primary">{recommendation.title}</h3>
                      <Badge 
                        variant={recommendation.priority === 'high' ? 'destructive' : 
                                recommendation.priority === 'medium' ? 'default' : 'secondary'}
                      >
                        {recommendation.priority} priority
                      </Badge>
                    </div>
                    <p className="text-ga-secondary mb-3">{recommendation.description}</p>
                    <div className="bg-blue-50 p-3 rounded-lg mb-3">
                      <p className="text-sm font-medium text-blue-800">
                        Expected Impact: {recommendation.expectedImpact}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-ga-primary mb-2">Action Items:</h4>
                      <ul className="space-y-1">
                        {recommendation.actionItems.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start space-x-2 text-sm text-ga-secondary">
                            <span className="text-ga-blue mt-1">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};