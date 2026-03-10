/**
 * Marketing Form Field Component
 * Reusable form field with validation and error handling
 */

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps
{
    label: string;
    name: string;
    type?: 'text' | 'email' | 'password' | 'tel' | 'textarea' | 'select';
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    options?: { value: string; label: string }[];
    rows?: number;
    className?: string;
}

export function FormField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    placeholder,
    required = false,
    disabled = false,
    options = [],
    rows = 3,
    className
}: FormFieldProps)
{
    const hasError = !!error;

    return (
        <div className={cn('space-y-2', className)}>
            <Label htmlFor={name} className="text-sm font-medium">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            {type === 'textarea' ? (
                <Textarea
                    id={name}
                    name={name}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    className={cn(
                        hasError && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${name}-error` : undefined}
                />
            ) : type === 'select' ? (
                <Select value={value} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger
                        className={cn(
                            hasError && 'border-red-500 focus-visible:ring-red-500'
                        )}
                        aria-invalid={hasError}
                    >
                        <SelectValue placeholder={placeholder || 'Select an option'} />
                    </SelectTrigger>
                    <SelectContent>
                        {options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ) : (
                <Input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        hasError && 'border-red-500 focus-visible:ring-red-500'
                    )}
                    aria-invalid={hasError}
                    aria-describedby={hasError ? `${name}-error` : undefined}
                />
            )}

            {hasError && (
                <div
                    id={`${name}-error`}
                    className="flex items-center gap-1 text-sm text-red-600"
                    role="alert"
                >
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
