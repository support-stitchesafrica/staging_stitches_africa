/**
 * Marketing Status Badge Component
 * Reusable status badge with predefined variants
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertCircle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type StatusType =
    | 'active'
    | 'inactive'
    | 'pending'
    | 'completed'
    | 'in_progress'
    | 'cancelled'
    | 'verified'
    | 'unverified'
    | 'approved'
    | 'rejected';

interface StatusBadgeProps
{
    status: StatusType;
    showIcon?: boolean;
    className?: string;
}

const statusConfig: Record<
    StatusType,
    {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: React.ElementType;
        className: string;
    }
> = {
    active: {
        label: 'Active',
        variant: 'default',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-400',
    },
    inactive: {
        label: 'Inactive',
        variant: 'secondary',
        icon: Minus,
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-400',
    },
    pending: {
        label: 'Pending',
        variant: 'outline',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400',
    },
    completed: {
        label: 'Completed',
        variant: 'default',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-400',
    },
    in_progress: {
        label: 'In Progress',
        variant: 'default',
        icon: Clock,
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
    },
    cancelled: {
        label: 'Cancelled',
        variant: 'destructive',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-400',
    },
    verified: {
        label: 'Verified',
        variant: 'default',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-400',
    },
    unverified: {
        label: 'Unverified',
        variant: 'secondary',
        icon: AlertCircle,
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-400',
    },
    approved: {
        label: 'Approved',
        variant: 'default',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-950 dark:text-green-400',
    },
    rejected: {
        label: 'Rejected',
        variant: 'destructive',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-400',
    },
};

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps)
{
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <Badge
            variant={config.variant}
            className={cn('inline-flex items-center gap-1', config.className, className)}
        >
            {showIcon && <Icon className="h-3 w-3" />}
            {config.label}
        </Badge>
    );
}

interface RoleBadgeProps
{
    role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member';
    className?: string;
}

const roleConfig: Record<
    string,
    {
        label: string;
        className: string;
    }
> = {
    super_admin: {
        label: 'Super Admin',
        className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-950 dark:text-red-400',
    },
    team_lead: {
        label: 'Team Lead',
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400',
    },
    bdm: {
        label: 'BDM',
        className: 'bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-400',
    },
    team_member: {
        label: 'Team Member',
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-950 dark:text-gray-400',
    },
};

export function RoleBadge({ role, className }: RoleBadgeProps)
{
    const config = roleConfig[role];

    return (
        <Badge className={cn(config.className, className)}>
            {config.label}
        </Badge>
    );
}
