import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PromotionalBadgeProps
{
    discountPercentage: number;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'compact';
    className?: string;
    showIcon?: boolean;
}

export function PromotionalBadge({
    discountPercentage,
    text = 'Promotional Deal',
    size = 'md',
    variant = 'default',
    className,
    showIcon = true,
}: PromotionalBadgeProps)
{
    const sizeClasses = {
        sm: 'text-xs px-2 py-1',
        md: 'text-sm px-3 py-1.5',
        lg: 'text-base px-4 py-2',
    };

    const iconSizes = {
        sm: 'w-3 h-3',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    };

    if (variant === 'compact')
    {
        return (
            <div
                className={cn(
                    'inline-flex items-center justify-center gap-1 bg-red-600 text-white font-bold rounded-md shadow-sm',
                    sizeClasses[size],
                    className
                )}
            >
                {showIcon && <Tag className={iconSizes[size]} />}
                <span>{discountPercentage}% OFF</span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white font-semibold rounded-lg shadow-md',
                sizeClasses[size],
                className
            )}
        >
            {showIcon && <Tag className={iconSizes[size]} />}
            <div className="flex flex-col">
                <span className="leading-tight">{text}</span>
                <span className="text-xs font-bold leading-tight">
                    {discountPercentage}% OFF
                </span>
            </div>
        </div>
    );
}
