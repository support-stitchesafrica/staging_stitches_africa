/**
 * Marketing Dashboard Widget Component
 * Reusable widget for dashboard metrics and data visualization
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LucideIcon, TrendingUp, TrendingDown, Minus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardWidgetProps
{
    title: string;
    value: string | number;
    description?: string;
    icon?: LucideIcon;
    trend?: {
        value: number;
        label: string;
    };
    badge?: {
        text: string;
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    };
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
    variant?: 'default' | 'compact';
}

export function DashboardWidget({
    title,
    value,
    description,
    icon: Icon,
    trend,
    badge,
    action,
    className,
    variant = 'default',
}: DashboardWidgetProps)
{
    const getTrendIcon = () =>
    {
        if (!trend) return null;
        if (trend.value > 0) return <TrendingUp className="h-4 w-4" />;
        if (trend.value < 0) return <TrendingDown className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    const getTrendColor = () =>
    {
        if (!trend) return '';
        if (trend.value > 0) return 'text-green-600';
        if (trend.value < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    if (variant === 'compact')
    {
        return (
            <Card className={cn('hover:shadow-md transition-shadow', className)}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground">{title}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-2xl font-bold">{value}</p>
                                {trend && (
                                    <span className={cn('text-sm flex items-center gap-1', getTrendColor())}>
                                        {getTrendIcon()}
                                        {Math.abs(trend.value)}%
                                    </span>
                                )}
                            </div>
                            {description && (
                                <p className="text-xs text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                        {Icon && (
                            <div className="ml-4 p-3 bg-primary/10 rounded-full">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn('hover:shadow-md transition-shadow', className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex-1">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    {description && (
                        <CardDescription className="mt-1">{description}</CardDescription>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {badge && (
                        <Badge variant={badge.variant || 'default'}>{badge.text}</Badge>
                    )}
                    {Icon && (
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="h-4 w-4 text-primary" />
                        </div>
                    )}
                    {action && (
                        <Button variant="ghost" size="sm" onClick={action.onClick}>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold">{value}</div>
                    {trend && (
                        <div className={cn('flex items-center gap-1 text-sm', getTrendColor())}>
                            {getTrendIcon()}
                            <span>{Math.abs(trend.value)}%</span>
                            <span className="text-muted-foreground">{trend.label}</span>
                        </div>
                    )}
                </div>
                {action && (
                    <Button
                        variant="link"
                        size="sm"
                        onClick={action.onClick}
                        className="mt-4 px-0"
                    >
                        {action.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface StatCardProps
{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'gray';
    trend?: string;
    className?: string;
}

const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
    gray: 'bg-gray-50 text-gray-600 dark:bg-gray-950 dark:text-gray-400',
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    trend,
    className,
}: StatCardProps)
{
    return (
        <Card className={cn('hover:shadow-md transition-shadow', className)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-2">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {trend && (
                            <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-full', colorClasses[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
