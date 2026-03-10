/**
 * Example usage of ReferralsTable component
 * This file demonstrates how to use the ReferralsTable component
 */

'use client';

import React from 'react';
import { ReferralsTable } from './ReferralsTable';

/**
 * Example component showing ReferralsTable usage
 */
export const ReferralsTableExample: React.FC = () =>
{
    // In a real application, you would get the userId from your auth context
    const userId = 'example-user-id';

    return (
        <div className="container mx-auto py-8">
            <ReferralsTable userId={userId} />
        </div>
    );
};

/**
 * Usage in a dashboard page:
 * 
 * import { ReferralsTable } from '@/components/referral/dashboard';
 * import { useAuth } from '@/contexts/ReferralAuthContext';
 * 
 * export default function DashboardPage() {
 *   const { user } = useAuth();
 * 
 *   if (!user) return <div>Please log in</div>;
 * 
 *   return (
 *     <div className="space-y-6">
 *       <ReferralsTable userId={user.uid} />
 *     </div>
 *   );
 * }
 */
