/**
 * Super Admin Detector Component
 * Detects if Super Admin exists and redirects to setup if needed
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface SuperAdminDetectorProps
{
    children: React.ReactNode;
}

export default function SuperAdminDetector({ children }: SuperAdminDetectorProps)
{
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(true);
    const [requiresSetup, setRequiresSetup] = useState(false);

    useEffect(() =>
    {
        checkSuperAdminStatus();
    }, []);

    const checkSuperAdminStatus = async () =>
    {
        try
        {
            // Skip check if already on setup page
            if (pathname === '/marketing/setup')
            {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/marketing/setup/super-admin');
            const result = await response.json();

            if (result.success && result.data.requiresSetup)
            {
                setRequiresSetup(true);
                router.push('/marketing/setup');
                return;
            }

            setLoading(false);
        } catch (error)
        {
            console.error('Error checking Super Admin status:', error);
            setLoading(false);
        }
    };

    // Show loading spinner while checking
    if (loading)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="mt-2 text-gray-600">Initializing marketing dashboard...</p>
                </div>
            </div>
        );
    }

    // Don't render children if redirecting to setup
    if (requiresSetup)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                    <p className="mt-2 text-gray-600">Redirecting to setup...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Hook for Super Admin detection in components
 */
export function useSuperAdminDetection()
{
    const [status, setStatus] = useState<{
        loading: boolean;
        hasSuperAdmin: boolean;
        requiresSetup: boolean;
    }>({
        loading: true,
        hasSuperAdmin: false,
        requiresSetup: false
    });

    useEffect(() =>
    {
        checkStatus();
    }, []);

    const checkStatus = async () =>
    {
        try
        {
            const response = await fetch('/api/marketing/setup/super-admin');
            const result = await response.json();

            if (result.success)
            {
                setStatus({
                    loading: false,
                    hasSuperAdmin: result.data.hasSuperAdmin,
                    requiresSetup: result.data.requiresSetup
                });
            } else
            {
                setStatus(prev => ({ ...prev, loading: false }));
            }
        } catch (error)
        {
            console.error('Error checking Super Admin status:', error);
            setStatus(prev => ({ ...prev, loading: false }));
        }
    };

    return {
        ...status,
        refetch: checkStatus
    };
}