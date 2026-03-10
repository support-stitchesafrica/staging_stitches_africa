'use client';

import React, { Component, ReactNode, Suspense } from 'react';
import HMRErrorBoundary from '@/components/shops/error-boundaries/HMRErrorBoundary';
import { loadReactModule } from '@/lib/utils/module-helpers';

interface ReactRuntimeWrapperProps
{
    children: ReactNode;
    fallback?: ReactNode;
    enableHMRBoundary?: boolean;
    enableSuspense?: boolean;
    suspenseFallback?: ReactNode;
}

interface ReactRuntimeWrapperState
{
    hasRuntimeError: boolean;
    runtimeError: Error | null;
    isRecovering: boolean;
}

/**
 * Wrapper component for React components that might have runtime dependencies
 * Provides error boundaries and recovery mechanisms for HMR-related issues
 */
class ReactRuntimeWrapper extends Component<ReactRuntimeWrapperProps, ReactRuntimeWrapperState>
{
    private retryTimeoutId: NodeJS.Timeout | null = null;

    constructor(props: ReactRuntimeWrapperProps)
    {
        super(props);
        this.state = {
            hasRuntimeError: false,
            runtimeError: null,
            isRecovering: false,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ReactRuntimeWrapperState>
    {
        // Check if this is a React runtime related error
        const isRuntimeError = error.message.toLowerCase().includes('react') ||
            error.message.toLowerCase().includes('jsx') ||
            error.message.toLowerCase().includes('runtime') ||
            error.message.toLowerCase().includes('module factory');

        if (isRuntimeError)
        {
            return {
                hasRuntimeError: true,
                runtimeError: error,
            };
        }

        // Let other error boundaries handle non-runtime errors
        throw error;
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo)
    {
        if (process.env.NODE_ENV === 'development')
        {
            console.group('[React Runtime Wrapper] Runtime error caught');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.groupEnd();
        }

        // Attempt automatic recovery for runtime errors
        this.scheduleRecovery();
    }

    componentWillUnmount()
    {
        if (this.retryTimeoutId)
        {
            clearTimeout(this.retryTimeoutId);
            this.retryTimeoutId = null;
        }
    }

    private scheduleRecovery = () =>
    {
        if (this.retryTimeoutId)
        {
            clearTimeout(this.retryTimeoutId);
        }

        this.retryTimeoutId = setTimeout(() =>
        {
            this.attemptRecovery();
        }, 1000);
    };

    private attemptRecovery = async () =>
    {
        if (this.state.isRecovering) return;

        this.setState({ isRecovering: true });

        try
        {
            // Try to reload React runtime modules
            await loadReactModule('react', 'runtime_recovery_react');
            await loadReactModule('react-dom', 'runtime_recovery_react_dom');

            // Wait a bit for modules to stabilize
            await new Promise(resolve => setTimeout(resolve, 500));

            // Reset error state
            this.setState({
                hasRuntimeError: false,
                runtimeError: null,
                isRecovering: false,
            });

            if (process.env.NODE_ENV === 'development')
            {
                console.log('[React Runtime Wrapper] Recovery successful');
            }
        } catch (recoveryError)
        {
            if (process.env.NODE_ENV === 'development')
            {
                console.error('[React Runtime Wrapper] Recovery failed:', recoveryError);
            }

            this.setState({ isRecovering: false });
        }
    };

    private handleManualRetry = () =>
    {
        this.attemptRecovery();
    };

    render()
    {
        const { children, fallback, enableHMRBoundary = true, enableSuspense = false, suspenseFallback } = this.props;
        const { hasRuntimeError, runtimeError, isRecovering } = this.state;

        // Show runtime error UI
        if (hasRuntimeError)
        {
            if (fallback)
            {
                return fallback;
            }

            return (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-700 mb-2">
                        <span className="font-medium">React Runtime Error</span>
                        {isRecovering && (
                            <span className="text-sm">(Recovering...)</span>
                        )}
                    </div>
                    <p className="text-sm text-yellow-600 mb-3">
                        {runtimeError?.message || 'A React runtime error occurred'}
                    </p>
                    <button
                        onClick={this.handleManualRetry}
                        disabled={isRecovering}
                        className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 disabled:opacity-50"
                    >
                        {isRecovering ? 'Recovering...' : 'Retry'}
                    </button>
                </div>
            );
        }

        // Wrap with Suspense if enabled
        let content = children;
        if (enableSuspense)
        {
            content = (
                <Suspense fallback={suspenseFallback || <div>Loading...</div>}>
                    {content}
                </Suspense>
            );
        }

        // Wrap with HMR Error Boundary if enabled
        if (enableHMRBoundary)
        {
            content = (
                <HMRErrorBoundary>
                    {content}
                </HMRErrorBoundary>
            );
        }

        return content;
    }
}

export default ReactRuntimeWrapper;

/**
 * Higher-order component to wrap components with React runtime protection
 */
export function withReactRuntimeWrapper<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    options?: {
        fallback?: ReactNode;
        enableHMRBoundary?: boolean;
        enableSuspense?: boolean;
        suspenseFallback?: ReactNode;
    }
)
{
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const WithReactRuntimeWrapper: React.FC<P> = (props) => (
        <ReactRuntimeWrapper {...options}>
            <WrappedComponent {...props} />
        </ReactRuntimeWrapper>
    );

    WithReactRuntimeWrapper.displayName = `withReactRuntimeWrapper(${displayName})`;

    return WithReactRuntimeWrapper;
}

/**
 * Hook to create a runtime-safe component wrapper
 */
export function useRuntimeSafeComponent<P extends object>(
    Component: React.ComponentType<P>,
    fallback?: ReactNode
): React.ComponentType<P>
{
    return React.useMemo(() =>
    {
        return withReactRuntimeWrapper(Component, {
            fallback,
            enableHMRBoundary: true,
            enableSuspense: false
        });
    }, [Component, fallback]);
}