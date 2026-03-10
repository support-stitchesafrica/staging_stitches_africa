/**
 * Marketing Responsive Container Component
 * Provides responsive layouts for different screen sizes
 */

'use client';

import { cn } from '@/lib/utils';

interface ResponsiveContainerProps
{
    children: React.ReactNode;
    className?: string;
}

export function ResponsiveContainer({ children, className }: ResponsiveContainerProps)
{
    return (
        <div className={cn('container mx-auto px-4 sm:px-6 lg:px-8', className)}>
            {children}
        </div>
    );
}

interface ResponsiveGridProps
{
    children: React.ReactNode;
    cols?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    gap?: number;
    className?: string;
}

export function ResponsiveGrid({
    children,
    cols = { default: 1, sm: 2, lg: 3, xl: 4 },
    gap = 6,
    className,
}: ResponsiveGridProps)
{
    const gridClasses = cn(
        'grid',
        `gap-${gap}`,
        cols.default && `grid-cols-${cols.default}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        className
    );

    return <div className={gridClasses}>{children}</div>;
}

interface ResponsiveStackProps
{
    children: React.ReactNode;
    direction?: 'vertical' | 'horizontal' | 'responsive';
    gap?: number;
    className?: string;
}

export function ResponsiveStack({
    children,
    direction = 'responsive',
    gap = 4,
    className,
}: ResponsiveStackProps)
{
    const stackClasses = cn(
        'flex',
        `gap-${gap}`,
        direction === 'vertical' && 'flex-col',
        direction === 'horizontal' && 'flex-row',
        direction === 'responsive' && 'flex-col md:flex-row',
        className
    );

    return <div className={stackClasses}>{children}</div>;
}
