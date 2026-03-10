'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';
import { AuthForms } from './AuthForms';

interface AuthFlowManagerProps
{
    children?: React.ReactNode;
}

export const AuthFlowManager: React.FC<AuthFlowManagerProps> = ({ children }) =>
{
    const { user, userProfile, loading, error, isFirstTimeUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isRedirecting, setIsRedirecting] = useState(false);

    useEffect(() =>
    {
        if (!loading && user && userProfile)
        {
            // Check if this is a first-time user who needs to complete measurements
            if (isFirstTimeUser && userProfile.metadata.onboardingStep === 'measurements')
            {
                setIsRedirecting(true);
                router.push('/shops/measurements');
                return;
            }

            // User is authenticated and has completed onboarding, redirect to intended destination or home
            const redirectTo = searchParams.get('redirect') || '/';
            setIsRedirecting(true);
            router.push(redirectTo);
        }
    }, [user, userProfile, loading, router, searchParams, isFirstTimeUser]);

    const handleAuthSuccess = () =>
    {
        // This will be handled by the useEffect above when user state changes
        console.log('Authentication successful');
    };

    if (loading || isRedirecting)
    {
        return <LoadingSkeleton />;
    }

    // If user is not authenticated, show auth form
    if (!user)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-md lg:max-w-2xl space-y-8 p-4 sm:p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}
                    <AuthForms onSuccess={handleAuthSuccess} />
                    {children}
                </div>
            </div>
        );
    }

    return <>{children}</>;
};