'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProductAnalytics } from '@/types/vendor-analytics';
import {
  Eye,
  ShoppingCart,
  TrendingUp,
  Star,
  Package,
  DollarSign,
  MousePointer,
  Truck,
  AlertCircle,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatUSD } from '@/lib/utils/currency';

interface ProductComparisonTableProps {
  products: ProductAnalytics[];
}

export function ProductComparisonTable({ 
  products
}: ProductComparisonTableProps) {
  const router = useRouter();

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <ArrowUpRight className="h-3 w-3" />;
    if (change < 0) return <ArrowDownRight className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-emerald-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  const getBestValue = (values: (number | string | boolean)[], higherIsBetter: boolean = true) => {
    const numericValues = values.filter(v => typeof v === 'number') as number[];
    if (numericValues.length === 0) return null;
    if (higherIsBetter) {
      return Math.max(...numericValues);
    }
    return Math.min(...numericValues);
  };

  const isBestValue = (value: number | string | boolean, values: (number | string | boolean)[], higherIsBetter: boolean = true) => {
    if (typeof value !== 'number') return false;
    return value === getBestValue(values, higherIsBetter);
  };

  // Define row type
  type ComparisonRow = {
    label: string;
    icon: any;
    getValue: (p: ProductAnalytics) => any;
    format: (v: any) => any;
    higherIsBetter: boolean | null;
    showChange?: boolean;
    getChange?: (p: ProductAnalytics) => number;
  };

  // Comparison sections
  const comparisonSections = [
    {
      title: 'Overview',
      rows: [
        {
          label: 'Product ID',
          icon: Package,
          getValue: (p: ProductAnalytics) => p.productId,
          format: (v: any) => v,
          higherIsBetter: null
        },
        {
          label: 'Category',
          icon: null,
          getValue: (p: ProductAnalytics) => p.category,
          format: (v: any) => v,
          higherIsBetter: null
        },
        {
          label: 'Trending',
          icon: TrendingUp,
          getValue: (p: ProductAnalytics) => p.isTrending,
          format: (v: boolean) => v ? 'Yes' : 'No',
          higherIsBetter: true
        },
        {
          label: 'Stock Level',
          icon: Package,
          getValue: (p: ProductAnalytics) => p.stockLevel,
          format: (v: number) => `${v} units`,
          higherIsBetter: true
        }
      ]
    },
    {
      title: 'Performance Metrics',
      rows: [
        {
          label: 'Total Views',
          icon: Eye,
          getValue: (p: ProductAnalytics) => p.views,
          format: (v: number) => v.toLocaleString(),
          higherIsBetter: true,
          showChange: true,
          getChange: (p: ProductAnalytics) => p.viewsChange
        },
        {
          label: 'Sales Count',
          icon: ShoppingCart,
          getValue: (p: ProductAnalytics) => p.salesCount,
          format: (v: number) => v.toLocaleString(),
          higherIsBetter: true
        },
        {
          label: 'Revenue',
          icon: DollarSign,
          getValue: (p: ProductAnalytics) => p.revenue,
          format: (v: number) => formatUSD(v),
          higherIsBetter: true
        },
        {
          label: 'Add to Cart Rate',
          icon: ShoppingCart,
          getValue: (p: ProductAnalytics) => p.addToCartRate,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: true
        },
        {
          label: 'Conversion Rate',
          icon: TrendingUp,
          getValue: (p: ProductAnalytics) => p.conversionRate,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: true
        }
      ]
    },
    {
      title: 'Customer Feedback',
      rows: [
        {
          label: 'Average Rating',
          icon: Star,
          getValue: (p: ProductAnalytics) => p.averageRating,
          format: (v: number) => v.toFixed(1),
          higherIsBetter: true
        },
        {
          label: 'Review Count',
          icon: null,
          getValue: (p: ProductAnalytics) => p.reviewCount,
          format: (v: number) => v.toLocaleString(),
          higherIsBetter: true
        },
        {
          label: 'Positive Comments',
          icon: null,
          getValue: (p: ProductAnalytics) => p.customerComments.positive,
          format: (v: number) => v.toLocaleString(),
          higherIsBetter: true
        },
        {
          label: 'Negative Comments',
          icon: null,
          getValue: (p: ProductAnalytics) => p.customerComments.negative,
          format: (v: number) => v.toLocaleString(),
          higherIsBetter: false
        }
      ]
    },
    {
      title: 'Visibility & Ranking',
      rows: [
        {
          label: 'Visibility Score',
          icon: Eye,
          getValue: (p: ProductAnalytics) => p.visibilityScore,
          format: (v: number) => `${v}/100`,
          higherIsBetter: true
        },
        {
          label: 'Ranking Position',
          icon: null,
          getValue: (p: ProductAnalytics) => p.rankingPosition,
          format: (v: number) => `#${v}`,
          higherIsBetter: false
        },
        {
          label: 'Overall Ranking Score',
          icon: null,
          getValue: (p: ProductAnalytics) => p.rankingFactors.overallScore,
          format: (v: number) => `${v.toFixed(0)}/100`,
          higherIsBetter: true
        }
      ]
    },
    {
      title: 'Ranking Factors',
      rows: [
        {
          label: 'Click-Through Rate',
          icon: MousePointer,
          getValue: (p: ProductAnalytics) => p.rankingFactors.ctr,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: true
        },
        {
          label: 'Fulfillment Speed',
          icon: Truck,
          getValue: (p: ProductAnalytics) => p.rankingFactors.fulfillmentSpeed,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: true
        },
        {
          label: 'Complaint Score',
          icon: AlertCircle,
          getValue: (p: ProductAnalytics) => p.rankingFactors.complaintScore,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: false
        },
        {
          label: 'Stock Health',
          icon: Package,
          getValue: (p: ProductAnalytics) => p.rankingFactors.stockHealth,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: true
        },
        {
          label: 'Price Competitiveness',
          icon: DollarSign,
          getValue: (p: ProductAnalytics) => p.rankingFactors.priceCompetitiveness,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: true
        },
        {
          label: 'Engagement Signals',
          icon: Heart,
          getValue: (p: ProductAnalytics) => p.rankingFactors.engagementSignals,
          format: (v: number) => formatPercentage(v),
          higherIsBetter: true
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {comparisonSections.map((section) => (
        <Card key={section.title} className="border-gray-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {section.title}
            </h3>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      Metric
                    </th>
                    {products.map((product) => (
                      <th
                        key={product.productId}
                        className="text-center py-3 px-4 text-sm font-medium text-gray-900"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="font-semibold">{product.productId}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/vendor/products/${product.productId}/analytics`)}
                            className="h-7 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.rows.map((row: ComparisonRow) => {
                    const values = products.map(p => row.getValue(p));
                    const Icon = row.icon;

                    return (
                      <tr key={row.label} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4 text-gray-600" />}
                            <span className="text-sm text-gray-900">{row.label}</span>
                          </div>
                        </td>
                        {products.map((product, index) => {
                          const value = values[index];
                          const isBest = row.higherIsBetter !== null && 
                            isBestValue(value, values, row.higherIsBetter);

                          return (
                            <td
                              key={product.productId}
                              className="py-3 px-4 text-center"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <span
                                  className={`text-sm font-medium ${
                                    isBest ? 'text-emerald-600 font-semibold' : 'text-gray-900'
                                  }`}
                                >
                                  {row.format(value)}
                                </span>
                                {row.showChange && row.getChange && (
                                  <div className={`flex items-center gap-1 text-xs ${getTrendColor(row.getChange(product))}`}>
                                    {getTrendIcon(row.getChange(product))}
                                    <span>{Math.abs(row.getChange(product)).toFixed(1)}%</span>
                                  </div>
                                )}
                                {isBest && (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                    Best
                                  </Badge>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {section.rows.map((row: ComparisonRow) => {
                const values = products.map(p => row.getValue(p));
                const Icon = row.icon;

                return (
                  <div key={row.label} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      {Icon && <Icon className="h-4 w-4 text-gray-600" />}
                      <span className="text-sm font-medium text-gray-900">{row.label}</span>
                    </div>
                    <div className="space-y-2">
                      {products.map((product, index) => {
                        const value = values[index];
                        const isBest = row.higherIsBetter !== null && 
                          isBestValue(value, values, row.higherIsBetter);

                        return (
                          <div
                            key={product.productId}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-xs text-gray-600">{product.productId}</span>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-medium ${
                                  isBest ? 'text-emerald-600 font-semibold' : 'text-gray-900'
                                }`}
                              >
                                {row.format(value)}
                              </span>
                              {isBest && (
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                                  Best
                                </Badge>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Comparison Summary
          </h3>
          <div className="space-y-3">
            {products.map((product) => {
              const bestMetrics = [];
              
              // Count how many "best" metrics this product has
              comparisonSections.forEach(section => {
                section.rows.forEach(row => {
                  if (row.higherIsBetter !== null) {
                    const values = products.map(p => row.getValue(p));
                    const value = row.getValue(product);
                    if (isBestValue(value, values, row.higherIsBetter)) {
                      bestMetrics.push(row.label);
                    }
                  }
                });
              });

              return (
                <div
                  key={product.productId}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{product.productId}</p>
                    <p className="text-sm text-gray-600">
                      {bestMetrics.length} best metric{bestMetrics.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Badge className={getScoreBgColor(product.visibilityScore)}>
                    Score: {product.visibilityScore}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
