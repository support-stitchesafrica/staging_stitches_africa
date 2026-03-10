'use client';

import React from 'react';

export interface DataTableGASkeletonProps
{
    columns?: number;
    rows?: number;
    className?: string;
    showPagination?: boolean;
}

export const DataTableGASkeleton: React.FC<DataTableGASkeletonProps> = ({
    columns = 4,
    rows = 5,
    className = '',
    showPagination = true,
}) =>
{
    return (
        <div className={`bg-ga-background border border-ga rounded-lg shadow-ga-card animate-pulse theme-transition ${className}`}>
            {/* Table skeleton */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px]">
                    {/* Header skeleton */}
                    <thead className="bg-ga-surface border-b border-ga">
                        <tr>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <th
                                    key={colIndex}
                                    className="px-3 sm:px-6 py-2 sm:py-3 text-left"
                                >
                                    <div className="h-4 bg-ga-background rounded w-24"></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    {/* Body skeleton */}
                    <tbody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`
                  border-b border-ga last:border-b-0
                  ${rowIndex % 2 === 0 ? 'bg-ga-background' : 'bg-ga-surface/50'}
                `}
                            >
                                {Array.from({ length: columns }).map((_, colIndex) => (
                                    <td
                                        key={colIndex}
                                        className="px-3 sm:px-6 py-3 sm:py-4"
                                    >
                                        <div className="h-4 bg-ga-surface rounded w-full max-w-[120px]"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination skeleton */}
            {showPagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t border-ga gap-3">
                    <div className="h-4 bg-ga-surface rounded w-48"></div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="h-8 w-8 bg-ga-surface rounded"></div>
                        <div className="h-8 w-8 bg-ga-surface rounded"></div>
                        <div className="h-8 w-8 bg-ga-surface rounded"></div>
                        <div className="h-8 w-8 bg-ga-surface rounded"></div>
                    </div>
                </div>
            )}
        </div>
    );
};
