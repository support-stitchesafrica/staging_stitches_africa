import React from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import
    {
        AlertTriangle,
        Wifi,
        Shield,
        HardDrive,
        FileX,
        Settings,
        RotateCcw,
        X
    } from "lucide-react"
import { UploadError, UploadErrorType, UploadErrorHandler } from "@/lib/services/uploadErrorHandler"
import { cn } from "@/lib/utils"

interface UploadErrorDisplayProps
{
    error: UploadError
    onRetry?: () => void
    onDismiss?: () => void
    className?: string
    showActions?: boolean
}

export function UploadErrorDisplay({
    error,
    onRetry,
    onDismiss,
    className,
    showActions = true
}: UploadErrorDisplayProps)
{
    const { message, actions } = UploadErrorHandler.getErrorMessageWithActions(error)

    const getErrorIcon = (errorType: UploadErrorType) =>
    {
        switch (errorType)
        {
            case UploadErrorType.NETWORK_ERROR:
                return Wifi
            case UploadErrorType.PERMISSION_ERROR:
                return Shield
            case UploadErrorType.QUOTA_ERROR:
                return HardDrive
            case UploadErrorType.VALIDATION_ERROR:
                return FileX
            case UploadErrorType.PROCESSING_ERROR:
                return Settings
            default:
                return AlertTriangle
        }
    }

    const getErrorColor = (errorType: UploadErrorType) =>
    {
        switch (errorType)
        {
            case UploadErrorType.NETWORK_ERROR:
                return "text-orange-600"
            case UploadErrorType.PERMISSION_ERROR:
            case UploadErrorType.QUOTA_ERROR:
                return "text-red-600"
            case UploadErrorType.VALIDATION_ERROR:
                return "text-yellow-600"
            case UploadErrorType.PROCESSING_ERROR:
                return "text-blue-600"
            default:
                return "text-destructive"
        }
    }

    const ErrorIcon = getErrorIcon(error.type)
    const iconColor = getErrorColor(error.type)

    return (
        <Alert className={cn("border-destructive/50 bg-destructive/5", className)}>
            <div className="flex items-start gap-3">
                <ErrorIcon className={cn("h-5 w-5 mt-0.5", iconColor)} />

                <div className="flex-1 space-y-2">
                    <AlertDescription className="text-sm font-medium">
                        {message}
                    </AlertDescription>

                    {/* Action suggestions */}
                    {showActions && actions.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-medium">Try these solutions:</p>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                                {actions.map((action, index) => (
                                    <li key={index} className="flex items-center gap-1">
                                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                                        {action}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                        {error.retryable && onRetry && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="h-7 text-xs"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Try Again
                            </Button>
                        )}

                        {onDismiss && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onDismiss}
                                className="h-7 text-xs"
                            >
                                <X className="h-3 w-3 mr-1" />
                                Dismiss
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Alert>
    )
}

/**
 * Simplified error display for inline use
 */
export function InlineUploadError({
    error,
    onRetry,
    onDismiss,
    className
}: UploadErrorDisplayProps)
{
    return (
        <div className={cn("p-2 bg-destructive/5 border border-destructive/20 rounded text-xs", className)}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-destructive font-medium">{error.userMessage}</span>
                <div className="flex gap-1">
                    {error.retryable && onRetry && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetry}
                            className="h-5 w-5 p-0"
                        >
                            <RotateCcw className="h-3 w-3" />
                        </Button>
                    )}
                    {onDismiss && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDismiss}
                            className="h-5 w-5 p-0"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}