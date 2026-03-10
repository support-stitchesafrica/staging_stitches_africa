/**
 * Social Proof Section Component
 * Displays real-time statistics and social proof
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Users, Award, TrendingUp } from 'lucide-react';

interface SocialProofSectionProps
{
    stats: {
        totalReferrers: number;
        totalRewards: number;
        successRate: number;
    };
    className?: string;
}

export function SocialProofSection({ stats, className = '' }: SocialProofSectionProps)
{
    const [isVisible, setIsVisible] = useState(false);
    const [animatedStats, setAnimatedStats] = useState({
        totalReferrers: 0,
        totalRewards: 0,
        successRate: 0,
    });
    const sectionRef = useRef<HTMLDivElement>(null);

    useEffect(() =>
    {
        const observer = new IntersectionObserver(
            ([entry]) =>
            {
                if (entry.isIntersecting)
                {
                    setIsVisible(true);
                }
            },
            { threshold: 0.2 }
        );

        if (sectionRef.current)
        {
            observer.observe(sectionRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() =>
    {
        if (!isVisible) return;

        const duration = 2000; // 2 seconds
        const steps = 60;
        const stepDuration = duration / steps;

        let currentStep = 0;

        const interval = setInterval(() =>
        {
            currentStep++;
            const progress = currentStep / steps;

            setAnimatedStats({
                totalReferrers: Math.floor(stats.totalReferrers * progress),
                totalRewards: Math.floor(stats.totalRewards * progress),
                successRate: Math.floor(stats.successRate * progress),
            });

            if (currentStep >= steps)
            {
                clearInterval(interval);
                setAnimatedStats(stats);
            }
        }, stepDuration);

        return () => clearInterval(interval);
    }, [isVisible, stats]);

    const statCards = [
        {
            icon: Users,
            label: 'Active Referrers',
            value: animatedStats.totalReferrers,
            suffix: '+',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
        },
        {
            icon: Award,
            label: 'Total Rewards Distributed',
            value: animatedStats.totalRewards,
            suffix: ' pts',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            icon: TrendingUp,
            label: 'Success Rate',
            value: animatedStats.successRate,
            suffix: '%',
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
        },
    ];

    return (
        <section ref={sectionRef} className={`py-12 sm:py-16 md:py-24 bg-gray-50 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8 sm:mb-12 md:mb-16">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-3 sm:mb-4 px-4">
                        Join Thousands of Active Referrers
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
                        Real people turning everyday connections into lasting rewards.
                    </p>
                    <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4 mt-4">
                        Share your link, grow your influence, and earn as your community shops repeatedly.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {statCards.map((stat, index) => (
                        <div
                            key={index}
                            className={`p-6 sm:p-8 bg-white rounded-2xl border-2 border-gray-200 hover:border-black transition-all duration-300 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'
                                }`}
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex justify-center mb-4 sm:mb-6">
                                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                                    <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color}`} />
                                </div>
                            </div>

                            <div className="text-center">
                                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-black mb-2">
                                    {stat.value.toLocaleString()}
                                    <span className="text-lg sm:text-xl md:text-2xl">{stat.suffix}</span>
                                </div>
                                <div className="text-sm sm:text-base text-gray-600 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Testimonial-style quote */}
                <div className="mt-8 sm:mt-12 md:mt-16 max-w-3xl mx-auto">
                    <div className="bg-black text-white p-6 sm:p-8 md:p-12 rounded-2xl relative">
                        <div className="text-4xl sm:text-5xl md:text-6xl text-gray-700 absolute top-3 sm:top-4 left-3 sm:left-4">"</div>
                        <p className="text-base sm:text-lg md:text-xl lg:text-2xl italic mb-4 sm:mb-6 relative z-10 px-2 sm:px-0">
                            The referral program has been an amazing way to earn passive income. I simply share my link with friends and watch my earnings grow!
                        </p>
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                            </div>
                            <div>
                                <div className="font-bold text-sm sm:text-base">Sarah O.</div>
                                <div className="text-gray-400 text-xs sm:text-sm">Top Referrer</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}