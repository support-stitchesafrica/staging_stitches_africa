import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"

export const uploadImages = async (files: File[], tailorId: string): Promise<string[]> => {
  const storage = getStorage()
  const urls: string[] = []

  for (const file of files) {
    const storageRef = ref(storage, `${tailorId}/products/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const url = await getDownloadURL(storageRef)
    urls.push(url)
  }

  return urls
}

