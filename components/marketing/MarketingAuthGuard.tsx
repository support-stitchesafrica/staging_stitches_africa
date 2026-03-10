/**
 * Marketing Dashboard Authentication Guard
 * Protects routes and provides role-based access control
 * Requirements: 3.3, 6.1, 7.1, 8.1, 9.1
 */

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMarketingAuth, type WithMarketingAuthOptions } from '@/contexts/MarketingAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle, Lock, ArrowLeft } from 'lucide-react';
import { UserPermissions } from '@/lib/marketing/auth-middleware';

interface MarketingAuthGuardProps extends WithMarketingAuthOptions
{
    children: React.ReactNode;
    showFallback?: boolean;
}

export default function MarketingAuthGuard({
    children,
    requiredRole,
    requiredPermissions,
    redirectTo,
    showFallback = true
}: MarketingAuthGuardProps)
{
    const router = useRouter();
    const {
        isAuthenticated,
        isAuthorized,
        loading,
        error,
        marketingUser,
        hasRole,
        hasPermission,
        canAccess,
        signOut
    } = useMarketingAuth();

    // Show loading state
    if (loading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">Authenticating</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    Please wait while we verify your access...
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handle authentication error
    if (error)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center space-y-4">
                            <AlertTriangle className="h-12 w-12 text-red-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Authentication Error
                                </h3>
                                <p className="text-sm text-gray-600 mt-2">
                                    {error}
                                </p>
                            </div>

                            <div className="w-full space-y-2">
                                <Button
                                    onClick={() => router.push('/marketing/login')}
                                    className="w-full"
                                >
                                    Go to Login
                                </Button>
                                <Button
                                    onClick={() => router.push('/')}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Main Site
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handle unauthenticated user
    if (!isAuthenticated)
    {
        if (!showFallback)
        {
            router.push(redirectTo || '/marketing/login');
            return null;
        }

        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <Shield className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                        <CardTitle>Authentication Required</CardTitle>
                        <CardDescription>
                            Please sign in to access the marketing dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Button
                                onClick={() => router.push('/marketing/login')}
                                className="w-full"
                            >
                                Sign In
                            </Button>
                            <Button
                                onClick={() => router.push('/')}
                                variant="outline"
                                className="w-full"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Main Site
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Handle unauthorized user (authenticated but not in marketing system)
    if (!isAuthorized)
    {
        if (!showFallback)
        {
            // If user is authenticated but not authorized, redirect to login
            if (isAuthenticated) {
                router.push('/marketing/unauthorized');
            } else {
                router.push('/marketing/login');
            }
            return null;
        }

        // If user is authenticated but not authorized, show unauthorized page
        if (isAuthenticated) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <Lock className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                            <CardTitle>Access Not Authorized</CardTitle>
                            <CardDescription>
                                You don't have permission to access the marketing dashboard
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Only invited team members can access the marketing dashboard.
                                    Contact your administrator for an invitation.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Button
                                    onClick={signOut}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Sign Out
                                </Button>
                                <Button
                                    onClick={() => router.push('/')}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Main Site
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        } else {
            // If user is not authenticated, redirect to login
            router.push('/marketing/login');
            return null;
        }
    }

    // Check role requirements
    if (requiredRole)
    {
        const hasRequiredRole = Array.isArray(requiredRole)
            ? hasRole(requiredRole)
            : hasRole(requiredRole);

        if (!hasRequiredRole)
        {
            if (!showFallback)
            {
                router.push('/marketing/unauthorized');
                return null;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <Lock className="h-12 w-12 mx-auto text-red-500 mb-4" />
                            <CardTitle>Insufficient Role</CardTitle>
                            <CardDescription>
                                You don't have the required role to access this page
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-1">
                                        <p><strong>Your Role:</strong> {marketingUser?.role.replace('_', ' ').toUpperCase()}</p>
                                        <p><strong>Required:</strong> {
                                            Array.isArray(requiredRole)
                                                ? requiredRole.map(r => r.replace('_', ' ').toUpperCase()).join(' or ')
                                                : requiredRole.replace('_', ' ').toUpperCase()
                                        }</p>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Button
                                    onClick={() => router.push('/marketing/login')}
                                    className="w-full"
                                >
                                    Go to Login
                                </Button>
                                <Button
                                    onClick={signOut}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }
    }

    // Check permission requirements
    if (requiredPermissions && requiredPermissions.length > 0)
    {
        const hasRequiredPermissions = requiredPermissions.every(permission => hasPermission(permission));

        if (!hasRequiredPermissions)
        {
            if (!showFallback)
            {
                router.push('/marketing/unauthorized');
                return null;
            }

            const missingPermissions = requiredPermissions.filter(permission => !hasPermission(permission));

            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-900">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <Lock className="h-12 w-12 mx-auto text-red-500 mb-4" />
                            <CardTitle>Insufficient Permissions</CardTitle>
                            <CardDescription>
                                You don't have the required permissions to access this page
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Alert className="mb-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    <div className="space-y-1">
                                        <p><strong>Missing Permissions:</strong></p>
                                        <ul className="list-disc list-inside text-sm">
                                            {missingPermissions.map(permission => (
                                                <li key={permission}>
                                                    {permission.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <Button
                                    onClick={() => router.push('/marketing/login')}
                                    className="w-full"
                                >
                                    Go to Login
                                </Button>
                                <Button
                                    onClick={signOut}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }
    }

    // All checks passed - render children
    return <>{children}</>;
}

// Utility components for specific role guards
export const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MarketingAuthGuard requiredRole="super_admin">
        {children}
    </MarketingAuthGuard>
);

export const TeamLeadGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MarketingAuthGuard requiredRole="team_lead">
        {children}
    </MarketingAuthGuard>
);

export const BDMGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MarketingAuthGuard requiredRole={['super_admin', 'bdm']}>
        {children}
    </MarketingAuthGuard>
);

export const TeamMemberGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MarketingAuthGuard requiredRole={['super_admin', 'team_lead', 'bdm', 'team_member']}>
        {children}
    </MarketingAuthGuard>
);

// Permission-based guards
export const UserManagementGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MarketingAuthGuard requiredPermissions={['canManageUsers']}>
        {children}
    </MarketingAuthGuard>
);

export const VendorManagementGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MarketingAuthGuard requiredPermissions={['canAssignVendors']}>
        {children}
    </MarketingAuthGuard>
);

export const AnalyticsGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MarketingAuthGuard requiredPermissions={['canViewAllAnalytics']}>
        {children}
    </MarketingAuthGuard>
);