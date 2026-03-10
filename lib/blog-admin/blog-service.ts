import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from "firebase/firestore"
import { db } from "@/firebase"
import type { BlogPost, CreateBlogPost } from "@/types/blog-admin"

export class BlogService {
  private static readonly COLLECTION_NAME = "news"

  static async createPost(postData: CreateBlogPost): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), {
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        images: postData.images,
        author: postData.authorName, // Use authorName for the author field
        category: postData.category,
        tags: postData.tags,
        featured: postData.featured,
        published: postData.published,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        publishedAt: postData.published ? serverTimestamp() : null
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating blog post:", error)
      throw error
    }
  }

  static async updatePost(id: string, postData: Partial<CreateBlogPost>): Promise<void> {
    try {
      const updateData: any = {
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        images: postData.images,
        author: postData.authorName, // Use authorName for the author field
        category: postData.category,
        tags: postData.tags,
        featured: postData.featured,
        published: postData.published,
        updatedAt: serverTimestamp()
      }

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key]
        }
      })

      // Set publishedAt when publishing for the first time
      if (postData.published) {
        const currentPost = await this.getPost(id)
        if (currentPost && !currentPost.publishedAt) {
          updateData.publishedAt = serverTimestamp()
        }
      }

      await updateDoc(doc(db, this.COLLECTION_NAME, id), updateData)
    } catch (error) {
      console.error("Error updating blog post:", error)
      throw error
    }
  }

  static async deletePost(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, id))
    } catch (error) {
      console.error("Error deleting blog post:", error)
      throw error
    }
  }

  static async getPost(id: string): Promise<BlogPost | null> {
    try {
      const docSnap = await getDoc(doc(db, this.COLLECTION_NAME, id))
      
      if (!docSnap.exists()) {
        return null
      }

      const data = docSnap.data()
      return this.formatPost(docSnap.id, data)
    } catch (error) {
      console.error("Error getting blog post:", error)
      throw error
    }
  }

  static async getAllPosts(): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy("createdAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => 
        this.formatPost(doc.id, doc.data())
      )
    } catch (error) {
      console.error("Error getting all blog posts:", error)
      throw error
    }
  }

  static async getPostsByAuthor(authorId: string, authorName?: string): Promise<BlogPost[]> {
    try {
      // First try to get posts by authorId (for new posts)
      let posts: BlogPost[] = []
      
      if (authorId && authorId !== "unknown") {
        const q1 = query(
          collection(db, this.COLLECTION_NAME),
          where("authorId", "==", authorId),
          orderBy("createdAt", "desc")
        )
        const querySnapshot1 = await getDocs(q1)
        posts = querySnapshot1.docs.map(doc => 
          this.formatPost(doc.id, doc.data())
        )
      }
      
      // If no posts found by authorId and we have authorName, try by author field
      if (posts.length === 0 && authorName) {
        const q2 = query(
          collection(db, this.COLLECTION_NAME),
          where("author", "==", authorName),
          orderBy("createdAt", "desc")
        )
        const querySnapshot2 = await getDocs(q2)
        posts = querySnapshot2.docs.map(doc => 
          this.formatPost(doc.id, doc.data())
        )
      }
      
      return posts
    } catch (error) {
      console.error("Error getting posts by author:", error)
      // If queries fail (e.g., missing index), return empty array
      return []
    }
  }

  static async getPublishedPosts(): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("published", "==", true),
        orderBy("publishedAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => 
        this.formatPost(doc.id, doc.data())
      )
    } catch (error) {
      console.error("Error getting published posts:", error)
      throw error
    }
  }

  static async getFeaturedPosts(): Promise<BlogPost[]> {
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where("featured", "==", true),
        where("published", "==", true),
        orderBy("publishedAt", "desc")
      )
      const querySnapshot = await getDocs(q)
      
      return querySnapshot.docs.map(doc => 
        this.formatPost(doc.id, doc.data())
      )
    } catch (error) {
      console.error("Error getting featured posts:", error)
      throw error
    }
  }

  private static formatPost(id: string, data: any): BlogPost {
    return {
      id,
      title: data.title || "",
      content: data.content || "",
      excerpt: data.excerpt || "",
      images: data.images || [],
      authorId: data.authorId || "unknown", // For existing posts without authorId
      authorName: data.author || data.authorName || "Unknown Author", // Use author field from existing structure
      category: data.category || "",
      tags: data.tags || [],
      featured: data.featured || false,
      published: data.published || false,
      createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt ? data.updatedAt.toDate() : new Date(),
      publishedAt: data.publishedAt && typeof data.publishedAt === 'object' && 'toDate' in data.publishedAt ? data.publishedAt.toDate() : undefined
    }
  }
}