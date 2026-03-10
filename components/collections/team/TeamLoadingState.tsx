'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamLoadingStateProps
{
    variant?: 'page' | 'inline' | 'card';
    message?: string;
    className?: string;
}

/**
 * Consistent loading UI component for team management
 * Supports different variants for different contexts
 */
export function TeamLoadingState({
    variant = 'page',
    message = 'Loading...',
    className,
}: TeamLoadingStateProps)
{
    // Page variant - full page loading state
    if (variant === 'page')
    {
        return (
            <div
                className={cn(
                    'flex min-h-[400px] items-center justify-center p-6',
                    className
                )}
            >
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
        );
    }

    // Card variant - loading state for card-like containers
    if (variant === 'card')
    {
        return (
            <div
                className={cn(
                    'flex min-h-[200px] items-center justify-center rounded-lg border bg-card p-6',
                    className
                )}
            >
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="size-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">{message}</p>
                </div>
            </div>
        );
    }

    // Inline variant - compact loading state for inline use
    return (
        <div className={cn('flex items-center gap-2 py-2', className)}>
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">{message}</span>
        </div>
    );
}
