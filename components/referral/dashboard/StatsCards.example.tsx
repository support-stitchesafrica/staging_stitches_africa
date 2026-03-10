/**
 * StatsCards Component Example
 * Demonstrates how to use the StatsCards component in a referral dashboard
 */

'use client';

import React, { memo } from 'react';
import { StatsCards } from './StatsCards';

/**
 * Example usage of StatsCards component
 * 
 * This component should be used in the referral dashboard page
 * Pass the authenticated user's ID to display their statistics
 */
export default function StatsCardsExample()
{
    // In a real implementation, get the userId from your auth context
    const userId = 'example-user-id';

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Referral Dashboard</h1>
                <p className="text-muted-foreground">
                    Track your referral performance in real-time
                </p>
            </div>

            {/* Stats Cards with real-time updates */}
            <StatsCards userId={userId} />

            <div className="text-sm text-muted-foreground">
                <p>
                    The stats cards above will automatically update in real-time when:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>A new user signs up using your referral code</li>
                    <li>Points are awarded for sign-ups or purchases</li>
                    <li>A referee makes a purchase</li>
                    <li>Your conversion rate changes</li>
                </ul>
            </div>
        </div>
    );
}

export default memo(StatsCard);
