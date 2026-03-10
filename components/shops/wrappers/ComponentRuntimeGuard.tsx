'use client';

import React, { ComponentType, ReactNode } from 'react';
import HMRErrorBoundary from '@/components/shops/error-boundaries/HMRErrorBoundary';
import ReactRuntimeWrapper from './ReactRuntimeWrapper';

interface ComponentRuntimeGuardProps
{
    children: ReactNode;
    fallback?: ReactNode;
    componentName?: string;
    enableHMRBoundary?: boolean;
    enableRuntimeWrapper?: boolean;
}

/**
 * Comprehensive runtime guard for React components
 * Combines HMR error boundary and React runtime wrapper for maximum stability
 */
export const ComponentRuntimeGuard: React.FC<ComponentRuntimeGuardProps> = ({
    children,
    fallback,
    componentName = 'Component',
    enableHMRBoundary = true,
    enableRuntimeWrapper = true
}) =>
{
    let content = children;

    // Apply React runtime wrapper if enabled
    if (enableRuntimeWrapper)
    {
        content = (
            <ReactRuntimeWrapper
                fallback={fallback || (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-gray-600 text-sm">
                            {componentName} temporarily unavailable
                        </p>
                    </div>
                )}
                enableHMRBoundary={false} // We'll handle HMR boundary separately
            >
                {content}
            </ReactRuntimeWrapper>
        );
    }

    // Apply HMR error boundary if enabled
    if (enableHMRBoundary)
    {
        content = (
            <HMRErrorBoundary
                fallback={fallback || (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-700 text-sm">
                            {componentName} encountered an error and is recovering...
                        </p>
                    </div>
                )}
            >
                {content}
            </HMRErrorBoundary>
        );
    }

    return <>{content}</>;
};

/**
 * Higher-order component to wrap components with comprehensive runtime protection
 */
export function withComponentRuntimeGuard<P extends object>(
    WrappedComponent: ComponentType<P>,
    options?: {
        fallback?: ReactNode;
        componentName?: string;
        enableHMRBoundary?: boolean;
        enableRuntimeWrapper?: boolean;
    }
): ComponentType<P>
{
    const {
        fallback,
        componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component',
        enableHMRBoundary = true,
        enableRuntimeWrapper = true
    } = options || {};

    const GuardedComponent: ComponentType<P> = (props) => (
        <ComponentRuntimeGuard
            fallback={fallback}
            componentName={componentName}
            enableHMRBoundary={enableHMRBoundary}
            enableRuntimeWrapper={enableRuntimeWrapper}
        >
            <WrappedComponent {...props} />
        </ComponentRuntimeGuard>
    );

    GuardedComponent.displayName = `withComponentRuntimeGuard(${componentName})`;

    return GuardedComponent;
}

/**
 * Utility to create runtime-safe versions of common component patterns
 */
export const createRuntimeSafeComponent = <P extends object>(
    Component: ComponentType<P>,
    componentName?: string
) =>
{
    return withComponentRuntimeGuard(Component, {
        componentName,
        enableHMRBoundary: true,
        enableRuntimeWrapper: true,
        fallback: (
            <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
                <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Loading {componentName || 'component'}...
                </p>
            </div>
        )
    });
};