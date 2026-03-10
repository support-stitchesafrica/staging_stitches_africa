/**
 * Admin Auth Guard Component
 * Protects admin routes and ensures only admin users can access
 * Requirements: 10.1, 10.2, 10.3
 */

'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';

interface AdminAuthGuardProps
{
    children: React.ReactNode;
    redirectTo?: string;
    unauthorizedRedirect?: string;
    fallback?: React.ReactNode;
}

/**
 * AdminAuthGuard Component
 * Protects routes that require admin privileges
 * Redirects unauthenticated users to login and unauthorized users to dashboard
 */
export const AdminAuthGuard: React.FC<AdminAuthGuardProps> = ({
    children,
    redirectTo = '/referral/login',
    unauthorizedRedirect = '/referral/dashboard',
    fallback,
}) =>
{
    const { isAuthenticated, isAdmin, loading, error } = useReferralAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [redirecting, setRedirecting] = React.useState(false);

    useEffect(() =>
    {
        // Don't redirect while loading or if already redirecting
        if (loading || redirecting) return;

        if (!isAuthenticated)
        {
            // Add a small delay to ensure Firebase Auth has fully initialized
            // This prevents premature redirects during page reloads
            const timer = setTimeout(() =>
            {
                if (!isAuthenticated && !loading)
                {
                    setRedirecting(true);
                    // Store the intended destination for redirect after login
                    const returnUrl = pathname || '/referral/admin';
                    const loginUrl = `${redirectTo}?returnUrl=${encodeURIComponent(returnUrl)}`;
                    router.push(loginUrl);
                }
            }, 100);

            return () => clearTimeout(timer);
        }

        if (isAuthenticated && !isAdmin)
        {
            // User is authenticated but not an admin
            // Add a small delay here too to ensure isAdmin state is fully loaded
            const timer = setTimeout(() =>
            {
                if (isAuthenticated && !isAdmin && !loading)
                {
                    setRedirecting(true);
                    router.push(unauthorizedRedirect);
                }
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isAdmin, loading, router, redirectTo, unauthorizedRedirect, pathname, redirecting]);

    // Show loading state
    if (loading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Verifying admin access...</p>
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

    // Show unauthorized message if authenticated but not admin
    if (isAuthenticated && !isAdmin)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-md mx-auto p-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-yellow-600 mb-2">Access Denied</h2>
                        <p className="text-gray-700 mb-4">
                            You do not have admin privileges to access this page.
                        </p>
                        <button
                            onClick={() => router.push(unauthorizedRedirect)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show fallback if provided and not authorized
    if ((!isAuthenticated || !isAdmin) && fallback)
    {
        return <>{fallback}</>;
    }

    // Don't render children if not authenticated or not admin
    if (!isAuthenticated || !isAdmin)
    {
        return null;
    }

    // User is authenticated and is admin, render children
    return <>{children}</>;
};

/**
 * Higher-order component for protecting admin pages
 * Usage: export default withAdminAuth(MyAdminPage);
 */
export function withAdminAuth<P extends object>(
    Component: React.ComponentType<P>,
    options: {
        redirectTo?: string;
        unauthorizedRedirect?: string;
        fallback?: React.ReactNode;
    } = {}
)
{
    const WrappedComponent = (props: P) =>
    {
        return (
            <AdminAuthGuard
                redirectTo={options.redirectTo}
                unauthorizedRedirect={options.unauthorizedRedirect}
                fallback={options.fallback}
            >
                <Component {...props} />
            </AdminAuthGuard>
        );
    };

    WrappedComponent.displayName = `withAdminAuth(${Component.displayName || Component.name})`;

    return WrappedComponent;
}
