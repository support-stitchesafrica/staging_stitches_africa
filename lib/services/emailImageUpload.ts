import { ref, uploadBytes, getDownloadURL, uploadBytesResumable, UploadTask } from "firebase/storage";
import { storage } from "@/firebase";
import { UploadErrorHandler, UploadError, UploadErrorType } from "./uploadErrorHandler";

/**
 * Supported image file types for email builder
 */
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp'
];

/**
 * Maximum file size in bytes (10MB)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

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
 * Enhanced error callback type with structured error
 */
type EnhancedErrorCallback = (error: UploadError) => void;

/**
 * Upload success callback type
 */
type SuccessCallback = (url: string) => void;

/**
 * Upload state interface for tracking multiple uploads
 */
interface UploadState {
  isUploading: boolean;
  progress: number;
  error: UploadError | null;
  success: boolean;
  fileName?: string;
  uploadTask?: UploadTask;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Type guard to check if an error is an UploadError
 */
function isUploadError(error: any): error is UploadError {
  return error && 
         typeof error === 'object' && 
         'type' in error && 
         'message' in error && 
         'userMessage' in error && 
         'retryable' in error;
}

/**
 * Email image upload service class
 */
export class EmailImageUploadService {
  private currentUploadTask: UploadTask | null = null;
  private progressCallback?: ProgressCallback;
  private errorCallback?: ErrorCallback;
  private successCallback?: SuccessCallback;
  private uploadStates: Map<string, UploadState> = new Map();

