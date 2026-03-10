'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderFunnel } from '@/types/vendor-analytics';
import { TrendingDown } from 'lucide-react';

interface OrderFunnelChartProps {
  funnel: OrderFunnel;
  title?: string;
  description?: string;
  height?: number;
}

export function OrderFunnelChart({
  funnel,
  title = 'Order Funnel',
  description = 'Customer journey from view to delivery',
  height = 400
}: OrderFunnelChartProps) {
  // Format data for funnel visualization
  const chartData = useMemo(() => {
    const stages = [
      { name: 'Viewed', value: funnel.viewed, color: '#3b82f6' },
      { name: 'Added to Cart', value: funnel.addedToCart, color: '#8b5cf6' },
      { name: 'Ordered', value: funnel.ordered, color: '#ec4899' },
      { name: 'Paid', value: funnel.paid, color: '#f59e0b' },
      { name: 'Delivered', value: funnel.delivered, color: '#10b981' }
    ];

    return stages.map((stage, index) => {
      const previousValue = index > 0 ? stages[index - 1].value : stage.value;
      const dropoffRate = previousValue > 0 
        ? ((previousValue - stage.value) / previousValue) * 100 
        : 0;
      const conversionRate = funnel.viewed > 0 
        ? (stage.value / funnel.viewed) * 100 
        : 0;

      return {
        ...stage,
        dropoffRate: dropoffRate.toFixed(1),
        conversionRate: conversionRate.toFixed(1)
      };
    });
  }, [funnel]);

  // Calculate overall conversion rate
  const overallConversion = useMemo(() => {
    if (funnel.viewed === 0) return 0;
    return ((funnel.delivered / funnel.viewed) * 100).toFixed(1);
  }, [funnel]);

  // Calculate drop-off points
  const dropoffAnalysis = useMemo(() => {
    const dropoffs = [
      {
        stage: 'View to Cart',
        count: funnel.viewed - funnel.addedToCart,
        rate: funnel.viewed > 0 ? ((funnel.viewed - funnel.addedToCart) / funnel.viewed) * 100 : 0
      },
      {
        stage: 'Cart to Order',
        count: funnel.addedToCart - funnel.ordered,
        rate: funnel.addedToCart > 0 ? ((funnel.addedToCart - funnel.ordered) / funnel.addedToCart) * 100 : 0
      },
      {
        stage: 'Order to Payment',
        count: funnel.ordered - funnel.paid,
        rate: funnel.ordered > 0 ? ((funnel.ordered - funnel.paid) / funnel.ordered) * 100 : 0
      },
      {
        stage: 'Payment to Delivery',
        count: funnel.paid - funnel.delivered,
        rate: funnel.paid > 0 ? ((funnel.paid - funnel.delivered) / funnel.paid) * 100 : 0
      }
    ];

    return dropoffs.sort((a, b) => b.rate - a.rate);
  }, [funnel]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <p className="text-sm font-semibold text-gray-900 mb-2">
          {data.name}
        </p>
        <div className="space-y-1">
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {data.value.toLocaleString()} customers
          </p>
          <p className="text-sm text-gray-600">
            {data.conversionRate}% of total views
          </p>
          {data.dropoffRate !== '0.0' && (
            <p className="text-sm text-red-600">
              {data.dropoffRate}% drop-off from previous stage
            </p>
          )}
        </div>
      </div>
    );
  };

  if (funnel.viewed === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px] text-gray-500">
            No order funnel data available for this period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Overall Conversion</p>
            <p className="text-2xl font-bold text-emerald-600">
              {overallConversion}%
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Funnel Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="name"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value: number) => value.toLocaleString()}
                style={{ fontSize: '12px', fontWeight: 'bold' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Drop-off Analysis */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            Biggest Drop-off Points
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dropoffAnalysis.slice(0, 2).map((dropoff, index) => (
              <div
                key={index}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {dropoff.stage}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-red-600">
                    {dropoff.rate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">
                    ({dropoff.count.toLocaleString()} customers)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stage Conversion Rates */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">
            Stage Conversion Rates
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {chartData.map((stage, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">{stage.name}</p>
                <p className="text-lg font-bold" style={{ color: stage.color }}>
                  {stage.conversionRate}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
