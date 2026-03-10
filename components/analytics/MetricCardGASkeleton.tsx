'use client';

import React from 'react';

export interface MetricCardGASkeletonProps
{
    className?: string;
    showSparkline?: boolean;
    showTrend?: boolean;
}

export const MetricCardGASkeleton: React.FC<MetricCardGASkeletonProps> = ({
    className = '',
    showSparkline = true,
    showTrend = true,
}) =>
{
    return (
        <div
            className={`
        bg-ga-background border border-ga rounded-lg p-4 sm:p-6
        shadow-ga-card animate-pulse theme-transition
        ${className}
      `}
        >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 min-w-0">
                    {/* Label skeleton */}
                    <div className="h-4 bg-ga-surface rounded w-24 mb-2"></div>
                    {/* Value skeleton */}
                    <div className="h-8 bg-ga-surface rounded w-32"></div>
                </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Trend indicator skeleton */}
                {showTrend && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="h-4 w-4 bg-ga-surface rounded"></div>
                        <div className="h-4 bg-ga-surface rounded w-12"></div>
                    </div>
                )}

                {/* Sparkline skeleton */}
                {showSparkline && (
                    <div className="w-16 sm:w-24 h-6 sm:h-8 ml-auto flex-shrink-0">
                        <div className="w-full h-full bg-ga-surface rounded"></div>
                    </div>
                )}
            </div>
        </div>
    );
};
