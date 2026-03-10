'use client';

import React from 'react';

export interface ChartCardSkeletonProps
{
    height?: number;
    className?: string;
    showSubtitle?: boolean;
    showActions?: boolean;
}

export const ChartCardSkeleton: React.FC<ChartCardSkeletonProps> = ({
    height = 300,
    className = '',
    showSubtitle = false,
    showActions = false,
}) =>
{
    return (
        <div
            className={`
        bg-ga-background border border-ga rounded-lg
        shadow-ga-card animate-pulse theme-transition
        ${className}
      `}
        >
            {/* Header skeleton */}
            <div className="flex flex-col sm:flex-row items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-ga gap-2">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                    {/* Title skeleton */}
                    <div className="h-6 bg-ga-surface rounded w-40 mb-2"></div>
                    {/* Subtitle skeleton */}
                    {showSubtitle && (
                        <div className="h-4 bg-ga-surface rounded w-32"></div>
                    )}
                </div>
                {/* Actions skeleton */}
                {showActions && (
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
                        <div className="h-8 w-20 bg-ga-surface rounded"></div>
                    </div>
                )}
            </div>

            {/* Chart content skeleton */}
            <div
                className="p-4 sm:p-6"
                style={{ height: `${height}px` }}
            >
                <div className="w-full h-full bg-ga-surface rounded flex items-center justify-center">
                    <div className="text-ga-secondary text-sm">Loading chart...</div>
                </div>
            </div>
        </div>
    );
};
