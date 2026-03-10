'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps
{
    productId: string;
    images: File[];
    previewUrls: string[];
    onImagesChange: (files: File[], previews: string[]) => void;
    maxImages?: number;
    maxSizePerImage?: number; // in bytes
    uploadProgress?: number; // 0-100
}

const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_MAX_IMAGES = 10;

export function ImageUploader({
    productId,
    images,
    previewUrls,
    onImagesChange,
    maxImages = DEFAULT_MAX_IMAGES,
    maxSizePerImage = DEFAULT_MAX_SIZE,
    uploadProgress,
}: ImageUploaderProps)
{
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFiles = useCallback(
        (files: File[]): { valid: File[]; errors: string[] } =>
        {
            const validFiles: File[] = [];
            const newErrors: string[] = [];

            for (const file of files)
            {
                // Check file format
                if (!ACCEPTED_FORMATS.includes(file.type))
                {
                    newErrors.push(
                        `${file.name}: Invalid format. Only JPEG, PNG, and WebP are allowed.`
                    );
                    continue;
                }

                // Check file size
                if (file.size > maxSizePerImage)
                {
                    newErrors.push(
                        `${file.name}: File too large. Maximum size is ${(maxSizePerImage / (1024 * 1024)).toFixed(0)}MB.`
                    );
                    continue;
                }

                validFiles.push(file);
            }

            return { valid: validFiles, errors: newErrors };
        },
        [maxSizePerImage]
    );

    const handleFiles = useCallback(
        async (newFiles: File[]) =>
        {
            setErrors([]);

            // Check if adding new files would exceed max images (count both new and existing)
            const totalImages = previewUrls.length + newFiles.length;
            if (totalImages > maxImages)
            {
                setErrors([
                    `Cannot add ${newFiles.length} images. Maximum ${maxImages} images allowed (currently have ${previewUrls.length}).`,
                ]);
                return;
            }

            // Validate files
            const { valid, errors: validationErrors } = validateFiles(newFiles);

            if (validationErrors.length > 0)
            {
                setErrors(validationErrors);
            }

            if (valid.length === 0)
            {
                return;
            }

            // Create preview URLs for valid files
            const newPreviewUrls = await Promise.all(
                valid.map(
                    (file) =>
                        new Promise<string>((resolve) =>
                        {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result as string);
                            reader.readAsDataURL(file);
                        })
                )
            );

            // Update parent component with new files and previews
            onImagesChange([...images, ...valid], [...previewUrls, ...newPreviewUrls]);
        },
        [images, previewUrls, maxImages, validateFiles, onImagesChange]
    );

    const handleDragEnter = useCallback((e: React.DragEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) =>
        {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            handleFiles(files);
        },
        [handleFiles]
    );

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) =>
        {
            const files = e.target.files ? Array.from(e.target.files) : [];
            handleFiles(files);

            // Reset input value to allow selecting the same file again
            if (fileInputRef.current)
            {
                fileInputRef.current.value = '';
            }
        },
        [handleFiles]
    );

    const handleRemoveImage = useCallback(
        (index: number) =>
        {
            const newImages = images.filter((_, i) => i !== index);
            const newPreviews = previewUrls.filter((_, i) => i !== index);
            onImagesChange(newImages, newPreviews);
            setErrors([]);
        },
        [images, previewUrls, onImagesChange]
    );

    const handleBrowseClick = () =>
    {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-3">
            {/* Upload Area */}
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${isDragging
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                    } ${previewUrls.length >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={previewUrls.length < maxImages ? handleBrowseClick : undefined}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPTED_FORMATS.join(',')}
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={previewUrls.length >= maxImages}
                />

                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-400" />
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-700">
                            {isDragging ? 'Drop images here' : 'Drag & drop images here'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            or click to browse
                        </p>
                    </div>

                    <div className="text-xs text-gray-400 space-y-0.5">
                        <p>JPEG, PNG, WebP • Max {(maxSizePerImage / (1024 * 1024)).toFixed(0)}MB per image</p>
                        <p>
                            {previewUrls.length} / {maxImages} images
                        </p>
                    </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress !== undefined && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="absolute inset-0 bg-white/90 rounded-lg flex flex-col items-center justify-center">
                        <div className="w-full max-w-xs px-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Uploading...</span>
                                <span className="text-sm font-medium text-primary-600">{uploadProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-primary-600 h-full transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Error Messages */}
            {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                    {errors.map((error, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Preview Grid */}
            {previewUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {previewUrls.map((url, index) => (
                        <div
                            key={`${productId}-${index}`}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 group"
                        >
                            <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjwvc3ZnPg=="
                            />

                            {/* Remove Button */}
                            <button
                                type="button"
                                onClick={(e) =>
                                {
                                    e.stopPropagation();
                                    handleRemoveImage(index);
                                }}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                                aria-label="Remove image"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Image Info Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-xs text-white truncate">
                                    {images[index]?.name || 'Existing image'}
                                </p>
                                {images[index]?.size && (
                                    <p className="text-[10px] text-gray-200">
                                        {(images[index].size / 1024).toFixed(0)} KB
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {previewUrls.length === 0 && (
                <div className="text-center py-4">
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No images added yet</p>
                </div>
            )}
        </div>
    );
}
