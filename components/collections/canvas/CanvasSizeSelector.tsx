'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Monitor, Instagram, Facebook, Twitter, CreditCard, Layout, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';

export interface CanvasSize
{
    id: string;
    name: string;
    width: number;
    height: number;
    category: 'social' | 'web' | 'print';
    icon: React.ReactNode;
}

export const CANVAS_SIZES: CanvasSize[] = [
    // Social Media
    { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080, category: 'social', icon: <Instagram className="w-4 h-4" /> },
    { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, category: 'social', icon: <Instagram className="w-4 h-4" /> },
    { id: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630, category: 'social', icon: <Facebook className="w-4 h-4" /> },
    { id: 'facebook-cover', name: 'Facebook Cover', width: 820, height: 312, category: 'social', icon: <Facebook className="w-4 h-4" /> },
    { id: 'twitter-post', name: 'Twitter Post', width: 1200, height: 675, category: 'social', icon: <Twitter className="w-4 h-4" /> },
    { id: 'twitter-header', name: 'Twitter Header', width: 1500, height: 500, category: 'social', icon: <Twitter className="w-4 h-4" /> },

    // Web Banners
    { id: 'web-banner-large', name: 'Large Banner', width: 1200, height: 400, category: 'web', icon: <Monitor className="w-4 h-4" /> },
    { id: 'web-banner-medium', name: 'Medium Banner', width: 970, height: 250, category: 'web', icon: <Monitor className="w-4 h-4" /> },
    { id: 'web-banner-small', name: 'Small Banner', width: 728, height: 90, category: 'web', icon: <Monitor className="w-4 h-4" /> },
    { id: 'web-hero', name: 'Hero Section', width: 1920, height: 1080, category: 'web', icon: <Layout className="w-4 h-4" /> },

    // Cards & Print
    { id: 'card-landscape', name: 'Card Landscape', width: 1200, height: 800, category: 'print', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'card-portrait', name: 'Card Portrait', width: 800, height: 1200, category: 'print', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'card-square', name: 'Card Square', width: 1000, height: 1000, category: 'print', icon: <CreditCard className="w-4 h-4" /> },
];

interface CanvasSizeSelectorProps
{
    currentSize: { width: number; height: number };
    onSizeChange: (size: CanvasSize) => void;
}

export function CanvasSizeSelector({ currentSize, onSizeChange }: CanvasSizeSelectorProps)
{
    const [isExpanded, setIsExpanded] = useState(false);

    const categories = [
        { id: 'social', name: 'Social Media', color: 'bg-purple-100 text-purple-700' },
        { id: 'web', name: 'Web Banners', color: 'bg-blue-100 text-blue-700' },
        { id: 'print', name: 'Cards & Print', color: 'bg-green-100 text-green-700' },
    ];

    // Find current size name
    const currentSizeName = CANVAS_SIZES.find(
        s => s.width === currentSize.width && s.height === currentSize.height
    )?.name || 'Custom';

    return (
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-blue-600" />
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-gray-900">Canvas Size</h3>
                        <p className="text-xs text-gray-500">
                            {currentSize.width} × {currentSize.height}px {currentSizeName !== 'Custom' && `(${currentSizeName})`}
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
            </button>

            {/* Content - Collapsible */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    {categories.map((category) => (
                        <div key={category.id}>
                            <div className={`text-xs font-medium px-2 py-1 rounded inline-block mb-2 ${category.color}`}>
                                {category.name}
                            </div>
                            <div className="space-y-1">
                                {CANVAS_SIZES
                                    .filter((size) => size.category === category.id)
                                    .map((size) =>
                                    {
                                        const isActive = currentSize.width === size.width && currentSize.height === size.height;
                                        return (
                                            <button
                                                key={size.id}
                                                onClick={() =>
                                                {
                                                    onSizeChange(size);
                                                    setIsExpanded(false);
                                                }}
                                                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all text-left ${isActive
                                                    ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                                                    : 'hover:bg-gray-100 border-2 border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    {size.icon}
                                                    <span className="text-sm font-medium">{size.name}</span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {size.width}×{size.height}
                                                </span>
                                            </button>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
