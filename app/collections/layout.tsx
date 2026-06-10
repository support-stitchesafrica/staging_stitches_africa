'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CollectionsAuthProvider, useCollectionsAuth } from '@/contexts/CollectionsAuthContext';
import { CollectionsSidebar } from '@/components/collections/CollectionsSidebar';
import { Toaster } from 'react-hot-toast';

/**
 * Collections Layout Content
 * Conditionally renders sidebar based on authentication state
 */
function CollectionsLayoutContent({ children }: { children: React.ReactNode })
{
    const { user, collectionsUser, loading } = useCollectionsAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [loadingTimedOut, setLoadingTimedOut] = useState(false);

    // Check if current page is the canvas editor
    const isEditorPage = pathname?.includes('/editor/');

    // Check if current page is an auth page (auth, invite)
    const isAuthPage = pathname?.includes('/auth') ||
        pathname?.includes('/invite/');

    // Safety timeout — if loading takes more than 4s, treat as unauthenticated
    useEffect(() =>
    {
        if (!loading) return;
        const timer = setTimeout(() => setLoadingTimedOut(true), 4000);
        return () => clearTimeout(timer);
    }, [loading]);

    // Redirect unauthenticated users to auth page (except on auth pages)
    useEffect(() =>
    {
        const isUnauthenticated = (!loading && !user) || loadingTimedOut;
        if (isUnauthenticated && !isAuthPage)
        {
            console.log('No user found, redirecting to auth page...');
            router.push('/collections/auth');
        }
    }, [user, loading, loadingTimedOut, isAuthPage, router]);

    // Show loading state (but not forever)
    if (loading && !loadingTimedOut)
    {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Auth pages and invite pages should never show sidebar
    if (isAuthPage)
    {
        return (
            <div className="min-h-screen bg-gray-50">
                {children}
            </div>
        );
    }

    // If user is authenticated and has collections access, show sidebar layout
    if (user && collectionsUser?.isCollectionsUser)
    {
        // Editor page gets full-screen layout without sidebar
        if (isEditorPage)
        {
            return (
                <div className="min-h-screen bg-gray-50">
                    {children}
                </div>
            );
        }

        // Other pages get sidebar layout
        return (
            <div className="flex min-h-screen bg-gray-50">
                <CollectionsSidebar />
                <main className="flex-1 lg:ml-64 ml-0 transition-all duration-300">
                    <div className="p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8">
                        {children}
                    </div>
                </main>
            </div>
        );
    }

    // If user is not authenticated, show full-width layout
    return (
        <div className="min-h-screen bg-gray-50">
            {children}
        </div>
    );
}

/**
 * Collections Layout
 * Wraps all collections routes with the CollectionsAuthProvider
 */
export default function CollectionsLayout({
    children,
}: {
    children: React.ReactNode;
})
{
    return (
        <CollectionsAuthProvider>
            <CollectionsLayoutContent>
                {children}
            </CollectionsLayoutContent>
            <Toaster position="top-right" />
        </CollectionsAuthProvider>
    );
}
