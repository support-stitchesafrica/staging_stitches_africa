import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Call remove.bg API to remove background
 */
async function removeBackground(file: File): Promise<File> {
  const formData = new FormData();
  formData.append("image_file", file);
  formData.append("size", "auto");

  const res = await fetch("https://api.remove.bg/v1.0/removebg", {
    method: "POST",
    headers: {
      "X-Api-Key": process.env.NEXT_PUBLIC_REMOVEBG_API_KEY || "",
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Background removal failed");
  const blob = await res.blob();
  return new File([blob], `bg-removed-${file.name}`, { type: "image/png" });
}

/**
 * Apply 3D shadow / perspective effect
 */
async function processImageTo3D(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("No canvas context");

        canvas.width = img.width;
        canvas.height = img.height;

        // Background fill
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply 3D shadow effect
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 25;
        ctx.shadowOffsetX = 20;
        ctx.shadowOffsetY = 20;
        ctx.setTransform(1, 0.1, -0.1, 1, 0, 0);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        canvas.toBlob((blob) => {
          if (!blob) return reject("Failed to create 3D image blob");
          const cleanedFile = new File([blob], `3d-${file.name}`, { type: "image/png" });
          resolve(cleanedFile);
        }, "image/png");
      };

      img.onerror = () => reject("Image load error");
    };

    reader.onerror = () => reject("File read error");
  });
}

/**
 * Upload image (with bg removal + 3D effect)
 */
export const uploadImageService = async (file: File, tailorId: string): Promise<string> => {
  try {
    // 1️⃣ Remove background
    const bgRemoved = await removeBackground(file);

    // 2️⃣ Apply 3D shadow/perspective
    const processedFile = await processImageTo3D(bgRemoved);

    // 3️⃣ Upload to Firebase
    const fileName = encodeURIComponent(`${Date.now()}_${processedFile.name}`);
    const storageRef = ref(storage, `${tailorId}/users/${fileName}`);

    await uploadBytes(storageRef, processedFile);
    return await getDownloadURL(storageRef);
  } catch (error: any) {
    console.error("Firebase upload failed:", error);
    throw new Error(error.message || "Failed to upload image.");
  }
};
