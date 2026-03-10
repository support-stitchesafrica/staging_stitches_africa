/**
 * Collection Product Service
 * 
 * Handles CRUD operations for custom collection products and image uploads.
 * Requirements: 1.4, 3.2, 3.3, 3.7, 4.2
 */

import { db, storage } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { CollectionProduct, CollectionProductData } from '@/types/collections';

/**
 * Create multiple collection products in a batch operation
 * 
 * @param products - Array of product data to create
 * @param userId - User ID creating the products
 * @returns Array of created product IDs
 */
export async function createProducts(
  products: Omit<CollectionProductData, 'createdBy' | 'createdAt' | 'updatedAt'>[],
  userId: string
): Promise<string[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    if (!products || products.length === 0) {
      throw new Error('At least one product is required');
    }

    const batch = writeBatch(db);
    const productIds: string[] = [];
    const now = Timestamp.now();

    for (const product of products) {
      // Validate required fields
      if (!product.title || !product.description || !product.price) {
        throw new Error('Missing required product fields');
      }

      // Create new document reference
      const productRef = doc(collection(db, 'staging_collectionProducts'));
      productIds.push(productRef.id);

      // Prepare product data
      const productData: CollectionProductData = {
        ...product,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      };

      batch.set(productRef, productData);
    }

    // Commit batch
    await batch.commit();

    return productIds;
  } catch (error) {
    console.error('Error creating products:', error);
    throw new Error('Failed to create products');
  }
}

/**
 * Get a single collection product by ID
 * 
 * @param productId - Product ID to fetch
 * @returns Collection product or null if not found
 */
export async function getProductById(productId: string): Promise<CollectionProduct | null> {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const productRef = doc(db, 'staging_collectionProducts', productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return null;
    }

    const data = productDoc.data();
    return {
      id: productDoc.id,
      title: data.title,
      description: data.description,
      quantity: data.quantity,
      size: data.size,
      color: data.color,
      price: data.price,
      enableMultiplePricing: data.enableMultiplePricing,
      individualItems: data.individualItems,
      brandName: data.brandName,
      images: data.images || [],
      owner: data.owner || { name: '', email: '', phoneNumber: '' },
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }
}

/**
 * Get all collection products created by a specific user
 * 
 * @param userId - User ID to fetch products for
 * @returns Array of collection products
 */
export async function getUserProducts(userId: string): Promise<CollectionProduct[]> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const productsRef = collection(db, 'staging_collectionProducts');
    const q = query(
      productsRef,
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const products: CollectionProduct[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      products.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        quantity: data.quantity,
        size: data.size,
        color: data.color,
        price: data.price,
        enableMultiplePricing: data.enableMultiplePricing,
        individualItems: data.individualItems,
        brandName: data.brandName,
        images: data.images || [],
        owner: data.owner || { name: '', email: '', phoneNumber: '' },
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });

    return products;
  } catch (error: any) {
    console.error('Error fetching user products:', error);
    
    // Provide more specific error messages
    if (error?.code === 'permission-denied') {
      throw new Error('Insufficient permissions to access your products. Please contact support.');
    } else if (error?.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please try again later.');
    } else if (error?.message?.includes('network')) {
      throw new Error('Network connection error. Please check your internet connection.');
    }
    
    throw new Error('Failed to fetch user products');
  }
}

/**
 * Update an existing collection product
 * 
 * @param productId - Product ID to update
 * @param updates - Partial product data to update
 */
export async function updateProduct(
  productId: string,
  updates: Partial<Omit<CollectionProductData, 'createdBy' | 'createdAt'>>
): Promise<void> {
  try {
    if (!productId) {
      throw new Error('Product ID is required');
    }

    const productRef = doc(db, 'staging_collectionProducts', productId);
    
    // Check if product exists
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }

    // Update product with timestamp
    await updateDoc(productRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating product:', error);
    throw new Error('Failed to update product');
  }
}

/**
 * Delete a collection product and its associated images
 * 
 * @param productId - Product ID to delete
 * @param userId - User ID (for verification)
 */
