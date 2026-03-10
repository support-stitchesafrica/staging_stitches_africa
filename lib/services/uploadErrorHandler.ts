/**
 * Upload error types for better error categorization
 */
export enum UploadErrorType {
  VALIDATION_ERROR = 'validation_error',
  NETWORK_ERROR = 'network_error',
  STORAGE_ERROR = 'storage_error',
  PROCESSING_ERROR = 'processing_error',
  PERMISSION_ERROR = 'permission_error',
  QUOTA_ERROR = 'quota_error',
  UNKNOWN_ERROR = 'unknown_error'
}

/**
 * Upload error interface with detailed information
 */
export interface UploadError {
  type: UploadErrorType
  message: string
  userMessage: string
  retryable: boolean
  code?: string
  details?: any
}

/**
 * Error handler class for upload operations
 */
export class UploadErrorHandler {
  /**
   * Convert Firebase storage error to structured upload error
   */
  static handleFirebaseError(error: any): UploadError {
    const code = error.code || error.message || 'unknown'
    
    switch (code) {
      case 'storage/unauthorized':
        return {
          type: UploadErrorType.PERMISSION_ERROR,
          message: 'User does not have permission to upload images',
          userMessage: 'You do not have permission to upload images. Please check your account settings.',
          retryable: false,
          code
        }

      case 'storage/canceled':
        return {
          type: UploadErrorType.NETWORK_ERROR,
          message: 'Upload was cancelled by user',
          userMessage: 'Upload was cancelled.',
          retryable: true,
          code
        }

      case 'storage/quota-exceeded':
        return {
          type: UploadErrorType.QUOTA_ERROR,
          message: 'Storage quota exceeded',
          userMessage: 'Storage limit exceeded. Please free up space or upgrade your plan.',
          retryable: false,
          code
        }

      case 'storage/invalid-format':
        return {
          type: UploadErrorType.VALIDATION_ERROR,
          message: 'Invalid image format',
          userMessage: 'Invalid image format. Please select a JPEG, PNG, GIF, or WebP image.',
          retryable: false,
          code
        }

      case 'storage/invalid-argument':
        return {
          type: UploadErrorType.VALIDATION_ERROR,
          message: 'Invalid upload parameters',
          userMessage: 'Invalid upload parameters. Please try again.',
          retryable: true,
          code
        }

      case 'storage/retry-limit-exceeded':
        return {
          type: UploadErrorType.NETWORK_ERROR,
          message: 'Upload failed after multiple retries',
          userMessage: 'Upload failed after multiple attempts. Please check your connection and try again.',
          retryable: true,
          code
        }

      case 'storage/server-file-wrong-size':
        return {
          type: UploadErrorType.VALIDATION_ERROR,
          message: 'File size mismatch during upload',
          userMessage: 'File upload failed due to size mismatch. Please try again.',
          retryable: true,
          code
        }

      case 'storage/unknown':
      default:
        // Check if it's a network-related error
        if (error.message?.includes('network') || error.message?.includes('connection')) {
          return {
            type: UploadErrorType.NETWORK_ERROR,
            message: 'Network connection error during upload',
            userMessage: 'Network connection error. Please check your internet connection and try again.',
            retryable: true,
            code
          }
        }

        return {
          type: UploadErrorType.UNKNOWN_ERROR,
          message: error.message || 'Unknown error occurred during upload',
          userMessage: 'An unexpected error occurred. Please try again.',
          retryable: true,
          code
        }
    }
  }

  /**
   * Handle file validation errors
   */
  static handleValidationError(message: string): UploadError {
    return {
      type: UploadErrorType.VALIDATION_ERROR,
      message,
      userMessage: message,
      retryable: false
    }
  }

  /**
   * Handle image processing errors
   */
  static handleProcessingError(error: any): UploadError {
    return {
      type: UploadErrorType.PROCESSING_ERROR,
      message: error.message || 'Image processing failed',
      userMessage: 'Failed to process image. Please try a different image or check the file format.',
      retryable: true,
      details: error
    }
  }

  /**
   * Get retry delay based on error type (in milliseconds)
   */
  static getRetryDelay(errorType: UploadErrorType, attemptNumber: number): number {
    const baseDelay = 1000 // 1 second base delay
    
    switch (errorType) {
      case UploadErrorType.NETWORK_ERROR:
        // Exponential backoff for network errors
        return baseDelay * Math.pow(2, attemptNumber - 1)
      
      case UploadErrorType.STORAGE_ERROR:
        // Linear backoff for storage errors
        return baseDelay * attemptNumber
      
      case UploadErrorType.PROCESSING_ERROR:
        // Fixed delay for processing errors
        return baseDelay
      
      default:
        return baseDelay
    }
  }

  /**
   * Get maximum retry attempts based on error type
   */
  static getMaxRetries(errorType: UploadErrorType): number {
    switch (errorType) {
      case UploadErrorType.NETWORK_ERROR:
        return 3
      
      case UploadErrorType.STORAGE_ERROR:
      case UploadErrorType.PROCESSING_ERROR:
        return 2
      
      case UploadErrorType.VALIDATION_ERROR:
      case UploadErrorType.PERMISSION_ERROR:
      case UploadErrorType.QUOTA_ERROR:
        return 0 // No retries for these errors
      
      default:
        return 1
    }
  }

  /**
   * Get user-friendly error message with action suggestions
   */
  static getErrorMessageWithActions(error: UploadError): {
    message: string
    actions: string[]
  } {
    const actions: string[] = []

    switch (error.type) {
      case UploadErrorType.NETWORK_ERROR:
        actions.push('Check your internet connection')
        actions.push('Try again in a few moments')
        break

      case UploadErrorType.VALIDATION_ERROR:
        actions.push('Check the file format (JPEG, PNG, GIF, WebP)')
        actions.push('Ensure file size is under 10MB')
        actions.push('Try a different image')
        break

      case UploadErrorType.PROCESSING_ERROR:
        actions.push('Try a different image')
        actions.push('Check if the image file is corrupted')
        break

      case UploadErrorType.PERMISSION_ERROR:
        actions.push('Check your account permissions')
        actions.push('Contact support if the issue persists')
        break

      case UploadErrorType.QUOTA_ERROR:
        actions.push('Free up storage space')
        actions.push('Upgrade your storage plan')
        break

      default:
        actions.push('Try again')
        actions.push('Contact support if the issue persists')
    }

    return {
      message: error.userMessage,
      actions
    }
  }
}