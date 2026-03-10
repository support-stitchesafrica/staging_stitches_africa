'use client';

/**
 * Activity Log Statistics Component
 * Displays statistics and insights about activity logs
 */

import React, { useState, useEffect } from 'react';
import { ActivityLogStats as StatsType } from '@/lib/marketing/activity-log-service';
import { FilterValues } from './ActivityLogFilters';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

interface ActivityLogStatsProps {
    filters?: FilterValues;
}

export function ActivityLogStats({ filters }: ActivityLogStatsProps) {
    const [stats, setStats] = useState<StatsType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { marketingUser, refreshUser } = useMarketingAuth();

    useEffect(() => {
        fetchStats();
    }, [filters]);

    const fetchStats = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            const queryParams = new URLSearchParams();
            if (filters?.startDate) queryParams.append('startDate', filters.startDate);
            if (filters?.endDate) queryParams.append('endDate', filters.endDate);

            const url = `/api/marketing/activity-logs/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
            let response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const data = await response.json();
            setStats(data.stats);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    const topActions = Object.entries(stats.logsByAction)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    const topEntityTypes = Object.entries(stats.logsByEntityType)
        .sort(([, a], [, b]) => b - a);

    const topUsers = Object.entries(stats.logsByUser)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return (
        <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Activity Statistics</h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">Total Activities</div>
                    <div className="text-2xl font-bold text-blue-900 mt-1">{stats.totalLogs}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600 font-medium">Action Types</div>
                    <div className="text-2xl font-bold text-green-900 mt-1">{Object.keys(stats.logsByAction).length}</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-purple-600 font-medium">Entity Types</div>
                    <div className="text-2xl font-bold text-purple-900 mt-1">{Object.keys(stats.logsByEntityType).length}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-orange-600 font-medium">Active Users</div>
                    <div className="text-2xl font-bold text-orange-900 mt-1">{Object.keys(stats.logsByUser).length}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Actions */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Top Actions</h3>
                    <div className="space-y-2">
                        {topActions.map(([action, count]) => (
                            <div key={action} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 capitalize">{action.replace(/_/g, ' ')}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full"
                                            style={{ width: `${(count / stats.totalLogs) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Entity Types */}
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Activity by Entity Type</h3>
                    <div className="space-y-2">
                        {topEntityTypes.map(([entityType, count]) => (
                            <div key={entityType} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 capitalize">{entityType}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full"
                                            style={{ width: `${(count / stats.totalLogs) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Users */}
            {topUsers.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Most Active Users</h3>
                    <div className="space-y-2">
                        {topUsers.map(([userId, count]) => (
                            <div key={userId} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{userId}</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-purple-600 h-2 rounded-full"
                                            style={{ width: `${(count / stats.totalLogs) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
