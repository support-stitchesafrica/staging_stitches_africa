/**
 * CTA Section Component
 * Call-to-action sections throughout the landing page
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';

interface CTASectionProps
{
    variant?: 'primary' | 'secondary';
    className?: string;
}

export function CTASection({ variant = 'primary', className = '' }: CTASectionProps)
{
    if (variant === 'primary')
    {
        return (
            <section className={`py-8 sm:py-12 bg-gradient-to-r from-gray-50 to-gray-100 ${className}`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex justify-center mb-3 sm:mb-4">
                        <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-black" />
                    </div>
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-black mb-3 sm:mb-4">
                        Ready to Start Earning?
                    </h3>
                    <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                        Join now and get your unique referral link in seconds
                    </p>
                    <Link href="/referral/signup" className="inline-block">
                        <Button
                            size="lg"
                            className="bg-black text-white hover:bg-gray-800 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group"
                        >
                            Get Started Free
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className={`py-12 sm:py-16 bg-black text-white ${className}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h3 className="text-2xl text-black sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                    Start Earning Today
                </h3>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto">
                    Join thousands of referrers who are already earning rewards. No fees, no commitments – just pure earning potential.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                    <Link href="/referral/signup" className="w-full sm:w-auto">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 group"
                        >
                            Sign Up Now
                            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="/referral/login" className="w-full sm:w-auto">
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto border-white text-white text-white hover:bg-white hover:text-black text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6"
                        >
                            Already a Member? Login
                        </Button>
                    </Link>
                </div>

                <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
                    <div>
                        <div className="text-2xl text-gray-600 sm:text-3xl font-bold mb-1 sm:mb-2">Free</div>
                        <div className="text-xs sm:text-sm text-gray-400">No signup fees</div>
                    </div>
                    <div>
                        <div className="text-2xl text-gray-600 sm:text-3xl font-bold mb-1 sm:mb-2">2 min</div>
                        <div className="text-xs sm:text-sm text-gray-400">Quick setup</div>
                    </div>
                    <div>
                        <div className="text-2xl text-gray-600 sm:text-3xl font-bold mb-1 sm:mb-2">24/7</div>
                        <div className="text-xs sm:text-sm text-gray-400">Earn anytime</div>
                    </div>
                </div>
            </div>
        </section>
    );
}