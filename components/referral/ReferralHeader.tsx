/**
 * Referral Program Header Component
 * Provides consistent navigation and user menu for referral pages
 * Requirements: 15.1, 15.2
 */

'use client';

import React, { useState } from 'react';
import { useReferralAuth } from '@/contexts/ReferralAuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export const ReferralHeader: React.FC = () =>
{
    const { referralUser, logout, isAdmin } = useReferralAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = async () =>
    {
        await logout();
        router.push('/referral/login');
    };

    const isActivePath = (path: string) => pathname === path;

    const navigation = [
        { name: 'Dashboard', href: '/referral/dashboard' },
        ...(isAdmin ? [{ name: 'Admin', href: '/referral/admin' }] : []),
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <Link href="/referral/dashboard" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900">Referral Program</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActivePath(item.href)
                                        ? 'bg-blue-50 text-blue-600'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </nav>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        {/* Desktop User Menu */}
                        <div className="hidden md:block relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-semibold">
                                        {referralUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm font-medium text-gray-900">
                                        {referralUser?.fullName || 'User'}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {referralUser?.totalPoints || 0} points
                                    </div>
                                </div>
                                <svg
                                    className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{referralUser?.fullName}</p>
                                            <p className="text-xs text-gray-500 truncate">{referralUser?.email}</p>
                                            <p className="text-xs text-blue-600 font-medium mt-1">
                                                Code: {referralUser?.referralCode}
                                            </p>
                                        </div>
                                        <Link
                                            href="/referral/dashboard"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            onClick={() => setShowUserMenu(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href="/referral/admin"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setShowUserMenu(false)}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {showMobileMenu ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showMobileMenu && (
                    <div className="md:hidden border-t border-gray-200 py-4">
                        <div className="px-4 py-3 border-b border-gray-100 mb-2">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-semibold">
                                        {referralUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{referralUser?.fullName}</p>
                                    <p className="text-xs text-gray-500">{referralUser?.email}</p>
                                    <p className="text-xs text-blue-600 font-medium">Code: {referralUser?.referralCode}</p>
                                </div>
                            </div>
                        </div>
                        <nav className="space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`block px-4 py-2 rounded-lg text-sm font-medium ${isActivePath(item.href)
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                    onClick={() => setShowMobileMenu(false)}
                                >
                                    {item.name}
                                </Link>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                Sign Out
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
};
