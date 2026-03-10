'use client';

/**
 * Activity Log Filters Component
 * Provides filtering options for activity logs
 */

import React, { useState } from 'react';
import { ActivityAction, EntityType } from '@/lib/marketing/activity-log-service';

interface ActivityLogFiltersProps
{
    onFilterChange: (filters: FilterValues) => void;
    isLoading?: boolean;
}

export interface FilterValues
{
    searchTerm?: string;
    userId?: string;
    actions?: ActivityAction[];
    entityTypes?: EntityType[];
    startDate?: string;
    endDate?: string;
}

const ACTION_OPTIONS: { value: ActivityAction; label: string }[] = [
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'vendor_assignment', label: 'Vendor Assignment' },
    { value: 'vendor_update', label: 'Vendor Update' },
    { value: 'vendor_creation', label: 'Vendor Creation' },
    { value: 'reassignment', label: 'Reassignment' },
    { value: 'invite_sent', label: 'Invite Sent' },
    { value: 'invite_accepted', label: 'Invite Accepted' },
    { value: 'invite_revoked', label: 'Invite Revoked' },
    { value: 'role_update', label: 'Role Update' },
    { value: 'user_created', label: 'User Created' },
    { value: 'user_updated', label: 'User Updated' },
    { value: 'user_deactivated', label: 'User Deactivated' },
    { value: 'user_activated', label: 'User Activated' },
    { value: 'data_export', label: 'Data Export' }
];

const ENTITY_TYPE_OPTIONS: { value: EntityType; label: string }[] = [
    { value: 'vendor', label: 'Vendor' },
    { value: 'user', label: 'User' },
    { value: 'team', label: 'Team' },
    { value: 'invitation', label: 'Invitation' },
    { value: 'system', label: 'System' }
];

export function ActivityLogFilters({ onFilterChange, isLoading = false }: ActivityLogFiltersProps)
{
    const [filters, setFilters] = useState<FilterValues>({});
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleFilterChange = (key: keyof FilterValues, value: any) =>
    {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
    };

    const handleApplyFilters = () =>
    {
        onFilterChange(filters);
    };

    const handleResetFilters = () =>
    {
        const emptyFilters: FilterValues = {};
        setFilters(emptyFilters);
        onFilterChange(emptyFilters);
    };

    const handleActionToggle = (action: ActivityAction) =>
    {
        const currentActions = filters.actions || [];
        const newActions = currentActions.includes(action)
            ? currentActions.filter(a => a !== action)
            : [...currentActions, action];
        handleFilterChange('actions', newActions.length > 0 ? newActions : undefined);
    };

    const handleEntityTypeToggle = (entityType: EntityType) =>
    {
        const currentTypes = filters.entityTypes || [];
        const newTypes = currentTypes.includes(entityType)
            ? currentTypes.filter(t => t !== entityType)
            : [...currentTypes, entityType];
        handleFilterChange('entityTypes', newTypes.length > 0 ? newTypes : undefined);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                </button>
            </div>

            {/* Search Term */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                </label>
                <input
                    type="text"
                    value={filters.searchTerm || ''}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value || undefined)}
                    placeholder="Search by user, email, entity..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={filters.startDate || ''}
                        onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                    </label>
                    <input
                        type="date"
                        value={filters.endDate || ''}
                        onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Advanced Filters */}
            {showAdvanced && (
                <>
                    {/* Action Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Action Types
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ACTION_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleActionToggle(option.value)}
                                    className={`px-3 py-1 text-sm rounded-full border ${filters.actions?.includes(option.value)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Entity Types */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Entity Types
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {ENTITY_TYPE_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleEntityTypeToggle(option.value)}
                                    className={`px-3 py-1 text-sm rounded-full border ${filters.entityTypes?.includes(option.value)
                                            ? 'bg-green-600 text-white border-green-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
                <button
                    onClick={handleApplyFilters}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Applying...' : 'Apply Filters'}
                </button>
                <button
                    onClick={handleResetFilters}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Reset
                </button>
            </div>
        </div>
    );
}
