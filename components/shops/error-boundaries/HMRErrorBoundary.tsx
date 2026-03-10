'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Zap, Clock, X } from 'lucide-react';
import { moduleLoader } from '@/lib/utils/module-loader';
import { refreshModuleCache, getModuleDiagnostics } from '@/lib/utils/module-helpers';

interface HMRError
{
    type: 'module-factory-deleted' | 'import-failure' | 'hmr-update-failed' | 'generic';
    modulePath: string;
    errorMessage: string;
    timestamp: Date;
    canRetry: boolean;
}

interface HMRErrorBoundaryState
{
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    hmrError: HMRError | null;
    retryCount: number;
    isRecovering: boolean;
    lastRecoveryAttempt: Date | null;
    showDetails: boolean;
}

interface HMRErrorBoundaryProps
{
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo, hmrError: HMRError | null) => void;
    maxRetries?: number;
    enableAutoRecovery?: boolean;
    recoveryDelay?: number;
}

class HMRErrorBoundary extends Component<HMRErrorBoundaryProps, HMRErrorBoundaryState>
{
    private retryTimeoutId: NodeJS.Timeout | null = null;
    private autoRecoveryTimeoutId: NodeJS.Timeout | null = null;

    constructor(props: HMRErrorBoundaryProps)
    {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            hmrError: null,
            retryCount: 0,
            isRecovering: false,
            lastRecoveryAttempt: null,
            showDetails: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<HMRErrorBoundaryState>
    {
        const hmrError = HMRErrorBoundary.analyzeHMRError(error);

        return {
            hasError: true,
            error,
            hmrError,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo)
    {
        const hmrError = HMRErrorBoundary.analyzeHMRError(error);

        // Enhanced logging for HMR errors
        if (process.env.NODE_ENV === 'development')
        {
            console.group('[HMR Error Boundary] Error caught');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('HMR Analysis:', hmrError);
            console.error('Module Diagnostics:', getModuleDiagnostics());
            console.groupEnd();
        }

        this.setState({
            errorInfo,
            hmrError,
        });

        // Call the onError callback if provided
        if (this.props.onError)
        {
            this.props.onError(error, errorInfo, hmrError);
        }

        // Attempt automatic recovery for HMR-related errors
        if (hmrError && hmrError.canRetry && this.state.retryCount < (this.props.maxRetries || 3))
        {
            if (this.props.enableAutoRecovery !== false)
            {
                this.scheduleAutoRecovery();
            }
        }
    }

    componentWillUnmount()
    {
        this.clearTimeouts();
    }

    private clearTimeouts()
    {
        if (this.retryTimeoutId)
        {
            clearTimeout(this.retryTimeoutId);
            this.retryTimeoutId = null;
        }
        if (this.autoRecoveryTimeoutId)
        {
            clearTimeout(this.autoRecoveryTimeoutId);
            this.autoRecoveryTimeoutId = null;
        }
    }

    /**
     * Analyze error to determine if it's HMR-related and how to handle it
     */
    static analyzeHMRError(error: Error): HMRError
    {
        const errorMessage = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';

        // Detect "module factory is not available" errors
        if (errorMessage.includes('module factory is not available') ||
            errorMessage.includes('module factory not available'))
        {
            return {
                type: 'module-factory-deleted',
                modulePath: HMRErrorBoundary.extractModulePath(error),
                errorMessage: error.message,
                timestamp: new Date(),
                canRetry: true,
            };
        }

        // Detect import failures
        if (errorMessage.includes('cannot resolve module') ||
            errorMessage.includes('module not found') ||
            errorMessage.includes('failed to import'))
        {
            return {
                type: 'import-failure',
                modulePath: HMRErrorBoundary.extractModulePath(error),
                errorMessage: error.message,
                timestamp: new Date(),
                canRetry: true,
            };
        }

        // Detect HMR update failures
        if (errorMessage.includes('hmr') ||
            errorMessage.includes('hot reload') ||
            stack.includes('webpack') ||
            stack.includes('turbopack'))
        {
            return {
                type: 'hmr-update-failed',
                modulePath: HMRErrorBoundary.extractModulePath(error),
                errorMessage: error.message,
                timestamp: new Date(),
                canRetry: true,
            };
        }

        // Generic error - might still be recoverable
        return {
            type: 'generic',
            modulePath: HMRErrorBoundary.extractModulePath(error),
            errorMessage: error.message,
            timestamp: new Date(),
            canRetry: false,
        };
    }

    /**
     * Extract module path from error message or stack trace
     */
    static extractModulePath(error: Error): string
    {
        const message = error.message;
        const stack = error.stack || '';

        // Try to extract module path from common error patterns
        const patterns = [
            /module ['"]([^'"]+)['"]/i,
            /import\(['"]([^'"]+)['"]\)/i,
            /from ['"]([^'"]+)['"]/i,
            /at ([^(]+\.(?:js|ts|jsx|tsx))/i,
        ];

        for (const pattern of patterns)
        {
            const match = message.match(pattern) || stack.match(pattern);
            if (match && match[1])
            {
                return match[1];
            }
        }

        return 'unknown';
    }

    /**
     * Schedule automatic recovery attempt
     */
    private scheduleAutoRecovery = () =>
    {
        const delay = this.props.recoveryDelay || 1000;

        this.autoRecoveryTimeoutId = setTimeout(() =>
        {
            this.handleAutoRecovery();
        }, delay);
    };

    /**
     * Attempt automatic recovery
     */
    private handleAutoRecovery = async () =>
    {
        if (this.state.isRecovering) return;

        this.setState({
            isRecovering: true,
            lastRecoveryAttempt: new Date()
        });

        try
        {
            // Clear module cache and attempt recovery
            await refreshModuleCache();

            // Wait a bit for modules to stabilize
            await new Promise(resolve => setTimeout(resolve, 500));

            // Reset error state to trigger re-render
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                hmrError: null,
                isRecovering: false,
                retryCount: this.state.retryCount + 1,
            });

            if (process.env.NODE_ENV === 'development')
            {
                console.log('[HMR Error Boundary] Auto-recovery successful');
            }
        } catch (recoveryError)
        {
            if (process.env.NODE_ENV === 'development')
            {
                console.error('[HMR Error Boundary] Auto-recovery failed:', recoveryError);
            }

            this.setState({ isRecovering: false });
        }
    };

    /**
     * Manual retry handler
     */
    private handleRetry = () =>
    {
        this.handleAutoRecovery();
    };

    /**
     * Manual refresh handler
     */
    private handleRefresh = () =>
    {
        if (typeof window !== 'undefined')
        {
            window.location.reload();
        }
    };

    /**
     * Clear cache and retry
     */
    private handleClearCacheAndRetry = async () =>
    {
        this.setState({ isRecovering: true });

        try
        {
            // Clear all caches
            moduleLoader.clearModuleCache();

            // Clear Next.js cache if possible
            if (typeof window !== 'undefined' && 'caches' in window)
            {
                const cacheNames = await caches.keys();
                await Promise.all(
                    cacheNames.map(cacheName => caches.delete(cacheName))
                );
            }

            await this.handleAutoRecovery();
        } catch (error)
        {
            if (process.env.NODE_ENV === 'development')
            {
                console.error('[HMR Error Boundary] Cache clear failed:', error);
            }
            this.setState({ isRecovering: false });
        }
    };

    /**
     * Toggle error details visibility
     */
    private toggleDetails = () =>
    {
        this.setState({ showDetails: !this.state.showDetails });
    };

    /**
     * Get user-friendly error message
     */
    private getErrorMessage(): string
    {
        const { hmrError } = this.state;

        if (!hmrError) return 'An unexpected error occurred';

        switch (hmrError.type)
        {
            case 'module-factory-deleted':
                return 'Module factory was deleted during hot reload. This is a common HMR issue.';
            case 'import-failure':
                return 'Failed to import a required module. This might be due to HMR instability.';
            case 'hmr-update-failed':
                return 'Hot Module Replacement update failed. The development server needs recovery.';
            default:
                return 'An error occurred that might be related to development server issues.';
        }
    }

    /**
     * Get recovery suggestions
     */
    private getRecoverySuggestions(): string[]
    {
        const { hmrError } = this.state;

        if (!hmrError) return ['Try refreshing the page'];

        const suggestions = ['Try the "Retry" button to attempt automatic recovery'];

        switch (hmrError.type)
        {
            case 'module-factory-deleted':
                suggestions.push('Clear cache and retry if the issue persists');
                suggestions.push('Refresh the page as a last resort');
                break;
            case 'import-failure':
                suggestions.push('Check if the module path is correct');
                suggestions.push('Clear cache and retry');
                break;
            case 'hmr-update-failed':
                suggestions.push('Clear cache and retry');
                suggestions.push('Restart the development server if issues continue');
                break;
            default:
                suggestions.push('Clear cache and retry');
                suggestions.push('Refresh the page');
        }

        return suggestions;
    }

    render()
    {
        if (!this.state.hasError)
        {
            return this.props.children;
        }

        // Use custom fallback if provided
        if (this.props.fallback)
        {
            return this.props.fallback;
        }

        const { hmrError, isRecovering, retryCount, showDetails, error, errorInfo } = this.state;
        const maxRetries = this.props.maxRetries || 3;
        const canRetry = hmrError?.canRetry && retryCount < maxRetries;

        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-white rounded-lg shadow-xl border border-red-200">
                    {/* Header */}
                    <div className="bg-red-500 text-white p-6 rounded-t-lg">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-8 h-8" />
                            <div>
                                <h1 className="text-xl font-bold">Development Error</h1>
                                <p className="text-red-100 text-sm">
                                    {hmrError?.type === 'module-factory-deleted' ? 'HMR Module Loading Error' : 'Application Error'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Error Message */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-2">What happened?</h2>
                            <p className="text-gray-700 leading-relaxed">
                                {this.getErrorMessage()}
                            </p>
                            {hmrError?.modulePath && hmrError.modulePath !== 'unknown' && (
                                <p className="text-sm text-gray-600 mt-2">
                                    <strong>Module:</strong> {hmrError.modulePath}
                                </p>
                            )}
                        </div>

                        {/* Recovery Status */}
                        {isRecovering && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 text-blue-700">
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    <span className="font-medium">Attempting recovery...</span>
                                </div>
                                <p className="text-blue-600 text-sm mt-1">
                                    Clearing module cache and reloading components
                                </p>
                            </div>
                        )}

                        {/* Retry Information */}
                        {retryCount > 0 && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="flex items-center gap-2 text-yellow-700">
                                    <Clock className="w-4 h-4" />
                                    <span className="font-medium">
                                        Recovery attempts: {retryCount}/{maxRetries}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Recovery Suggestions */}
                        <div className="mb-6">
                            <h3 className="text-md font-semibold text-gray-900 mb-3">How to fix this:</h3>
                            <ul className="space-y-2">
                                {this.getRecoverySuggestions().map((suggestion, index) => (
                                    <li key={index} className="flex items-start gap-2 text-gray-700">
                                        <span className="text-blue-500 font-bold text-sm mt-1">•</span>
                                        <span className="text-sm">{suggestion}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 mb-6">
                            {canRetry && !isRecovering && (
                                <button
                                    onClick={this.handleRetry}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Retry
                                </button>
                            )}

                            {!isRecovering && (
                                <button
                                    onClick={this.handleClearCacheAndRetry}
                                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                    <Zap className="w-4 h-4" />
                                    Clear Cache & Retry
                                </button>
                            )}

                            <button
                                onClick={this.handleRefresh}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                Refresh Page
                            </button>

                            <button
                                onClick={this.toggleDetails}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                <Bug className="w-4 h-4" />
                                {showDetails ? 'Hide' : 'Show'} Details
                            </button>
                        </div>

                        {/* Error Details */}
                        {showDetails && (
                            <div className="border-t pt-6">
                                <div className="space-y-4">
                                    {/* Error Message */}
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Error Message:</h4>
                                        <pre className="bg-gray-100 p-3 rounded text-sm text-gray-800 overflow-x-auto">
                                            {error?.message || 'No error message available'}
                                        </pre>
                                    </div>

                                    {/* Stack Trace */}
                                    {error?.stack && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Stack Trace:</h4>
                                            <pre className="bg-gray-100 p-3 rounded text-xs text-gray-700 overflow-x-auto max-h-40 overflow-y-auto">
                                                {error.stack}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Component Stack */}
                                    {errorInfo?.componentStack && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Component Stack:</h4>
                                            <pre className="bg-gray-100 p-3 rounded text-xs text-gray-700 overflow-x-auto max-h-40 overflow-y-auto">
                                                {errorInfo.componentStack}
                                            </pre>
                                        </div>
                                    )}

                                    {/* Module Diagnostics */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 mb-2">Module Diagnostics:</h4>
                                            <pre className="bg-gray-100 p-3 rounded text-xs text-gray-700 overflow-x-auto max-h-40 overflow-y-auto">
                                                {JSON.stringify(getModuleDiagnostics(), null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-6 py-4 rounded-b-lg border-t">
                        <p className="text-xs text-gray-600">
                            This error boundary is active only in development mode.
                            Production builds will handle errors differently.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
}
export default HMRErrorBoundary;
export type { HMRError, HMRErrorBoundaryProps, HMRErrorBoundaryState };