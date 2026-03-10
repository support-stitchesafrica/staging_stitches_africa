'use client';

import React, { memo, useMemo, useCallback } from 'react'
import { User, LogOut, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import
{
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface AnalyticsHeaderProps
{
    title: string;
    subtitle?: string;
    dateRange?: { start: Date; end: Date };
    onDateRangeChange?: (range: { start: Date; end: Date }) => void;
    showComparison?: boolean;
    onDateRangeClick?: () => void;
    userEmail?: string;
    onLogout?: () => void;
    showBackButton?: boolean;
    onBack?: () => void;
}

const formatDateRange = (range?: { start: Date; end: Date }): string =>
{
    if (!range) return 'Select date range';

    const start = range.start;
    const end = range.end;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const last30Days = new Date(today);
    last30Days.setDate(last30Days.getDate() - 30);

    // Check for common presets
    if (start.getTime() === today.getTime() && end.getTime() === today.getTime())
    {
        return 'Today';
    }

    if (start.getTime() === yesterday.getTime() && end.getTime() === yesterday.getTime())
    {
        return 'Yesterday';
    }

    if (start.getTime() === last7Days.getTime() && end.getTime() === today.getTime())
    {
        return 'Last 7 days';
    }

    if (start.getTime() === last30Days.getTime() && end.getTime() === today.getTime())
    {
        return 'Last 30 days';
    }

    // Format custom range
    const formatDate = (date: Date) =>
    {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return `${formatDate(start)} - ${formatDate(end)}`;
};

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
    title,
    subtitle,
    dateRange,
    onDateRangeClick,
    userEmail,
    onLogout,
    showBackButton,
    onBack,
}) =>
{

    return (
        <header
            className="bg-white border-b border-gray-200 sticky top-0 z-10"
            role="banner"
        >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-0">
                {/* Title Section */}
                <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
                    {showBackButton && onBack && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={onBack}
                            className="border-gray-200 text-gray-900 hover:bg-gray-50 flex-shrink-0"
                            aria-label="Go back"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-ga">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Actions Section */}
                <div
                    className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end"
                    role="toolbar"
                    aria-label="Dashboard controls"
                >
                    {/* Date Range Picker Button */}
                    {onDateRangeClick && (
                        <span
                            
                            onClick={onDateRangeClick}
                            className="gap-2 flex border px-3 py-2 rounded-lg border-gray-200 text-gray-900 hover:bg-gray-50 text-xs sm:text-sm flex-1 sm:flex-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label={`Select date range. Current selection: ${formatDateRange(dateRange)}`}
                        >
                            <Calendar className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                            <span className="truncate">{formatDateRange(dateRange)}</span>
                        </span>
                    )}

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <span
                                
                                
                                className="border-gray-200 border px-3 py-2 rounded-lg text-gray-900 hover:bg-gray-50 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                aria-label="User menu"
                                aria-haspopup="menu"
                            >
                                <User className="w-4 h-4" aria-hidden="true" />
                            </span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56" role="menu">
                            {userEmail && (
                                <>
                                    <div className="px-2 py-1.5" role="none">
                                        <p className="text-sm font-medium text-gray-900">Account</p>
                                        <p className="text-xs text-gray-600 truncate">{userEmail}</p>
                                    </div>
                                    <DropdownMenuSeparator />
                                </>
                            )}
                            <DropdownMenuItem
                                onClick={onLogout}
                                className="text-red-600 cursor-pointer"
                                role="menuitem"
                            >
                                <LogOut className="w-4 h-4 mr-2" aria-hidden="true" />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

        </header>
    );
};
