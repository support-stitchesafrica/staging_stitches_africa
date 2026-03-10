import React, { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Upload, X, RotateCcw, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { emailImageUploadService } from "@/lib/services/emailImageUpload"
import { UploadProgressBar } from "./upload-progress-bar"

interface ImageUploadButtonProps
{
    onImageUploaded: (url: string) => void
    onUploadProgress?: (progress: number) => void
    onUploadError?: (error: string) => void
    currentImageUrl?: string
    className?: string
    disabled?: boolean
}

interface UploadState
{
    isUploading: boolean
    progress: number
    error: string | null
    success: boolean
    fileName?: string
    fileSize?: number
    uploadedAt?: Date
}

export function ImageUploadButton({
    onImageUploaded,
    onUploadProgress,
    onUploadError,
    currentImageUrl,
    className,
    disabled = false
}: ImageUploadButtonProps)
{
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadState, setUploadState] = useState<UploadState>({
        isUploading: false,
        progress: 0,
        error: null,
        success: false
    })
    const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)

    const validateImageFile = (file: File): { valid: boolean; error?: string } =>
    {
        // Check file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type))
        {
            return {
                valid: false,
                error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
            }
        }

        // Check file size (10MB limit)
        const maxSize = 10 * 1024 * 1024 // 10MB in bytes
        if (file.size > maxSize)
        {
            return {
                valid: false,
                error: 'Image file size must be less than 10MB'
            }
        }

        return { valid: true }
    }

    const handleFileSelect = async (file: File) =>
    {
        // Generate unique upload ID
        const uploadId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setCurrentUploadId(uploadId)

        // Validate file
        const validation = validateImageFile(file)
        if (!validation.valid)
        {
            setUploadState(prev => ({ ...prev, error: validation.error || 'Invalid file' }))
            onUploadError?.(validation.error || 'Invalid file')
            return
        }

        // Reset state
        setUploadState({
            isUploading: true,
            progress: 0,
            error: null,
            success: false
        })

        try
        {
            // Use the enhanced upload service with ID tracking
            const imageUrl = await emailImageUploadService.uploadImageWithId(
                uploadId,
                file,
                undefined, // userId - can be added later if needed
                (progress) =>
                {
                    setUploadState(prev => ({ ...prev, progress }))
                    onUploadProgress?.(progress)
                },
                (error) =>
                {
                    setUploadState({
                        isUploading: false,
                        progress: 0,
                        error,
                        success: false
                    })
                    onUploadError?.(error)
                },
                (url) =>
                {
                    setUploadState({
                        isUploading: false,
                        progress: 100,
                        error: null,
                        success: true,
                        fileName: file.name,
                        fileSize: file.size,
                        uploadedAt: new Date()
                    })
                    onImageUploaded(url)

                    // Reset success state after 5 seconds
                    setTimeout(() =>
                    {
                        setUploadState(prev => ({ ...prev, success: false, progress: 0 }))
                        emailImageUploadService.clearUploadState(uploadId)
                    }, 5000)
                }
            )

        } catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
            setUploadState({
                isUploading: false,
                progress: 0,
                error: errorMessage,
                success: false
            })
            onUploadError?.(errorMessage)
        }
    }

    const handleButtonClick = () =>
    {
        if (disabled || uploadState.isUploading) return
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    {
        const file = event.target.files?.[0]
        if (file)
        {
            handleFileSelect(file)
        }
        // Reset input value to allow selecting the same file again
        event.target.value = ''
    }

    const handleRetry = () =>
    {
        setUploadState({
            isUploading: false,
            progress: 0,
            error: null,
            success: false
        })
        if (currentUploadId)
        {
            emailImageUploadService.clearUploadState(currentUploadId)
        }
    }

    const handleCancel = () =>
    {
        if (currentUploadId)
        {
            emailImageUploadService.cancelUploadById(currentUploadId)
            setUploadState({
                isUploading: false,
                progress: 0,
                error: null,
                success: false
            })
            setCurrentUploadId(null)
        }
    }

    const renderButtonContent = () =>
    {
        if (uploadState.isUploading)
        {
            return (
                <>
                    <Upload className="h-4 w-4 animate-pulse" />
                    Uploading...
                </>
            )
        }

        if (uploadState.success)
        {
            return (
                <>
                    <Check className="h-4 w-4" />
                    Uploaded!
                </>
            )
        }

        if (uploadState.error)
        {
            return (
                <>
                    <X className="h-4 w-4" />
                    Failed
                </>
            )
        }

        return (
            <>
                <Upload className="h-4 w-4" />
                {currentImageUrl ? 'Change Image' : 'Upload Image'}
            </>
        )
    }

    return (
        <div className={cn("space-y-2", className)}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={disabled || uploadState.isUploading}
            />

            <Button
                type="button"
                variant={uploadState.error ? "destructive" : uploadState.success ? "default" : "outline"}
                size="sm"
                onClick={handleButtonClick}
                disabled={disabled || uploadState.isUploading}
                className={cn(
                    "w-full gap-2 transition-all",
                    uploadState.success && "bg-green-600 hover:bg-green-700"
                )}
            >
                {renderButtonContent()}
            </Button>

            {/* Enhanced progress tracking */}
            <UploadProgressBar
                progress={uploadState.progress}
                isUploading={uploadState.isUploading}
                error={uploadState.error}
                success={uploadState.success}
                fileName={uploadState.fileName}
                fileSize={uploadState.fileSize}
                uploadedAt={uploadState.uploadedAt}
                onCancel={uploadState.isUploading ? handleCancel : undefined}
                onRetry={uploadState.error ? handleRetry : undefined}
                onDismissError={uploadState.error ? handleRetry : undefined}
                onDismissSuccess={() => setUploadState(prev => ({ ...prev, success: false }))}
            />
        </div>
    )
}