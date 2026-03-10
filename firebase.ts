import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence,
  indexedDBLocalPersistence 
} from "firebase/auth";
import { 
  getFirestore,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  enableIndexedDbPersistence,
  enableMultiTabIndexedDbPersistence
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import { getAnalytics, logEvent } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAU8mfUgPZZzLPJXZlibKCkei-DifO_LXQ",
  authDomain: "stitches-africa.firebaseapp.com",
  projectId: "stitches-africa",
  storageBucket: "stitches-africa.firebasestorage.app", // ✅ correct bucket
  messagingSenderId: "72103487036",
  appId: "1:72103487036:web:ebed8812bf2b5fe4ddc539",
  measurementId: "G-LR7MYF6MJ6",
};

// Initialize Firebase app only if it hasn't been initialized already
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with optimized cache settings
let dbInstance: ReturnType<typeof getFirestore> | null = null;

function initializeOptimizedFirestore() {
  if (dbInstance) return dbInstance;
  
  try {
    // Try to get existing instance first
    dbInstance = getFirestore(app);
  } catch {
    // Initialize with cache optimization
    dbInstance = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      experimentalForceLongPolling: false,
      experimentalAutoDetectLongPolling: true,
    });
  }
  
  return dbInstance;
}

export const auth = getAuth(app);
export const db = initializeOptimizedFirestore();
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// Enable Firestore offline persistence for faster loads
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, try single-tab
      enableIndexedDbPersistence(db).catch((persistErr) => {
        console.warn('Firestore persistence not available:', persistErr);
      });
    } else if (err.code !== 'unimplemented') {
      console.warn('Firestore persistence error:', err);
    }
  });
}

// Connect to Firebase Emulator in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Check if we should use emulator
  if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    // Connect to Firestore emulator
    if (!db._delegate._databaseId.projectId.includes('localhost')) {
      const { connectFirestoreEmulator } = require('firebase/firestore');
      try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('🔥 Connected to Firestore Emulator');
      } catch (error) {
        console.log('Firestore Emulator already connected or failed to connect');
      }
    }
    
    // Connect to Auth emulator
    if (!auth.config.emulator) {
      const { connectAuthEmulator } = require('firebase/auth');
      try {
        connectAuthEmulator(auth, 'http://localhost:9099');
        console.log('🔐 Connected to Auth Emulator');
      } catch (error) {
        console.log('Auth Emulator already connected or failed to connect');
      }
    }
  }
}

// Set optimized auth persistence (IndexedDB is faster than localStorage)
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence)
    .catch(() => {
      // Fallback to localStorage if IndexedDB fails
      return setPersistence(auth, browserLocalPersistence);
    })
    .catch((err) => {
      console.error("Failed to set auth persistence:", err);
    });
  
  // Add auth state debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    auth.onAuthStateChanged((user) => {
      console.log('Firebase Auth State Changed:', user ? `User: ${user.email}` : 'No user');
    });
  }
}
