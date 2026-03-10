"use client"

import type React from "react"
import { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import {
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth"
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"
import { COLLECTIONS } from "@/lib/firebase/collections"

export interface NewsletterUser {
  id?: string
  email: string
  displayName?: string
  isNewsuser: boolean
  role: string
  createdAt?: any
  updatedAt?: any
}

interface AuthContextType {
  user: User | null
  newsletterUser: NewsletterUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  newsletterUser: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [newsletterUser, setNewsletterUser] = useState<NewsletterUser | null>(null)
  const [loading, setLoading] = useState(true)

  // ✅ Watch Firebase Auth state
  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (firebaseUser?.email) {
        const userData = await newsletterUserOperations.getByEmail(firebaseUser.email)
        setNewsletterUser(userData)
      } else {
        setNewsletterUser(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  // ✅ Sign in existing user
  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase not initialized")

    // Sign in via Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Get ID token
    const token = await firebaseUser.getIdToken()

    // Save in localStorage
    localStorage.setItem("token", token)
    localStorage.setItem("email", firebaseUser.email ?? "")

    // Get user record from Firestore
    const userData = await newsletterUserOperations.getByEmail(firebaseUser.email!)
    if (!userData) {
      // If not in Firestore, create record automatically
      const newUser = {
        email: firebaseUser.email!,
        displayName: firebaseUser.displayName ?? email.split("@")[0],
        isNewsuser: true,
        role: "admin",
      }
      await newsletterUserOperations.create(newUser)
      setNewsletterUser(newUser as NewsletterUser)
    } else {
      setNewsletterUser(userData)
    }

    setUser(firebaseUser)
  }

  // ✅ Sign up new user
  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!auth) throw new Error("Firebase not initialized")

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const firebaseUser = userCredential.user

    // Create Firestore record
    await newsletterUserOperations.create({
      email,
      displayName: displayName || email.split("@")[0],
      isNewsuser: true,
      role: "admin",
    })

    // Get ID token and save in localStorage
    const token = await firebaseUser.getIdToken()
    localStorage.setItem("token", token)
    localStorage.setItem("email", firebaseUser.email ?? "")

    setUser(firebaseUser)
    setNewsletterUser({
      email,
      displayName: displayName || email.split("@")[0],
      isNewsuser: true,
      role: "admin",
    })
  }

  // ✅ Sign out
  const signOut = async () => {
    if (!auth) return
    await firebaseSignOut(auth)
    localStorage.removeItem("token")
    localStorage.removeItem("email")
    setUser(null)
    setNewsletterUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, newsletterUser, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)


// ✅ NewsletterUser Firestore operations
export const newsletterUserOperations = {
  async create(user: Omit<NewsletterUser, "id" | "createdAt" | "updatedAt">) {
    const docRef = await addDoc(collection(db!, COLLECTIONS.NEWSLETTER_USERS), {
      ...user,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  },

  async getAll() {
    const q = query(collection(db!, COLLECTIONS.NEWSLETTER_USERS), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as NewsletterUser)
  },

  async getByEmail(email: string) {
    const q = query(collection(db!, COLLECTIONS.NEWSLETTER_USERS), where("email", "==", email))
    const snapshot = await getDocs(q)
    if (!snapshot.empty) {
      const doc = snapshot.docs[0]
      return { id: doc.id, ...doc.data() } as NewsletterUser
    }
    return null
  },

  async getById(id: string) {
    const docRef = doc(db!, COLLECTIONS.NEWSLETTER_USERS, id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as NewsletterUser
    }
    return null
  },

  async update(id: string, data: Partial<NewsletterUser>) {
    const docRef = doc(db!, COLLECTIONS.NEWSLETTER_USERS, id)
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    })
  },

  async delete(id: string) {
    const docRef = doc(db!, COLLECTIONS.NEWSLETTER_USERS, id)
    await deleteDoc(docRef)
  },
}
