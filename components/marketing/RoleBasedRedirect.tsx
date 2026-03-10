/**
 * Marketing Dashboard - Role-Based Redirect Component
 * Automatically redirects users to their appropriate dashboard based on role
 * Requirements: 3.3, 6.1, 7.1, 8.1, 9.1
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { Loader2 } from 'lucide-react';

interface RoleBasedRedirectProps
{
    fallbackPath?: string;
    children?: React.ReactNode;
}

export default function RoleBasedRedirect({
    fallbackPath = '/marketing/dashboard',
    children
}: RoleBasedRedirectProps)
{
    const router = useRouter();
    const { marketingUser, loading, isAuthorized } = useMarketingAuth();

    useEffect(() =>
    {
        if (loading || !isAuthorized || !marketingUser) return;

        const redirectPath = getDashboardPath(marketingUser.role);
        router.push(redirectPath);
    }, [marketingUser, loading, isAuthorized, router]);

    // Show loading while determining redirect
    if (loading || !isAuthorized)
    {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    // Render children if provided (for custom loading states)
    return children ? <>{children}</> : null;
}

/**
 * Get the appropriate dashboard path for a user role
 */
function getDashboardPath(role: string): string
{
    switch (role)
    {
        case 'super_admin':
            return '/marketing';
        case 'team_lead':
            return '/marketing';
        case 'bdm':
            return '/marketing';
        case 'team_member':
            return '/marketing';
        default:
            return '/marketing';
    }
}

/**
 * Hook to get the dashboard path for the current user
 */
export function useDashboardPath(): string | null
{
    const { marketingUser } = useMarketingAuth();

    if (!marketingUser) return null;

    return getDashboardPath(marketingUser.role);
}

/**
 * Hook to check if current path matches user's default dashboard
 */
export function useIsDefaultDashboard(currentPath: string): boolean
{
    const { marketingUser } = useMarketingAuth();

    if (!marketingUser) return false;

    const defaultPath = getDashboardPath(marketingUser.role);
    return currentPath === defaultPath;
}