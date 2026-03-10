'use client';

import Image from 'next/image';
import { Tag, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BannerPreviewProps
{
    imageUrl: string;
    title?: string;
    description?: string;
    displayPercentage?: number;
    eventName: string;
    className?: string;
}

export function BannerPreview({
    imageUrl,
    title,
    description,
    displayPercentage,
    eventName,
    className,
}: BannerPreviewProps)
{
    return (
        <div className={cn('space-y-3', className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Banner Preview</h3>
                <span className="text-xs text-gray-500">How it will appear on the landing page</span>
            </div>

            {/* Preview Container */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gray-50 p-4">
                <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden group shadow-lg">
                    {/* Banner Image */}
                    <Image
                        src={imageUrl}
                        alt={title || eventName}
                        fill
                        className="object-cover"
                    />

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />

                    {/* Content Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16">
                        <div className="max-w-2xl space-y-4">
                            {/* Discount Badge */}
                            {displayPercentage && displayPercentage > 0 && (
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-full font-bold text-sm md:text-base shadow-lg">
                                    <Tag className="w-4 h-4" />
                                    Up to {displayPercentage}% OFF
                                </div>
                            )}

                            {/* Title */}
                            <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg">
                                {title || eventName}
                            </h2>

                            {/* Description */}
                            {description && (
                                <p className="text-lg md:text-xl text-white/90 drop-shadow-md max-w-xl">
                                    {description}
                                </p>
                            )}

                            {/* CTA Button */}
                            <div className="flex items-center gap-4 pt-2">
                                <button className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
                                    Shop Now
                                </button>

                                {/* Countdown Timer Preview */}
                                <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg">
                                    <Clock className="w-4 h-4" />
                                    <span className="text-sm font-medium">2d 14h 32m</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview Info */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="flex-1">
                    <p className="text-xs text-yellow-800">
                        This is a preview of how your banner will appear on the landing page. The actual countdown timer will show the time remaining until the promotion ends.
                    </p>
                </div>
            </div>
        </div>
    );
}
