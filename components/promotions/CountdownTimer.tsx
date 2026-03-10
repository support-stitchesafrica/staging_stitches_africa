'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { CustomerPromotionalService } from '@/lib/promotionals/customer-service';
import { cn } from '@/lib/utils';

interface CountdownTimerProps
{
    endDate: Date;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    onExpire?: () => void;
}

export function CountdownTimer({
    endDate,
    className,
    size = 'md',
    showIcon = true,
    onExpire,
}: CountdownTimerProps)
{
    const [timeRemaining, setTimeRemaining] = useState(
        CustomerPromotionalService.calculateTimeRemaining(endDate)
    );

    useEffect(() =>
    {
        // Update countdown every second
        const interval = setInterval(() =>
        {
            const remaining = CustomerPromotionalService.calculateTimeRemaining(endDate);
            setTimeRemaining(remaining);

            // Call onExpire callback when timer expires
            if (remaining.isExpired && onExpire)
            {
                onExpire();
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [endDate, onExpire]);

    // Size variants
    const sizeClasses = {
        sm: {
            container: 'text-xs gap-1',
            unit: 'min-w-[32px] p-1',
            number: 'text-sm',
            label: 'text-[10px]',
            icon: 'w-3 h-3',
        },
        md: {
            container: 'text-sm gap-2',
            unit: 'min-w-[48px] p-2',
            number: 'text-lg',
            label: 'text-xs',
            icon: 'w-4 h-4',
        },
        lg: {
            container: 'text-base gap-3',
            unit: 'min-w-[64px] p-3',
            number: 'text-2xl',
            label: 'text-sm',
            icon: 'w-5 h-5',
        },
    };

    const sizes = sizeClasses[size];

    // If expired, show expired message
    if (timeRemaining.isExpired)
    {
        return (
            <div
                className={cn(
                    'inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium',
                    sizes.container,
                    className
                )}
            >
                {showIcon && <Clock className={sizes.icon} />}
                <span>Promotion Ended</span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-lg bg-gradient-to-r from-red-50 to-orange-50 border border-red-200',
                sizes.container,
                className
            )}
        >
            {showIcon && (
                <div className="flex items-center justify-center px-3">
                    <Clock className={cn(sizes.icon, 'text-red-600')} />
                </div>
            )}

            <div className="flex items-center gap-1">
                {/* Days */}
                {timeRemaining.days > 0 && (
                    <>
                        <div
                            className={cn(
                                'flex flex-col items-center justify-center bg-white rounded shadow-sm',
                                sizes.unit
                            )}
                        >
                            <span className={cn('font-bold text-red-600', sizes.number)}>
                                {String(timeRemaining.days).padStart(2, '0')}
                            </span>
                            <span className={cn('text-gray-500 uppercase', sizes.label)}>
                                {timeRemaining.days === 1 ? 'Day' : 'Days'}
                            </span>
                        </div>
                        <span className="text-gray-400 font-bold">:</span>
                    </>
                )}

                {/* Hours */}
                <div
                    className={cn(
                        'flex flex-col items-center justify-center bg-white rounded shadow-sm',
                        sizes.unit
                    )}
                >
                    <span className={cn('font-bold text-red-600', sizes.number)}>
                        {String(timeRemaining.hours).padStart(2, '0')}
                    </span>
                    <span className={cn('text-gray-500 uppercase', sizes.label)}>
                        {timeRemaining.hours === 1 ? 'Hr' : 'Hrs'}
                    </span>
                </div>

                <span className="text-gray-400 font-bold">:</span>

                {/* Minutes */}
                <div
                    className={cn(
                        'flex flex-col items-center justify-center bg-white rounded shadow-sm',
                        sizes.unit
                    )}
                >
                    <span className={cn('font-bold text-red-600', sizes.number)}>
                        {String(timeRemaining.minutes).padStart(2, '0')}
                    </span>
                    <span className={cn('text-gray-500 uppercase', sizes.label)}>
                        {timeRemaining.minutes === 1 ? 'Min' : 'Mins'}
                    </span>
                </div>

                <span className="text-gray-400 font-bold">:</span>

                {/* Seconds */}
                <div
                    className={cn(
                        'flex flex-col items-center justify-center bg-white rounded shadow-sm',
                        sizes.unit
                    )}
                >
                    <span className={cn('font-bold text-red-600', sizes.number)}>
                        {String(timeRemaining.seconds).padStart(2, '0')}
                    </span>
                    <span className={cn('text-gray-500 uppercase', sizes.label)}>
                        {timeRemaining.seconds === 1 ? 'Sec' : 'Secs'}
                    </span>
                </div>
            </div>
        </div>
    );
}
