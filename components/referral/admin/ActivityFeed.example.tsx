/**
 * ActivityFeed Component Usage Example
 * 
 * This file demonstrates how to use the ActivityFeed component
 * in the admin dashboard.
 */

'use client';

import React, { memo } from 'react';
import { ActivityFeed } from './ActivityFeed';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';

/**
 * Example 1: Basic Usage with Real-time Updates
 */
export function ActivityFeedBasicExample()
{
    const { user, token } = useReferralAuth();

    if (!user || !token)
    {
        return <div>Please log in to view activity feed</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <ActivityFeed
                token={token}
                enableRealtime={true}
                maxItems={50}
            />
        </div>
    );
}

/**
 * Example 2: Without Real-time Updates (Manual Refresh Only)
 */
export function ActivityFeedManualExample()
{
    const { user, token } = useReferralAuth();

    if (!user || !token)
    {
        return <div>Please log in to view activity feed</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <ActivityFeed
                token={token}
                enableRealtime={false}
                maxItems={100}
            />
        </div>
    );
}

/**
 * Example 3: In Admin Dashboard Layout
 */
export function AdminDashboardWithActivityFeed()
{
    const { user, token } = useReferralAuth();

    if (!user || !token)
    {
        return <div>Please log in</div>;
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Other admin components */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                    {/* Stats cards, charts, etc. */}
                </div>
            </div>

            {/* Activity Feed */}
            <div className="grid gap-6">
                <ActivityFeed
                    token={token}
                    enableRealtime={true}
                    maxItems={50}
                />
            </div>
        </div>
    );
}

export const MemoizedAdminDashboard = memo(AdminDashboard);

/**
 * Example 4: Side-by-side with Other Components
 */
export function AdminDashboardSideBySide()
{
    const { user, token } = useReferralAuth();

    if (!user || !token)
    {
        return <div>Please log in</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Left column - Other admin content */}
                <div className="space-y-6">
                    {/* Stats, charts, etc. */}
                </div>

                {/* Right column - Activity Feed */}
                <div>
                    <ActivityFeed
                        token={token}
                        enableRealtime={true}
                        maxItems={30}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * Props Interface Reference:
 * 
 * interface ActivityFeedProps {
 *   token: string;              // Firebase auth token (required)
 *   maxItems?: number;          // Max activities to display (default: 50)
 *   enableRealtime?: boolean;   // Enable Firestore listeners (default: true)
 * }
 * 
 * Features:
 * - Real-time updates using Firestore listeners
 * - Filter by activity type (all, signup, purchase, points)
 * - Manual refresh button
 * - Responsive design
 * - Loading states and error handling
 * - Relative time formatting
 * - Detailed activity information
 * - Live indicator badge
 * 
 * Requirements Fulfilled:
 * - 13.1: Display recent sign-ups with referrer information
 * - 13.2: Display recent purchases with commission details
 * - 13.3: Display points awarded with timestamps
 * - 13.4: Real-time updates using Firestore listeners
 * - 13.5: Filter activities by type
 */
