import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from "firebase/storage";
import { storage } from "@/firebase";

/**
 * Supported image file types for collection editor
 */
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

/**
 * Maximum file size in bytes (15MB for high-quality collection images)
 */
const MAX_FILE_SIZE = 15 * 1024 * 1024;

/**
 * File validation result interface
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Upload progress callback type
 */
type ProgressCallback = (progress: number) => void;

/**
 * Upload error callback type
 */
type ErrorCallback = (error: string) => void;

/**
 * Upload success callback type
 */
type SuccessCallback = (url: string) => void;

/**
 * Upload state interface
 */
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
  fileName?: string;
  uploadTask?: UploadTask;
}

/**
 * Collection image upload service class
 */
export class CollectionImageUploadService {
  private uploadStates: Map<string, UploadState> = new Map();

  /**
   * Validate image file for collection editor requirements
   */
  validateImageFile(file: File): ValidationResult {
    // Check file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)'
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Image file size must be less than 15MB'
      };
    }

    // Check for empty file
    if (file.size === 0) {
      return {
        valid: false,
        error: 'Selected file is empty. Please choose a valid image file.'
      };
    }

    return { valid: true };
  }

  /**
   * Process image for collection optimization
   */
  private async processImageForCollection(file: File): Promise<File> {
    // Skip processing for SVG files
    if (file.type === 'image/svg+xml') {
      return file;
    }

    return new Promise((resolve, reject) => {
      try {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
          try {
            const img = new Image();
            img.src = reader.result as string;

            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                if (!ctx) {
                  reject(new Error("No canvas context available"));
                  return;
                }

                // Scale down if needed (max 2000px for high quality)
                const maxDimension = 2000;
                const scale = Math.max(img.naturalWidth, img.naturalHeight) > maxDimension 
                  ? maxDimension / Math.max(img.naturalWidth, img.naturalHeight) 
                  : 1;

                canvas.width = img.naturalWidth * scale;
                canvas.height = img.naturalHeight * scale;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                // Draw image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Export as PNG for quality or JPEG for smaller size
                const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const quality = outputFormat === 'image/jpeg' ? 0.92 : undefined;

                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      reject(new Error("Failed to create processed image blob"));
                      return;
                    }
                    const extension = outputFormat === 'image/png' ? 'png' : 'jpg';
                    const processedFile = new File(
                      [blob], 
                      `collection-${Date.now()}-${file.name.replace(/\.[^/.]+$/, '')}.${extension}`, 
                      { type: outputFormat }
                    );
                    resolve(processedFile);
                  },
                  outputFormat,
                  quality
                );
              } catch (error) {
                reject(error);
              }
            };

            img.onerror = () => reject(new Error("Failed to load image for processing"));
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => reject(new Error("Failed to read image file"));
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Upload image to Firebase Storage with progress tracking
   */
  async uploadImage(
    uploadId: string,
    file: File, 
    collectionId: string,
    userId?: string,
    onProgress?: ProgressCallback,
    onError?: ErrorCallback,
    onSuccess?: SuccessCallback
  ): Promise<string> {
    // Initialize upload state
    this.setUploadState(uploadId, {
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
      fileName: file.name
    });

    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        const error = validation.error || 'Invalid file';
        this.setUploadState(uploadId, {
          isUploading: false,
          error,
          success: false
        });
        onError?.(error);
        throw new Error(error);
      }

      // Process image for collection optimization
      const processedFile = await this.processImageForCollection(file);

      // Create storage reference with proper folder structure
      const fileName = encodeURIComponent(`${Date.now()}_${processedFile.name}`);
      const folderPath = userId 
        ? `collection-images/${userId}/${collectionId}` 
        : `collection-images/anonymous/${collectionId}`;
      const storageRef = ref(storage, `${folderPath}/${fileName}`);

      // Create upload task for progress tracking
      const uploadTask = uploadBytesResumable(storageRef, processedFile);
      
      // Store upload task in state
      this.setUploadState(uploadId, { uploadTask });

      return new Promise((resolve, reject) => {
        // Track upload progress
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.setUploadState(uploadId, { progress });
            onProgress?.(progress);
          },
          (error) => {
            const errorMessage = this.getErrorMessage(error);
            this.setUploadState(uploadId, {
              isUploading: false,
              error: errorMessage,
              success: false
            });
            onError?.(errorMessage);
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              this.setUploadState(uploadId, {
                isUploading: false,
                progress: 100,
                error: null,
                success: true
              });
              onSuccess?.(downloadURL);
              resolve(downloadURL);
            } catch (error) {
              const errorMessage = 'Failed to get download URL';
              this.setUploadState(uploadId, {
                isUploading: false,
                error: errorMessage,
                success: false
              });
              onError?.(errorMessage);
              reject(new Error(errorMessage));
            }
          }
        );
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      this.setUploadState(uploadId, {
        isUploading: false,
        error: errorMessage,
        success: false
      });
      onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Cancel specific upload by ID
   */
  cancelUpload(uploadId: string): void {
    const uploadState = this.uploadStates.get(uploadId);
    if (uploadState?.uploadTask) {
      uploadState.uploadTask.cancel();
      this.uploadStates.delete(uploadId);
    }
  }

  /**
   * Get upload state by ID
   */
  getUploadState(uploadId: string): UploadState | null {
    return this.uploadStates.get(uploadId) || null;
  }

  /**
   * Set upload state
   */
  private setUploadState(uploadId: string, state: Partial<UploadState>): void {
    const currentState = this.uploadStates.get(uploadId) || {
      isUploading: false,
      progress: 0,
      error: null,
      success: false
    };
    
    this.uploadStates.set(uploadId, { ...currentState, ...state });
  }

  /**
   * Clear upload state
   */
  clearUploadState(uploadId: string): void {
    this.uploadStates.delete(uploadId);
  }

  /**
   * Get all active uploads
   */
  getActiveUploads(): Map<string, UploadState> {
    return new Map(this.uploadStates);
  }

  /**
   * Convert Firebase error to user-friendly message
   */
  private getErrorMessage(error: any): string {
    switch (error.code) {
      case 'storage/unauthorized':
        return 'You do not have permission to upload images';
      case 'storage/canceled':
        return 'Upload was cancelled';
      case 'storage/unknown':
        return 'An unknown error occurred during upload';
      case 'storage/invalid-format':
        return 'Invalid image format';
      case 'storage/invalid-argument':
        return 'Invalid upload parameters';
      case 'storage/retry-limit-exceeded':
        return 'Upload failed after multiple retries. Please try again';
      default:
        return 'Upload failed. Please check your connection and try again';
    }
  }
}

/**
 * Default instance for easy importing
 */
export const collectionImageUploadService = new CollectionImageUploadService();

/**
 * Convenience function for simple uploads
 */
export const uploadCollectionImage = async (
  uploadId: string,
  file: File,
  collectionId: string,
  userId?: string,
  onProgress?: ProgressCallback,
  onError?: ErrorCallback,
  onSuccess?: SuccessCallback
): Promise<string> => {
  return collectionImageUploadService.uploadImage(
    uploadId,
    file,
    collectionId,
    userId,
    onProgress,
    onError,
    onSuccess
  );
};
