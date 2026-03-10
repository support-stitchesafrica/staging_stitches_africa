/**
 * Marketing Loading State Components
 * Reusable loading indicators and skeletons
 */

'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps
{
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps)
{
    return (
        <div className={cn('flex items-center justify-center', className)}>
            <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        </div>
    );
}

interface LoadingOverlayProps
{
    message?: string;
    className?: string;
}

export function LoadingOverlay({ message, className }: LoadingOverlayProps)
{
    return (
        <div
            className={cn(
                'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center',
                className
            )}
        >
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                {message && <p className="text-sm text-muted-foreground">{message}</p>}
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number })
{
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-12 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton()
{
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-1/4 mb-4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4 mt-2" />
            </CardContent>
        </Card>
    );
}

export function DashboardSkeleton()
{
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-10 w-32" />
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            {/* Content Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <TableSkeleton rows={5} columns={4} />
                </CardContent>
            </Card>
        </div>
    );
}

export function FormSkeleton({ fields = 4 }: { fields?: number })
{
    return (
        <div className="space-y-4">
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
            ))}
            <div className="flex gap-2 justify-end mt-6">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
            </div>
        </div>
    );
}
