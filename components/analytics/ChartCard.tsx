'use client';

import React from 'react';

export interface ChartCardProps
{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
    height?: number;
    className?: string;
    onClick?: () => void;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    subtitle,
    children,
    actions,
    height,
    className = '',
    onClick,
}) =>
{
    return (
        <div
            className={`
        bg-ga-background border border-ga rounded-lg
        shadow-ga-card ga-card-hover theme-transition
        ${onClick ? 'cursor-pointer hover:shadow-ga-card-hover' : ''}
        ${className}
      `}
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 border-b border-ga gap-2">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                    <h3 className="text-base sm:text-lg font-semibold text-ga-primary font-ga truncate">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs sm:text-sm text-ga-secondary mt-1 truncate">{subtitle}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-4">
                        {actions}
                    </div>
                )}
            </div>

            {/* Chart Content */}
            <div
                className="p-4 sm:p-6 overflow-x-auto"
                style={height ? { height: `${height}px` } : undefined}
            >
                {children}
            </div>
        </div>
    );
};
