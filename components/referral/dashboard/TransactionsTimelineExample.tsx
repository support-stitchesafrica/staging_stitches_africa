/**
 * TransactionsTimeline Component Usage Example
 * Demonstrates how to use the TransactionsTimeline component
 */

'use client';

import React from 'react';
import { TransactionsTimeline } from './TransactionsTimeline';

/**
 * Example 1: Basic Usage
 * Display the last 10 transactions for a user
 */
export function BasicTransactionsExample()
{
    const userId = 'user123'; // Replace with actual user ID

    return (
        <div className="container mx-auto p-6">
            <TransactionsTimeline userId={userId} />
        </div>
    );
}

/**
 * Example 2: Custom Max Items
 * Display more transactions (e.g., last 20)
 */
export function CustomMaxItemsExample()
{
    const userId = 'user123'; // Replace with actual user ID

    return (
        <div className="container mx-auto p-6">
            <TransactionsTimeline
                userId={userId}
                maxItems={20}
            />
        </div>
    );
}

/**
 * Example 3: In Dashboard Layout
 * Use as part of a larger dashboard
 */
export function DashboardLayoutExample()
{
    const userId = 'user123'; // Replace with actual user ID

    return (
        <div className="container mx-auto p-6">
            <div className="grid gap-6 md:grid-cols-2">
                {/* Other dashboard components */}
                <div className="md:col-span-1">
                    {/* Stats or other components */}
                </div>

                {/* Transactions Timeline */}
                <div className="md:col-span-1">
                    <TransactionsTimeline userId={userId} />
                </div>
            </div>
        </div>
    );
}

/**
 * Example 4: With Authentication Context
 * Use with actual authenticated user
 */
export function AuthenticatedExample()
{
    // In a real app, get userId from auth context
    // const { user } = useAuth();
    // const userId = user?.uid;

    const userId = 'user123'; // Placeholder

    if (!userId)
    {
        return <div>Please log in to view transactions</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">My Referral Dashboard</h1>

            <div className="space-y-6">
                {/* Other dashboard sections */}

                {/* Transactions Timeline */}
                <TransactionsTimeline userId={userId} />
            </div>
        </div>
    );
}

/**
 * Example 5: Compact View
 * Show fewer transactions in a sidebar or compact layout
 */
export function CompactViewExample()
{
    const userId = 'user123'; // Replace with actual user ID

    return (
        <aside className="w-80 p-4">
            <TransactionsTimeline
                userId={userId}
                maxItems={5}
            />
        </aside>
    );
}
