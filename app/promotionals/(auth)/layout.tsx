'use client';

import { PromotionalsAuthProvider } from '@/contexts/PromotionalsAuthContext';
import { Toaster } from 'react-hot-toast';

/**
 * Promotional Auth Layout
 * Wraps auth routes with the PromotionalsAuthProvider
 */
export default function PromotionalsAuthLayout({
    children,
}: {
    children: React.ReactNode;
})
{
    return (
        <PromotionalsAuthProvider>
            <div className="min-h-screen bg-gray-50">
                {children}
            </div>
            <Toaster position="top-right" />
        </PromotionalsAuthProvider>
    );
}
