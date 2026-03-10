'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from '@/types/vendor-analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface PaymentSuccessRatesProps {
  vendorId: string;
  dateRange: DateRange;
}

export function PaymentSuccessRates({ vendorId, dateRange }: PaymentSuccessRatesProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchSuccessRates();
  }, [vendorId, dateRange]);

  const fetchSuccessRates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/payment-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, dateRange })
      });

      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching success rates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const successVsFailure = data?.successVsFailureRate || {
    totalAttempts: 0,
    successful: 0,
    failed: 0,
    successRate: 0
  };

  const chartData = data?.methods?.map((method: any) => ({
    name: method.method,
    successful: method.successCount || 0,
    failed: method.failureCount || 0,
    successRate: method.successRate
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successVsFailure.totalAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Payment transactions attempted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {successVsFailure.successful}
            </div>
            <p className="text-xs text-muted-foreground">
              Completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {successVsFailure.failed}
            </div>
            <p className="text-xs text-muted-foreground">
              Failed transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Success Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Success Rate</CardTitle>
          <CardDescription>Percentage of successful payment transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="text-6xl font-bold text-primary">
                {successVsFailure.successRate}%
              </div>
              <p className="text-muted-foreground mt-2">
                Success Rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success vs Failure by Method */}
      <Card>
        <CardHeader>
          <CardTitle>Success vs Failure by Payment Method</CardTitle>
          <CardDescription>Breakdown of successful and failed transactions per method</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="successful" fill="#22c55e" name="Successful" stackId="a" />
              <Bar dataKey="failed" fill="#ef4444" name="Failed" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Success Rate by Method</CardTitle>
          <CardDescription>Detailed success and failure statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Payment Method</th>
                  <th className="text-right p-3 font-medium">Successful</th>
                  <th className="text-right p-3 font-medium">Failed</th>
                  <th className="text-right p-3 font-medium">Total</th>
                  <th className="text-right p-3 font-medium">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((method: any, index: number) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{method.name}</td>
                    <td className="text-right p-3 text-green-600">{method.successful}</td>
                    <td className="text-right p-3 text-red-600">{method.failed}</td>
                    <td className="text-right p-3">{method.successful + method.failed}</td>
                    <td className="text-right p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        method.successRate >= 90 ? 'bg-green-100 text-green-800' :
                        method.successRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {method.successRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
