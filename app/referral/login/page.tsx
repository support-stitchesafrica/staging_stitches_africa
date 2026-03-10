/**
 * Referral Program Login Page
 * Enhanced split layout with illustration
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

'use client';


import React, { Suspense } from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/referral/auth/LoginForm';
import { ReferralAuthProvider } from '@/contexts/ReferralAuthContext';
import { AuthDebugger } from '@/components/referral/auth/AuthDebugger';
import { ArrowLeft } from 'lucide-react';

export default function ReferralLoginPage()
{
    return (
        <ReferralAuthProvider>
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <div className="min-h-screen flex">
                    {/* Left Column - Form */}
                    <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
                        <div className="mx-auto w-full max-w-sm lg:w-96">
                            {/* Back to home link */}
                            <Link
                                href="/referral"
                                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-8 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to home
                            </Link>

                            <LoginForm />
                        </div>
                    </div>

                    {/* Right Column - Illustration */}
                    <div className="hidden lg:block relative flex-1 bg-black">
                        <div className="absolute inset-0 flex items-center justify-center p-12">
                            <div className="max-w-md text-center space-y-8">
                                {/* Illustration */}
                                <LoginIllustration />

                                {/* Text Content */}
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold text-white">
                                        Welcome Back!
                                    </h2>
                                    <p className="text-lg text-gray-300">
                                        Track your referrals, monitor earnings, and grow your income with our powerful dashboard.
                                    </p>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-6 pt-8">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">1</div>
                                        <div className="text-sm text-gray-400">Points/Referral</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">5%</div>
                                        <div className="text-sm text-gray-400">Commission</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-white">∞</div>
                                        <div className="text-sm text-gray-400">Potential</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Suspense>
            <AuthDebugger />
        </ReferralAuthProvider>
    );
}

/**
 * Login Illustration Component
 * SVG illustration for the login page
 * Requirements: 9.2, 16.1, 16.2, 16.3
 */
function LoginIllustration()
{
    return (
        <svg
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-auto"
        >
            {/* Dashboard illustration */}
            <g className="animate-float">
                {/* Dashboard screen */}
                <rect x="50" y="50" width="300" height="200" rx="8" stroke="white" strokeWidth="3" fill="none" />

                {/* Chart bars */}
                <rect x="80" y="150" width="30" height="60" fill="white" opacity="0.7" />
                <rect x="130" y="120" width="30" height="90" fill="white" opacity="0.9" />
                <rect x="180" y="100" width="30" height="110" fill="white" />
                <rect x="230" y="130" width="30" height="80" fill="white" opacity="0.8" />
                <rect x="280" y="110" width="30" height="100" fill="white" opacity="0.85" />

                {/* User icon */}
                <circle cx="200" cy="80" r="15" stroke="white" strokeWidth="2" fill="none" />
                <path d="M200 95 L200 110" stroke="white" strokeWidth="2" />
                <path d="M200 100 L185 115" stroke="white" strokeWidth="2" />
                <path d="M200 100 L215 115" stroke="white" strokeWidth="2" />
            </g>

            {/* Floating elements */}
            <g className="animate-pulse-slow">
                <circle cx="100" cy="30" r="4" fill="white" opacity="0.6" />
                <circle cx="320" cy="40" r="3" fill="white" opacity="0.5" />
                <circle cx="350" cy="220" r="5" fill="white" opacity="0.7" />
                <circle cx="70" cy="240" r="3" fill="white" opacity="0.4" />
            </g>
        </svg>
    );
}
