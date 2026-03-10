'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export interface ErrorFallbackProps
{
    error?: Error | string;
    onRetry?: () => void;
    title?: string;
    message?: string;
    className?: string;
    compact?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    onRetry,
    title = 'Unable to Load Data',
    message,
    className = '',
    compact = false,
}) =>
{
    const errorMessage = typeof error === 'string'
        ? error
        : error?.message || message || 'An error occurred while loading this data.';

    if (compact)
    {
        return (
            <div className={`flex items-center gap-2 text-ga-red text-sm ${className}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{errorMessage}</span>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="ml-auto text-ga-blue hover:text-ga-blue/80 transition-colors flex-shrink-0"
                        aria-label="Retry"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`bg-ga-background border border-ga rounded-lg p-6 ${className}`}>
            <div className="flex flex-col items-center justify-center text-center py-4">
                <AlertCircle className="w-10 h-10 text-ga-red mb-3" />
                <h3 className="text-base font-semibold text-ga-primary mb-2">
                    {title}
                </h3>
                <p className="text-sm text-ga-secondary mb-4 max-w-md">
                    {errorMessage}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="flex items-center gap-2 px-4 py-2 bg-ga-blue text-white rounded-md hover:bg-ga-blue/90 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                )}
            </div>
        </div>
    );
};
