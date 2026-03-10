/**
 * Simple Image Uploader Component for Waitlist Banners
 * Fallback component if MediaUploader doesn't work
 */

"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { WaitlistImageUploadService } from '@/lib/waitlist/image-upload-service';

interface ImageUploaderProps {
  currentUrl?: string;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  onDelete?: () => void;
  userId: string;
  className?: string;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadState {
  file: File | null;
  preview: string | null;
  progress: number;
  status: UploadStatus;
  error: string | null;
  url: string | null;
}

export default function ImageUploader({
  currentUrl,
  onUploadComplete,
  onUploadError,
  onDelete,
  userId,
  className = ''
}: ImageUploaderProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    preview: currentUrl || null,
    progress: 0,
    status: 'idle',
    error: null,
    url: currentUrl || null
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file
    const validation = WaitlistImageUploadService.validateImageFile(file);
    if (!validation.valid) {
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: validation.error || 'Invalid file'
      }));
      if (onUploadError) {
        onUploadError(validation.error || 'Invalid file');
      }
      return;
    }

    try {
      // Generate preview
      const preview = await WaitlistImageUploadService.generatePreviewUrl(file);
      setUploadState(prev => ({
        ...prev,
        file,
        preview,
        status: 'uploading',
        error: null,
        progress: 0
      }));

      // Upload file
      const url = await WaitlistImageUploadService.uploadImage(file, userId, {
        onProgress: (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        },
        onComplete: (url) => {
          setUploadState(prev => ({
            ...prev,
            status: 'success',
            url,
            progress: 100
          }));
          if (onUploadComplete) {
            onUploadComplete(url);
          }
        },
        onError: (error) => {
          setUploadState(prev => ({
            ...prev,
            status: 'error',
            error: error.message
          }));
          if (onUploadError) {
            onUploadError(error.message);
          }
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [userId, onUploadComplete, onUploadError]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  }, [handleFileSelect]);

  const handleDelete = useCallback(async () => {
    if (!uploadState.url) return;

    try {
      const success = await WaitlistImageUploadService.deleteImage(uploadState.url);
      
      if (success) {
        if (onDelete) {
          onDelete();
        }
        
        setUploadState({
          file: null,
          preview: null,
          progress: 0,
          status: 'idle',
          error: null,
          url: null
        });
      } else {
        setUploadState(prev => ({
          ...prev,
          status: 'error',
          error: 'Failed to delete image. Please try again.'
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete image';
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    }
  }, [uploadState.url, onDelete]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const renderPreview = () => {
    if (!uploadState.preview) return null;

    return (
      <div className="relative">
        <img
          src={uploadState.preview}
          alt="Banner preview"
          className="w-full h-48 object-cover rounded-lg border"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          {uploadState.status === 'success' && (
            <div className="bg-green-500 text-white p-1 rounded-full">
              <CheckCircle className="w-4 h-4" />
            </div>
          )}
          {uploadState.status === 'error' && (
            <div className="bg-red-500 text-white p-1 rounded-full">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          <button
            onClick={handleDelete}
            className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
            title="Delete"
            disabled={uploadState.status === 'uploading'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {uploadState.status === 'uploading' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="text-white text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <div className="text-sm">{Math.round(uploadState.progress)}%</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUploadArea = () => {
    if (uploadState.preview && uploadState.status !== 'uploading') {
      return renderPreview();
    }

    return (
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploadState.status === 'uploading' ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {uploadState.status === 'uploading' ? (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <div>
              <div className="text-sm text-gray-600 mb-2">
                Uploading {uploadState.file?.name}...
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(uploadState.progress)}%
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragOver ? (
                <Upload className="w-8 h-8 text-blue-500" />
              ) : (
                <Image className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div>
              <div className="text-lg font-medium text-gray-900 mb-1">
                {isDragOver ? 'Drop your banner here' : 'Upload Banner Image'}
              </div>
              <div className="text-sm text-gray-500">
                Drag & drop or click to select
              </div>
              <div className="text-xs text-gray-400 mt-2">
                JPG, PNG, WebP up to 10MB
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      {renderUploadArea()}

      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Error</span>
          </div>
          <div className="text-sm text-red-600 mt-1">
            {uploadState.error}
          </div>
        </div>
      )}

      {uploadState.status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Upload Successful</span>
          </div>
          <div className="text-sm text-green-600 mt-1">
            Your banner image has been uploaded successfully.
          </div>
        </div>
      )}
    </div>
  );
}