/**
 * Simple Image Upload Service for Waitlist Banners
 * Fallback service if MediaUploader doesn't work
 */

import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface ImageUploadOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (url: string) => void;
}

export class WaitlistImageUploadService {
  /**
   * Validate image file
   */
  static validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Invalid file type. Please upload JPG, PNG, or WebP images.'
      };
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File too large. Please upload images smaller than 10MB.'
      };
    }

    return { valid: true };
  }

  /**
   * Generate preview URL for image
   */
  static generatePreviewUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload image to Firebase Storage
   */
  static async uploadImage(
    file: File, 
    userId: string, 
    options: ImageUploadOptions = {}
  ): Promise<string> {
    const { onProgress, onError, onComplete } = options;

    try {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        const error = new Error(validation.error || 'Invalid file');
        if (onError) onError(error);
        throw error;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `waitlist-banners/${userId}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Start upload with progress tracking
      if (onProgress) onProgress(0);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      if (onProgress) onProgress(100);

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (onComplete) onComplete(downloadURL);

      return downloadURL;
    } catch (error) {
      const uploadError = error instanceof Error ? error : new Error('Upload failed');
      if (onError) onError(uploadError);
      throw uploadError;
    }
  }

  /**
   * Delete image from Firebase Storage
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract storage path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid storage URL');
      }

      const storagePath = decodeURIComponent(pathMatch[1]);
      const storageRef = ref(storage, storagePath);

      await deleteObject(storageRef);
      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      return false;
    }
  }

  /**
   * Upload with progress tracking (alternative method)
   */
  static uploadWithProgress(
    file: File,
    userId: string,
    onProgress: (progress: number) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        reject(new Error(validation.error || 'Invalid file'));
        return;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `waitlist-banners/${userId}/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Start upload
      onProgress(0);

      uploadBytes(storageRef, file)
        .then(async (snapshot) => {
          onProgress(100);
          const downloadURL = await getDownloadURL(snapshot.ref);
          resolve(downloadURL);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}