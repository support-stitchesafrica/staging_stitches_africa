'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';

interface ProtectedRouteProps
{
    children: React.ReactNode;
    fallback?: React.ReactNode;
    redirectTo?: string;
}

export const StandardProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    fallback,
    redirectTo = '/auth'
}) =>
{
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() =>
    {
        if (!loading && !user)
        {
            // Redirect to auth page with current path as redirect parameter
            const currentPath = window.location.pathname + window.location.search;
            const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
            router.push(redirectUrl);
        }
    }, [user, loading, router, redirectTo]);

    if (loading)
    {
        return fallback || <LoadingSkeleton />;
    }

    if (!user)
    {
        return fallback || <LoadingSkeleton />;
    }

    return <>{children}</>;
};

export const OptionalProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    fallback
}) =>
{
    const { loading } = useAuth();

    if (loading)
    {
        return fallback || <LoadingSkeleton />;
    }

    return <>{children}</>;
};