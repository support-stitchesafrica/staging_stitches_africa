'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Building2,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Award,
    Target,
    BarChart3,
    PieChart,
    RefreshCw,
    Download,
    AlertCircle
} from 'lucide-react';
import { type TeamPerformanceMetrics } from '@/lib/marketing/analytics-service';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

interface TeamAnalyticsDashboardProps {
    teamId: string;
    className?: string;
}

export default function TeamAnalyticsDashboard({
    teamId,
    className = ''
}: TeamAnalyticsDashboardProps) {
    const [analytics, setAnalytics] = useState<TeamPerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
    const { marketingUser, refreshUser } = useMarketingAuth();

    useEffect(() => {
        loadAnalytics();
    }, [teamId, timeRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/analytics/team/${teamId}?timeRange=${timeRange}`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/analytics/team/${teamId}?timeRange=${timeRange}`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to load team analytics');
            }

            if (result.success) {
                setAnalytics(result.data);
            } else {
                throw new Error(result.error || 'Failed to load team analytics');
            }
        } catch (error) {
            console.error('Error loading team analytics:', error);
            setError(error instanceof Error ? error.message : 'Failed to load team analytics');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    };

    if (loading) {
        return (
            <div className={`space-y-6 ${className}`}>
                <TeamAnalyticsSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">Team Analytics</h2>
                    <button
                        onClick={loadAnalytics}
                        className="p-2 hover:bg-gray-700 rounded-lg"
                        title="Retry"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
                <div className="flex items-center text-red-400">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className={`bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 ${className}`}>
                <div className="text-center text-gray-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                    <p>No team analytics data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Team Analytics</h2>
                    <p className="text-gray-400">
                        {analytics.teamName} • Led by {analytics.teamLeadName}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value as any)}
                        className="px-3 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                        <option value="1y">Last year</option>
                    </select>
                    <button
                        onClick={loadAnalytics}
                        className="p-2 hover:bg-gray-800 rounded-lg"
                        title="Refresh"
                    >
                        <RefreshCw className="w-5 h-5 text-gray-400" />
                    </button>
                    <button className="px-4 py-2 border border-gray-700 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Team Members"
                    value={analytics.totalMembers}
                    subtitle={`${analytics.activeMembers} active`}
                    icon={Users}
                    color="blue"
                />
                <MetricCard
                    title="Total Vendors"
                    value={analytics.totalVendors}
                    subtitle={`${analytics.averageVendorsPerMember.toFixed(1)} per member`}
                    icon={Building2}
                    color="green"
                />
                <MetricCard
                    title="Total Revenue"
                    value={formatCurrency(analytics.totalRevenue)}
                    subtitle={`${formatCurrency(analytics.averageRevenuePerMember)} per member`}
                    icon={DollarSign}
                    color="purple"
                    trend={analytics.monthlyGrowthRate}
                />
                <MetricCard
                    title="Performance Score"
                    value={`${analytics.teamPerformanceScore.toFixed(0)}/100`}
                    subtitle="Team average"
                    icon={Award}
                    color="orange"
                    trend={analytics.monthlyGrowthRate}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Distribution Chart */}
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white">Revenue Distribution</h3>
                        <PieChart className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        Chart visualization would go here
                    </div>
                </div>

                {/* Vendor Performance Chart */}
                <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white">Vendor Performance</h3>
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        Chart visualization would go here
                    </div>
                </div>
            </div>

            {/* Team Members Performance */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Team Members Performance</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Member</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vendors</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Revenue</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Tasks</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {analytics.topPerformingMembers.map((member) => (
                                <tr key={member.userId}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                                                    <Users className="h-5 w-5 text-gray-400" />
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-white">{member.userName}</div>
                                                <div className="text-sm text-gray-400">N/A</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {member.vendorCount}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                        {formatCurrency(member.totalRevenue)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-300">N/A</div>
                                        <div className="text-sm text-gray-400">N/A</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="text-sm font-medium text-white mr-2">
                                                {member.performanceScore.toFixed(0)}/100
                                            </div>
                                            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                member.performanceScore >= 80 
                                                    ? 'bg-green-900 text-green-200' 
                                                    : member.performanceScore >= 60 
                                                        ? 'bg-yellow-900 text-yellow-200' 
                                                        : 'bg-red-900 text-red-200'
                                            }`}>
                                                {member.performanceScore >= 80 ? 'Excellent' : 
                                                 member.performanceScore >= 60 ? 'Good' : 'Needs Improvement'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Performing Vendors */}
            <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Top Performing Vendors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.topPerformingMembers.slice(0, 6).map((member, index) => (
                        <div key={member.userId} className="bg-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center">
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium mr-2">
                                            {index + 1}
                                        </div>
                                        <h4 className="text-sm font-medium text-white">{member.userName}</h4>
                                    </div>
                                </div>
                                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    member.performanceScore >= 80 
                                        ? 'bg-green-900 text-green-200' 
                                        : member.performanceScore >= 60 
                                            ? 'bg-yellow-900 text-yellow-200' 
                                            : 'bg-red-900 text-red-200'
                                }`}>
                                    {member.performanceScore.toFixed(0)}%
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Revenue</span>
                                    <span className="text-white">{formatCurrency(member.totalRevenue)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Vendors</span>
                                    <span className="text-white">{member.vendorCount}</span>
                                </div>
                            </div>
                        </div>
                    ))}
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
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
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
                    <span className={`ml-1 text-sm font-medium ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {formatPercentage(trend)}
                    </span>
                    <span className="ml-1 text-sm text-gray-400">from last period</span>
                </div>
            )}
        </div>
    );
}

// Loading Skeleton
function TeamAnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-700 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 animate-pulse">
                        <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
                        <div className="h-8 bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6 animate-pulse">
                        <div className="h-5 bg-gray-700 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            {[...Array(4)].map((_, j) => (
                                <div key={j} className="h-4 bg-gray-700 rounded"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}