// lib/authService.ts
import { auth, db } from "@/firebase"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  UserCredential,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth"
import { toast } from "sonner"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export class FirebaseAuthService {
  // ✅ Sign up with email & password
  async registerUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
  try {
    // 🔑 make sure persistence is browserLocalPersistence
    await setPersistence(auth, browserLocalPersistence);

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (user) {
      await sendEmailVerification(user);

      await setDoc(doc(db, "staging_users", user.uid), {
        uid: user.uid,
        email,
        role: "verifier",
        is_tailor: true,
        is_sub_tailor: false,
        is_general_admin: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
      });

      // ✅ store uid in localStorage
      localStorage.setItem("userId", user.uid);
    }

    return userCredential;
  } catch (error: any) {
    console.error("Error registering user:", error);
    throw error;
  }
}

  // Sign in with email & password
  async signInUserWithEmailAndPassword(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error("Error signing in user:", error)
      throw error
    }
  }

  // Google sign-in
  async signInWithGoogle(): Promise<UserCredential | null> {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)

      if (result.user) {
        // Save user to Firestore if new
        await setDoc(
          doc(db, "staging_users", result.user.uid),
          {
            uid: result.user.uid,
            email: result.user.email,
            role: "verifier",
            is_tailor: false,
            is_sub_tailor: false,
            is_general_admin: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        // ✅ Save userId to localStorage
        localStorage.setItem("userId", result.user.uid)
      }

      return result
    } catch (error: any) {
      console.error("Error signing in with Google:", error)
      toast.error(error.message || "Google sign-in failed")
      return null
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error("Error sending password reset email:", error)
      throw error
    }
  }

  // Anonymous sign-in
  async signInAnonymously(): Promise<UserCredential> {
    try {
      return await signInAnonymously(auth)
    } catch (error: any) {
      console.error("Error signing in anonymously:", error)
      throw error
    }
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user: User | null = auth.currentUser
    if (!user || !user.email) throw new Error("No logged-in user found")

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)
      toast.success("Password changed successfully")
    } catch (error: any) {
      console.error("Failed to change password:", error)
      throw error
    }
  }
}
