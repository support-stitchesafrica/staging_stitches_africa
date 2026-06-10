/**
 * Client-only: convert blob: previews to data:image URLs for the dimensions API.
 */
import { isVisionImageUrl } from "@/lib/ai/vision-image-urls";

const MAX_IMAGES = 3;

async function blobUrlToDataUrl(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image as data URL"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader error"));
    reader.readAsDataURL(blob);
  });
}

/**
 * Normalizes product images for POST /api/ai/dimensions (OpenAI vision).
 */
export async function prepareImagesForDimensionAnalysis(
  sources: string[]
): Promise<string[]> {
  const prepared: string[] = [];

  for (const url of sources.slice(0, MAX_IMAGES)) {
    if (!url || typeof url !== "string") continue;

    if (isVisionImageUrl(url)) {
      prepared.push(url);
      continue;
    }

    if (url.startsWith("blob:")) {
      try {
        const dataUrl = await blobUrlToDataUrl(url);
        prepared.push(dataUrl);
      } catch (error) {
        console.warn("[dimensions] Could not read blob image for AI:", error);
      }
    }
  }

  return prepared;
}
