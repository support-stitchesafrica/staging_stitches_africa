'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange, PaymentAbandonmentStats } from '@/types/vendor-analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface PaymentAbandonmentChartProps {
  vendorId: string;
  dateRange: DateRange;
}

export function PaymentAbandonmentChart({ vendorId, dateRange }: PaymentAbandonmentChartProps) {
  const [loading, setLoading] = useState(true);
  const [abandonmentStats, setAbandonmentStats] = useState<PaymentAbandonmentStats[]>([]);

  useEffect(() => {
    fetchAbandonmentStats();
  }, [vendorId, dateRange]);

  const fetchAbandonmentStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/payment-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, dateRange })
      });

      if (response.ok) {
        const data = await response.json();
        setAbandonmentStats(data.abandonmentByMethod || []);
      }
    } catch (error) {
      console.error('Error fetching abandonment stats:', error);
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

  const chartData = abandonmentStats.map(stat => ({
    method: stat.method,
    completed: stat.completed,
    abandoned: stat.abandoned,
    abandonmentRate: stat.abandonmentRate
  }));

  const averageAbandonmentRate = abandonmentStats.length > 0
    ? abandonmentStats.reduce((sum, stat) => sum + stat.abandonmentRate, 0) / abandonmentStats.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Average Abandonment Rate</CardTitle>
          <CardDescription>Overall payment abandonment across all methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className={`text-6xl font-bold ${
                averageAbandonmentRate < 20 ? 'text-green-600' :
                averageAbandonmentRate < 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {averageAbandonmentRate.toFixed(1)}%
              </div>
              <p className="text-muted-foreground mt-2">
                Average Abandonment Rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abandonment Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Abandonment by Method</CardTitle>
          <CardDescription>
            Compare completed vs abandoned transactions for each payment method
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
              <Bar dataKey="completed" fill="#22c55e" name="Completed" />
              <Bar dataKey="abandoned" fill="#ef4444" name="Abandoned" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Method Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {abandonmentStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.method}</CardTitle>
              {stat.abandonmentRate < 20 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                stat.abandonmentRate < 20 ? 'text-green-600' :
                stat.abandonmentRate < 40 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {stat.abandonmentRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.abandoned} of {stat.attempts} abandoned
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Abandonment Details</CardTitle>
          <CardDescription>Complete breakdown of payment abandonment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Payment Method</th>
                  <th className="text-right p-3 font-medium">Attempts</th>
                  <th className="text-right p-3 font-medium">Completed</th>
                  <th className="text-right p-3 font-medium">Abandoned</th>
                  <th className="text-right p-3 font-medium">Abandonment Rate</th>
                  <th className="text-right p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {abandonmentStats.map((stat, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{stat.method}</td>
                    <td className="text-right p-3">{stat.attempts}</td>
                    <td className="text-right p-3 text-green-600">{stat.completed}</td>
                    <td className="text-right p-3 text-red-600">{stat.abandoned}</td>
                    <td className="text-right p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        stat.abandonmentRate < 20 ? 'bg-green-100 text-green-800' :
                        stat.abandonmentRate < 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stat.abandonmentRate}%
                      </span>
                    </td>
                    <td className="text-right p-3">
                      {stat.abandonmentRate < 20 ? (
                        <span className="text-green-600 text-sm">Good</span>
                      ) : stat.abandonmentRate < 40 ? (
                        <span className="text-yellow-600 text-sm">Fair</span>
                      ) : (
                        <span className="text-red-600 text-sm">Needs Attention</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {abandonmentStats.some(stat => stat.abandonmentRate > 30) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {abandonmentStats
                .filter(stat => stat.abandonmentRate > 30)
                .map((stat, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-yellow-600">•</span>
                    <span>
                      <strong>{stat.method}</strong> has a high abandonment rate ({stat.abandonmentRate}%).
                      Consider simplifying the checkout process or offering alternative payment methods.
                    </span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
