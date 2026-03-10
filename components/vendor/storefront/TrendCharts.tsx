'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface DailyStats {
  date: string;
  pageViews: number;
  productViews: number;
  cartAdds: number;
}

interface TrendChartsProps {
  dailyStats: DailyStats[];
  loading?: boolean;
  className?: string;
}

export function TrendCharts({ dailyStats, loading = false, className }: TrendChartsProps) {
  const isMobile = useIsMobile();

  // Format data for charts
  const chartData = React.useMemo(() => {
    return dailyStats.map(stat => ({
      ...stat,
      formattedDate: format(parseISO(stat.date), isMobile ? 'MM/dd' : 'MMM dd'),
      fullDate: format(parseISO(stat.date), 'MMM dd, yyyy'),
      conversionRate: stat.productViews > 0 ? (stat.cartAdds / stat.productViews) * 100 : 0
    }));
  }, [dailyStats, isMobile]);

  // Calculate trend indicators
  const trendData = React.useMemo(() => {
    if (chartData.length < 2) return null;

    const recent = chartData.slice(-7); // Last 7 days
    const previous = chartData.slice(-14, -7); // Previous 7 days

    const recentAvg = {
      pageViews: recent.reduce((sum, d) => sum + d.pageViews, 0) / recent.length,
      productViews: recent.reduce((sum, d) => sum + d.productViews, 0) / recent.length,
      cartAdds: recent.reduce((sum, d) => sum + d.cartAdds, 0) / recent.length,
    };

    const previousAvg = {
      pageViews: previous.reduce((sum, d) => sum + d.pageViews, 0) / previous.length,
      productViews: previous.reduce((sum, d) => sum + d.productViews, 0) / previous.length,
      cartAdds: previous.reduce((sum, d) => sum + d.cartAdds, 0) / previous.length,
    };

    return {
      pageViews: previousAvg.pageViews > 0 ? ((recentAvg.pageViews - previousAvg.pageViews) / previousAvg.pageViews) * 100 : 0,
      productViews: previousAvg.productViews > 0 ? ((recentAvg.productViews - previousAvg.productViews) / previousAvg.productViews) * 100 : 0,
      cartAdds: previousAvg.cartAdds > 0 ? ((recentAvg.cartAdds - previousAvg.cartAdds) / previousAvg.cartAdds) * 100 : 0,
    };
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {data.fullDate}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">{entry.name}:</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {entry.name === 'Conversion Rate' ? `${entry.value.toFixed(1)}%` : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const TrendIndicator = ({ value, label }: { value: number; label: string }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;
    
    return (
      <div className="flex items-center gap-2 text-sm">
        <TrendingUp 
          className={`h-4 w-4 ${
            isNeutral ? 'text-gray-400' : isPositive ? 'text-green-500' : 'text-red-500 rotate-180'
          }`} 
        />
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className={`font-semibold ${
          isNeutral ? 'text-gray-500' : isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isNeutral ? '0%' : `${isPositive ? '+' : ''}${value.toFixed(1)}%`}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trend Analysis
          </CardTitle>
          <CardDescription>
            Visual trends and patterns in your storefront performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trend Analysis
          </CardTitle>
          <CardDescription>
            Visual trends and patterns in your storefront performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No trend data available for the selected period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Trend Analysis
            </CardTitle>
            <CardDescription>
              Visual trends and patterns in your storefront performance
            </CardDescription>
          </div>
          
          {/* Trend Indicators */}
          {trendData && (
            <div className="text-right space-y-1">
              <p className="text-xs text-muted-foreground mb-2">7-day trend vs previous</p>
              <TrendIndicator value={trendData.pageViews} label="Page Views" />
              <TrendIndicator value={trendData.productViews} label="Product Views" />
              <TrendIndicator value={trendData.cartAdds} label="Cart Adds" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="line" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="line">Line Chart</TabsTrigger>
            <TabsTrigger value="area">Area Chart</TabsTrigger>
            <TabsTrigger value="bar">Bar Chart</TabsTrigger>
          </TabsList>
          
          <TabsContent value="line" className="mt-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ 
                    top: 10, 
                    right: isMobile ? 5 : 30, 
                    left: isMobile ? -20 : 20, 
                    bottom: 0 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#6b7280"
                    fontSize={isMobile ? 10 : 12}
                    tickLine={false}
                    axisLine={false}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={isMobile ? 10 : 12}
                    tickLine={false}
                    axisLine={false}
                    width={isMobile ? 40 : 60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {!isMobile && <Legend />}
                  <Line
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="productViews"
                    name="Product Views"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cartAdds"
                    name="Cart Adds"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="area" className="mt-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ 
                    top: 10, 
                    right: isMobile ? 5 : 30, 
                    left: isMobile ? -20 : 20, 
                    bottom: 0 
                  }}
                >
                  <defs>
                    <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="productViewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="cartAddsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#6b7280"
                    fontSize={isMobile ? 10 : 12}
                    tickLine={false}
                    axisLine={false}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={isMobile ? 10 : 12}
                    tickLine={false}
                    axisLine={false}
                    width={isMobile ? 40 : 60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {!isMobile && <Legend />}
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="url(#pageViewsGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="productViews"
                    name="Product Views"
                    stackId="2"
                    stroke="#10b981"
                    fill="url(#productViewsGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cartAdds"
                    name="Cart Adds"
                    stackId="3"
                    stroke="#f59e0b"
                    fill="url(#cartAddsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="bar" className="mt-6">
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ 
                    top: 10, 
                    right: isMobile ? 5 : 30, 
                    left: isMobile ? -20 : 20, 
                    bottom: 0 
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                  <XAxis
                    dataKey="formattedDate"
                    stroke="#6b7280"
                    fontSize={isMobile ? 10 : 12}
                    tickLine={false}
                    axisLine={false}
                    angle={isMobile ? -45 : 0}
                    textAnchor={isMobile ? 'end' : 'middle'}
                    height={isMobile ? 60 : 30}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={isMobile ? 10 : 12}
                    tickLine={false}
                    axisLine={false}
                    width={isMobile ? 40 : 60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {!isMobile && <Legend />}
                  <Bar
                    dataKey="pageViews"
                    name="Page Views"
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="productViews"
                    name="Product Views"
                    fill="#10b981"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar
                    dataKey="cartAdds"
                    name="Cart Adds"
                    fill="#f59e0b"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}