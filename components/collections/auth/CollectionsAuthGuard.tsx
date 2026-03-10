'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCollectionsAuth } from '@/contexts/CollectionsAuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { toast } from 'sonner';

/**
 * Collections Auth Guard Component
 * Protects routes by ensuring user is authenticated and has Collections access
 * Redirects to /collections/auth if not authenticated or not authorized
 */
interface CollectionsAuthGuardProps
{
    /** Content to render when user is authenticated and authorized */
    children: React.ReactNode;
}

export const CollectionsAuthGuard: React.FC<CollectionsAuthGuardProps> = ({ children }) =>
{
    const { user, collectionsUser, loading, error } = useCollectionsAuth();
    const router = useRouter();
    const pathname = usePathname();
    const hasShownToast = useRef(false);
    const isRedirecting = useRef(false);

    useEffect(() =>
    {
        // Wait for loading to complete before checking auth state
        if (loading) return;

        // Prevent multiple redirects
        if (isRedirecting.current) return;

        console.log('Collections Auth Guard Check:', { user: !!user, collectionsUser: !!collectionsUser, pathname });

        // If no user is authenticated, redirect to auth page
        if (!user)
        {
            console.log('No user found, redirecting to auth');
            if (!hasShownToast.current && pathname !== '/collections/auth')
            {
                toast.error('Authentication Required', {
                    duration: 4000,
                    description: 'Please sign in to access Collections Designer.'
                });
                hasShownToast.current = true;
            }

            if (pathname !== '/collections/auth')
            {
                isRedirecting.current = true;
                router.push('/collections/auth');
            }
            return;
        }

        // If user is authenticated but doesn't have Collections access, redirect to auth page
        if (!collectionsUser || !collectionsUser.isCollectionsUser)
        {
            console.log('User lacks Collections access, redirecting to auth');
            if (!hasShownToast.current && pathname !== '/collections/auth')
            {
                toast.error('Access Denied', {
                    duration: 5000,
                    description: 'You are not authorized to access Collections Designer. Please contact your administrator.'
                });
                hasShownToast.current = true;
            }

            if (pathname !== '/collections/auth')
            {
                isRedirecting.current = true;
                router.push('/collections/auth');
            }
            return;
        }

        // Reset flags when successfully authenticated and authorized
        hasShownToast.current = false;
        isRedirecting.current = false;
    }, [user, collectionsUser, loading, router, pathname]);

    // Reset redirect flag when pathname changes
    useEffect(() =>
    {
        isRedirecting.current = false;
    }, [pathname]);

    // Show loading spinner while checking authentication
    if (loading)
    {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    // Show error message if there's an authentication error
    if (error)
    {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-8">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">
                        Access Denied
                    </h2>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <button
                        onClick={() => router.push('/collections/auth')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // If user is not authenticated or not authorized, don't render children
    // (redirect will happen in useEffect)
    if (!user || !collectionsUser || !collectionsUser.isCollectionsUser)
    {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    // User is authenticated and authorized, render protected content
    return <>{children}</>;
};
