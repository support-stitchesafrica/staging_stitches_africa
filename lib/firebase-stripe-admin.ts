import { initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"

// Initialize Firebase Admin with your service account key
const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  // Store your full service account JSON in environment variable
  // or import it directly if available
}

let app: any
let db: any
let auth: any

try {
  app = initializeApp({
    projectId: firebaseAdminConfig.projectId,
  })
  db = getFirestore(app)
  auth = getAuth(app)
} catch (error) {
  console.error("Firebase Admin initialization error:", error)
}

export function getFirebaseAdmin() {
  return {
    app,
    firestore: () => db,
    auth: () => auth,
  }
}

export { db, auth }
