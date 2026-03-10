import { doc, updateDoc, getDoc } from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/firebase";
import { PromotionalBanner } from "@/types/promotionals";
import { Timestamp } from "firebase/firestore";

/**
 * Banner data for creating/updating promotional banners
 */
export interface BannerData {
  title?: string;
  description?: string;
  displayPercentage?: number;
}

/**
 * Allowed image MIME types for banner uploads
 */
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/**
 * Maximum file size for banner images (5MB)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Service for managing promotional banner images and metadata
 */
export class BannerService {
  /**
   * Validates banner image file
   * @param file - File to validate
   * @throws Error if file is invalid
   */
  private static validateBannerFile(file: File): void {
    // Check file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
      );
    }
  }

  /**
   * Uploads a banner image to Firebase Storage
   * @param eventId - ID of the promotional event
   * @param file - Image file to upload
   * @returns Promise resolving to the download URL of the uploaded image
   */
  static async uploadBannerImage(
    eventId: string,
    file: File
  ): Promise<string> {
    try {
      // Validate the file
      this.validateBannerFile(file);

      // Get file extension
      const fileExtension = file.name.split(".").pop() || "jpg";

      // Create storage reference
      const storageRef = ref(
        storage,
        `promotionalBanners/${eventId}/banner.${fileExtension}`
      );

      // Upload file
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
      });

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error("Error uploading banner image:", error);
      throw new Error(
        `Failed to upload banner image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Deletes a banner image from Firebase Storage
   * @param eventId - ID of the promotional event
   */
  static async deleteBannerImage(eventId: string): Promise<void> {
    try {
      // Try to delete all possible file extensions
      const extensions = ["jpg", "jpeg", "png", "webp"];

      for (const ext of extensions) {
        try {
          const storageRef = ref(
            storage,
            `promotionalBanners/${eventId}/banner.${ext}`
          );
          await deleteObject(storageRef);
          console.log(`Deleted banner image with extension: ${ext}`);
          break; // Exit loop if deletion successful
        } catch (error: any) {
          // If file doesn't exist, continue to next extension
          if (error.code !== "storage/object-not-found") {
            throw error;
          }
        }
      }
    } catch (error) {
      console.error("Error deleting banner image:", error);
      throw new Error(
        `Failed to delete banner image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Updates banner metadata in Firestore
   * @param eventId - ID of the promotional event
   * @param bannerData - Banner metadata to update
   */
  static async updateBanner(
    eventId: string,
    bannerData: BannerData & { imageUrl: string }
  ): Promise<void> {
    try {
      const eventRef = doc(db, "promotionalEvents", eventId);
      
      // Check if the document exists before updating
      const eventDoc = await getDoc(eventRef);
      if (!eventDoc.exists()) {
        throw new Error(`No document to update: ${eventRef.path}`);
      }

      const banner: PromotionalBanner = {
        imageUrl: bannerData.imageUrl,
        title: bannerData.title,
        description: bannerData.description,
        displayPercentage: bannerData.displayPercentage,
        uploadedAt: Timestamp.now(),
      };

      await updateDoc(eventRef, {
        banner,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error updating banner metadata:", error);
      throw new Error(
        `Failed to update banner metadata: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Gets banner data for a promotional event
   * @param eventId - ID of the promotional event
   * @returns Promise resolving to banner data or null if not found
   */
  static async getBanner(eventId: string): Promise<PromotionalBanner | null> {
    try {
      const eventRef = doc(db, "promotionalEvents", eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        throw new Error("Promotional event not found");
      }

      const eventData = eventDoc.data();
      return eventData.banner || null;
    } catch (error) {
      console.error("Error getting banner:", error);
      throw new Error(
        `Failed to get banner: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Uploads banner image and updates metadata in a single operation
   * @param eventId - ID of the promotional event
   * @param file - Image file to upload
   * @param bannerData - Banner metadata
   * @returns Promise resolving to the download URL
   */
  static async uploadAndUpdateBanner(
    eventId: string,
    file: File,
    bannerData: BannerData
  ): Promise<string> {
    try {
      // Upload image first
      const imageUrl = await this.uploadBannerImage(eventId, file);

      // Update banner metadata
      await this.updateBanner(eventId, {
        ...bannerData,
        imageUrl,
      });

      return imageUrl;
    } catch (error) {
      console.error("Error uploading and updating banner:", error);
      throw new Error(
        `Failed to upload and update banner: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Removes banner from promotional event
   * @param eventId - ID of the promotional event
   */
  static async removeBanner(eventId: string): Promise<void> {
    try {
      // Delete image from storage
      await this.deleteBannerImage(eventId);

      // Remove banner metadata from Firestore
      const eventRef = doc(db, "promotionalEvents", eventId);
      await updateDoc(eventRef, {
        banner: null,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error removing banner:", error);
      throw new Error(
        `Failed to remove banner: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
