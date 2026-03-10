/**
 * Referral Auth Guard Component
 * Protects referral routes and ensures only authenticated referrers can access
 * Requirements: 10.1, 10.2, 10.3
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';

interface ReferralAuthGuardProps
{
    children: React.ReactNode;
    redirectTo?: string;
    fallback?: React.ReactNode;
}

/**
 * ReferralAuthGuard Component
 * Protects routes that require referral authentication
 * Redirects unauthenticated users to login page
 */
export const ReferralAuthGuard: React.FC<ReferralAuthGuardProps> = ({
    children,
    redirectTo = '/referral/login',
    fallback,
}) =>
{
    const { isAuthenticated, loading, error } = useReferralAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [redirecting, setRedirecting] = React.useState(false);

    useEffect(() =>
    {
        // Don't redirect while loading or if already redirecting
        if (loading || redirecting) return;

        if (!isAuthenticated)
        {
            // Add a delay to ensure Firebase Auth has fully initialized and restored session
            // This prevents premature redirects during page reloads when session is being restored
            const timer = setTimeout(() =>
            {
                if (!isAuthenticated && !loading)
                {
                    setRedirecting(true);
                    // Store the intended destination for redirect after login
                    const returnUrl = pathname || '/referral/dashboard';
                    const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}`;
                    router.push(loginUrl);
                }
            }, 200);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, loading, router, redirectTo, pathname, redirecting]);

    // Show loading state
    if (loading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h2>
                        <p className="text-gray-700 mb-4">{error}</p>
                        <button
                            onClick={() => router.push(redirectTo)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show fallback if provided and not authenticated
    if (!isAuthenticated && fallback)
    {
        return <>{fallback}</>;
    }

    // Don't render children if not authenticated
    if (!isAuthenticated)
    {
        return null;
    }

    // User is authenticated, render children
    return <>{children}</>;
};

/**
 * Higher-order component for protecting pages
 * Usage: export default withReferralAuth(MyPage);
 */
export function withReferralAuth<P extends object>(
    Component: React.ComponentType<P>,
    options: { redirectTo?: string; fallback?: React.ReactNode } = {}
)
{
    const WrappedComponent = (props: P) =>
    {
        return (
            <ReferralAuthGuard redirectTo={options.redirectTo} fallback={options.fallback}>
                <Component {...props} />
            </ReferralAuthGuard>
        );
    };

    WrappedComponent.displayName = `withReferralAuth(${Component.displayName || Component.name})`;

    return WrappedComponent;
}
