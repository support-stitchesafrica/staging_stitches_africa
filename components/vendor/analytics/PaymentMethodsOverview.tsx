'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange, PaymentMethodStats } from '@/types/vendor-analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUSD } from '@/lib/utils/currency';

interface PaymentMethodsOverviewProps {
  vendorId: string;
  dateRange: DateRange;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function PaymentMethodsOverview({ vendorId, dateRange }: PaymentMethodsOverviewProps) {
  const [loading, setLoading] = useState(true);
  const [methods, setMethods] = useState<PaymentMethodStats[]>([]);

  useEffect(() => {
    fetchPaymentMethods();
  }, [vendorId, dateRange]);

  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/payment-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, dateRange })
      });

      if (response.ok) {
        const data = await response.json();
        setMethods(data.methods || []);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = methods.map(method => ({
    name: method.method,
    transactions: method.count,
    revenue: method.totalAmount,
    successRate: method.successRate
  }));

  const pieData = methods.map(method => ({
    name: method.method,
    value: method.count
  }));

  return (
    <div className="space-y-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Transaction Volume */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume by Method</CardTitle>
            <CardDescription>Number of transactions per payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="transactions" fill="#0088FE" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
            <CardDescription>Percentage breakdown of payment methods</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Method Details</CardTitle>
          <CardDescription>Comprehensive breakdown of each payment method</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">Method</th>
                  <th className="text-right p-3 font-medium">Transactions</th>
                  <th className="text-right p-3 font-medium">Total Amount</th>
                  <th className="text-right p-3 font-medium">Avg Amount</th>
                  <th className="text-right p-3 font-medium">Success Rate</th>
                  <th className="text-right p-3 font-medium">Share</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{method.method}</td>
                    <td className="text-right p-3">{method.count}</td>
                    <td className="text-right p-3">
                      {formatUSD(method.totalAmount)}
                    </td>
                    <td className="text-right p-3">
                      {formatUSD(method.averageAmount || 0)}
                    </td>
                    <td className="text-right p-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        method.successRate >= 90 ? 'bg-green-100 text-green-800' :
                        method.successRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {method.successRate}%
                      </span>
                    </td>
                    <td className="text-right p-3">{method.percentage}%</td>
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
