import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

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

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, "us-central1");

// Set session persistence globally (only in browser environment)
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.error("Failed to set auth persistence:", err);
  });
}
