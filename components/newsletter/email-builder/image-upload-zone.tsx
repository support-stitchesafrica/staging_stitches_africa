import React, { useState, useRef } from "react"
import { Upload, Image as ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { emailImageUploadService } from "@/lib/services/emailImageUpload"

interface ImageUploadZoneProps
{
    onImageUploaded: (url: string) => void
    onUploadProgress?: (progress: number) => void
    onUploadError?: (error: string) => void
    className?: string
    disabled?: boolean
    children?: React.ReactNode
}

interface DragState
{
    isDragOver: boolean
    isDragActive: boolean
}

export function ImageUploadZone({
    onImageUploaded,
    onUploadProgress,
    onUploadError,
    className,
    disabled = false,
    children
}: ImageUploadZoneProps)
{
    const [dragState, setDragState] = useState<DragState>({
        isDragOver: false,
        isDragActive: false
    })
    const [isUploading, setIsUploading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [currentUploadId, setCurrentUploadId] = useState<string | null>(null)
    const dragCounterRef = useRef(0)

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

    const handleFileUpload = async (file: File) =>
    {
        // Generate unique upload ID
        const uploadId = `zone-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        setCurrentUploadId(uploadId)

        // Validate file
        const validation = validateImageFile(file)
        if (!validation.valid)
        {
            setError(validation.error || 'Invalid file')
            onUploadError?.(validation.error || 'Invalid file')
            return
        }

        setError(null)
        setIsUploading(true)
        setUploadProgress(0)

        try
        {
            // Use the enhanced upload service with ID tracking
            const imageUrl = await emailImageUploadService.uploadImageWithId(
                uploadId,
                file,
                undefined, // userId - can be added later if needed
                (progress) =>
                {
                    setUploadProgress(progress)
                    onUploadProgress?.(progress)
                },
                (error) =>
                {
                    setError(error)
                    setIsUploading(false)
                    onUploadError?.(error)
                },
                (url) =>
                {
                    onImageUploaded(url)
                    setIsUploading(false)
                    setUploadProgress(100)

                    // Clear upload state after success
                    setTimeout(() =>
                    {
                        emailImageUploadService.clearUploadState(uploadId)
                        setCurrentUploadId(null)
                        setUploadProgress(0)
                    }, 2000)
                }
            )

        } catch (error)
        {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.'
            setError(errorMessage)
            setIsUploading(false)
            onUploadError?.(errorMessage)
        }
    }

    const handleDragEnter = (e: React.DragEvent) =>
    {
        e.preventDefault()
        e.stopPropagation()

        if (disabled || isUploading) return

        dragCounterRef.current++

        if (e.dataTransfer.items && e.dataTransfer.items.length > 0)
        {
            setDragState({
                isDragOver: true,
                isDragActive: true
            })
        }
    }

    const handleDragLeave = (e: React.DragEvent) =>
    {
        e.preventDefault()
        e.stopPropagation()

        if (disabled || isUploading) return

        dragCounterRef.current--

        if (dragCounterRef.current === 0)
        {
            setDragState({
                isDragOver: false,
                isDragActive: false
            })
        }
    }

    const handleDragOver = (e: React.DragEvent) =>
    {
        e.preventDefault()
        e.stopPropagation()

        if (disabled || isUploading) return

        // Ensure we show the correct drag effect
        e.dataTransfer.dropEffect = 'copy'
    }

    const handleDrop = (e: React.DragEvent) =>
    {
        e.preventDefault()
        e.stopPropagation()

        if (disabled || isUploading) return

        // Reset drag state
        setDragState({
            isDragOver: false,
            isDragActive: false
        })
        dragCounterRef.current = 0

        const files = Array.from(e.dataTransfer.files)
        const imageFiles = files.filter(file => file.type.startsWith('image/'))

        if (imageFiles.length === 0)
        {
            setError('Please drop an image file')
            onUploadError?.('Please drop an image file')
            return
        }

        // Handle the first image file
        const file = imageFiles[0]
        handleFileUpload(file)
    }

    const clearError = () =>
    {
        setError(null)
        if (currentUploadId)
        {
            emailImageUploadService.clearUploadState(currentUploadId)
        }
    }

    const cancelUpload = () =>
    {
        if (currentUploadId)
        {
            emailImageUploadService.cancelUploadById(currentUploadId)
            setIsUploading(false)
            setUploadProgress(0)
            setError(null)
            setCurrentUploadId(null)
        }
    }

    return (
        <div
            className={cn(
                "relative transition-all duration-200 ease-in-out",
                dragState.isDragOver && !disabled && !isUploading && [
                    "ring-2 ring-primary ring-offset-2",
                    "bg-primary/5"
                ],
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {children}

            {/* Drag overlay */}
            {dragState.isDragOver && !disabled && !isUploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/10 border-2 border-dashed border-primary rounded-lg">
                    <div className="flex flex-col items-center gap-2 text-primary">
                        <Upload className="h-8 w-8" />
                        <p className="text-sm font-medium">Drop image here</p>
                    </div>
                </div>
            )}

            {/* Upload overlay with progress and cancel */}
            {isUploading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90 rounded-lg">
                    <div className="flex flex-col items-center gap-3 p-4 bg-card border rounded-lg shadow-lg min-w-[200px]">
                        <Upload className="h-8 w-8 animate-pulse text-primary" />
                        <p className="text-sm font-medium">Uploading image...</p>
                        <div className="w-full space-y-2">
                            <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                {Math.round(uploadProgress)}%
                            </p>
                        </div>
                        <button
                            onClick={cancelUpload}
                            className="text-xs text-muted-foreground hover:text-destructive underline"
                        >
                            Cancel Upload
                        </button>
                    </div>
                </div>
            )}

            {/* Error overlay */}
            {error && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-destructive/10 border-2 border-destructive rounded-lg">
                    <div className="flex flex-col items-center gap-2 text-destructive max-w-xs text-center">
                        <X className="h-6 w-6" />
                        <p className="text-sm font-medium">{error}</p>
                        <button
                            onClick={clearError}
                            className="text-xs underline hover:no-underline"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}