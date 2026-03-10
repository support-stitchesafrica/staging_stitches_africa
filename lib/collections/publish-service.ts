/**
 * Collection Publishing Service
 * 
 * Handles the complete publishing workflow for collections:
 * - Check for existing published collections
 * - Generate and upload preview images
 * - Update collection status in Firestore
 * - Unpublish previous collections
 * 
 * Requirements: 6.1, 6.3, 6.4, 6.5
 */

import { collectionRepository } from '@/lib/firestore';
import { uploadCollectionThumbnail, compressImage } from './storage-service';
import { ProductCollection } from '@/types/collections';

export interface PublishResult {
  success: boolean;
  message: string;
  previousPublished?: ProductCollection;
}

/**
 * Check if there's an existing published collection
 * 
 * @returns The currently published collection, or null if none exists
 */
export async function getExistingPublishedCollection(): Promise<ProductCollection | null> {
  try {
    return await collectionRepository.getPublishedCollection();
  } catch (error) {
    console.error('Error checking for published collection:', error);
    throw new Error('Failed to check for existing published collection');
  }
}

/**
 * Publish a collection
 * 
 * This function:
 * 1. Checks for existing published collection
 * 2. Generates and uploads preview image
 * 3. Unpublishes previous collection (if any)
 * 4. Publishes the new collection
 * 
 * @param collectionId - The ID of the collection to publish
 * @param previewBlob - The canvas preview image as a Blob
 * @returns PublishResult with success status and message
 */
export async function publishCollection(
  collectionId: string,
  previewBlob: Blob
): Promise<PublishResult> {
  try {
    // Step 1: Check for existing published collection
    const existingPublished = await getExistingPublishedCollection();

    // Step 2: Compress and upload preview image
    const compressedBlob = await compressImage(previewBlob, 1200, 800, 0.85);
    const thumbnailUrl = await uploadCollectionThumbnail(collectionId, compressedBlob);

    // Step 3: Update collection with thumbnail URL
    await collectionRepository.update(collectionId, {
      thumbnail: thumbnailUrl,
    });

    // Step 4: Publish the collection (this will automatically unpublish the previous one)
    await collectionRepository.publish(collectionId);

    return {
      success: true,
      message: existingPublished
        ? `Collection published successfully. Previous collection "${existingPublished.name}" has been unpublished.`
        : 'Collection published successfully!',
      previousPublished: existingPublished || undefined,
    };
  } catch (error) {
    console.error('Error publishing collection:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to publish collection',
    };
  }
}

/**
 * Unpublish a collection
 * 
 * @param collectionId - The ID of the collection to unpublish
 * @returns Success status
 */
export async function unpublishCollection(collectionId: string): Promise<boolean> {
  try {
    await collectionRepository.unpublish(collectionId);
    return true;
  } catch (error) {
    console.error('Error unpublishing collection:', error);
    throw new Error('Failed to unpublish collection');
  }
}

/**
 * Get publish status for a collection
 * 
 * @param collectionId - The ID of the collection
 * @returns Object with publish status information
 */
export async function getPublishStatus(collectionId: string): Promise<{
  isPublished: boolean;
  hasOtherPublished: boolean;
  otherPublishedCollection?: ProductCollection;
}> {
  try {
    const collection = await collectionRepository.getById(collectionId);
    const publishedCollection = await getExistingPublishedCollection();

    return {
      isPublished: collection?.published || false,
      hasOtherPublished: publishedCollection !== null && publishedCollection.id !== collectionId,
      otherPublishedCollection: publishedCollection && publishedCollection.id !== collectionId
        ? publishedCollection
        : undefined,
    };
  } catch (error) {
    console.error('Error getting publish status:', error);
    throw new Error('Failed to get publish status');
  }
}
