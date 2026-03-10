/**
 * Marketing Error State Component
 * Reusable error state for handling errors gracefully
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps
{
    title?: string;
    message: string;
    onRetry?: () => void;
    variant?: 'card' | 'alert' | 'inline';
    className?: string;
}

export function ErrorState({
    title = 'Something went wrong',
    message,
    onRetry,
    variant = 'card',
    className,
}: ErrorStateProps)
{
    if (variant === 'alert')
    {
        return (
            <Alert variant="destructive" className={className}>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{title}</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>{message}</span>
                    {onRetry && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onRetry}
                            className="ml-4"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
        );
    }

    if (variant === 'inline')
    {
        return (
            <div className={cn('flex items-center gap-2 text-sm text-destructive', className)}>
                <XCircle className="h-4 w-4" />
                <span>{message}</span>
                {onRetry && (
                    <Button
                        variant="link"
                        size="sm"
                        onClick={onRetry}
                        className="h-auto p-0 text-destructive"
                    >
                        Retry
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Card className={cn('border-destructive', className)}>
            <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="rounded-full bg-destructive/10 p-4 mb-4">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">{message}</p>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
