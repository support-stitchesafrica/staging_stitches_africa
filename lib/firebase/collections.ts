import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment,
} from "firebase/firestore"
import { db } from "./config" // ✅ Uses your provided Firebase service

// === Collection Constants ===
export const COLLECTIONS = {
  TEMPLATES: "templates",
  SUBSCRIBERS: "subscribers",
  CAMPAIGNS: "campaigns",
  LISTS: "lists",
  NEWSLETTER_USERS: "newsletter_users",
}

// === Type Definitions ===
export interface Template {
  id?: string
  name: string
  description: string
  thumbnail?: string
  content: string
  category: "bespoke" | "ready-to-wear" | "general"
  tags?: string[]
  isPrebuilt?: boolean
  sections?: TemplateSection[]
  styles?: TemplateStyles
  createdAt: any
  updatedAt: any
}

export interface TemplateSection {
  id: string
  name: string
  blocks: Block[]
}

export interface Block {
  id: string
  type: "heading" | "text" | "image" | "button" | "divider" | "spacer" | "social" | "video" | "code" | "columns"
  content: string
  styles?: BlockStyles
  link?: string
  columns?: Block[][]
  columnCount?: number
  uploadMetadata?: {
    originalFileName?: string
    uploadedAt?: Date
    fileSize?: number
  }
}

export interface BlockStyles {
  textAlign?: "left" | "center" | "right"
  fontSize?: string
  fontWeight?: string
  fontFamily?: string
  color?: string
  backgroundColor?: string
  padding?: string
  margin?: string
  borderRadius?: string
  width?: string
  height?: string
  maxWidth?: string
  lineHeight?: string
  letterSpacing?: string
  textTransform?: "none" | "capitalize" | "uppercase" | "lowercase" | "initial" | "inherit"
  border?: string
}

export interface TemplateStyles {
  backgroundColor?: string
  backgroundImage?: string
  backgroundSize?: string
  backgroundPosition?: string
  backgroundRepeat?: string
  fontFamily?: string
  fontSize?: string
  lineHeight?: string
  primaryColor?: string
  secondaryColor?: string
  maxWidth?: string
  padding?: string
  borderRadius?: string
}

export interface Subscriber {
  id?: string
  email: string
  firstName?: string
  lastName?: string
  lists: string[] // Array of List IDs
  status: "active" | "unsubscribed" | "bounced"
  createdAt: any
}
export interface Campaign {
  id?: string
  name: string
  subject: string
  previewText?: string
  templateId?: string
  // 👇 allow both string or block-structured content
  content:
    | string
    | {
        blocks: any[]
        templateStyles?: Record<string, any>
        html?: string
      }
  status: "draft" | "scheduled" | "sent" | "sending"
  recipientLists: string[]
  recipientCount: number
  sentCount: number
  openCount: number
  clickCount: number
  openedBy?: string[]
  clickedBy?: string[]
  scheduledAt?: any
  sentAt?: any
  createdAt: any
  updatedAt: any
}


export interface List {
  id?: string
  name: string
  description?: string
  subscriberCount: number
  createdAt: any
  updatedAt: any
}

// NewsletterUser types
export interface NewsletterUser {
  id?: string
  email: string
  displayName?: string
  isNewsuser: boolean
  role?: "admin" | "editor" | "viewer"
  createdAt: any
  updatedAt: any
}

// === Utility ===
export function ensureDB() {
  if (!db) throw new Error("❌ Firebase Firestore not initialized. Check your Firebase config.")
  return db
}