  /**
   * Validate image file for email builder requirements
   */
  validateImageFile(file: File): ValidationResult {
    // Check file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      return {
        valid: false,
        error: 'Please select a valid image file (JPEG, PNG, GIF, WebP)'
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'Image file size must be less than 10MB'
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
   * Process image for email optimization
   * Applies similar processing to vendor service but optimized for email use
   */
  private async processImageForEmail(file: File): Promise<File> {
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
                  reject(UploadErrorHandler.handleProcessingError(new Error("No canvas context available")));
                  return;
                }

                // Scale down for email optimization (max 800px width for email compatibility)
                const maxWidth = 800;
                const scale = img.naturalWidth > maxWidth ? maxWidth / img.naturalWidth : 1;

                canvas.width = img.naturalWidth * scale;
                canvas.height = img.naturalHeight * scale;

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = "high";

                // For email images, we want clean backgrounds
                ctx.fillStyle = "#fff";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Apply slight enhancement for email display
                ctx.filter = "contrast(1.02) brightness(1.02)";
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Reset filter
                ctx.filter = "none";

                // Export as JPEG for email compatibility and smaller size
                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      reject(UploadErrorHandler.handleProcessingError(new Error("Failed to create processed image blob")));
                      return;
                    }
                    const processedFile = new File([blob], `email-${Date.now()}-${file.name}.jpg`, {
                      type: "image/jpeg",
                    });
                    resolve(processedFile);
                  },
                  "image/jpeg",
                  0.85 // Good quality for email while keeping size reasonable
                );
              } catch (error) {
                reject(UploadErrorHandler.handleProcessingError(error));
              }
            };

            img.onerror = () => reject(UploadErrorHandler.handleProcessingError(new Error("Failed to load image for processing")));
          } catch (error) {
            reject(UploadErrorHandler.handleProcessingError(error));
          }
        };

        reader.onerror = () => reject(UploadErrorHandler.handleProcessingError(new Error("Failed to read image file")));
      } catch (error) {
        reject(UploadErrorHandler.handleProcessingError(error));
      }
    });
  }

  /**
   * Upload image to Firebase Storage with progress tracking
   */
  async uploadImage(
    file: File, 
    userId?: string,
    onProgress?: ProgressCallback,
    onError?: ErrorCallback,
    onSuccess?: SuccessCallback
  ): Promise<string> {
    // Store callbacks
    this.progressCallback = onProgress;
    this.errorCallback = onError;
    this.successCallback = onSuccess;

    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        const error = validation.error || 'Invalid file';
        this.errorCallback?.(error);
        throw new Error(error);
      }

      // Process image for email optimization
      const processedFile = await this.processImageForEmail(file);

      // Create storage reference with proper folder structure
      const fileName = encodeURIComponent(`${Date.now()}_${processedFile.name}`);
      const folderPath = userId ? `email-images/${userId}` : 'email-images/anonymous';
      const storageRef = ref(storage, `${folderPath}/${fileName}`);

      // Create upload task for progress tracking
      this.currentUploadTask = uploadBytesResumable(storageRef, processedFile);

      return new Promise((resolve, reject) => {
        if (!this.currentUploadTask) {
          reject(new Error('Upload task not initialized'));
          return;
        }

        // Track upload progress
        this.currentUploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            this.progressCallback?.(progress);
          },
          (error) => {
            const errorMessage = this.getErrorMessage(error);
            this.errorCallback?.(errorMessage);
            reject(new Error(errorMessage));
          },
          async () => {
            try {
              if (!this.currentUploadTask) {
                throw new Error('Upload task not available');
              }
              
              const downloadURL = await getDownloadURL(this.currentUploadTask.snapshot.ref);
              this.successCallback?.(downloadURL);
              resolve(downloadURL);
            } catch (error) {
              const errorMessage = 'Failed to get download URL';
              this.errorCallback?.(errorMessage);
              reject(new Error(errorMessage));
            }
          }
        );
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      this.errorCallback?.(errorMessage);
      throw error;
    }
  }

  /**
   * Cancel current upload
   */
  cancelUpload(): void {
    if (this.currentUploadTask) {
      this.currentUploadTask.cancel();
      this.currentUploadTask = null;
    }
  }

  /**
   * Cancel specific upload by ID
   */
  cancelUploadById(uploadId: string): void {
    const uploadState = this.uploadStates.get(uploadId);
    if (uploadState?.uploadTask) {
      uploadState.uploadTask.cancel();
      this.uploadStates.delete(uploadId);
    }
  }

  /**
   * Get current upload progress (0-100)
   */
  getUploadProgress(): number {
    if (!this.currentUploadTask) return 0;
    
    const snapshot = this.currentUploadTask.snapshot;
    return (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
  setUploadState(uploadId: string, state: Partial<UploadState>): void {
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

  /**
   * Upload image with retry mechanism
   */
  async uploadImageWithRetry(
    uploadId: string,
    file: File,
    userId?: string,
    onProgress?: ProgressCallback,
    onError?: ErrorCallback,
    onSuccess?: SuccessCallback,
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: UploadError | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.setUploadState(uploadId, {
          retryCount: attempt - 1,
          maxRetries
        });

        return await this.uploadImageWithId(uploadId, file, userId, onProgress, onError, onSuccess);
      } catch (error) {
        lastError = isUploadError(error) ? 
          error : 
          UploadErrorHandler.handleFirebaseError(error instanceof Error ? error : { message: 'Unknown error' });

        // Don't retry for non-retryable errors
        if (!lastError.retryable || attempt === maxRetries) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = UploadErrorHandler.getRetryDelay(lastError.type, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      this.setUploadState(uploadId, {
        isUploading: false,
        error: lastError,
        success: false
      });
      onError?.(lastError.userMessage);
      throw lastError;
    }

    throw new Error('Upload failed after retries');
  }

  /**
   * Upload image with ID tracking for better state management
   */
  async uploadImageWithId(
    uploadId: string,
    file: File, 
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
        const error = UploadErrorHandler.handleValidationError(validation.error || 'Invalid file');
        this.setUploadState(uploadId, {
          isUploading: false,
          error,
          success: false
        });
        onError?.(error.userMessage);
        throw error;
      }

      // Process image for email optimization
      const processedFile = await this.processImageForEmail(file);

      // Create storage reference with proper folder structure
      const fileName = encodeURIComponent(`${Date.now()}_${processedFile.name}`);
      const folderPath = userId ? `email-images/${userId}` : 'email-images/anonymous';
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
            const uploadError = UploadErrorHandler.handleFirebaseError(error);
            this.setUploadState(uploadId, {
              isUploading: false,
              error: uploadError,
              success: false
            });
            onError?.(uploadError.userMessage);
            reject(uploadError);
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
              const uploadError = UploadErrorHandler.handleFirebaseError(error);
              this.setUploadState(uploadId, {
                isUploading: false,
                error: uploadError,
                success: false
              });
              onError?.(uploadError.userMessage);
              reject(uploadError);
            }
          }
        );
      });

    } catch (error) {
      const uploadError = isUploadError(error) ? 
        error : 
        UploadErrorHandler.handleFirebaseError(error);
      
      this.setUploadState(uploadId, {
        isUploading: false,
        error: uploadError,
        success: false
      });
      onError?.(uploadError.userMessage);
      throw uploadError;
    }
  }
}

/**
 * Default instance for easy importing
 */
export const emailImageUploadService = new EmailImageUploadService();

/**
 * Convenience function for simple uploads
 */
export const uploadEmailImage = async (
  file: File,
  userId?: string,
  onProgress?: ProgressCallback,
  onError?: ErrorCallback,
  onSuccess?: SuccessCallback
): Promise<string> => {
  return emailImageUploadService.uploadImage(file, userId, onProgress, onError, onSuccess);
};

/**
 * Convenience function for uploads with ID tracking
 */
export const uploadEmailImageWithId = async (
  uploadId: string,
  file: File,
  userId?: string,
  onProgress?: ProgressCallback,
  onError?: ErrorCallback,
  onSuccess?: SuccessCallback
): Promise<string> => {
  return emailImageUploadService.uploadImageWithId(uploadId, file, userId, onProgress, onError, onSuccess);
};