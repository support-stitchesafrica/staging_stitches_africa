/**
 * Marketing Responsive Dashboard Layout Component
 * Mobile-optimized dashboard layout with responsive grid
 */

'use client';

import { cn } from '@/lib/utils';

interface ResponsiveDashboardProps
{
    children: React.ReactNode;
    className?: string;
}

export function ResponsiveDashboard({ children, className }: ResponsiveDashboardProps)
{
    return (
        <div className={cn('space-y-6 p-4 sm:p-6 lg:p-8', className)}>
            {children}
        </div>
    );
}

interface DashboardHeaderProps
{
    title: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}

export function DashboardHeader({
    title,
    description,
    actions,
    className,
}: DashboardHeaderProps)
{
    return (
        <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
            <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
                {description && (
                    <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
                )}
            </div>
            {actions && (
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}

interface DashboardStatsGridProps
{
    children: React.ReactNode;
    columns?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
    className?: string;
}

export function DashboardStatsGrid({
    children,
    columns = { default: 1, sm: 2, lg: 4 },
    className,
}: DashboardStatsGridProps)
{
    return (
        <div
            className={cn(
                'grid gap-4 sm:gap-6',
                columns.default === 1 && 'grid-cols-1',
                columns.default === 2 && 'grid-cols-2',
                columns.sm === 2 && 'sm:grid-cols-2',
                columns.sm === 3 && 'sm:grid-cols-3',
                columns.md === 2 && 'md:grid-cols-2',
                columns.md === 3 && 'md:grid-cols-3',
                columns.md === 4 && 'md:grid-cols-4',
                columns.lg === 2 && 'lg:grid-cols-2',
                columns.lg === 3 && 'lg:grid-cols-3',
                columns.lg === 4 && 'lg:grid-cols-4',
                columns.xl === 4 && 'xl:grid-cols-4',
                columns.xl === 5 && 'xl:grid-cols-5',
                className
            )}
        >
            {children}
        </div>
    );
}

interface DashboardContentGridProps
{
    children: React.ReactNode;
    columns?: 1 | 2;
    className?: string;
}

export function DashboardContentGrid({
    children,
    columns = 1,
    className,
}: DashboardContentGridProps)
{
    return (
        <div
            className={cn(
                'grid gap-4 sm:gap-6',
                columns === 1 && 'grid-cols-1',
                columns === 2 && 'grid-cols-1 lg:grid-cols-2',
                className
            )}
        >
            {children}
        </div>
    );
}

interface DashboardSectionProps
{
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function DashboardSection({
    title,
    description,
    actions,
    children,
    className,
}: DashboardSectionProps)
{
    return (
        <div className={cn('space-y-4', className)}>
            {(title || description || actions) && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        {title && <h2 className="text-lg sm:text-xl font-semibold">{title}</h2>}
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>
                    {actions && <div className="flex gap-2">{actions}</div>}
                </div>
            )}
            {children}
        </div>
    );
}
