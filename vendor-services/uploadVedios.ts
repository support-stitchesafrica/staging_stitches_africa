import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase";

/**
 * Upload multiple video files to Firebase Storage
 */
export const uploadVideos = async (
  files: File[],
  tailorId: string
): Promise<string[]> => {
  const uploadPromises = files.map(async (file) => {
    // Safe filename
    const fileName = encodeURIComponent(`${Date.now()}_${file.name}`);
    const storageRef = ref(storage, `${tailorId}/videos/${fileName}`);

    // Upload video
    await uploadBytes(storageRef, file); // You can add metadata here if needed

    // Get download URL
    return getDownloadURL(storageRef);
  });

  return Promise.all(uploadPromises);
};