export async function deleteProduct(productId: string, userId: string): Promise<void> {
  try {
    if (!productId || !userId) {
      throw new Error('Product ID and User ID are required');
    }

    const productRef = doc(db, 'staging_collectionProducts', productId);
    
    // Get product to verify ownership and get image URLs
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      throw new Error('Product not found');
    }

    const productData = productDoc.data();
    
    // Verify ownership
    if (productData.createdBy !== userId) {
      throw new Error('Unauthorized to delete this product');
    }

    // Delete all images from storage
    await deleteProductImages(userId, productId);

    // Delete product document
    await deleteDoc(productRef);
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new Error('Failed to delete product');
  }
}

/**
 * Upload product images to Firebase Storage with progress tracking
 * Uses parallel uploads with concurrency limit for optimal performance
 * 
 * @param files - Array of image files to upload
 * @param userId - User ID (for storage path)
 * @param productId - Product ID (for storage path)
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Array of download URLs
 */
export async function uploadProductImages(
  files: File[],
  userId: string,
  productId: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    if (!userId || !productId) {
      throw new Error('User ID and Product ID are required');
    }

    // Validate files
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of files) {
      if (file.size > maxSize) {
        throw new Error(`File ${file.name} exceeds 5MB limit`);
      }
      if (!allowedFormats.includes(file.type)) {
        throw new Error(`File ${file.name} has invalid format. Only JPEG, PNG, and WebP are allowed`);
      }
    }

    // Upload files in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 3; // Upload max 3 files at a time
    const downloadUrls: string[] = new Array(files.length);
    let completedUploads = 0;

    // Process uploads in batches
    for (let i = 0; i < files.length; i += CONCURRENCY_LIMIT) {
      const batch = files.slice(i, i + CONCURRENCY_LIMIT);
      const batchPromises = batch.map(async (file, batchIndex) => {
        const fileIndex = i + batchIndex;
        
        // Compress image before upload
        const compressedBlob = await compressProductImage(file);
        
        // Create storage reference
        const timestamp = Date.now();
        const filename = `image-${timestamp}-${fileIndex}.${getFileExtension(file.name)}`;
        const storageRef = ref(
          storage,
          `collectionProducts/${userId}/${productId}/${filename}`
        );

        // Upload file
        const snapshot = await uploadBytes(storageRef, compressedBlob, {
          contentType: file.type,
        });

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);
        downloadUrls[fileIndex] = downloadURL;

        // Update progress
        completedUploads++;
        if (onProgress) {
          const progress = Math.round((completedUploads / files.length) * 100);
          onProgress(progress);
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);
    }

    return downloadUrls;
  } catch (error) {
    console.error('Error uploading product images:', error);
    throw error;
  }
}

/**
 * Delete all images for a product from Firebase Storage
 * 
 * @param userId - User ID
 * @param productId - Product ID
 */
async function deleteProductImages(userId: string, productId: string): Promise<void> {
  try {
    const folderRef = ref(storage, `collectionProducts/${userId}/${productId}`);
    
    // List all files in the folder
    const listResult = await listAll(folderRef);
    
    // Delete each file
    const deletePromises = listResult.items.map((itemRef) => 
      deleteObject(itemRef).catch(() => {
        // Ignore errors if file doesn't exist
      })
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting product images:', error);
    // Don't throw error, as this is a cleanup operation
  }
}

/**
 * Compress product image for optimal storage
 * 
 * @param file - Image file to compress
 * @param maxWidth - Maximum width (default: 1200)
 * @param maxHeight - Maximum height (default: 1200)
 * @param quality - JPEG quality (default: 0.85)
 * @returns Compressed image blob
 */
async function compressProductImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
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
        file.type === 'image/png' ? 'image/png' : 'image/jpeg',
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

/**
 * Get file extension from filename
 * 
 * @param filename - Filename to extract extension from
 * @returns File extension (e.g., 'jpg', 'png')
 */
function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : 'jpg';
}
