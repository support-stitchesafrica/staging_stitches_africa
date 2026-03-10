'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendDataPoint } from '@/types/vendor-analytics';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatUSD, formatUSDCompact } from '@/lib/utils/currency';

interface SalesTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  description?: string;
  showArea?: boolean;
  height?: number;
}

export function SalesTrendChart({
  data,
  title = 'Sales Trend',
  description = 'Daily sales performance over time',
  showArea = true,
  height = 350
}: SalesTrendChartProps) {
  const isMobile = useIsMobile();
  
  // Format data for Recharts
  const chartData = useMemo(() => {
    return data.map(point => ({
      date: format(point.date, isMobile ? 'MM/dd' : 'MMM dd'),
      fullDate: format(point.date, 'MMM dd, yyyy'),
      value: point.value,
      label: point.label
    }));
  }, [data, isMobile]);

  // Calculate summary stats
  const stats = useMemo(() => {
    if (data.length === 0) return { total: 0, average: 0, peak: 0 };
    
    const total = data.reduce((sum, point) => sum + point.value, 0);
    const average = total / data.length;
    const peak = Math.max(...data.map(point => point.value));
    
    return { total, average, peak };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-1">
          {data.fullDate}
        </p>
        <p className="text-lg font-bold text-emerald-600">
          {formatUSD(data.value)}
        </p>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-gray-500">
            No sales data available for this period
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
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatUSD(stats.total)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Average Daily</p>
            <p className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
              {formatUSD(stats.average)}
            </p>
          </div>
          <div className="p-2 sm:p-3 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Peak Day</p>
            <p className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
              {formatUSD(stats.peak)}
            </p>
          </div>
        </div>

        <div className="touch-pan-y overflow-x-auto -mx-2 sm:mx-0">
          <ResponsiveContainer width="100%" height={isMobile ? 250 : height}>
            {showArea ? (
              <AreaChart
                data={chartData}
                margin={{ 
                  top: 10, 
                  right: isMobile ? 5 : 10, 
                  left: isMobile ? -20 : 0, 
                  bottom: 0 
                }}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
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
                  tickFormatter={formatUSDCompact}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                {!isMobile && <Legend />}
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Sales"
                  stroke="#10b981"
                  strokeWidth={isMobile ? 1.5 : 2}
                  fill="url(#salesGradient)"
                  dot={isMobile ? false : { fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <LineChart
                data={chartData}
                margin={{ 
                  top: 10, 
                  right: isMobile ? 5 : 10, 
                  left: isMobile ? -20 : 0, 
                  bottom: 0 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
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
                  tickFormatter={formatUSDCompact}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                {!isMobile && <Legend />}
                <Line
                  type="monotone"
                  dataKey="value"
                  name="Sales"
                  stroke="#10b981"
                  strokeWidth={isMobile ? 1.5 : 2}
                  dot={isMobile ? false : { fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: isMobile ? 4 : 6, strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
