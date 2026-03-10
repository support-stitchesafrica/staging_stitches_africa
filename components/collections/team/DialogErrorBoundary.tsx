'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { logError, formatErrorMessage, ErrorCode, createError } from '@/lib/collections/errors';

interface DialogErrorBoundaryProps
{
    children: ReactNode;
    onClose?: () => void;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface DialogErrorBoundaryState
{
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary component specifically for dialog components
 * Provides a compact error UI suitable for modal dialogs
 */
export class DialogErrorBoundary extends Component<DialogErrorBoundaryProps, DialogErrorBoundaryState>
{
    constructor(props: DialogErrorBoundaryProps)
    {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<DialogErrorBoundaryState>
    {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void
    {
        // Log error using Collections error utilities
        const collectionsError = createError(
            ErrorCode.UNKNOWN_ERROR,
            error.message,
            {
                componentStack: errorInfo.componentStack,
                errorBoundary: 'DialogErrorBoundary',
            }
        );

        logError(collectionsError, {
            originalError: error.toString(),
            errorInfo: errorInfo.componentStack,
        });

        // Update state
        this.setState({
            error,
        });

        // Call custom error handler if provided
        if (this.props.onError)
        {
            this.props.onError(error, errorInfo);
        }
    }

    handleClose = (): void =>
    {
        // Reset error state
        this.setState({
            hasError: false,
            error: null,
        });

        // Call parent close handler
        if (this.props.onClose)
        {
            this.props.onClose();
        }
    };

    render(): ReactNode
    {
        if (this.state.hasError)
        {
            // Format error message
            const errorMessage = this.state.error
                ? formatErrorMessage(this.state.error)
                : 'An unexpected error occurred';

            // Compact error UI for dialogs
            return (
                <div className="p-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="size-4" />
                        <AlertTitle>Error in Dialog</AlertTitle>
                        <AlertDescription className="mt-2 space-y-3">
                            <p className="text-sm">
                                An error occurred while rendering this dialog. Please close and try again.
                            </p>

                            <div className="rounded-md bg-destructive/10 p-2">
                                <p className="text-xs text-destructive">
                                    {errorMessage}
                                </p>
                            </div>

                            {/* Show detailed error in development */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="rounded-md bg-muted p-2">
                                    <p className="text-xs font-mono">
                                        {this.state.error.toString()}
                                    </p>
                                </div>
                            )}

                            <Button
                                onClick={this.handleClose}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <X className="size-4 mr-2" />
                                Close Dialog
                            </Button>
                        </AlertDescription>
                    </Alert>
                </div>
            );
        }

        return this.props.children;
    }
}
