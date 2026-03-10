/**
 * Marketing Responsive Form Component
 * Mobile-optimized form layout
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ResponsiveFormProps
{
    title?: string;
    description?: string;
    children: React.ReactNode;
    onSubmit: (e: React.FormEvent) => void;
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
    isLoading?: boolean;
    className?: string;
    variant?: 'card' | 'plain';
}

export function ResponsiveForm({
    title,
    description,
    children,
    onSubmit,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    onCancel,
    isLoading = false,
    className,
    variant = 'card',
}: ResponsiveFormProps)
{
    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault();
        onSubmit(e);
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">{children}</div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="w-full sm:w-auto"
                    >
                        {cancelLabel}
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                >
                    {isLoading ? 'Processing...' : submitLabel}
                </Button>
            </div>
        </form>
    );

    if (variant === 'plain')
    {
        return <div className={className}>{formContent}</div>;
    }

    return (
        <Card className={className}>
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent>{formContent}</CardContent>
        </Card>
    );
}

interface FormSectionProps
{
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export function FormSection({
    title,
    description,
    children,
    className,
}: FormSectionProps)
{
    return (
        <div className={cn('space-y-4', className)}>
            <div className="space-y-1">
                <h3 className="text-lg font-medium">{title}</h3>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </div>
            <div className="space-y-4 pl-0 sm:pl-4">{children}</div>
        </div>
    );
}

interface FormRowProps
{
    children: React.ReactNode;
    columns?: 1 | 2 | 3;
    className?: string;
}

export function FormRow({ children, columns = 1, className }: FormRowProps)
{
    const gridClasses = cn(
        'grid gap-4',
        columns === 1 && 'grid-cols-1',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        className
    );

    return <div className={gridClasses}>{children}</div>;
}
