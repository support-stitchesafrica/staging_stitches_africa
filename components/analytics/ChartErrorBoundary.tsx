'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props
{
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State
{
    hasError: boolean;
    error: Error | null;
}

export class ChartErrorBoundary extends Component<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): State
    {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void
    {
        // Log error to console
        console.error('Chart Error Boundary caught an error:', error, errorInfo);

        // Call custom error handler if provided
        if (this.props.onError)
        {
            this.props.onError(error, errorInfo);
        }

        // You can also log to an error reporting service here
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = (): void =>
    {
        this.setState({
            hasError: false,
            error: null,
        });
    };

    render(): ReactNode
    {
        if (this.state.hasError)
        {
            // Use custom fallback if provided
            if (this.props.fallback)
            {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="bg-ga-background border border-ga rounded-lg p-6 shadow-ga-card">
                    <div className="flex flex-col items-center justify-center text-center py-8">
                        <AlertCircle className="w-12 h-12 text-ga-red mb-4" />
                        <h3 className="text-lg font-semibold text-ga-primary mb-2">
                            Unable to Load Chart
                        </h3>
                        <p className="text-sm text-ga-secondary mb-4 max-w-md">
                            {this.state.error?.message || 'An error occurred while rendering this chart.'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="flex items-center gap-2 px-4 py-2 bg-ga-blue text-white rounded-md hover:bg-ga-blue/90 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
