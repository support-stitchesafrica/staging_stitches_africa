import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage';
import { storage } from '@/firebase';

export interface MediaUploadOptions {
  vendorId: string;
  uploadType: 'logo' | 'banner' | 'video';
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (url: string, metadata?: any) => void;
}

export interface MediaUploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    dimensions?: { width: number; height: number };
  };
}

export class MediaUploadService {
  private static instance: MediaUploadService;
  private activeUploads: Map<string, UploadTask> = new Map();

  static getInstance(): MediaUploadService {
    if (!MediaUploadService.instance) {
      MediaUploadService.instance = new MediaUploadService();
    }
    return MediaUploadService.instance;
  }

  /**
   * Upload file using the API endpoint with compression and processing
   */
  async uploadFile(file: File, options: MediaUploadOptions): Promise<MediaUploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('vendorId', options.vendorId);
    formData.append('uploadType', options.uploadType);

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result: MediaUploadResult = await response.json();
      
      if (result.success && options.onComplete) {
        options.onComplete(result.url!, result.metadata);
      } else if (!result.success && options.onError) {
        options.onError(new Error(result.error || 'Upload failed'));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      if (options.onError) {
        options.onError(new Error(errorMessage));
      }
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Upload file directly to Firebase Storage with progress tracking
   */
  async uploadFileWithProgress(file: File, options: MediaUploadOptions): Promise<string> {
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `${options.uploadType}_${timestamp}.${fileExtension}`;
    const filePath = `storefronts/${options.vendorId}/${options.uploadType}s/${fileName}`;

    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        uploadType: options.uploadType,
        vendorId: options.vendorId,
        uploadedAt: new Date().toISOString()
      }
    });

    // Store the upload task for potential cancellation
    this.activeUploads.set(filePath, uploadTask);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (options.onProgress) {
            options.onProgress(progress);
          }
        },
        (error) => {
          this.activeUploads.delete(filePath);
          if (options.onError) {
            options.onError(error);
          }
          reject(error);
        },
        async () => {
          this.activeUploads.delete(filePath);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            if (options.onComplete) {
              options.onComplete(downloadURL);
            }
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(filePath: string): boolean {
    const uploadTask = this.activeUploads.get(filePath);
    if (uploadTask) {
      uploadTask.cancel();
      this.activeUploads.delete(filePath);
      return true;
    }
    return false;
  }

  /**
   * Delete a file from storage using URL
   */
  async deleteFileByUrl(url: string, vendorId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/media/upload`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, vendorId }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Delete a file from storage using file path
   */
  async deleteFile(filePath: string, vendorId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/media/upload?filePath=${encodeURIComponent(filePath)}&vendorId=${vendorId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to delete file:', error);
      return false;
    }
  }

  /**
   * Extract file path from Firebase Storage URL
   */
  extractFilePathFromUrl(url: string): string | null {
    try {
      // Firebase Storage URLs have the format:
      // https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
      const urlObj = new URL(url);
      const pathParam = urlObj.pathname.split('/o/')[1];
      if (pathParam) {
        return decodeURIComponent(pathParam.split('?')[0]);
      }
      return null;
    } catch (error) {
      console.error('Failed to extract file path from URL:', error);
      return null;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, uploadType: string): { valid: boolean; error?: string } {
    const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
    const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

    const isImage = SUPPORTED_IMAGE_TYPES.includes(file.type);
    const isVideo = SUPPORTED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        valid: false,
        error: 'Unsupported file type. Please upload JPG, PNG, WebP, MP4, or WebM files.'
      };
    }

    if (isImage && file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: 'Image file too large. Maximum size is 10MB.'
      };
    }

    if (isVideo && file.size > MAX_VIDEO_SIZE) {
      return {
        valid: false,
        error: 'Video file too large. Maximum size is 100MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Get file size in human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate preview URL for file
   */
  generatePreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const mediaUploadService = MediaUploadService.getInstance();