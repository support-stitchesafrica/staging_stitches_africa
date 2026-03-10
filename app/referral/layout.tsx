/**
 * Referral Program Layout
 * Provides consistent header and navigation for referral section
 * Requirements: 15.1, 15.2
 */

'use client';

import React from 'react';
import { ReferralAuthProvider } from '@/contexts/ReferralAuthContext';

export default function ReferralLayout({
    children,
}: {
    children: React.ReactNode;
})
{
    return (
        <ReferralAuthProvider>
            <div className="min-h-screen bg-gray-50">
                {children}
            </div>
        </ReferralAuthProvider>
    );
}
