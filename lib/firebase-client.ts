import { initializeApp, getApps, getApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyAU8mfUgPZZzLPJXZlibKCkei-DifO_LXQ",
  authDomain: "stitches-africa.firebaseapp.com",
  projectId: "stitches-africa",
  storageBucket: "stitches-africa.firebasestorage.app", // ✅ correct bucket
  messagingSenderId: "72103487036",
  appId: "1:72103487036:web:ebed8812bf2b5fe4ddc539",
}

// Initialize Firebase app only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
export const db = getFirestore(app)
export const auth = getAuth(app)

// Set auth persistence to LOCAL to ensure sessions persist across page reloads
// This is critical for the referral authentication system
// We set this immediately and synchronously to ensure it's applied before any auth operations
if (typeof window !== 'undefined') {
  // Set persistence immediately on initialization
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Firebase Auth persistence set to LOCAL');
    })
    .catch((error) => {
      console.error('Error setting auth persistence:', error);
    });
}
