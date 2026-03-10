import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth"
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore"
import { auth, db } from "@/firebase"
import type { BlogUser, CreateBlogUser, BlogPermission } from "@/types/blog-admin"

export class BlogAuthService {
  private static readonly COLLECTION_NAME = "blog_users"

  // Role-based permissions
  private static readonly ROLE_PERMISSIONS: Record<string, BlogPermission[]> = {
    admin: [
      'create_post',
      'edit_own_post',
      'edit_any_post',
      'delete_own_post',
      'delete_any_post',
      'manage_users',
      'view_analytics',
      'invite_users'
    ],
    editor: [
      'create_post',
      'edit_own_post',
      'edit_any_post',
      'delete_own_post',
      'view_analytics'
    ],
    author: [
      'edit_own_post',
      'delete_own_post'
    ]
  }

  static async register(userData: CreateBlogUser): Promise<{ success: boolean; message?: string; user?: BlogUser }> {
    try {
      // Check if username is already taken
      const usernameQuery = query(
        collection(db, this.COLLECTION_NAME),
        where("username", "==", userData.username)
      )
      const usernameSnapshot = await getDocs(usernameQuery)
      
      if (!usernameSnapshot.empty) {
        return { success: false, message: "Username is already taken" }
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      )
      const firebaseUser = userCredential.user

      // Create blog user document
      const blogUser: Omit<BlogUser, 'uid'> = {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      }

      await setDoc(doc(db, this.COLLECTION_NAME, firebaseUser.uid), {
        ...blogUser,
        uid: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      const fullUser: BlogUser = {
        ...blogUser,
        uid: firebaseUser.uid
      }

      return { success: true, user: fullUser }
    } catch (error: any) {
      console.error("Blog user registration error:", error)
      return { success: false, message: error.message }
    }
  }

  static async login(email: string, password: string): Promise<{ success: boolean; message?: string; user?: BlogUser }> {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Get blog user data
      const blogUser = await this.getBlogUser(firebaseUser.uid)
      
      if (!blogUser) {
        await signOut(auth)
        return { success: false, message: "Blog user profile not found" }
      }

      if (!blogUser.isActive) {
        await signOut(auth)
        return { success: false, message: "Your account has been deactivated" }
      }

      // Update last login
      await updateDoc(doc(db, this.COLLECTION_NAME, firebaseUser.uid), {
        updatedAt: serverTimestamp()
      })

      return { success: true, user: blogUser }
    } catch (error: any) {
      console.error("Blog user login error:", error)
      return { success: false, message: error.message }
    }
  }

  static async logout(): Promise<void> {
    await signOut(auth)
  }

  static async getBlogUser(uid: string): Promise<BlogUser | null> {
    try {
      const userDoc = await getDoc(doc(db, this.COLLECTION_NAME, uid))
      
      if (!userDoc.exists()) {
        return null
      }

      const data = userDoc.data()
      return {
        uid: userDoc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        role: data.role,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: data.isActive ?? true
      }
    } catch (error) {
      console.error("Error fetching blog user:", error)
      return null
    }
  }

  static hasPermission(userRole: string, permission: BlogPermission): boolean {
    const rolePermissions = this.ROLE_PERMISSIONS[userRole] || []
    return rolePermissions.includes(permission)
  }

  static canCreatePost(userRole: string): boolean {
    return this.hasPermission(userRole, 'create_post')
  }

  static canEditPost(userRole: string, postAuthorId: string, currentUserId: string): boolean {
    // Can edit own posts
    if (postAuthorId === currentUserId && this.hasPermission(userRole, 'edit_own_post')) {
      return true
    }
    
    // Can edit any post (admin/editor)
    return this.hasPermission(userRole, 'edit_any_post')
  }

  static canDeletePost(userRole: string, postAuthorId: string, currentUserId: string): boolean {
    // Can delete own posts
    if (postAuthorId === currentUserId && this.hasPermission(userRole, 'delete_own_post')) {
      return true
    }
    
    // Can delete any post (admin)
    return this.hasPermission(userRole, 'delete_any_post')
  }
}