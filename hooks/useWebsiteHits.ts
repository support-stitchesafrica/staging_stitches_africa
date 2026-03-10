// hooks/useWebsiteHits.ts
'use client';

import { useEffect } from 'react';
import { WebsiteHitsService } from '@/lib/services/websiteHitsService';

/**
 * Hook to automatically track website hits
 * Call this hook in your root layout or main page component
 */
export function useWebsiteHits() {
  useEffect(() => {
    // Record hit after a short delay to ensure page is loaded
    const timer = setTimeout(() => {
      WebsiteHitsService.recordHit();
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // Empty dependency array ensures this runs once per page load
}
