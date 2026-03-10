'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange, PaymentMethodTrend } from '@/types/vendor-analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PaymentMethodTrendsProps {
  vendorId: string;
  dateRange: DateRange;
}

const METHOD_COLORS: Record<string, string> = {
  'Card': '#3b82f6',
  'Bank Transfer': '#10b981',
  'Mobile Money': '#f59e0b',
  'Cash': '#8b5cf6',
  'USSD': '#ec4899'
};

export function PaymentMethodTrends({ vendorId, dateRange }: PaymentMethodTrendsProps) {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<PaymentMethodTrend[]>([]);

  useEffect(() => {
    fetchTrends();
  }, [vendorId, dateRange]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/payment-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, dateRange })
      });

      if (response.ok) {
        const data = await response.json();
        setTrends(data.usageTrends || []);
      }
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for line chart
  const allDates = new Set<string>();
  trends.forEach(trend => {
    trend.trend.forEach(point => {
      allDates.add(new Date(point.date).toISOString().split('T')[0]);
    });
  });

  const sortedDates = Array.from(allDates).sort();
  const chartData = sortedDates.map(dateStr => {
    const dataPoint: any = { date: dateStr };
    trends.forEach(trend => {
      const point = trend.trend.find(
        p => new Date(p.date).toISOString().split('T')[0] === dateStr
      );
      dataPoint[trend.method] = point?.value || 0;
    });
    return dataPoint;
  });

  return (
    <div className="space-y-6">
      {/* Growth Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trends.map(trend => (
          <Card key={trend.method}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{trend.method}</CardTitle>
              {trend.growthRate >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                trend.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.growthRate >= 0 ? '+' : ''}{trend.growthRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Growth rate over period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Usage Over Time</CardTitle>
          <CardDescription>
            Track how payment method preferences change over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString();
                }}
              />
              <Legend />
              {trends.map(trend => (
                <Line
                  key={trend.method}
                  type="monotone"
                  dataKey={trend.method}
                  stroke={METHOD_COLORS[trend.method] || '#6b7280'}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Trend Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis</CardTitle>
          <CardDescription>Detailed growth metrics for each payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Payment Method</th>
                  <th className="text-right p-3 font-medium">Data Points</th>
                  <th className="text-right p-3 font-medium">First Value</th>
                  <th className="text-right p-3 font-medium">Last Value</th>
                  <th className="text-right p-3 font-medium">Growth Rate</th>
                  <th className="text-right p-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {trends.map((trend, index) => {
                  const firstValue = trend.trend[0]?.value || 0;
                  const lastValue = trend.trend[trend.trend.length - 1]?.value || 0;
                  const isGrowing = trend.growthRate >= 0;

                  return (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{trend.method}</td>
                      <td className="text-right p-3">{trend.trend.length}</td>
                      <td className="text-right p-3">{firstValue}</td>
                      <td className="text-right p-3">{lastValue}</td>
                      <td className="text-right p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isGrowing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isGrowing ? '+' : ''}{trend.growthRate}%
                        </span>
                      </td>
                      <td className="text-right p-3">
                        {isGrowing ? (
                          <TrendingUp className="h-4 w-4 text-green-600 inline" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 inline" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
