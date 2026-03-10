'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryRevenue } from '@/types/vendor-analytics';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatUSD } from '@/lib/utils/currency';

interface RevenueBreakdownProps {
  categories: CategoryRevenue[];
  title?: string;
  description?: string;
  height?: number;
}

const COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#8b5cf6', // purple-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
];

export function RevenueBreakdown({
  categories,
  title = 'Revenue by Category',
  description = 'Sales distribution across product categories',
  height = 350
}: RevenueBreakdownProps) {
  const isMobile = useIsMobile();
  
  // Format data for Recharts
  const chartData = useMemo(() => {
    return categories.map((cat, index) => ({
      name: cat.category,
      value: cat.revenue,
      percentage: cat.percentage,
      orderCount: cat.orderCount,
      color: COLORS[index % COLORS.length]
    }));
  }, [categories]);

  const totalRevenue = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.revenue, 0);
  }, [categories]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">
          {data.name}
        </p>
        <div className="space-y-1">
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {formatUSD(data.value)}
          </p>
          <p className="text-sm text-gray-600">
            {data.percentage.toFixed(1)}% of total
          </p>
          <p className="text-sm text-gray-600">
            {data.orderCount} orders
          </p>
        </div>
      </div>
    );
  };

  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage.toFixed(0)}%`;
  };

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-gray-500">
            No category data available
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
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatUSD(totalRevenue)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-6">
          {/* Pie Chart */}
          <div className="touch-pan-y">
            <ResponsiveContainer width="100%" height={isMobile ? 250 : height}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={isMobile ? false : renderCustomLabel}
                  outerRadius={isMobile ? 80 : 120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Top Categories
            </h4>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {chartData.map((category, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {category.orderCount} orders
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-2 sm:ml-3 flex-shrink-0">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900">
                      {formatUSD(category.value)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {category.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
