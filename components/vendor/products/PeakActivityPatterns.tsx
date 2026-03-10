/**
 * Peak Activity Patterns Component
 * Displays peak activity times and patterns for a product
 * 
 * Validates: Requirement 22.5
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Clock, 
  Calendar,
  Smartphone,
  Tablet,
  Monitor,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface PeakActivityData {
  peakHour: {
    hour: number;
    count: number;
    label: string;
  } | null;
  peakDay: {
    day: string;
    count: number;
  } | null;
  topDevice: {
    device: string;
    count: number;
    percentage: number;
  } | null;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
    label: string;
  }>;
  dailyDistribution: Array<{
    day: string;
    count: number;
  }>;
  deviceDistribution: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
}

interface PeakActivityPatternsProps {
  data: PeakActivityData;
}

export function PeakActivityPatterns({ data }: PeakActivityPatternsProps) {
  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getDeviceColor = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
        return '#8b5cf6'; // purple
      case 'tablet':
        return '#3b82f6'; // blue
      case 'desktop':
        return '#10b981'; // emerald
      default:
        return '#6b7280'; // gray
    }
  };

  // Sort daily distribution by day of week
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDailyData = [...data.dailyDistribution].sort((a, b) => {
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
  });

  // Find peak values for highlighting
  const maxHourlyCount = Math.max(...data.hourlyDistribution.map(d => d.count), 0);
  const maxDailyCount = Math.max(...sortedDailyData.map(d => d.count), 0);

  return (
    <div className="space-y-6">
      {/* Peak Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Peak Hour */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm font-medium">Peak Hour</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.peakHour ? (
              <>
                <p className="text-2xl font-bold text-blue-900 mb-1">
                  {data.peakHour.label}
                </p>
                <p className="text-sm text-blue-700">
                  {data.peakHour.count} activities
                </p>
              </>
            ) : (
              <p className="text-sm text-blue-700">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Peak Day */}
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.peakDay ? (
              <>
                <p className="text-2xl font-bold text-purple-900 mb-1">
                  {data.peakDay.day}
                </p>
                <p className="text-sm text-purple-700">
                  {data.peakDay.count} activities
                </p>
              </>
            ) : (
              <p className="text-sm text-purple-700">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Top Device */}
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-sm font-medium">Top Device</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {data.topDevice ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  {getDeviceIcon(data.topDevice.device)}
                  <p className="text-2xl font-bold text-emerald-900 capitalize">
                    {data.topDevice.device}
                  </p>
                </div>
                <p className="text-sm text-emerald-700">
                  {data.topDevice.percentage.toFixed(1)}% of traffic
                </p>
              </>
            ) : (
              <p className="text-sm text-emerald-700">No data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution Chart */}
      {data.hourlyDistribution.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              Activity by Hour
            </CardTitle>
            <CardDescription>
              Distribution of customer activity throughout the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.hourlyDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {data.hourlyDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count === maxHourlyCount ? '#3b82f6' : '#93c5fd'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Daily Distribution Chart */}
      {sortedDailyData.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Activity by Day of Week
            </CardTitle>
            <CardDescription>
              Distribution of customer activity across the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sortedDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {sortedDailyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.count === maxDailyCount ? '#8b5cf6' : '#c4b5fd'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Device Distribution */}
      {data.deviceDistribution.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-gray-600" />
              Device Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of customer devices accessing this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceDistribution
                .sort((a, b) => b.percentage - a.percentage)
                .map((device) => (
                  <div key={device.device} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(device.device)}
                        <span className="text-sm font-medium capitalize">
                          {device.device}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {device.count} activities
                        </span>
                        <Badge variant="outline">
                          {device.percentage.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${device.percentage}%`,
                          backgroundColor: getDeviceColor(device.device)
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
