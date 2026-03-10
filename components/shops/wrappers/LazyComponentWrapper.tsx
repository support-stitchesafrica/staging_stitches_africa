'use client';

import React, { lazy, Suspense, ComponentType } from 'react';
import HMRErrorBoundary from '@/components/shops/error-boundaries/HMRErrorBoundary';
import { loadModuleWithRetry } from '@/lib/utils/module-helpers';

interface LazyWrapperOptions
{
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    enableHMRBoundary?: boolean;
    moduleKey?: string;
}

/**
 * Creates a lazy-loaded component with HMR error boundary protection
 * and module loading retry logic for better stability during development
 */
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T } | T>,
    options: LazyWrapperOptions = {}
): ComponentType<React.ComponentProps<T>>
{
    const {
        fallback = <div>Loading...</div>,
        errorFallback,
        enableHMRBoundary = true,
        moduleKey
    } = options;

    // Create lazy component with module loading wrapper
    const LazyComponent = lazy(async (): Promise<{ default: T }> =>
    {
        try
        {
            // Use module loading wrapper for better HMR stability
            const moduleResult = await loadModuleWithRetry(
                // Convert import function to module path for retry logic
                importFn.toString(),
                moduleKey
            );

            // Handle both default exports and named exports
            if (moduleResult && typeof moduleResult === 'object' && 'default' in moduleResult)
            {
                return { default: moduleResult.default };
            }

            return { default: moduleResult as T };
        } catch (error)
        {
            // Fallback to direct import if module wrapper fails
            if (process.env.NODE_ENV === 'development')
            {
                console.warn('[LazyComponentWrapper] Module wrapper failed, falling back to direct import:', error);
            }
            const result = await importFn();

            // Ensure we always return the expected format
            if (result && typeof result === 'object' && 'default' in result)
            {
                return result as { default: T };
            }

            return { default: result as T };
        }
    });

    // Create the wrapped component
    const WrappedLazyComponent: ComponentType<React.ComponentProps<T>> = (props) =>
    {
        const content = (
            <Suspense fallback={fallback}>
                <LazyComponent {...props} />
            </Suspense>
        );

        if (enableHMRBoundary)
        {
            return (
                <HMRErrorBoundary fallback={errorFallback}>
                    {content}
                </HMRErrorBoundary>
            );
        }

        return content;
    };

    // Set display name for debugging
    WrappedLazyComponent.displayName = `LazyWrapper(${(LazyComponent as any).displayName || 'Component'})`;

    return WrappedLazyComponent;
}

/**
 * Higher-order component to wrap existing lazy components with HMR protection
 */
export function withLazyWrapper<P extends object>(
    LazyComponent: ComponentType<P>,
    options: Omit<LazyWrapperOptions, 'moduleKey'> = {}
): ComponentType<P>
{
    const {
        fallback = <div>Loading...</div>,
        errorFallback,
        enableHMRBoundary = true
    } = options;

    const WrappedComponent: ComponentType<P> = (props) =>
    {
        const content = (
            <Suspense fallback={fallback}>
                <LazyComponent {...props} />
            </Suspense>
        );

        if (enableHMRBoundary)
        {
            return (
                <HMRErrorBoundary fallback={errorFallback}>
                    {content}
                </HMRErrorBoundary>
            );
        }

        return content;
    };

    WrappedComponent.displayName = `withLazyWrapper(${LazyComponent.displayName || 'Component'})`;

    return WrappedComponent;
}

/**
 * Utility to create a lazy component with common loading patterns
 */
export const createStandardLazyComponent = <T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T } | T>,
    componentName?: string
) =>
{
    return createLazyComponent(importFn, {
        fallback: (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading {componentName || 'component'}...</span>
            </div>
        ),
        errorFallback: (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                    Failed to load {componentName || 'component'}. Please try refreshing the page.
                </p>
            </div>
        ),
        enableHMRBoundary: true,
        moduleKey: componentName ? `lazy_${componentName.toLowerCase().replace(/\s+/g, '_')}` : undefined
    });
};