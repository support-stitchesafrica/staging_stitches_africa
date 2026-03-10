'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logError, formatErrorMessage, ErrorCode, createError } from '@/lib/collections/errors';

interface TeamErrorBoundaryProps
{
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface TeamErrorBoundaryState
{
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    errorCount: number;
}

/**
 * Error Boundary component for team management section
 * Catches React errors and displays user-friendly error message with retry mechanism
 * Integrates with Collections error handling utilities
 */
export class TeamErrorBoundary extends Component<TeamErrorBoundaryProps, TeamErrorBoundaryState>
{
    constructor(props: TeamErrorBoundaryProps)
    {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<TeamErrorBoundaryState>
    {
        // Update state so the next render will show the fallback UI
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void
    {
        // Log error using Collections error utilities
        const collectionsError = createError(
            ErrorCode.UNKNOWN_ERROR,
            error.message,
            {
                componentStack: errorInfo.componentStack,
                errorBoundary: 'TeamErrorBoundary',
            }
        );

        logError(collectionsError, {
            originalError: error.toString(),
            errorInfo: errorInfo.componentStack,
        });

        // Update state with error details
        this.setState((prevState) => ({
            error,
            errorInfo,
            errorCount: prevState.errorCount + 1,
        }));

        // Call custom error handler if provided
        if (this.props.onError)
        {
            this.props.onError(error, errorInfo);
        }
    }

    handleReset = (): void =>
    {
        // Reset error state to retry rendering
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleReload = (): void =>
    {
        // Full page reload as last resort
        window.location.reload();
    };

    render(): ReactNode
    {
        if (this.state.hasError)
        {
            // Custom fallback UI provided by parent
            if (this.props.fallback)
            {
                return this.props.fallback;
            }

            // Format error message using utility
            const errorMessage = this.state.error
                ? formatErrorMessage(this.state.error)
                : 'An unexpected error occurred';

            // Show different message if error persists after retry
            const persistentError = this.state.errorCount > 1;

            // Default error UI
            return (
                <div className="flex min-h-[400px] items-center justify-center p-6">
                    <div className="w-full max-w-md">
                        <Alert variant="destructive">
                            <AlertTriangle className="size-5" />
                            <AlertTitle className="text-lg font-semibold">
                                {persistentError ? 'Persistent Error' : 'Something went wrong'}
                            </AlertTitle>
                            <AlertDescription className="mt-2 space-y-4">
                                <p>
                                    {persistentError
                                        ? 'The error persists after retry. Please reload the page or contact support if the issue continues.'
                                        : 'An unexpected error occurred while loading the team management interface. This has been logged for investigation.'}
                                </p>

                                {/* Show formatted error message */}
                                <div className="rounded-md bg-destructive/10 p-3">
                                    <p className="text-sm text-destructive">
                                        {errorMessage}
                                    </p>
                                </div>

                                {/* Show detailed error in development */}
                                {process.env.NODE_ENV === 'development' && this.state.error && (
                                    <div className="mt-3 rounded-md bg-muted p-3">
                                        <p className="text-xs font-mono">
                                            {this.state.error.toString()}
                                        </p>
                                        {this.state.errorInfo && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-xs font-semibold">
                                                    Component Stack
                                                </summary>
                                                <pre className="mt-2 max-h-40 overflow-auto text-xs">
                                                    {this.state.errorInfo.componentStack}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {!persistentError && (
                                        <Button onClick={this.handleReset} variant="outline" size="sm">
                                            <RefreshCw className="size-4" />
                                            Try Again
                                        </Button>
                                    )}
                                    <Button
                                        onClick={this.handleReload}
                                        variant="default"
                                        size="sm"
                                    >
                                        Reload Page
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>
            );
        }

        // No error, render children normally
        return this.props.children;
    }
}
