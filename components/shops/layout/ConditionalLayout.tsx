'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';

interface ConditionalLayoutProps
{
    children: React.ReactNode;
}

export const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) =>
{
    const pathname = usePathname();

    // Hide header/footer on auth pages
    const shouldShowHeaderFooter = !pathname?.includes('/auth');

    if (!shouldShowHeaderFooter)
    {
        // Clean layout for auth pages without header/footer
        return (
            <div className="min-h-screen bg-white">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
        );
    }

    // Standard layout with header, footer, and mobile bottom nav
    return (
        <div className="min-h-screen flex flex-col bg-white">
            <Header />
            <main className="flex-1 bg-white mobile-content-padding lg:pb-0">
                {children}
            </main>
            {/* Footer - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:block">
                <Footer />
            </div>
            {/* Mobile Bottom Navigation - Only shown on mobile */}
            <MobileBottomNav />
        </div>
    );
};