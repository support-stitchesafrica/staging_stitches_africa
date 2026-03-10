'use client';

import React, { Suspense } from 'react';
import { AuthFlowManager } from '@/components/shops/auth/AuthFlowManager';
import { LoadingSkeleton } from '@/components/shops/ui/LoadingSkeleton';

export default function AuthPage()
{
    return (
        <Suspense fallback={<LoadingSkeleton variant="page" />}>
            {/* Fully responsive container with optimized spacing for all device sizes */}
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-4 sm:py-8 md:py-12">
                {/* Full width on mobile, constrained on larger screens */}
                <div className="w-full">
                    <AuthFlowManager />
                </div>
            </div>
        </Suspense>
    );
}