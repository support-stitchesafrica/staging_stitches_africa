'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MeasurementForm } from '@/components/shops/measurements/MeasurementForm';
import { StandardProtectedRoute } from '@/components/shops/auth/RouteProtectionComponents';
import { useAuth } from '@/contexts/AuthContext';
import { extractValidRedirectParam } from '@/lib/utils/user-profile-utils';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';
import { useAnalytics } from '@/hooks/useAnalytics';

function MeasurementsPageContent()
{
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile, loading, hasCompletedOnboarding } = useAuth();
    const { trackFeatureUsage } = useAnalytics();
    const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);

    // Check if user should have access to measurements page
    useEffect(() =>
    {
        if (loading || !user) return;

        // In the new flow, measurements are always accessible to authenticated users
        // No onboarding completion checks - measurements are optional
        setAccessAllowed(true);
    }, [user, loading]);

    const handleComplete = () =>
    {
        // Check for intended destination from URL parameters
        const redirectTo = extractValidRedirectParam(searchParams);

        // Check if user came from checkout
        const fromCheckout = searchParams.get('from') === 'checkout';
        const isRequired = searchParams.get('required') === 'true';

        // Track measurement completion
        trackFeatureUsage('measurements_completed', {
            fromCheckout,
            isRequired,
            hasRedirect: !!redirectTo,
            userId: user?.uid
        });

        // Priority 1: If there's a valid redirect parameter, use it
        // This handles the case where checkout redirects with a return URL
        if (redirectTo)
        {
            // Track successful return to checkout with measurements
            if (fromCheckout)
            {
                trackFeatureUsage('measurements_completed_return_to_checkout', {
                    redirectUrl: redirectTo,
                    isRequired,
                    userId: user?.uid
                });
            }

            router.push(redirectTo);
            return;
        }

        // Priority 2: If user came from checkout but no redirect param, go back to checkout
        // This ensures users can return to checkout after providing measurements
        if (fromCheckout)
        {
            // Track successful return to checkout with measurements
            trackFeatureUsage('measurements_completed_return_to_checkout', {
                redirectUrl: '/shops/checkout',
                isRequired,
                userId: user?.uid
            });

            router.push('/shops/checkout');
            return;
        }

        // Priority 3: If user came from account, redirect back to account with success message
        const fromAccount = searchParams.get('from') === 'account' || document.referrer.includes('/account');
        if (fromAccount)
        {
            router.push('/shops/account?message=measurements-updated');
            return;
        }

        // Priority 4: Default behavior based on user profile
        // For first-time users completing measurements after registration, redirect to home
        // For existing users updating measurements, redirect to account
        if (userProfile?.metadata.isFirstTimeUser)
        {
            router.push('/shops');
        } else
        {
            router.push('/shops/account');
        }
    };

    const handleSkip = () =>
    {
        // Skip functionality - redirect to home page
        // Measurements are now optional in the new flow
        handleComplete();
    };

    // Show loading while checking access
    if (loading || accessAllowed === null)
    {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    // Don't render if access is not allowed (redirect will happen in useEffect)
    if (!accessAllowed)
    {
        return null;
    }

    return (
        <StandardProtectedRoute>
            <div className="min-h-screen bg-white py-4 sm:py-6 lg:py-8">
                <MeasurementForm
                    onComplete={handleComplete}
                    onSkip={handleSkip}
                    showSkipOption={true}
                />
            </div>
        </StandardProtectedRoute>
    );
}

export default function MeasurementsPage()
{
    return (
        <Suspense fallback={<LoadingSkeleton variant="page" />}>
            <MeasurementsPageContent />
        </Suspense>
    );
}