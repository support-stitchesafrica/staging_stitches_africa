/**
 * Organization Analytics Dashboard Component
 * Shows comprehensive organization-wide performance metrics and insights
 */

'use client';

import { useState, useEffect } from 'react';
import {
    Building2,
    Users,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Award,
    Target,
    BarChart3,
    LineChart,
    RefreshCw,
    Download,
    AlertCircle
} from 'lucide-react';
import { type OrganizationAnalytics } from '@/lib/marketing/analytics-service';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

interface OrganizationAnalyticsDashboardProps
{
    className?: string;
}

export default function OrganizationAnalyticsDashboard({
    className = ''
}: OrganizationAnalyticsDashboardProps)
{
    const { marketingUser, refreshUser } = useMarketingAuth();
    const [analytics, setAnalytics] = useState<OrganizationAnalytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

    useEffect(() =>
    {
        loadAnalytics();
    }, [timeRange]);

    const loadAnalytics = async () =>
    {
        try
        {
            setLoading(true);
            setError(null);

            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/analytics/organization?timeRange=${timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/analytics/organization?timeRange=${timeRange}`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            const result = await response.json();

            if (!response.ok)
            {
                throw new Error(result.error || 'Failed to load organization analytics');
            }

            if (result.success)
            {
                setAnalytics(result.data);
            } else
            {
                throw new Error(result.error || 'Failed to load organization analytics');
            }
        } catch (error)
        {
            console.error('Error loading organization analytics:', error);
            setError(error instanceof Error ? error.message : 'Failed to load organization analytics');
        } finally
        {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) =>
    {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (value: number) =>
    {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    if (loading)
    {
        return (
            <div className={`space-y-6 ${className}`}>
                <OrganizationAnalyticsSkeleton />
            </div>
        );
    }

    if (error)
    {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Organization Analytics</h2>
                    <button
                        onClick={loadAnalytics}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Retry"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="flex items-center text-red-600">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!analytics)
    {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                <div className="text-center text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                    <p>No organization analytics data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organization Analytics</h2>
                    <p className="text-gray-600">
                        Company-wide performance overview
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <button
                        onClick={loadAnalytics}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-500" />
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Vendors"
                    value={analytics.totalVendors}
                    subtitle={`${analytics.activeVendors} active`}
                    icon={Building2}
                    color="blue"
                    trend={analytics.vendorGrowthRate}
                />
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(analytics.totalRevenue)}
                    subtitle={`${formatCurrency(analytics.monthlyRevenue)} this month`}
                    icon={DollarSign}
                    color="green"
                    trend={analytics.revenueGrowthRate}
                />
                <MetricCard
                    title="Total Teams"
                    value={analytics.totalTeams}
                    subtitle="teams"
                    icon={Users}
                    color="purple"
                    trend={0} // No trend data available for teams
                />
                <MetricCard
                    title="Avg. Order Value"
                    value={formatCurrency(analytics.averageOrderValue)}
                    subtitle={`${analytics.totalOrders} orders`}
                    icon={Package}
                    color="orange"
                    trend={0} // No trend data available for order value
                />
            </div>

            {/* Charts Section - Simplified for now */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                        <LineChart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart visualization would go here
                    </div>
                </div>

                {/* Vendor Performance Chart */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Vendor Performance</h3>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                        Chart visualization would go here
                    </div>
                </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Performing Teams */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Teams</h3>
                    <div className="space-y-4">
                        {analytics.topPerformingTeams.slice(0, 5).map((team, index) => (
                            <div key={team.teamId} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm mr-3">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{team.teamName}</p>
                                        <p className="text-sm text-gray-500">{team.vendorCount} vendors</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">{formatCurrency(team.totalRevenue)}</p>
                                    <p className="text-sm text-gray-500">{team.performanceScore}% score</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Performing Users */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Users</h3>
                    <div className="space-y-4">
                        {analytics.topPerformingUsers.slice(0, 5).map((user) => (
                            <div key={user.userId} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                        <Users className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.userName}</p>
                                        <p className="text-sm text-gray-500">{user.role}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">{user.vendorCount} vendors</p>
                                    <p className="text-sm text-gray-500">{formatCurrency(user.totalRevenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Metric Card Component
function MetricCard({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue',
    trend = 0
}: { 
    title: string; 
    value: string | number; 
    subtitle: string; 
    icon: React.ComponentType<{ className?: string }>;
    color?: 'blue' | 'green' | 'purple' | 'orange';
    trend?: number;
}) {
    const colorClasses = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        orange: 'bg-orange-500'
    };
    
    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
                </div>
            </div>
            {trend !== 0 && (
                <div className="mt-4 flex items-center">
                    {trend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`ml-1 text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercentage(trend)}
                    </span>
                    <span className="ml-1 text-sm text-gray-500">from last period</span>
                </div>
            )}
        </div>
    );
}

// Loading Skeleton
function OrganizationAnalyticsSkeleton()
{
    return (
        <div className="space-y-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
                        <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="h-4 bg-gray-200 rounded"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}