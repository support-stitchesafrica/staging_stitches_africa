'use client';

import { useEffect, useState } from 'react';

/**
 * Safe wrapper for search params that handles SSR gracefully
 * This avoids the useSearchParams SSR issues by reading from window.location
 */
export function useSafeSearchParams() {
    const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
        // Initialize with empty params on server, will be updated on client
        return new URLSearchParams();
    });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        // Use setTimeout to avoid setState in effect warning
        const timer = setTimeout(() => {
            setIsClient(true);
            
            // Read search params from window.location on client side
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                setSearchParams(params);
            }
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        // Listen for URL changes
        const handleUrlChange = () => {
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                setSearchParams(params);
            }
        };

        // Listen for popstate events (back/forward navigation)
        window.addEventListener('popstate', handleUrlChange);

        // Listen for pushstate/replacestate (programmatic navigation)
        const originalPushState = window.history.pushState;
        const originalReplaceState = window.history.replaceState;

        window.history.pushState = function (...args) {
            originalPushState.apply(window.history, args);
            handleUrlChange();
        };

        window.history.replaceState = function (...args) {
            originalReplaceState.apply(window.history, args);
            handleUrlChange();
        };

        return () => {
            window.removeEventListener('popstate', handleUrlChange);
            window.history.pushState = originalPushState;
            window.history.replaceState = originalReplaceState;
        };
    }, [isClient]);

    return searchParams;
}