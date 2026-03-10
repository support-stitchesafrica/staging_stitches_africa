/**
 * Example usage of the EmailImageUploadService
 * This demonstrates how to integrate the service with the email builder
 */

import { emailImageUploadService, uploadEmailImage } from './emailImageUpload';

// Example 1: Basic usage with callbacks
export const handleImageUpload = async (file: File, userId?: string) => {
  try {
    const imageUrl = await uploadEmailImage(
      file,
      userId,
      // Progress callback
      (progress) => {
        console.log(`Upload progress: ${progress.toFixed(1)}%`);
        // Update UI progress indicator
      },
      // Error callback
      (error) => {
        console.error('Upload error:', error);
        // Show error message to user
      },
      // Success callback
      (url) => {
        console.log('Upload successful:', url);
        // Update image block with new URL
      }
    );

    return imageUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

// Example 2: Integration with email builder updateBlock function
export const uploadAndUpdateImageBlock = async (
  file: File,
  blockId: string,
  updateBlock: (id: string, updates: any) => void,
  userId?: string
) => {
  // Set loading state
  updateBlock(blockId, { 
    uploadMetadata: { 
      isUploading: true, 
      progress: 0 
    } 
  });

  try {
    const imageUrl = await emailImageUploadService.uploadImage(
      file,
      userId,
      // Progress callback
      (progress) => {
        updateBlock(blockId, { 
          uploadMetadata: { 
            isUploading: true, 
            progress 
          } 
        });
      },
      // Error callback
      (error) => {
        updateBlock(blockId, { 
          uploadMetadata: { 
            isUploading: false, 
            error 
          } 
        });
      },
      // Success callback
      (url) => {
        updateBlock(blockId, { 
          content: url,
          uploadMetadata: { 
            isUploading: false, 
            originalFileName: file.name,
            uploadedAt: new Date(),
            fileSize: file.size
          } 
        });
      }
    );

    return imageUrl;
  } catch (error) {
    updateBlock(blockId, { 
      uploadMetadata: { 
        isUploading: false, 
        error: error instanceof Error ? error.message : 'Upload failed'
      } 
    });
    throw error;
  }
};

// Example 3: Drag and drop integration
export const handleImageDrop = async (
  event: DragEvent,
  blockId: string,
  updateBlock: (id: string, updates: any) => void,
  userId?: string
) => {
  event.preventDefault();
  
  const files = Array.from(event.dataTransfer?.files || []);
  const imageFile = files.find(file => file.type.startsWith('image/'));
  
  if (!imageFile) {
    console.error('No image file found in drop');
    return;
  }

  // Validate file before upload
  const validation = emailImageUploadService.validateImageFile(imageFile);
  if (!validation.valid) {
    updateBlock(blockId, { 
      uploadMetadata: { 
        error: validation.error 
      } 
    });
    return;
  }

  await uploadAndUpdateImageBlock(imageFile, blockId, updateBlock, userId);
};

// Example 4: File input integration
export const handleFileInputChange = async (
  event: React.ChangeEvent<HTMLInputElement>,
  blockId: string,
  updateBlock: (id: string, updates: any) => void,
  userId?: string
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  await uploadAndUpdateImageBlock(file, blockId, updateBlock, userId);
  
  // Clear the input so the same file can be selected again
  event.target.value = '';
};

// Example 5: Cancel upload
export const handleCancelUpload = (blockId: string, updateBlock: (id: string, updates: any) => void) => {
  emailImageUploadService.cancelUpload();
  updateBlock(blockId, { 
    uploadMetadata: { 
      isUploading: false, 
      error: 'Upload cancelled' 
    } 
  });
};