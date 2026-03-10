/**
 * Collection Storage Service
 * 
 * Handles uploading and managing collection images in Firebase Storage.
 * Requirements: 6.2
 */

import { storage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Upload collection thumbnail to Firebase Storage
 * 
 * @param collectionId - The ID of the collection
 * @param blob - The image blob to upload
 * @param filename - Optional filename (defaults to 'thumbnail.png')
 * @returns Download URL of the uploaded image
 */
export async function uploadCollectionThumbnail(
  collectionId: string,
  blob: Blob,
  filename: string = 'thumbnail.png'
): Promise<string> {
  try {
    // Create storage reference
    const storageRef = ref(storage, `collections/${collectionId}/${filename}`);

    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/png',
    });

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading collection thumbnail:', error);
    throw new Error('Failed to upload collection thumbnail');
  }
}

/**
 * Upload canvas export image to Firebase Storage
 * 
 * @param collectionId - The ID of the collection
 * @param blob - The image blob to upload
 * @returns Download URL of the uploaded image
 */
export async function uploadCanvasExport(
  collectionId: string,
  blob: Blob
): Promise<string> {
  return uploadCollectionThumbnail(collectionId, blob, 'canvas-export.png');
}

/**
 * Delete collection images from Firebase Storage
 * 
 * @param collectionId - The ID of the collection
 */
export async function deleteCollectionImages(collectionId: string): Promise<void> {
  try {
    // Delete thumbnail
    const thumbnailRef = ref(storage, `collections/${collectionId}/thumbnail.png`);
    await deleteObject(thumbnailRef).catch(() => {
      // Ignore error if file doesn't exist
    });

    // Delete canvas export
    const exportRef = ref(storage, `collections/${collectionId}/canvas-export.png`);
    await deleteObject(exportRef).catch(() => {
      // Ignore error if file doesn't exist
    });
  } catch (error) {
    console.error('Error deleting collection images:', error);
    // Don't throw error, as this is a cleanup operation
  }
}

/**
 * Compress image blob for optimal storage
 * 
 * @param blob - The image blob to compress
 * @param maxWidth - Maximum width (default: 1200)
 * @param maxHeight - Maximum height (default: 800)
 * @param quality - JPEG quality (default: 0.8)
 * @returns Compressed image blob
 */
export async function compressImage(
  blob: Blob,
  maxWidth: number = 1200,
  maxHeight: number = 800,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      // Create canvas for compression
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
