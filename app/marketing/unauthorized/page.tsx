/**
 * Marketing Dashboard - Unauthorized Access Page
 * Displayed when user doesn't have sufficient permissions
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, LogOut } from 'lucide-react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export default function UnauthorizedPage() {
    const router = useRouter();
    const { marketingUser, signOut } = useMarketingAuth();

    // Redirect to login automatically after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/marketing/login');
        }, 3000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <Lock className="h-16 w-16 mx-auto text-red-500 mb-4" />
                    <CardTitle className="text-2xl">Access Denied</CardTitle>
                    <CardDescription>
                        You don't have permission to access this resource
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-6">
                        <Lock className="h-4 w-4" />
                        <AlertDescription>
                            {marketingUser ? (
                                <div className="space-y-1">
                                    <p>Your current role: <strong>{marketingUser.role.replace('_', ' ').toUpperCase()}</strong></p>
                                    <p>This page requires higher permissions or a different role.</p>
                                </div>
                            ) : (
                                <p>You need to be signed in with appropriate permissions to access this page.</p>
                            )}
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                        <Button
                            onClick={() => router.push('/marketing/auth/login')}
                            className="w-full"
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            Go to Login
                        </Button>

                        <Button
                            onClick={signOut}
                            variant="outline"
                            className="w-full"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Redirecting to login page in 3 seconds...
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            Need access? Contact your administrator to request the appropriate permissions.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}