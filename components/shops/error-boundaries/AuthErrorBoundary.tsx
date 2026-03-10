'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface AuthErrorBoundaryState
{
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    isModuleError: boolean;
    retryCount: number;
}

interface AuthErrorBoundaryProps
{
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    maxRetries?: number;
}

class AuthErrorBoundary extends Component<AuthErrorBoundaryProps, AuthErrorBoundaryState>
{
    private retryTimeoutId: NodeJS.Timeout | null = null;

    constructor(props: AuthErrorBoundaryProps)
    {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            isModuleError: false,
            retryCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<AuthErrorBoundaryState>
    {
        // Check if this is a Firebase module loading error
        const isModuleError = AuthErrorBoundary.isFirebaseModuleError(error);

        return {
            hasError: true,
            error,
            isModuleError,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo)
    {
        // Log the error for debugging
        console.error('AuthErrorBoundary caught an error:', error, errorInfo);

        this.setState({
            errorInfo,
        });

        // Call the onError callback if provided
        if (this.props.onError)
        {
            this.props.onError(error, errorInfo);
        }

        // If it's a module error, attempt automatic retry after a delay
        if (this.state.isModuleError && this.state.retryCount < (this.props.maxRetries || 3))
        {
            this.scheduleRetry();
        }
    }

    componentWillUnmount()
    {
        if (this.retryTimeoutId)
        {
            clearTimeout(this.retryTimeoutId);
        }
    }

    private static isFirebaseModuleError(error: Error): boolean
    {
        const errorMessage = error.message.toLowerCase();
        const stackTrace = error.stack?.toLowerCase() || '';

        const moduleErrorPatterns = [
            'module factory not available',
            'failed to load',
            'module loading failed',
            'cannot resolve module',
            'dynamic import failed',
            'module not found',
            'firebase/auth',
            'firebase/firestore',
            'auth is not defined',
            'firestore is not defined',
        ];

        return moduleErrorPatterns.some(pattern =>
            errorMessage.includes(pattern) || stackTrace.includes(pattern)
        );
    }

    private scheduleRetry = () =>
    {
        const retryDelay = Math.min(1000 * Math.pow(2, this.state.retryCount), 10000); // Max 10 seconds

        this.retryTimeoutId = setTimeout(() =>
        {
            this.handleRetry();
        }, retryDelay);
    };

    private handleRetry = () =>
    {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1,
        }));

        // Clear module cache to force fresh imports
        this.clearModuleCache();
    };

    private handleManualRetry = () =>
    {
        this.setState(prevState => ({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: prevState.retryCount + 1,
        }));

        // Clear module cache to force fresh imports
        this.clearModuleCache();
    };

    private clearModuleCache = async () =>
    {
        try
        {
            const { clearModuleCache } = await import('@/lib/firebase-wrapper');
            clearModuleCache();
        } catch (error)
        {
            console.error('Failed to clear module cache:', error);
        }
    };

    private handleRefreshPage = () =>
    {
        window.location.reload();
    };

    private handleGoHome = () =>
    {
        window.location.href = '/';
    };

    render()
    {
        if (this.state.hasError)
        {
            // If a custom fallback is provided, use it
            if (this.props.fallback)
            {
                return this.props.fallback;
            }

            // Render different UI based on error type
            if (this.state.isModuleError)
            {
                return this.renderModuleErrorUI();
            } else
            {
                return this.renderGenericErrorUI();
            }
        }

        return this.props.children;
    }

    private renderModuleErrorUI()
    {
        const { retryCount } = this.state;
        const maxRetries = this.props.maxRetries || 3;
        const canRetry = retryCount < maxRetries;

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-amber-500" />
                    </div>

                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Authentication System Unavailable
                    </h1>

                    <p className="text-gray-600 mb-6">
                        The authentication system is temporarily unavailable due to a module loading issue.
                        This usually resolves automatically.
                    </p>

                    {retryCount > 0 && (
                        <p className="text-sm text-gray-500 mb-4">
                            Retry attempt: {retryCount}/{maxRetries}
                        </p>
                    )}

                    <div className="space-y-3">
                        {canRetry && (
                            <button
                                onClick={this.handleManualRetry}
                                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Try Again
                            </button>
                        )}

                        <button
                            onClick={this.handleRefreshPage}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Page
                        </button>

                        <button
                            onClick={this.handleGoHome}
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Go to Homepage
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-6 text-left">
                            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                Error Details (Development)
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                {this.state.error.message}
                                {this.state.error.stack && `\n\n${this.state.error.stack}`}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        );
    }

    private renderGenericErrorUI()
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <AlertTriangle className="h-12 w-12 text-red-500" />
                    </div>

                    <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        Something went wrong
                    </h1>

                    <p className="text-gray-600 mb-6">
                        An unexpected error occurred in the authentication system.
                        Please try refreshing the page or contact support if the problem persists.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={this.handleManualRetry}
                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </button>

                        <button
                            onClick={this.handleRefreshPage}
                            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh Page
                        </button>

                        <button
                            onClick={this.handleGoHome}
                            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Go to Homepage
                        </button>
                    </div>

                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details className="mt-6 text-left">
                            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                                Error Details (Development)
                            </summary>
                            <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                {this.state.error.message}
                                {this.state.error.stack && `\n\n${this.state.error.stack}`}
                            </pre>
                        </details>
                    )}
                </div>
            </div>
        );
    }
}

export default AuthErrorBoundary;