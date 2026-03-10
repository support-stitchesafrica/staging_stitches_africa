import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase";

/**
 * Type for processed image data with original, cleaned, and enhanced versions
 */
export interface ProcessedImageData {
  original: string;
  cleaned: string;
  enhanced: string;
  originalFile: File;
  cleanedFile: File;
  enhancedFile: File;
}

/**
 * Helper: Load image from URL
 * Used for: Comparison slider, canvas operations, image validation
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

/**
 * Helper: Convert File to base64 data URL
 */
function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Apply advanced image enhancement for sharp, professional results
 */
async function enhanceImageQuality(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));

        // Use original dimensions for maximum quality
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply subtle professional shadow for depth without blur
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Draw the image at full resolution
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Apply sharpening filter using image data manipulation
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const sharpened = applySharpeningFilter(imageData);
        ctx.putImageData(sharpened, 0, 0);

        // Convert to high-quality PNG
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Failed to create enhanced image blob"));
          const enhancedFile = new File([blob], `enhanced-${file.name}`, { 
            type: "image/png" 
          });
          resolve(enhancedFile);
        }, "image/png", 1.0); // Maximum quality
      };

      img.onerror = () => reject(new Error("Image load error"));
    };

    reader.onerror = () => reject(new Error("File read error"));
  });
}

/**
 * Apply sharpening filter to image data for crisp results
 */
function applySharpeningFilter(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  const output = new ImageData(width, height);
  const outputData = output.data;

  // Sharpening kernel (unsharp mask)
  const kernel = [
    0, -0.25, 0,
    -0.25, 2, -0.25,
    0, -0.25, 0
  ];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIdx = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            sum += data[pixelIdx] * kernel[kernelIdx];
          }
        }
        
        // Clamp values to valid range
        outputData[idx + c] = Math.max(0, Math.min(255, sum));
      }
      
      // Preserve alpha channel
      outputData[idx + 3] = data[idx + 3];
    }
  }

  // Copy edge pixels without modification
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        const idx = (y * width + x) * 4;
        for (let c = 0; c < 4; c++) {
          outputData[idx + c] = data[idx + c];
        }
      }
    }
  }

  return output;
}

/**
 * Process image with AI background removal + 3D enhancement
 * API handles premium -> free tier fallback automatically
 */
async function processImage(file: File): Promise<ProcessedImageData> {
  try {
    // Load original image
    const originalDataUrl = await fileToDataURL(file);

    // Step 1: Call API for background removal
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/remove-bg', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Background removal failed: ${response.statusText}`);
    }

    // Get processed image blob
    const imageBlob = await response.blob();

    // Create file from blob
    const cleanedFile = new File([imageBlob], `bg-removed-${file.name}.png`, {
      type: "image/png",
    });

    // Create data URL for preview
    const cleanedDataUrl = await fileToDataURL(cleanedFile);

    // Step 2: Apply quality enhancement and product-specific improvements
    const qualityEnhanced = await enhanceImageQuality(cleanedFile);
    const enhancedFile = await applyProductEnhancements(qualityEnhanced);
    const enhancedDataUrl = await fileToDataURL(enhancedFile);

    return {
      original: originalDataUrl,
      cleaned: cleanedDataUrl,
      enhanced: enhancedDataUrl,
      originalFile: file,
      cleanedFile,
      enhancedFile,
    };
  } catch (error) {
    console.error("Image processing failed:", error);

    // Fallback: return original image for all versions
    const originalDataUrl = await fileToDataURL(file);
    return {
      original: originalDataUrl,
      cleaned: originalDataUrl,
      enhanced: originalDataUrl,
      originalFile: file,
      cleanedFile: file,
      enhancedFile: file,
    };
  }
}

/**
 * Process images with background removal
 * Returns processed image data for preview before upload
 */
export const processImagesForPreview = async (
  files: File[]
): Promise<ProcessedImageData[]> => {
  const processedImages: ProcessedImageData[] = [];

  for (const file of files) {
    const processed = await processImage(file);
    processedImages.push(processed);
  }

  return processedImages;
};

/**
 * Upload processed images to Firebase Storage
 * @param processedImages - Array of processed image data
 * @param tailorId - Tailor's unique ID
 * @param imageChoices - User's choice per image: 'original' or 'processed'
 */
export const uploadProcessedImages = async (
  processedImages: ProcessedImageData[],
  tailorId: string,
  imageChoices?: Record<number, 'original' | 'processed'>
): Promise<string[]> => {
  const uploadPromises = processedImages.map(async (processed, index) => {
    // Determine which file to upload based on user's choice
    const choice = imageChoices?.[index] || 'processed';
    const fileToUpload = choice === 'original' ? processed.originalFile : processed.enhancedFile;

    const fileName = encodeURIComponent(`${Date.now()}_${fileToUpload.name}`);
    const storageRef = ref(storage, `${tailorId}/products/${fileName}`);

    await uploadBytes(storageRef, fileToUpload);

    return getDownloadURL(storageRef);
  });

  return Promise.all(uploadPromises);
};

/**
 * Legacy function for backward compatibility
 */
export const uploadImages = async (
  files: File[],
  tailorId: string
): Promise<string[]> => {
  const processed = await processImagesForPreview(files);
  return uploadProcessedImages(processed, tailorId);
};

/**
 * Add white background to transparent PNG with enhanced quality
 */
export async function addWhiteBackground(
  transparentImageBlob: Blob
): Promise<Blob> {
  const img = await loadImage(URL.createObjectURL(transparentImageBlob));
  
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("No canvas context");

  // Use original dimensions for maximum quality
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  // Enable high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Paint clean white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add professional subtle shadow for depth
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // Draw image at full resolution
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  ctx.restore();

  URL.revokeObjectURL(img.src);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject("Failed to create blob");
        resolve(blob);
      },
      "image/png",
      1.0 // Maximum quality
    );
  });
}

/**
 * Apply professional product image enhancements
 */
async function applyProductEnhancements(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("No canvas context"));

        // Use original dimensions for maximum quality
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the original image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Apply brightness and contrast adjustments for product photos
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const enhanced = enhanceProductImage(imageData);
        ctx.putImageData(enhanced, 0, 0);

        // Convert to high-quality PNG
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Failed to create enhanced product image"));
          const enhancedFile = new File([blob], `product-enhanced-${file.name}`, { 
            type: "image/png" 
          });
          resolve(enhancedFile);
        }, "image/png", 1.0);
      };

      img.onerror = () => reject(new Error("Image load error"));
    };

    reader.onerror = () => reject(new Error("File read error"));
  });
}

/**
 * Enhance product image with brightness, contrast, and clarity
 */
function enhanceProductImage(imageData: ImageData): ImageData {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  // Enhancement parameters for product photos
  const brightness = 1.05; // Slight brightness boost
  const contrast = 1.1;    // Slight contrast boost
  const saturation = 1.05; // Slight saturation boost

  for (let i = 0; i < data.length; i += 4) {
    // Skip transparent pixels
    if (data[i + 3] === 0) continue;

    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    r *= brightness;
    g *= brightness;
    b *= brightness;

    // Apply contrast
    r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
    g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
    b = ((b / 255 - 0.5) * contrast + 0.5) * 255;

    // Apply saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + saturation * (r - gray);
    g = gray + saturation * (g - gray);
    b = gray + saturation * (b - gray);

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  return imageData;
}

// Export loadImage for external use (e.g., comparison slider)
export { loadImage };