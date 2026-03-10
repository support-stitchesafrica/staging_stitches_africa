import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "../firebase"
import type { NewsArticle, CreateNewsArticle } from "@/types/news"

const NEWS_COLLECTION = "staging_news"

export class NewsService {
  // Get all news articles
  static async getAllNews(): Promise<NewsArticle[]> {
    const newsQuery = query(collection(db, NEWS_COLLECTION))
    const snapshot = await getDocs(newsQuery)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        updatedAt: data.updatedAt?.toDate?.() || null,
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as NewsArticle
    })
  }

  // Get published news articles only (no index needed, sorted locally)
  static async getPublishedNews(): Promise<NewsArticle[]> {
    try {
      // Only filter on published
      const newsQuery = query(
        collection(db, NEWS_COLLECTION),
        where("published", "==", true)
      )

      const snapshot = await getDocs(newsQuery)
      const articles = snapshot.docs.map((docSnap) => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || null,
          updatedAt: data.updatedAt?.toDate?.() || null,
          publishedAt: data.publishedAt?.toDate?.() || null,
        } as NewsArticle
      })

      // Sort locally by publishedAt DESC
      return articles.sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    } catch (error) {
      console.error("Error fetching published news:", error)
      return []
    }
  }

  // Get news article by ID
  static async getNewsById(id: string): Promise<NewsArticle | null> {
    const docRef = doc(db, NEWS_COLLECTION, id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
        updatedAt: data.updatedAt?.toDate?.() || null,
        publishedAt: data.publishedAt?.toDate?.() || null,
      } as NewsArticle
    }
    return null
  }

  // Create new news article
  static async createNews(newsData: CreateNewsArticle): Promise<string> {
    const now = Timestamp.now()
    const docRef = await addDoc(collection(db, NEWS_COLLECTION), {
      ...newsData,
      createdAt: now,
      updatedAt: now,
      publishedAt: newsData.published ? now : null,
    })
    return docRef.id
  }

  // Update news article
  static async updateNews(id: string, newsData: Partial<CreateNewsArticle>): Promise<void> {
    const docRef = doc(db, NEWS_COLLECTION, id)
    const updateData: any = {
      ...newsData,
      updatedAt: Timestamp.now(),
    }

    if (newsData.published !== undefined) {
      updateData.publishedAt = newsData.published ? Timestamp.now() : null
    }

    await updateDoc(docRef, updateData)
  }

  // Delete news article
  static async deleteNews(id: string): Promise<void> {
    const docRef = doc(db, NEWS_COLLECTION, id)
    await deleteDoc(docRef)
  }

  // Upload image
  static async uploadImage(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, `news/${path}/${file.name}`)
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  // Delete image
  static async deleteImage(imageUrl: string): Promise<void> {
    const imageRef = ref(storage, imageUrl)
    await deleteObject(imageRef)
  }
}
