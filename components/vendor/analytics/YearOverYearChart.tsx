'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YearOverYearComparison } from '@/types/vendor-analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface YearOverYearChartProps {
  data: YearOverYearComparison[];
  title?: string;
  description?: string;
  valueFormatter?: (value: number) => string;
  loading?: boolean;
}

export function YearOverYearChart({
  data,
  title = 'Year-over-Year Comparison',
  description = 'Compare performance across years',
  valueFormatter = (value) => value.toLocaleString(),
  loading = false
}: YearOverYearChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-200 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse rounded bg-gray-100" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-gray-500">
            No data available for comparison
          </div>
        </CardContent>
      </Card>
    );
  }

  const getBarColor = (change: number) => {
    if (change > 0) return '#10b981'; // green
    if (change < 0) return '#ef4444'; // red
    return '#6b7280'; // gray
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{data.year}</p>
          <p className="text-sm text-gray-600">
            Value: {valueFormatter(data.value)}
          </p>
          {data.change !== 0 && (
            <div className="flex items-center gap-1 text-sm mt-1">
              {data.change > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={data.change > 0 ? 'text-green-600' : 'text-red-600'}>
                {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="year" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={valueFormatter}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={() => 'Value'}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.change)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            {data.map((year, index) => (
              <div key={year.year} className="space-y-1">
                <p className="text-xs text-gray-500">{year.year}</p>
                <p className="text-sm font-semibold">{valueFormatter(year.value)}</p>
                {index > 0 && year.change !== 0 && (
                  <p className={`text-xs ${year.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {year.change > 0 ? '+' : ''}{year.change.toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
