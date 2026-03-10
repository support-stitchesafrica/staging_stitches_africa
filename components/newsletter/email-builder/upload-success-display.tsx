import React, { useEffect, useState } from "react"
import { Check, Image, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface UploadSuccessDisplayProps
{
    fileName?: string
    fileSize?: number
    uploadedAt?: Date
    onDismiss?: () => void
    autoHide?: boolean
    autoHideDelay?: number
    className?: string
}

export function UploadSuccessDisplay({
    fileName,
    fileSize,
    uploadedAt,
    onDismiss,
    autoHide = true,
    autoHideDelay = 3000,
    className
}: UploadSuccessDisplayProps)
{
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() =>
    {
        if (autoHide && autoHideDelay > 0)
        {
            const timer = setTimeout(() =>
            {
                setIsVisible(false)
                onDismiss?.()
            }, autoHideDelay)

            return () => clearTimeout(timer)
        }
    }, [autoHide, autoHideDelay, onDismiss])

    const formatFileSize = (bytes: number): string =>
    {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatUploadTime = (date: Date): string =>
    {
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60)
        {
            return 'Just now'
        } else if (diffInSeconds < 3600)
        {
            const minutes = Math.floor(diffInSeconds / 60)
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
        } else
        {
            return date.toLocaleTimeString()
        }
    }

    if (!isVisible) return null

    return (
        <div className={cn(
            "p-3 bg-green-50 border border-green-200 rounded-lg transition-all duration-300",
            "animate-in slide-in-from-top-2 fade-in-0",
            className
        )}>
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4 text-green-600" />
                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Image className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                            Image uploaded successfully!
                        </span>
                    </div>

                    {/* File details */}
                    <div className="space-y-1">
                        {fileName && (
                            <p className="text-xs text-green-700 truncate">
                                <span className="font-medium">File:</span> {fileName}
                            </p>
                        )}

                        <div className="flex gap-4 text-xs text-green-600">
                            {fileSize && (
                                <span>
                                    <span className="font-medium">Size:</span> {formatFileSize(fileSize)}
                                </span>
                            )}

                            {uploadedAt && (
                                <span>
                                    <span className="font-medium">Uploaded:</span> {formatUploadTime(uploadedAt)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Dismiss button */}
                {onDismiss && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                        {
                            setIsVisible(false)
                            onDismiss()
                        }}
                        className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    )
}

/**
 * Compact success notification for inline use
 */
export function InlineUploadSuccess({
    fileName,
    onDismiss,
    className
}: Pick<UploadSuccessDisplayProps, 'fileName' | 'onDismiss' | 'className'>)
{
    return (
        <div className={cn(
            "flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs",
            "animate-in slide-in-from-top-1 fade-in-0",
            className
        )}>
            <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
            <span className="text-green-800 font-medium flex-1 truncate">
                {fileName ? `${fileName} uploaded!` : 'Upload successful!'}
            </span>
            {onDismiss && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-4 w-4 p-0 text-green-600 hover:text-green-700"
                >
                    <X className="h-2 w-2" />
                </Button>
            )}
        </div>
    )
}