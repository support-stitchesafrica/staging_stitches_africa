/**
 * Admin Layout for Referral Program
 * Provides consistent navigation and layout for admin pages
 * Requirements: 15.1, 15.2
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminAuthGuard } from '@/components/referral/auth/AdminAuthGuard';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';
import { Button } from '@/components/ui/button';
import
{
    LayoutDashboard,
    Users,
    BarChart3,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AdminLayoutProps
{
    children: React.ReactNode;
}

const navigationItems = [
    {
        name: 'Dashboard',
        href: '/referral/admin',
        icon: LayoutDashboard,
    },
    {
        name: 'Referrers',
        href: '/referral/admin/referrers',
        icon: Users,
    },
    {
        name: 'Analytics',
        href: '/referral/admin/analytics',
        icon: BarChart3,
    },
];

export default function AdminLayout({ children }: AdminLayoutProps)
{
    const pathname = usePathname();
    const { logout, referralUser } = useReferralAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = async () =>
    {
        try
        {
            await logout();
        } catch (error)
        {
            console.error('Logout error:', error);
        }
    };

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            {/* Logo and Title */}
                            <div className="flex items-center">
                                <Link href="/referral/admin" className="flex items-center space-x-2">
                                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                        <img
                                            src="/Stitches-Africa-Logo-06.png"
                                            alt="Stitches Africa"
                                            className="w-8 h-8 object-contain"
                                        />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-gray-900">Referral Program</h1>
                                        <p className="text-xs text-gray-500">Admin Dashboard</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Desktop Navigation */}
                            <nav className="hidden md:flex items-center space-x-1">
                                {navigationItems.map((item) =>
                                {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            )}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* User Menu */}
                            <div className="flex items-center space-x-4">
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-medium text-gray-900">
                                        {referralUser?.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleLogout}
                                    className="hidden md:flex items-center space-x-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </Button>

                                {/* Mobile menu button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="md:hidden"
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                >
                                    {mobileMenuOpen ? (
                                        <X className="w-5 h-5" />
                                    ) : (
                                        <Menu className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {mobileMenuOpen && (
                        <div className="md:hidden border-t border-gray-200 bg-white">
                            <div className="px-4 py-3 space-y-1">
                                {navigationItems.map((item) =>
                                {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={cn(
                                                'flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                                                isActive
                                                    ? 'bg-blue-50 text-blue-700'
                                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}

                                <div className="pt-3 border-t border-gray-200">
                                    <div className="px-4 py-2">
                                        <p className="text-sm font-medium text-gray-900">
                                            {referralUser?.fullName}
                                        </p>
                                        <p className="text-xs text-gray-500">Administrator</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="w-full justify-start px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    >
                                        <LogOut className="w-5 h-5 mr-3" />
                                        <span>Logout</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* Main Content */}
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 mt-auto">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                            <p className="text-sm text-gray-500">
                                © {new Date().getFullYear()} Referral Program. All rights reserved.
                            </p>
                            <div className="flex items-center space-x-6">
                                <Link
                                    href="/referral/dashboard"
                                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Referrer Dashboard
                                </Link>
                                <Link
                                    href="/support"
                                    className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                                >
                                    Support
                                </Link>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </AdminAuthGuard>
    );
}
