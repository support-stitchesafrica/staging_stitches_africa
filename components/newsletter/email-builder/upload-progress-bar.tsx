import React from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { X, Upload, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { UploadError } from "@/lib/services/uploadErrorHandler"
import { UploadErrorDisplay } from "./upload-error-display"
import { UploadSuccessDisplay } from "./upload-success-display"

interface UploadProgressBarProps
{
    progress: number
    isUploading: boolean
    error: UploadError | string | null
    success: boolean
    fileName?: string
    fileSize?: number
    uploadedAt?: Date
    onCancel?: () => void
    onRetry?: () => void
    onDismissError?: () => void
    onDismissSuccess?: () => void
    className?: string
}

export function UploadProgressBar({
    progress,
    isUploading,
    error,
    success,
    fileName,
    fileSize,
    uploadedAt,
    onCancel,
    onRetry,
    onDismissError,
    onDismissSuccess,
    className
}: UploadProgressBarProps)
{
    if (!isUploading && !error && !success)
    {
        return null
    }

    // Handle structured error vs string error
    const uploadError = typeof error === 'string' ?
        { type: 'unknown_error', message: error, userMessage: error, retryable: true } as UploadError :
        error;

    return (
        <div className={cn("space-y-2", className)}>
            {/* Upload progress */}
            {isUploading && (
                <div className="p-3 border rounded-lg bg-card">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Upload className="h-4 w-4 animate-pulse text-primary" />
                            <span className="text-sm font-medium">Uploading image...</span>
                        </div>
                        {onCancel && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onCancel}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        )}
                    </div>

                    {fileName && (
                        <p className="text-xs text-muted-foreground truncate mb-2">
                            {fileName}
                        </p>
                    )}

                    <div className="space-y-1">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-muted-foreground text-right">
                            {Math.round(progress)}%
                        </p>
                    </div>
                </div>
            )}

            {/* Error display */}
            {uploadError && (
                <UploadErrorDisplay
                    error={uploadError}
                    onRetry={onRetry}
                    onDismiss={onDismissError}
                />
            )}

            {/* Success display */}
            {success && (
                <UploadSuccessDisplay
                    fileName={fileName}
                    fileSize={fileSize}
                    uploadedAt={uploadedAt}
                    onDismiss={onDismissSuccess}
                />
            )}
        </div>
    )
}