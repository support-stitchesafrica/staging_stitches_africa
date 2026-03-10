// components/WebsiteHitsTracker.tsx
'use client';

import { useWebsiteHits } from '@/hooks/useWebsiteHits';

/**
 * Client component that tracks website hits
 * Add this to your root layout to track all page visits
 */
export function WebsiteHitsTracker()
{
    useWebsiteHits();
    return null; // This component doesn't render anything
}
