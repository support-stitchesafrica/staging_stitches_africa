'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Building2, DollarSign, Calendar } from 'lucide-react';
import ExportButton from '@/components/marketing/export/ExportButton';
import { AnalyticsGuard } from '@/components/marketing/MarketingAuthGuard';

export default function AnalyticsPage()
{
    const [timeRange, setTimeRange] = useState('30d');
    const [analyticsData, setAnalyticsData] = useState({
        totalRevenue: 0,
        totalVendors: 0,
        activeUsers: 0,
        conversionRate: 0,
        topPerformers: [],
        recentActivity: []
    });

    useEffect(() =>
    {
        // TODO: Fetch analytics data from API
        // Placeholder data
        const mockData = {
            totalRevenue: 248000,
            totalVendors: 156,
            activeUsers: 24,
            conversionRate: 68.5,
            topPerformers: [
                { name: 'Jane Smith', role: 'Team Lead', sales: 45000, vendors: 12 },
                { name: 'Mike Johnson', role: 'BDM', sales: 38000, vendors: 15 },
                { name: 'Sarah Wilson', role: 'Team Member', sales: 32000, vendors: 8 }
            ],
            recentActivity: [
                { action: 'New vendor added', user: 'Mike Johnson', time: '2 hours ago' },
                { action: 'Vendor assigned', user: 'Jane Smith', time: '4 hours ago' },
                { action: 'Sale completed', user: 'Sarah Wilson', time: '6 hours ago' }
            ]
        };

        setAnalyticsData(mockData);
    }, [timeRange]);

    return (
        <AnalyticsGuard>
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="w-6 h-6" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-gray-600">Track performance and insights</p>
                    </div>

                    {/* Time Range Selector and Export */}
                    <div className="flex items-center gap-2">
                        <ExportButton
                            label="Export Report"
                            endpoint="/api/marketing/export/analytics"
                            filename={`analytics-report-${new Date().toISOString().split('T')[0]}.csv`}
                            exportType="analytics"
                            variant="outline"
                        />
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="1y">Last year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard
                    title="Total Revenue"
                    value={`$${analyticsData.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="green"
                    change="+12.5%"
                />
                <MetricCard
                    title="Total Vendors"
                    value={analyticsData.totalVendors}
                    icon={Building2}
                    color="blue"
                    change="+8.2%"
                />
                <MetricCard
                    title="Active Users"
                    value={analyticsData.activeUsers}
                    icon={Users}
                    color="purple"
                    change="+5.1%"
                />
                <MetricCard
                    title="Conversion Rate"
                    value={`${analyticsData.conversionRate}%`}
                    icon={TrendingUp}
                    color="orange"
                    change="+2.3%"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart Placeholder */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h2>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Chart will be implemented here</p>
                        </div>
                    </div>
                </div>

                {/* Vendor Performance Chart Placeholder */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor Performance</h2>
                    <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">Chart will be implemented here</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h2>
                    <div className="space-y-4">
                        {analyticsData.topPerformers.map((performer, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{performer.name}</p>
                                        <p className="text-sm text-gray-500">{performer.role}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">${performer.sales.toLocaleString()}</p>
                                    <p className="text-sm text-gray-500">{performer.vendors} vendors</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {analyticsData.recentActivity.map((activity, index) => (
                            <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-900">{activity.action}</p>
                                    <p className="text-xs text-gray-500">by {activity.user}</p>
                                </div>
                                <span className="text-xs text-gray-400">{activity.time}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        </AnalyticsGuard>
    );
}

function MetricCard({ title, value, icon: Icon, color, change }: {
    title: string;
    value: string | number;
    icon: any;
    color: 'green' | 'blue' | 'purple' | 'orange';
    change: string;
})
{
    const colorClasses = {
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600'
    };

    const changeColor = change.startsWith('+') ? 'text-green-600' : 'text-red-600';

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-full ${colorClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
                <span className={`text-sm font-medium ${changeColor}`}>
                    {change}
                </span>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}