'use client';

import type React from "react"
import { MarketingSidebar } from '@/components/marketing/MarketingSidebar';
import { useState, useEffect } from "react";
import { Menu, X } from 'lucide-react';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';

export default function MarketingDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { marketingUser } = useMarketingAuth();

    // Detect mobile viewport
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close mobile menu when viewport becomes desktop
    useEffect(() => {
        if (!isMobile) {
            setIsMobileMenuOpen(false);
        }
    }, [isMobile]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileMenuOpen]);

    const handleToggleCollapse = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const handleMobileMenuClose = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Header */}
            {isMobile && (
                <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-40 flex items-center px-4">
                    <button
                        onClick={handleMobileMenuToggle}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-5 h-5 text-gray-700" />
                        ) : (
                            <Menu className="w-5 h-5 text-gray-700" />
                        )}
                    </button>
                    <span className="ml-3 text-lg font-bold text-gray-900">
                        Marketing Dashboard
                    </span>
                </header>
            )}

            {/* Mobile Overlay */}
            {isMobile && isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={handleMobileMenuClose}
                    aria-hidden="true"
                />
            )}

            {/* Layout Grid */}
            <div className="flex">
                {/* Desktop Sidebar */}
                {!isMobile && (
                    <MarketingSidebar
                        isCollapsed={isSidebarCollapsed}
                        onToggleCollapse={handleToggleCollapse}
                        userRole={marketingUser?.role}
                        userName={marketingUser?.name}
                        userEmail={marketingUser?.email}
                        userId={marketingUser?.uid}
                    />
                )}

                {/* Mobile Sidebar Drawer */}
                {isMobile && (
                    <div
                        className={`
                            fixed top-0 left-0 h-full z-50
                            transform transition-transform duration-300 ease-in-out
                            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
                        `}
                    >
                        <MarketingSidebar
                            isCollapsed={false}
                            onToggleCollapse={handleMobileMenuClose}
                            userRole={marketingUser?.role}
                            userName={marketingUser?.name}
                            userEmail={marketingUser?.email}
                            userId={marketingUser?.uid}
                        />
                    </div>
                )}

                {/* Main Content Area */}
                <main
                    className={`
                        flex-1 min-h-screen bg-white
                        ${isMobile ? 'pt-14' : ''}
                        transition-all duration-300
                        w-full
                        overflow-x-hidden
                    `}
                >
                    <div className="w-full h-full p-4 sm:p-6 md:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </>
    )
}