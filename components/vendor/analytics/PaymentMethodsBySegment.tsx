'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange, PaymentMethodBySegment } from '@/types/vendor-analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';

interface PaymentMethodsBySegmentProps {
  vendorId: string;
  dateRange: DateRange;
}

const SEGMENT_COLORS: Record<string, string> = {
  new: '#3b82f6',
  returning: '#10b981',
  frequent: '#f59e0b',
  'high-value': '#8b5cf6'
};

const SEGMENT_LABELS: Record<string, string> = {
  new: 'New Customers',
  returning: 'Returning Customers',
  frequent: 'Frequent Buyers',
  'high-value': 'High-Value Customers'
};

export function PaymentMethodsBySegment({ vendorId, dateRange }: PaymentMethodsBySegmentProps) {
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState<PaymentMethodBySegment[]>([]);

  useEffect(() => {
    fetchDistribution();
  }, [vendorId, dateRange]);

  const fetchDistribution = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/payment-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, dateRange })
      });

      if (response.ok) {
        const data = await response.json();
        setDistribution(data.distributionBySegment || []);
      }
    } catch (error) {
      console.error('Error fetching distribution:', error);
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

  // Prepare data for stacked bar chart
  const allMethods = new Set<string>();
  distribution.forEach(segment => {
    segment.methods.forEach(method => allMethods.add(method.method));
  });

  const chartData = Array.from(allMethods).map(method => {
    const dataPoint: any = { method };
    distribution.forEach(segment => {
      const methodData = segment.methods.find(m => m.method === method);
      dataPoint[segment.segment] = methodData?.count || 0;
    });
    return dataPoint;
  });

  return (
    <div className="space-y-6">
      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods by Customer Segment</CardTitle>
          <CardDescription>
            How different customer segments prefer different payment methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="method" />
              <YAxis />
              <Tooltip />
              <Legend />
              {distribution.map(segment => (
                <Bar
                  key={segment.segment}
                  dataKey={segment.segment}
                  fill={SEGMENT_COLORS[segment.segment]}
                  name={SEGMENT_LABELS[segment.segment]}
                  stackId="a"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {distribution.map(segment => (
          <Card key={segment.segment}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" style={{ color: SEGMENT_COLORS[segment.segment] }} />
                <CardTitle>{SEGMENT_LABELS[segment.segment]}</CardTitle>
              </div>
              <CardDescription>Payment method preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {segment.methods.map((method, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SEGMENT_COLORS[segment.segment] }}
                      />
                      <span className="font-medium">{method.method}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {method.count} transactions
                      </span>
                      <span className="font-semibold">{method.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>Complete payment method distribution across segments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Customer Segment</th>
                  <th className="text-left p-3 font-medium">Payment Method</th>
                  <th className="text-right p-3 font-medium">Transactions</th>
                  <th className="text-right p-3 font-medium">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {distribution.map(segment =>
                  segment.methods.map((method, index) => (
                    <tr key={`${segment.segment}-${index}`} className="border-b hover:bg-muted/50">
                      {index === 0 && (
                        <td
                          className="p-3 font-medium"
                          rowSpan={segment.methods.length}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: SEGMENT_COLORS[segment.segment] }}
                            />
                            {SEGMENT_LABELS[segment.segment]}
                          </div>
                        </td>
                      )}
                      <td className="p-3">{method.method}</td>
                      <td className="text-right p-3">{method.count}</td>
                      <td className="text-right p-3">{method.percentage}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
