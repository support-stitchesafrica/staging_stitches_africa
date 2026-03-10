'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Users,
    Activity,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    BarChart3,
    Eye,
    RefreshCw
} from 'lucide-react';
import { type VendorPerformanceMetrics } from '@/lib/marketing/analytics-service';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

interface VendorAnalyticsCardProps {
    vendorId: string;
    vendorName: string;
    showDetailedView?: boolean;
    className?: string;
}

export default function VendorAnalyticsCard({
    vendorId,
    vendorName,
    showDetailedView = false,
    className = ''
}: VendorAnalyticsCardProps) {
    const [analytics, setAnalytics] = useState<VendorPerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(showDetailedView);
    const { marketingUser, refreshUser } = useMarketingAuth();

    useEffect(() => {
        loadAnalytics();
    }, [vendorId]);

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

            let response = await fetch(`/api/marketing/vendors/${vendorId}/analytics?type=performance`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/vendors/${vendorId}/analytics?type=performance`, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }
            
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to load analytics');
            }

            if (result.success) {
                setAnalytics(result.data);
            } else {
                throw new Error(result.error || 'Failed to load analytics');
            }
        } catch (error) {
            console.error('Error loading vendor analytics:', error);
            setError(error instanceof Error ? error.message : 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
            case 'good': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'needs_attention': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'excellent': return CheckCircle;
            case 'good': return TrendingUp;
            case 'average': return Clock;
            case 'needs_attention': return AlertCircle;
            default: return Activity;
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
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{vendorName}</h3>
                    <button
                        onClick={loadAnalytics}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="Retry"
                    >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
                <div className="flex items-center text-red-600">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{error}</span>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
                <div className="text-center text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    <p>No analytics data available</p>
                </div>
            </div>
        );
    }

    const StatusIcon = getStatusIcon(analytics.status);

    return (
        <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{vendorName}</h3>
                    {analytics.assignedToUserName && (
                        <p className="text-sm text-gray-500">Assigned to {analytics.assignedToUserName}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(analytics.status)}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {analytics.status.replace('_', ' ')}
                    </span>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title={showDetails ? 'Hide details' : 'Show details'}
                    >
                        <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">Revenue</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                        {formatCurrency(analytics.totalRevenue)}
                    </div>
                    {analytics.revenueGrowthRate !== undefined && (
                        <div className={`flex items-center justify-center text-xs ${
                            analytics.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {analytics.revenueGrowthRate >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {formatPercentage(analytics.revenueGrowthRate)}
                        </div>
                    )}
                </div>
                <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                        <Package className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-500">Orders</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                        {analytics.totalOrders}
                    </div>
                    {analytics.orderGrowthRate !== undefined && (
                        <div className={`flex items-center justify-center text-xs ${
                            analytics.orderGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                            {analytics.orderGrowthRate >= 0 ? (
                                <TrendingUp className="w-3 h-3 mr-1" />
                            ) : (
                                <TrendingDown className="w-3 h-3 mr-1" />
                            )}
                            {formatPercentage(analytics.orderGrowthRate)}
                        </div>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Performance Score</span>
                    <span>{analytics.performanceScore.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className={`h-2 rounded-full ${
                            analytics.performanceScore >= 80 ? 'bg-green-500' :
                            analytics.performanceScore >= 60 ? 'bg-blue-500' :
                            analytics.performanceScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${analytics.performanceScore}%` }}
                    ></div>
                </div>
            </div>

            {/* Detailed View */}
            {showDetails && (
                <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Detailed Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Last Order</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                                {analytics.lastActivityDate ? new Date(analytics.lastActivityDate).toLocaleDateString() : 'N/A'}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                <Users className="w-4 h-4 mr-1" />
                                <span>Products</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                                {analytics.totalProducts || 0}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                <Activity className="w-4 h-4 mr-1" />
                                <span>Interactions</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                                {analytics.totalActivities || 0}
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                                <BarChart3 className="w-4 h-4 mr-1" />
                                <span>Avg. Value</span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(analytics.averageOrderValue)}
                            </div>
                        </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                        <button className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                            View Details
                        </button>
                        <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Assign
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}