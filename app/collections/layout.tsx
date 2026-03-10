'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
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

    // Check if current page is the canvas editor
    const isEditorPage = pathname?.includes('/editor/');

    // Check if current page is an auth page (auth, invite)
    const isAuthPage = pathname?.includes('/auth') ||
        pathname?.includes('/invite/');

    // Redirect unauthenticated users to auth page (except on auth pages)
    useEffect(() =>
    {
        if (!loading && !user && !isAuthPage)
        {
            console.log('No user found, redirecting to auth page...');
            router.push('/collections/auth');
        }
    }, [user, loading, isAuthPage, router]);

    // Show loading state
    if (loading)
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
