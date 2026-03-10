'use client';

import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps
{
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

/**
 * Reusable empty state component with helpful messages
 * Provides clear guidance when no content is available
 */
export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}: EmptyStateProps)
{
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-gray-400" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {title}
            </h3>

            <p className="text-gray-600 max-w-md mb-6">
                {description}
            </p>

            {(actionLabel || secondaryActionLabel) && (
                <div className="flex gap-3">
                    {actionLabel && onAction && (
                        <Button onClick={onAction}>
                            {actionLabel}
                        </Button>
                    )}

                    {secondaryActionLabel && onSecondaryAction && (
                        <Button variant="outline" onClick={onSecondaryAction}>
                            {secondaryActionLabel}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
