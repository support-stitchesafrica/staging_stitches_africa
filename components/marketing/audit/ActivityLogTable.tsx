'use client';

/**
 * Activity Log Table Component
 * Displays activity logs in a table format with filtering and pagination
 */

import React, { useState, useEffect } from 'react';
import { ActivityLog, activityLogUtils } from '@/lib/marketing/activity-log-service';
import { format } from 'date-fns';

interface ActivityLogTableProps
{
    logs: ActivityLog[];
    isLoading?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

export function ActivityLogTable({
    logs,
    isLoading = false,
    onLoadMore,
    hasMore = false
}: ActivityLogTableProps)
{
    const formatTimestamp = (timestamp: any) =>
    {
        try
        {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return format(date, 'MMM dd, yyyy HH:mm:ss');
        } catch (error)
        {
            return 'Invalid date';
        }
    };

    const getActionBadgeColor = (action: string) =>
    {
        const color = activityLogUtils.getActionColor(action as any);
        const colorMap: Record<string, string> = {
            blue: 'bg-blue-100 text-blue-800',
            gray: 'bg-gray-100 text-gray-800',
            green: 'bg-green-100 text-green-800',
            yellow: 'bg-yellow-100 text-yellow-800',
            orange: 'bg-orange-100 text-orange-800',
            purple: 'bg-purple-100 text-purple-800',
            red: 'bg-red-100 text-red-800',
            indigo: 'bg-indigo-100 text-indigo-800'
        };
        return colorMap[color] || colorMap.gray;
    };

    if (isLoading && logs.length === 0)
    {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (logs.length === 0)
    {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No activity logs found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Timestamp
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Action
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Entity
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Details
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatTimestamp(log.timestamp)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900">{log.userName || 'Unknown'}</div>
                                        <div className="text-gray-500">{log.userEmail}</div>
                                        {log.userRole && (
                                            <div className="text-xs text-gray-400 capitalize">{log.userRole.replace('_', ' ')}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                                        {activityLogUtils.formatAction(log.action)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm">
                                        <div className="font-medium text-gray-900 capitalize">{log.entityType}</div>
                                        {log.entityName && (
                                            <div className="text-gray-500 text-xs">{log.entityName}</div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    <details className="cursor-pointer">
                                        <summary className="text-blue-600 hover:text-blue-800">View details</summary>
                                        <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto max-w-md">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </details>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {hasMore && (
                <div className="flex justify-center py-4">
                    <button
                        onClick={onLoadMore}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Loading...' : 'Load More'}
                    </button>
                </div>
            )}
        </div>
    );
}
