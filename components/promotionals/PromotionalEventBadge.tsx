/**
 * Promotional Event Badge Component
 * Displays event name and discount on product cards with dynamic styling
 */
'use client';

import React from 'react';
import { Tag, Clock, Zap, Gift, Star } from 'lucide-react';

interface PromotionalEventBadgeProps
{
    eventName: string;
    discount: number;
    eventId?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showDiscount?: boolean;
    showIcon?: boolean;
}

export const PromotionalEventBadge: React.FC<PromotionalEventBadgeProps> = ({
    eventName,
    discount,
    eventId,
    className = '',
    size = 'md',
    showDiscount = true,
    showIcon = true
}) =>
{
    // Size configurations
    const sizeClasses = {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-sm',
        lg: 'px-4 py-2 text-base'
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5'
    };

    // Generate badge color and styling based on event name
    const getBadgeConfig = (name: string) =>
    {
        const lowerName = name.toLowerCase();

        // Special event configurations
        if (lowerName.includes('black friday'))
        {
            return {
                colors: 'bg-black text-white border-gray-800',
                icon: Tag,
                isAnimated: false
            };
        }

        if (lowerName.includes('cyber monday'))
        {
            return {
                colors: 'bg-blue-600 text-white border-blue-700',
                icon: Tag,
                isAnimated: false
            };
        }

        if (lowerName.includes('christmas') || lowerName.includes('holiday'))
        {
            return {
                colors: 'bg-red-600 text-white border-red-700',
                icon: Gift,
                isAnimated: false
            };
        }

        if (lowerName.includes('valentine'))
        {
            return {
                colors: 'bg-pink-600 text-white border-pink-700',
                icon: Gift,
                isAnimated: false
            };
        }

        if (lowerName.includes('summer'))
        {
            return {
                colors: 'bg-yellow-500 text-white border-yellow-600',
                icon: Star,
                isAnimated: false
            };
        }

        if (lowerName.includes('spring'))
        {
            return {
                colors: 'bg-green-500 text-white border-green-600',
                icon: Star,
                isAnimated: false
            };
        }

        if (lowerName.includes('flash') || lowerName.includes('lightning'))
        {
            return {
                colors: 'bg-orange-500 text-white border-orange-600',
                icon: Zap,
                isAnimated: true
            };
        }

        // Hash-based color selection for consistent colors across custom events
        const colors = [
            'bg-purple-500 text-white border-purple-600',
            'bg-indigo-500 text-white border-indigo-600',
            'bg-teal-500 text-white border-teal-600',
            'bg-rose-500 text-white border-rose-600',
            'bg-amber-500 text-white border-amber-600',
            'bg-emerald-500 text-white border-emerald-600'
        ];

        let hash = 0;
        for (let i = 0; i < name.length; i++)
        {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }

        return {
            colors: colors[Math.abs(hash) % colors.length],
            icon: Tag,
            isAnimated: false
        };
    };

    const badgeConfig = getBadgeConfig(eventName);
    const IconComponent = badgeConfig.icon;

    return (
        <div
            className={`
        inline-flex items-center gap-1.5 font-semibold rounded-full shadow-sm border
        ${sizeClasses[size]} 
        ${badgeConfig.colors}
        ${badgeConfig.isAnimated ? 'animate-pulse' : ''}
        ${className}
      `}
            title={`${eventName}${showDiscount ? ` - ${discount}% off` : ''}`}
        >
            {showIcon && (
                <IconComponent className={`${iconSizes[size]} flex-shrink-0`} />
            )}
            <span className="truncate max-w-24">
                {eventName}
            </span>
            {showDiscount && discount > 0 && (
                <span className="font-bold">
                    -{discount}%
                </span>
            )}
        </div>
    );
};

// Preset badge variants for common events
export const BlackFridayBadge: React.FC<Omit<PromotionalEventBadgeProps, 'eventName'>> = (props) => (
    <PromotionalEventBadge eventName="Black Friday" {...props} />
);

export const CyberMondayBadge: React.FC<Omit<PromotionalEventBadgeProps, 'eventName'>> = (props) => (
    <PromotionalEventBadge eventName="Cyber Monday" {...props} />
);

export const FlashSaleBadge: React.FC<Omit<PromotionalEventBadgeProps, 'eventName'>> = (props) => (
    <PromotionalEventBadge eventName="Flash Sale" {...props} />
);

export const ChristmasBadge: React.FC<Omit<PromotionalEventBadgeProps, 'eventName'>> = (props) => (
    <PromotionalEventBadge eventName="Christmas Sale" {...props} />
);

export const ValentineBadge: React.FC<Omit<PromotionalEventBadgeProps, 'eventName'>> = (props) => (
    <PromotionalEventBadge eventName="Valentine Sale" {...props} />
);

export const SummerBadge: React.FC<Omit<PromotionalEventBadgeProps, 'eventName'>> = (props) => (
    <PromotionalEventBadge eventName="Summer Sale" {...props} />
);

export default PromotionalEventBadge;