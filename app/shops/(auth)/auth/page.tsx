'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForms } from '@/components/shops/auth/AuthForms';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';

function AuthPageInner()
{
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [ready, setReady] = useState(false);

    useEffect(() =>
    {
        if (!loading)
        {
            if (user)
            {
                // Already logged in — forward to shop with referral params preserved
                const redirectTo = searchParams.get('redirect') || '/shops';
                const ref = searchParams.get('ref');
                const motherRef = searchParams.get('motherRef');
                const params = new URLSearchParams();
                if (ref) params.set('ref', ref);
                if (motherRef) params.set('motherRef', motherRef);
                const query = params.toString();
                router.replace(query ? `${redirectTo}?${query}` : redirectTo);
            } else
            {
                setReady(true);
            }
        }
    }, [user, loading, router, searchParams]);

    if (loading || !ready)
    {
        return <LoadingSkeleton variant="page" />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-4 sm:py-8 md:py-12">
            <div className="w-full max-w-md lg:max-w-2xl mx-auto space-y-8 p-4 sm:p-8">
                <AuthForms onSuccess={() => router.push('/shops')} />
            </div>
        </div>
    );
}

export default function AuthPage()
{
    return (
        <Suspense fallback={<LoadingSkeleton variant="page" />}>
            <AuthPageInner />
        </Suspense>
    );
}
