/**
 * Example usage of ReferralCodeCard component
 * This file demonstrates how to use the ReferralCodeCard in a dashboard
 */

'use client';

import React from 'react';
import { ReferralCodeCard } from './ReferralCodeCard';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';

/**
 * Example Dashboard Component
 * Shows how to integrate ReferralCodeCard with authentication context
 */
export const ReferralDashboardExample: React.FC = () =>
{
    const { referralUser, loading } = useReferralAuth();

    if (loading)
    {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    if (!referralUser)
    {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Please log in to view your referral code</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-4xl p-6">
            <h1 className="mb-6 text-3xl font-bold">Referral Dashboard</h1>

            {/* Referral Code Card */}
            <ReferralCodeCard
                referralCode={referralUser.referralCode}
            />

            {/* Additional dashboard components would go here */}
        </div>
    );
};

/**
 * Standalone Example (without auth context)
 * Useful for testing or preview purposes
 */
export const ReferralCodeCardStandalone: React.FC = () =>
{
    return (
        <div className="container mx-auto max-w-2xl p-6">
            <h2 className="mb-4 text-2xl font-bold">Referral Code Card Preview</h2>
            <ReferralCodeCard
                referralCode="ABC12345"
                baseUrl="https://example.com"
            />
        </div>
    );
};
