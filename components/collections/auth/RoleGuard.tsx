'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCollectionsAuth } from '@/contexts/CollectionsAuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CollectionsRole } from '@/lib/collections/types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * RoleGuard Component Props
 */
interface RoleGuardProps
{
    /** Array of roles that are allowed to access the protected content */
    allowedRoles: CollectionsRole[];

    /** Content to render when user has appropriate role */
    children: React.ReactNode;

    /** Optional custom fallback component to render when access is denied */
    fallback?: React.ReactNode;
}

/**
 * Default Access Denied UI Component
 * Displays when user doesn't have the required role
 */
interface AccessDeniedProps
{
    userRole?: CollectionsRole;
    allowedRoles: CollectionsRole[];
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ userRole, allowedRoles }) =>
{
    const router = useRouter();

    const roleDisplayNames: Record<CollectionsRole, string> = {
        superadmin: 'Super Admin',
        editor: 'Editor',
        viewer: 'Viewer',
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                    {/* Icon */}
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-red-100 p-4">
                            <ShieldAlert className="w-12 h-12 text-red-600" />
                        </div>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Access Denied
                    </h2>

                    {/* Description */}
                    <p className="text-gray-600 mb-4">
                        You don't have permission to access this page.
                    </p>

                    {/* Current Role Display */}
                    {userRole && (
                        <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                            <p className="text-sm text-gray-700">
                                Your current role:{' '}
                                <span className="font-semibold text-gray-900">
                                    {roleDisplayNames[userRole]}
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Required Roles */}
                    <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                            Required role{allowedRoles.length > 1 ? 's' : ''}:{' '}
                            <span className="font-semibold text-blue-900">
                                {allowedRoles.map(role => roleDisplayNames[role]).join(', ')}
                            </span>
                        </p>
                    </div>

                    {/* Help Text */}
                    <p className="text-sm text-gray-500 mb-6">
                        If you believe you should have access to this page, please contact your administrator.
                    </p>

                    {/* Action Button */}
                    <button
                        onClick={() => router.push('/collections')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * RoleGuard Component
 * Protects routes and features based on user roles
 * 
 * @example
 * // Protect a page for Super Admins only
 * <RoleGuard allowedRoles={['superadmin']}>
 *   <TeamManagementPage />
 * </RoleGuard>
 * 
 * @example
 * // Allow multiple roles
 * <RoleGuard allowedRoles={['superadmin', 'editor']}>
 *   <CollectionEditor />
 * </RoleGuard>
 * 
 * @example
 * // With custom fallback
 * <RoleGuard 
 *   allowedRoles={['superadmin']} 
 *   fallback={<CustomAccessDenied />}
 * >
 *   <AdminPanel />
 * </RoleGuard>
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
    allowedRoles,
    children,
    fallback
}) =>
{
    const { collectionsUser, loading } = useCollectionsAuth();

    // Show loading spinner while checking authentication
    if (loading)
    {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        );
    }

    // If no user is authenticated, show access denied
    // (CollectionsAuthGuard should handle redirecting to login)
    if (!collectionsUser)
    {
        return fallback || <AccessDenied allowedRoles={allowedRoles} />;
    }

    // Check if user's role is in the allowed roles list
    const hasAccess = allowedRoles.includes(collectionsUser.role);

    if (!hasAccess)
    {
        // User doesn't have the required role, show access denied
        return fallback || (
            <AccessDenied
                userRole={collectionsUser.role}
                allowedRoles={allowedRoles}
            />
        );
    }

    // User has the required role, render protected content
    return <>{children}</>;
};
