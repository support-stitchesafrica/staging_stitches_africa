'use client';

/**
 * Audit Dashboard Component
 * Main dashboard for viewing and managing activity logs
 * Requirements: 13.1, 13.2
 */

import React, { useState, useEffect } from 'react';
import { ActivityLog } from '@/lib/marketing/activity-log-service';
import { ActivityLogTable } from './ActivityLogTable';
import { ActivityLogFilters, FilterValues } from './ActivityLogFilters';
import { ActivityLogStats } from './ActivityLogStats';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export function AuditDashboard() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFilters, setCurrentFilters] = useState<FilterValues>({});
    const [showStats, setShowStats] = useState(true);
    const { marketingUser, refreshUser } = useMarketingAuth();

    // Fetch activity logs
    const fetchLogs = async (filters: FilterValues = {}, append: boolean = false) => {
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

            if (filters.searchTerm) queryParams.append('searchTerm', filters.searchTerm);
            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            let url = '/api/marketing/activity-logs';

            // Use search endpoint if we have complex filters
            if (filters.actions || filters.entityTypes || filters.searchTerm) {
                url = '/api/marketing/activity-logs/search';

                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        searchTerm: filters.searchTerm,
                        userId: filters.userId,
                        actions: filters.actions,
                        entityTypes: filters.entityTypes,
                        startDate: filters.startDate,
                        endDate: filters.endDate,
                        limit: 50
                    })
                });
                
                // If we get a 401, try refreshing the token
                if (response.status === 401) {
                    await refreshUser();
                    idToken = await currentUser.getIdToken(true); // Force refresh
                    response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${idToken}`
                        },
                        body: JSON.stringify({
                            searchTerm: filters.searchTerm,
                            userId: filters.userId,
                            actions: filters.actions,
                            entityTypes: filters.entityTypes,
                            startDate: filters.startDate,
                            endDate: filters.endDate,
                            limit: 50
                        })
                    });
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch activity logs');
                }

                const data = await response.json();

                if (append) {
                    setLogs(prev => [...prev, ...data.logs]);
                } else {
                    setLogs(data.logs);
                }
                setHasMore(data.logs.length >= 50);
            } else {
                // Use simple GET endpoint
                if (queryParams.toString()) {
                    url += `?${queryParams.toString()}`;
                }

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
                    throw new Error('Failed to fetch activity logs');
                }

                const data = await response.json();

                if (append) {
                    setLogs(prev => [...prev, ...data.logs]);
                } else {
                    setLogs(data.logs);
                }
                setHasMore(data.hasMore);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchLogs();
    }, []);

    // Handle filter changes
    const handleFilterChange = (filters: FilterValues) => {
        setCurrentFilters(filters);
        fetchLogs(filters);
    };

    // Handle load more
    const handleLoadMore = () => {
        fetchLogs(currentFilters, true);
    };

    // Handle export
    const handleExport = async () => {
        try {
            // Create CSV content
            const headers = ['Timestamp', 'User', 'Email', 'Role', 'Action', 'Entity Type', 'Entity Name', 'Details'];
            const rows = logs.map(log => {
                // Handle Firebase Timestamp
                let timestampStr = '';
                if (log.timestamp && typeof log.timestamp === 'object') {
                    if ('toDate' in log.timestamp && typeof log.timestamp.toDate === 'function') {
                        timestampStr = log.timestamp.toDate().toISOString();
                    } else if ('seconds' in log.timestamp) {
                        timestampStr = new Date(log.timestamp.seconds * 1000).toISOString();
                    } else {
                        timestampStr = new Date().toISOString(); // fallback
                    }
                } else {
                    timestampStr = new Date(log.timestamp).toISOString();
                }

                return [
                    timestampStr,
                    log.userName || '',
                    log.userEmail || '',
                    log.userRole || '',
                    log.action,
                    log.entityType,
                    log.entityName || '',
                    JSON.stringify(log.details)
                ];
            });

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Download CSV
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `activity-logs-${new Date().toISOString()}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error exporting logs:', err);
            alert('Failed to export activity logs');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Activity Audit Log</h1>
                    <p className="text-gray-600 mt-1">
                        View and monitor all system activities and user actions
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowStats(!showStats)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                    >
                        {showStats ? 'Hide' : 'Show'} Stats
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={logs.length === 0}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Statistics */}
            {showStats && <ActivityLogStats filters={currentFilters} />}

            {/* Filters */}
            <ActivityLogFilters onFilterChange={handleFilterChange} isLoading={isLoading} />

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Activity Log Table */}
            <div className="bg-white rounded-lg shadow">
                <ActivityLogTable
                    logs={logs}
                    isLoading={isLoading}
                    onLoadMore={handleLoadMore}
                    hasMore={hasMore}
                />
            </div>
        </div>
    );
}
