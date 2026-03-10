'use client';

import { useState, useRef, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BannerUploadProps
{
    onFileSelect: (file: File) => void;
    currentImageUrl?: string;
    disabled?: boolean;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export function BannerUpload({ onFileSelect, currentImageUrl, disabled }: BannerUploadProps)
{
    const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validate file
    const validateFile = (file: File): string | null =>
    {
        if (!ALLOWED_TYPES.includes(file.type))
        {
            return 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.';
        }

        if (file.size > MAX_SIZE)
        {
            return 'File size exceeds 5MB limit.';
        }

        return null;
    };

    // Handle file selection
    const handleFileChange = (file: File) =>
    {
        setError(null);

        const validationError = validateFile(file);
        if (validationError)
        {
            setError(validationError);
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () =>
        {
            setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Pass file to parent
        onFileSelect(file);
    };

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const file = e.target.files?.[0];
        if (file)
        {
            handleFileChange(file);
        }
    };

    // Handle drag events
    const handleDragEnter = (e: DragEvent<HTMLDivElement>) =>
    {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled)
        {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) =>
    {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) =>
    {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) =>
    {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const file = e.dataTransfer.files?.[0];
        if (file)
        {
            handleFileChange(file);
        }
    };

    // Handle click to upload
    const handleClick = () =>
    {
        if (!disabled)
        {
            fileInputRef.current?.click();
        }
    };

    // Handle remove image
    const handleRemove = (e: React.MouseEvent) =>
    {
        e.stopPropagation();
        setPreview(null);
        setError(null);
        if (fileInputRef.current)
        {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                Banner Image <span className="text-red-500">*</span>
            </label>

            {/* Upload Area */}
            <div
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                    'relative border-2 border-dashed rounded-lg transition-all cursor-pointer',
                    isDragging && !disabled
                        ? 'border-purple-500 bg-purple-50'
                        : error
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50',
                    disabled && 'opacity-50 cursor-not-allowed',
                    preview ? 'p-0' : 'p-8'
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_TYPES.join(',')}
                    onChange={handleInputChange}
                    disabled={disabled}
                    className="hidden"
                />

                {preview ? (
                    // Image Preview
                    <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden group">
                        <Image
                            src={preview}
                            alt="Banner preview"
                            fill
                            className="object-cover"
                        />
                        {!disabled && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={handleRemove}
                                    className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-700" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Upload Prompt
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className={cn(
                            'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                            error ? 'bg-red-100' : 'bg-purple-100'
                        )}>
                            {error ? (
                                <ImageIcon className="w-8 h-8 text-red-600" />
                            ) : (
                                <Upload className="w-8 h-8 text-purple-600" />
                            )}
                        </div>

                        <p className="text-sm font-medium text-gray-900 mb-1">
                            {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500">
                            JPEG, PNG, or WebP (max 5MB)
                        </p>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                    <span className="font-medium">Error:</span> {error}
                </p>
            )}

            {/* Info */}
            {!error && !preview && (
                <p className="text-xs text-gray-500">
                    Recommended size: 1920x820px for best results
                </p>
            )}
        </div>
    );
}
