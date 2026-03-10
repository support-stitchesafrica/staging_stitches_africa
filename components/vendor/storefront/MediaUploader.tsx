'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, Video, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { mediaUploadService, MediaUploadResult } from '@/lib/storefront/media-service';

interface MediaUploaderProps {
  vendorId: string;
  uploadType: 'logo' | 'banner' | 'video';
  currentUrl?: string;
  onUploadComplete?: (url: string, metadata?: any) => void;
  onUploadError?: (error: string) => void;
  onDelete?: () => void;
  className?: string;
  maxFiles?: number;
}

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error' | 'deleting';

interface UploadState {
  file: File | null;
  preview: string | null;
  progress: number;
  status: UploadStatus;
  error: string | null;
  url: string | null;
}

export default function MediaUploader({
  vendorId,
  uploadType,
  currentUrl,
  onUploadComplete,
  onUploadError,
  onDelete,
  className = '',
  maxFiles = 1
}: MediaUploaderProps) {
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
  const dragCounter = useRef(0);

  const resetUploadState = useCallback(() => {
    setUploadState({
      file: null,
      preview: currentUrl || null,
      progress: 0,
      status: 'idle',
      error: null,
      url: currentUrl || null
    });
  }, [currentUrl]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file
    const validation = mediaUploadService.validateFile(file, uploadType);
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

    // Generate preview
    try {
      const preview = await mediaUploadService.generatePreviewUrl(file);
      setUploadState(prev => ({
        ...prev,
        file,
        preview,
        status: 'uploading',
        error: null,
        progress: 0
      }));

      // Start upload with progress tracking
      try {
        const url = await mediaUploadService.uploadFileWithProgress(file, {
          vendorId,
          uploadType,
          onProgress: (progress) => {
            setUploadState(prev => ({ ...prev, progress }));
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
          },
          onComplete: (url, metadata) => {
            setUploadState(prev => ({
              ...prev,
              status: 'success',
              url,
              progress: 100
            }));
            if (onUploadComplete) {
              onUploadComplete(url, metadata);
            }
          }
        });

        // Upload completed successfully - state already updated in onComplete callback
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [vendorId, uploadType, onUploadComplete, onUploadError]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

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
      setUploadState(prev => ({ ...prev, status: 'deleting' }));
      
      // Delete from Firebase Storage
      const success = await mediaUploadService.deleteFileByUrl(uploadState.url, vendorId);
      
      if (success) {
        // Call the onDelete callback if provided
        if (onDelete) {
          onDelete();
        }
        
        // Reset the upload state
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
          error: 'Failed to delete file. Please try again.'
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete file';
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    }
  }, [uploadState.url, vendorId, onDelete]);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReplace = useCallback(async () => {
    if (!uploadState.url) return;

    try {
      setUploadState(prev => ({ ...prev, status: 'deleting' }));
      
      // Delete the current file first
      const success = await mediaUploadService.deleteFileByUrl(uploadState.url, vendorId);
      
      if (success) {
        // Reset state to allow new upload
        setUploadState({
          file: null,
          preview: null,
          progress: 0,
          status: 'idle',
          error: null,
          url: null
        });
        
        // Open file dialog for new upload
        setTimeout(() => openFileDialog(), 100);
      } else {
        setUploadState(prev => ({
          ...prev,
          status: 'error',
          error: 'Failed to replace file. Please try again.'
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to replace file';
      setUploadState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    }
  }, [uploadState.url, vendorId, openFileDialog]);

  const getAcceptedFileTypes = () => {
    switch (uploadType) {
      case 'video':
        return 'video/mp4,video/webm';
      default:
        return 'image/jpeg,image/png,image/webp';
    }
  };

  const getUploadTypeLabel = () => {
    switch (uploadType) {
      case 'logo':
        return 'Logo';
      case 'banner':
        return 'Banner';
      case 'video':
        return 'Video';
      default:
        return 'Media';
    }
  };

  const getUploadTypeIcon = () => {
    switch (uploadType) {
      case 'video':
        return <Video className="w-8 h-8 text-gray-400" />;
      default:
        return <Image className="w-8 h-8 text-gray-400" />;
    }
  };

  const renderPreview = () => {
    if (!uploadState.preview) return null;

    if (uploadType === 'video') {
      return (
        <video
          src={uploadState.preview}
          className="w-full h-32 object-cover rounded-lg"
          controls
          muted
        />
      );
    }

    return (
      <img
        src={uploadState.preview}
        alt={`${getUploadTypeLabel()} preview`}
        className="w-full h-32 object-cover rounded-lg"
      />
    );
  };

  const renderUploadArea = () => {
    if (uploadState.preview && (uploadState.status as UploadStatus) !== 'uploading' && (uploadState.status as UploadStatus) !== 'deleting') {
      return (
        <div className="relative">
          {renderPreview()}
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
              onClick={handleReplace}
              className="bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
              title="Replace"
              disabled={(uploadState.status as UploadStatus) === 'deleting'}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              title="Delete"
              disabled={(uploadState.status as UploadStatus) === 'deleting'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {((uploadState.status as UploadStatus) === 'uploading' || (uploadState.status as UploadStatus) === 'deleting') && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
              <div className="text-white text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <div className="text-sm">
                  {(uploadState.status as UploadStatus) === 'uploading' 
                    ? `${Math.round(uploadState.progress)}%`
                    : 'Deleting...'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${((uploadState.status as UploadStatus) === 'uploading' || (uploadState.status as UploadStatus) === 'deleting') ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {((uploadState.status as UploadStatus) === 'uploading' || (uploadState.status as UploadStatus) === 'deleting') ? (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <div>
              <div className="text-sm text-gray-600 mb-2">
                {(uploadState.status as UploadStatus) === 'uploading' 
                  ? `Uploading ${uploadState.file?.name}...`
                  : 'Deleting file...'
                }
              </div>
              {(uploadState.status as UploadStatus) === 'uploading' && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(uploadState.progress)}%
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              {isDragOver ? (
                <Upload className="w-8 h-8 text-blue-500" />
              ) : (
                getUploadTypeIcon()
              )}
            </div>
            <div>
              <div className="text-lg font-medium text-gray-900 mb-1">
                {isDragOver ? `Drop your ${uploadType} here` : `Upload ${getUploadTypeLabel()}`}
              </div>
              <div className="text-sm text-gray-500">
                Drag & drop or click to select
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {uploadType === 'video' 
                  ? 'MP4, WebM up to 100MB'
                  : 'JPG, PNG, WebP up to 10MB'
                }
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
        accept={getAcceptedFileTypes()}
        onChange={handleFileInputChange}
        className="hidden"
        multiple={maxFiles > 1}
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
            Your {uploadType} has been uploaded successfully.
          </div>
        </div>
      )}
    </div>
  );
}