// === TEMPLATE OPERATIONS ===
export const templateService = {
  async create(template: Omit<Template, "id" | "createdAt" | "updatedAt">) {
    const firestore = ensureDB()

    // 🧩 Deep clean the template (remove undefined values)
    const cleanTemplate = JSON.parse(JSON.stringify(template))

    const ref = await addDoc(collection(firestore, COLLECTIONS.TEMPLATES), {
      ...cleanTemplate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  },

  async getAll() {
    const firestore = ensureDB()
    const q = query(collection(firestore, COLLECTIONS.TEMPLATES), orderBy("createdAt", "desc"))
    const snapshot = await getDocs(q)
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Template[]
  },

  async getById(id: string) {
    const firestore = ensureDB()
    const ref = doc(firestore, COLLECTIONS.TEMPLATES, id)
    const snap = await getDoc(ref)
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Template) : null
  },

  async update(id: string, data: Partial<Template>) {
    const firestore = ensureDB()

    const cleanData = JSON.parse(JSON.stringify(data)) // also clean nested columns
    const ref = doc(firestore, COLLECTIONS.TEMPLATES, id)
    await updateDoc(ref, { ...cleanData, updatedAt: serverTimestamp() })
  },

  async delete(id: string) {
    const firestore = ensureDB()
    await deleteDoc(doc(firestore, COLLECTIONS.TEMPLATES, id))
  },
}

// === SUB COLLECT OPERATIONS ===
export const subCollectService = {
  /**
   * Create a new folder (document) inside "sub_collect"
   * Example: { name: "newsletter", description: "Monthly newsletter list" }
   */
  async createFolder(folder: { name: string; description?: string }) {
    const firestore = ensureDB()
    const ref = await addDoc(collection(firestore, "sub_collect"), {
      name: folder.name,
      description: folder.description || "",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  },

  /**
   * Get all folders inside "sub_collect"
   */
  async getFolders() {
    const firestore = ensureDB()
    const q = query(collection(firestore, "sub_collect"), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  /**
   * Add a subscriber to a specific folder's subcollection "subscribers"
   */
  async addSubscriber(folderId: string, data: { email: string; status?: string; firstName: string; lastName: string }) {
    if (!folderId) throw new Error("Folder ID is required")

    const firestore = ensureDB()
    const subRef = collection(firestore, "sub_collect", folderId, "subscribers")

    const ref = await addDoc(subRef, {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      status: data.status || "active",
      date: serverTimestamp(),
      active: true,
    })
    return ref.id
  },

  /**
   * Get all subscribers within a specific folder
   */
  async getSubscribers(folderId: string) {
    if (!folderId) throw new Error("Folder ID is required")

    const firestore = ensureDB()
    const q = query(collection(firestore, "sub_collect", folderId, "subscribers"), orderBy("date", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  /**
   * Delete a specific subscriber from a folder
   */
  async deleteSubscriber(folderId: string, subscriberId: string) {
    if (!folderId || !subscriberId) throw new Error("Folder ID and Subscriber ID are required")

    const firestore = ensureDB()
    const ref = doc(firestore, "sub_collect", folderId, "subscribers", subscriberId)
    await deleteDoc(ref)
  },
}

// === SUBSCRIBER OPERATIONS ===
export const subscriberService = {
  async create(sub: Omit<Subscriber, "id" | "createdAt">) {
    const firestore = ensureDB()
    const ref = await addDoc(collection(firestore, COLLECTIONS.SUBSCRIBERS), {
      ...sub,
      createdAt: serverTimestamp(),
    })
    return ref.id
  },

  async getAll() {
    const firestore = ensureDB()
    const q = query(collection(firestore, COLLECTIONS.SUBSCRIBERS), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Subscriber[]
  },

  async getByList(listId: string) {
    const firestore = ensureDB()
    const q = query(collection(firestore, COLLECTIONS.SUBSCRIBERS), where("lists", "array-contains", listId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Subscriber[]
  },

  async update(id: string, data: Partial<Subscriber>) {
    const firestore = ensureDB()
    await updateDoc(doc(firestore, COLLECTIONS.SUBSCRIBERS, id), data)
  },

  async delete(id: string) {
    const firestore = ensureDB()
    await deleteDoc(doc(firestore, COLLECTIONS.SUBSCRIBERS, id))
  },
}

// === CAMPAIGN OPERATIONS ===
// === CAMPAIGN EVENT OPERATIONS ===
export const campaignEventService = {
  async logEvent(campaignId: string, event: {
    email: string
    type: "open" | "click"
    url?: string
  }) {
    const firestore = ensureDB()
    const ref = collection(firestore, COLLECTIONS.CAMPAIGNS, campaignId, "events")

    await addDoc(ref, {
      ...event,
      timestamp: serverTimestamp(),
    })
  },

  async getEvents(campaignId: string) {
    const firestore = ensureDB()
    const q = query(
      collection(firestore, COLLECTIONS.CAMPAIGNS, campaignId, "events"),
      orderBy("timestamp", "desc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },

  async getEventsByEmail(campaignId: string, email: string) {
    const firestore = ensureDB()
    const q = query(
      collection(firestore, COLLECTIONS.CAMPAIGNS, campaignId, "events"),
      where("email", "==", email),
      orderBy("timestamp", "desc")
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  },
}

export const campaignService = {
  async create(campaign: Omit<Campaign, "id" | "createdAt" | "updatedAt">) {
    const firestore = ensureDB()
    const ref = await addDoc(collection(firestore, COLLECTIONS.CAMPAIGNS), {
      ...campaign,
      openCount: 0,
      clickCount: 0,
      openedBy: [],
      clickedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  },

  async getAll() {
    const firestore = ensureDB()
    const q = query(collection(firestore, COLLECTIONS.CAMPAIGNS), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Campaign[]
  },

  async getById(id: string) {
    const firestore = ensureDB()
    const ref = doc(firestore, COLLECTIONS.CAMPAIGNS, id)
    const snap = await getDoc(ref)
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Campaign) : null
  },

  async update(id: string, data: Partial<Campaign>) {
    const firestore = ensureDB()
    const ref = doc(firestore, COLLECTIONS.CAMPAIGNS, id)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  },

  async delete(id: string) {
    const firestore = ensureDB()
    await deleteDoc(doc(firestore, COLLECTIONS.CAMPAIGNS, id))
  },
  async increment(id: string, field: string, amount: number) {
    const firestore = ensureDB()
    const docRef = doc(firestore, COLLECTIONS.CAMPAIGNS, id)
    await updateDoc(docRef, {
      [field]: increment(amount),
      updatedAt: new Date(),
    })
  },
}

// === LIST OPERATIONS ===
export const listService = {
  async create(list: Omit<List, "id" | "createdAt" | "updatedAt">) {
    const firestore = ensureDB()
    const ref = await addDoc(collection(firestore, COLLECTIONS.LISTS), {
      ...list,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  },

  async getAll() {
    const firestore = ensureDB()
    const q = query(collection(firestore, COLLECTIONS.LISTS), orderBy("createdAt", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as List[]
  },

  async update(id: string, data: Partial<List>) {
    const firestore = ensureDB()
    await updateDoc(doc(firestore, COLLECTIONS.LISTS, id), { ...data, updatedAt: serverTimestamp() })
  },

  async delete(id: string) {
    const firestore = ensureDB()
    await deleteDoc(doc(firestore, COLLECTIONS.LISTS, id))
  },
}

// NewsletterUser operations
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

