'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAtlasAuth } from '@/contexts/AtlasAuthContext';
import { AtlasRole } from '@/lib/atlas/types';
import LoadingSpinner from '@/components/LoadingSpinner';

/**
 * Role Guard Component Props
 */
interface RoleGuardProps
{
    /** Array of roles that are allowed to access the content */
    allowedRoles: AtlasRole[];

    /** Content to render when user has an allowed role */
    children: React.ReactNode;

    /** Optional fallback content to render when user doesn't have permission */
    fallback?: React.ReactNode;
}

/**
 * Role Guard Component
 * Protects content by checking if the current user's role is in the allowed roles list
 * Renders children if role is allowed, otherwise shows fallback or redirects
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
    allowedRoles,
    children,
    fallback
}) =>
{
    const { atlasUser, loading } = useAtlasAuth();
    const router = useRouter();

    // Show loading spinner while checking authentication
    if (loading)
    {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    // If no atlas user, this should be handled by AtlasAuthGuard
    // But as a safety check, redirect to auth page
    if (!atlasUser)
    {
        router.push('/atlas/auth');
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    // Check if user's role is in the allowed roles list
    const hasPermission = allowedRoles.includes(atlasUser.role);

    // If user doesn't have permission
    if (!hasPermission)
    {
        // If fallback is provided, render it
        if (fallback)
        {
            return <>{fallback}</>;
        }

        // Otherwise, show default access denied message
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8 max-w-md">
                    <div className="mb-4">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Restricted
                    </h2>
                    <p className="text-gray-600 mb-6">
                        You don't have permission to access this content.
                        Your current role ({atlasUser.role}) doesn't have the required permissions.
                    </p>
                    <button
                        onClick={() => router.push('/atlas')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Overview Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // User has permission, render children
    return <>{children}</>;
};
