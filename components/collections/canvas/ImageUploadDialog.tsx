'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { collectionImageUploadService } from '@/lib/services/collectionImageUpload';
import Image from 'next/image';

interface ImageUploadDialogProps
{
    collectionId: string;
    userId?: string;
    onImageUploaded: (imageUrl: string) => void;
    onClose: () => void;
}

export function ImageUploadDialog({
    collectionId,
    userId,
    onImageUploaded,
    onClose,
}: ImageUploadDialogProps)
{
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadIdRef = useRef(`upload-${Date.now()}`);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) =>
    {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        const validation = collectionImageUploadService.validateImageFile(file);
        if (!validation.valid)
        {
            setError(validation.error || 'Invalid file');
            return;
        }

        setSelectedFile(file);
        setError(null);
        setSuccess(false);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) =>
        {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = async () =>
    {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try
        {
            const imageUrl = await collectionImageUploadService.uploadImage(
                uploadIdRef.current,
                selectedFile,
                collectionId,
                userId,
                (progress) => setUploadProgress(progress),
                (error) => setError(error),
                () => setSuccess(true)
            );

            // Add image to canvas
            onImageUploaded(imageUrl);

            // Close dialog after short delay
            setTimeout(() =>
            {
                onClose();
            }, 1000);

        } catch (err)
        {
            console.error('Upload error:', err);
            setError(err instanceof Error ? err.message : 'Upload failed');
        } finally
        {
            setUploading(false);
        }
    };

    const handleCancel = () =>
    {
        if (uploading)
        {
            collectionImageUploadService.cancelUpload(uploadIdRef.current);
        }
        onClose();
    };

    const handleDragOver = (e: React.DragEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) =>
    {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        // Validate file
        const validation = collectionImageUploadService.validateImageFile(file);
        if (!validation.valid)
        {
            setError(validation.error || 'Invalid file');
            return;
        }

        setSelectedFile(file);
        setError(null);
        setSuccess(false);

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) =>
        {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleCancel}
        >
            <Card
                className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white shadow-2xl rounded-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2">
                        <Upload className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">Upload Custom Image</h3>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0 hover:bg-red-100"
                        disabled={uploading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Upload Area */}
                    {!selectedFile && (
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer"
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p className="text-lg font-medium text-gray-700 mb-2">
                                Drop your image here or click to browse
                            </p>
                            <p className="text-sm text-gray-500">
                                Supports JPEG, PNG, GIF, WebP, SVG (max 15MB)
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Preview */}
                    {selectedFile && previewUrl && (
                        <div className="space-y-4">
                            <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200">
                                <Image
                                    src={previewUrl}
                                    alt="Preview"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <ImageIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span className="text-sm font-medium text-gray-700 truncate">
                                        {selectedFile.name}
                                    </span>
                                    <span className="text-xs text-gray-500 flex-shrink-0">
                                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                    </span>
                                </div>
                                {!uploading && !success && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                        {
                                            setSelectedFile(null);
                                            setPreviewUrl(null);
                                            setError(null);
                                        }}
                                        className="flex-shrink-0"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Upload Progress */}
                            {uploading && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Uploading...</span>
                                        <span className="font-semibold text-blue-600">
                                            {Math.round(uploadProgress)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full transition-all duration-300 rounded-full"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-700">
                                        Image uploaded successfully!
                                    </span>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-sm font-medium text-red-700">{error}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t bg-gray-50 flex items-center justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading || success}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : success ? (
                            <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Uploaded
                            </>
                        ) : (
                            <>
                                <Upload className="h-4 w-4 mr-2" />
                                Upload & Add to Canvas
                            </>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
