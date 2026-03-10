"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentProofUploadProps {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
  disabled?: boolean;
  maxSizeInMB?: number;
}

interface UploadState {
  file: File | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  previewUrl: string | null;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf'];

export function PaymentProofUpload({
  onUploadSuccess,
  onUploadError,
  disabled = false,
  maxSizeInMB = 5,
}: PaymentProofUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    file: null,
    uploading: false,
    progress: 0,
    error: null,
    success: false,
    previewUrl: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  /**
   * Validate file type and size
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Only PNG, JPG, and PDF files are allowed.',
      };
    }

    // Check file size
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeInMB}MB limit.`,
      };
    }

    return { valid: true };
  };

  /**
   * Create preview URL for images
   */
  const createPreviewUrl = (file: File): string | null => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  /**
   * Upload file to server
   */
  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // Simulate upload progress
    setUploadState(prev => ({ ...prev, uploading: true, progress: 0 }));

    try {
      // Create XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadState(prev => ({ ...prev, progress }));
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.url) {
                resolve(response.url);
              } else {
                reject(new Error(response.message || 'Upload failed'));
              }
            } catch (error) {
              reject(new Error('Invalid response from server'));
            }
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Send request
        xhr.open('POST', '/api/checkout/vvip/upload-proof');
        xhr.send(formData);
      });
    } catch (error) {
      throw error;
    }
  };

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(async (file: File) => {
    if (disabled) return;

    // Reset state
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false,
      previewUrl: null,
    });

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      const error = validation.error || 'Invalid file';
      setUploadState(prev => ({ ...prev, error }));
      onUploadError?.(error);
      toast.error(error);
      return;
    }

    // Set file and create preview
    const previewUrl = createPreviewUrl(file);
    setUploadState(prev => ({
      ...prev,
      file,
      previewUrl,
    }));

    try {
      // Upload file
      const url = await uploadFile(file);
      
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        success: true,
        progress: 100,
      }));

      onUploadSuccess(url);
      toast.success('Payment proof uploaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage,
      }));
      onUploadError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [disabled, maxSizeInMB, onUploadSuccess, onUploadError]);

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Handle click to select file
   */
  const handleClick = () => {
    if (!disabled && !uploadState.uploading) {
      fileInputRef.current?.click();
    }
  };

  /**
   * Remove selected file
   */
  const handleRemoveFile = () => {
    if (uploadState.previewUrl) {
      URL.revokeObjectURL(uploadState.previewUrl);
    }
    
    setUploadState({
      file: null,
      uploading: false,
      progress: 0,
      error: null,
      success: false,
      previewUrl: null,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  /**
   * Get file type icon
   */
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <File className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {!uploadState.file ? (
        // Drop zone
        <div
          ref={dropZoneRef}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${disabled 
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }
          `}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
          <p className={`text-lg font-medium mb-2 ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {disabled ? 'Upload disabled' : 'Drop your payment proof here'}
          </p>
          <p className={`text-sm mb-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
            or click to browse files
          </p>
          <div className={`text-xs ${disabled ? 'text-gray-400' : 'text-gray-400'}`}>
            <p>Supported formats: PNG, JPG, PDF</p>
            <p>Maximum size: {maxSizeInMB}MB</p>
          </div>
        </div>
      ) : (
        // File preview
        <div className="border border-gray-300 rounded-lg p-4">
          <div className="flex items-start gap-4">
            {/* File icon or image preview */}
            <div className="flex-shrink-0">
              {uploadState.previewUrl ? (
                <img
                  src={uploadState.previewUrl}
                  alt="Payment proof preview"
                  className="w-16 h-16 object-cover rounded-lg border"
                />
              ) : (
                getFileIcon(uploadState.file)
              )}
            </div>

            {/* File details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {uploadState.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadState.file.size)}
                  </p>
                </div>
                
                {!uploadState.uploading && (
                  <button
                    onClick={handleRemoveFile}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    disabled={disabled}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload progress */}
              {uploadState.uploading && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadState.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadState.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Success state */}
              {uploadState.success && (
                <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>Upload successful</span>
                </div>
              )}

              {/* Error state */}
              {uploadState.error && (
                <div className="mt-2 flex items-start gap-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{uploadState.error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Upload a clear image or PDF of your bank transfer receipt or confirmation.</p>
      </div>
    </div>
  );
}