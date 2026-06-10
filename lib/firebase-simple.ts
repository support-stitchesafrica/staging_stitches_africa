// Re-export from the single Firebase instance to avoid duplicate app initialization
export { app as default, auth, db, getAuthInstance, getFirebaseDb as getDbInstance } from "@/firebase";
