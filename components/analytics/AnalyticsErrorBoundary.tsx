'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface Props
{
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showHomeButton?: boolean;
}

interface State
{
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class AnalyticsErrorBoundary extends Component<Props, State>
{
    constructor(props: Props)
    {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State>
    {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void
    {
        // Log error details
        console.error('Analytics Error Boundary caught an error:', {
            error,
            errorInfo,
            componentStack: errorInfo.componentStack,
        });

        // Update state with error info
        this.setState({
            errorInfo,
        });

        // Call custom error handler if provided
        if (this.props.onError)
        {
            this.props.onError(error, errorInfo);
        }

        // Log to error reporting service
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = (): void =>
    {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = (): void =>
    {
        window.location.href = '/atlas';
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

            // Default error UI for full page errors
            return (
                <div className="min-h-screen bg-ga-background flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full bg-ga-background border border-ga rounded-lg p-8 shadow-ga-card">
                        <div className="flex flex-col items-center text-center">
                            <AlertTriangle className="w-16 h-16 text-ga-orange mb-6" />

                            <h1 className="text-2xl font-bold text-ga-primary mb-3">
                                Something Went Wrong
                            </h1>

                            <p className="text-ga-secondary mb-6 max-w-md">
                                We encountered an error while loading this analytics dashboard.
                                Please try refreshing the page or return to the overview.
                            </p>

                            {/* Error details (only in development) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="w-full mb-6 p-4 bg-ga-surface border border-ga rounded-lg text-left">
                                    <p className="text-sm font-semibold text-ga-red mb-2">
                                        Error Details (Development Only):
                                    </p>
                                    <p className="text-xs text-ga-secondary font-mono break-all">
                                        {this.state.error.message}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-ga-secondary cursor-pointer hover:text-ga-primary">
                                                Component Stack
                                            </summary>
                                            <pre className="text-xs text-ga-secondary mt-2 overflow-auto max-h-40">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                                <button
                                    onClick={this.handleReset}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-ga-blue text-white rounded-md hover:bg-ga-blue/90 transition-colors font-medium"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Try Again
                                </button>

                                {this.props.showHomeButton !== false && (
                                    <button
                                        onClick={this.handleGoHome}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-ga-surface text-ga-primary border border-ga rounded-md hover:bg-ga-background transition-colors font-medium"
                                    >
                                        <Home className="w-4 h-4" />
                                        Go to Overview
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
