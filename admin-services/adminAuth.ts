// services/adminAuth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { auth, db } from "../firebase"

type AdminInput = {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: "admin" | "superadmin"
  username?: string
}

// ==============================
// Register Admin (no restriction)
// ==============================
export const registerAdmin = async ({
  email,
  password,
  firstName,
  lastName,
  username,
  role = "admin",
}: {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
  role?: string
}) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const newUser = userCredential.user

    // Save details in Firestore under `admins` collection
    await setDoc(doc(db, "staging_admins", newUser.uid), {
      uid: newUser.uid,
      email,
      firstName,
      lastName,
      username,
      role,
      createdAt: serverTimestamp(),
    })

    // ✅ Get tokens
    const idToken = await newUser.getIdToken()
    const refreshToken = newUser.refreshToken

    // ✅ Save clean data in localStorage
    localStorage.setItem("adminUID", newUser.uid)
    localStorage.setItem("adminEmail", email)
    localStorage.setItem("adminFirstName", firstName)
    localStorage.setItem("adminLastName", lastName)
    localStorage.setItem("adminUsername", username || "")
    localStorage.setItem("adminRole", role)
    localStorage.setItem("adminToken", idToken)
    localStorage.setItem("adminRefreshToken", refreshToken)

    return {
      success: true,
      data: {
        uid: newUser.uid,
        email,
        firstName,
        lastName,
        username,
        role,
        idToken,
        refreshToken,
      },
    }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// ==============================
// Login Admin
// ==============================
export const loginAdmin = async (email: string, password: string) => {
  try {
    // Hardcoded super admin check - bypasses Firestore
    const SUPER_ADMIN_EMAIL = "admin@stitchesafrica.com";
    const SUPER_ADMIN_PASSWORD_PATTERN = "SUPER_ADMIN_123";
    
    // Check if this is the hardcoded super admin
    if (email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && 
        password.includes(SUPER_ADMIN_PASSWORD_PATTERN)) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const idToken = await user.getIdToken();
        const refreshToken = user.refreshToken;

        // Set super admin data in localStorage
        localStorage.setItem("adminUID", user.uid);
        localStorage.setItem("adminEmail", email);
        localStorage.setItem("adminFirstName", "Super");
        localStorage.setItem("adminLastName", "Admin");
        localStorage.setItem("adminUsername", "SuperAdmin");
        localStorage.setItem("adminRole", "superadmin");
        localStorage.setItem("adminToken", idToken);
        localStorage.setItem("adminRefreshToken", refreshToken);

        return {
          success: true,
          data: {
            uid: user.uid,
            email: email,
            firstName: "Super",
            lastName: "Admin",
            username: "SuperAdmin",
            role: "superadmin",
            idToken,
            refreshToken,
          },
        };
      } catch (authError: any) {
        return { 
          success: false, 
          message: authError.message || "Authentication failed" 
        };
      }
    }

    // For other users, proceed with normal Firestore check
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;

    // Check Firestore `admins` collection
    const adminRef = doc(db, "staging_admins", uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      // ❌ Not in admins collection → deny access
      await signOut(auth);
      throw new Error("You are not authorized as admin.");
    }

    const adminData = adminSnap.data();
    const idToken = await user.getIdToken();
    const refreshToken = user.refreshToken;

    localStorage.setItem("adminUID", user.uid);
    localStorage.setItem("adminEmail", adminData?.email || user.email || "");
    localStorage.setItem("adminFirstName", adminData?.firstName || user.displayName || "");
    localStorage.setItem("adminLastName", adminData?.lastName || "");
    localStorage.setItem("adminUsername", adminData?.username || "");
    localStorage.setItem("adminRole", adminData?.role || "admin");
    localStorage.setItem("adminToken", idToken);
    localStorage.setItem("adminRefreshToken", refreshToken);

    return {
      success: true,
      data: {
        uid,
        ...adminData,
        idToken,
        refreshToken,
      },
    };
  } catch (error: any) {
    return { success: false, message: error.message || "Login failed" };
  }
};

// ==============================
// Logout
// ==============================
export const logoutAdmin = async () => {
  await signOut(auth)
  localStorage.clear()
  window.location.href = "/admin" // redirect to login
}

// ==============================
// Get Current Admin Profile
// ==============================
export const getCurrentAdminProfile = async () => {
  const uid = localStorage.getItem("adminUID")
  if (!uid) throw new Error("No admin UID found")

  return {
    uid,
    email: localStorage.getItem("adminEmail"),
    firstName: localStorage.getItem("adminFirstName"),
    lastName: localStorage.getItem("adminLastName"),
    username: localStorage.getItem("adminUsername"),
    role: localStorage.getItem("adminRole"),
    token: localStorage.getItem("adminToken"),
    refreshToken: localStorage.getItem("adminRefreshToken"),
  }
}

// ==============================
// Update Admin Profile
// ==============================
export const updateAdminProfile = async (updates: any) => {
  const uid = localStorage.getItem("adminUID")
  if (!uid) throw new Error("No admin UID found")

  const adminRef = doc(db, "staging_admins", uid)
  await updateDoc(adminRef, updates)

  // ✅ Keep localStorage in sync
  Object.keys(updates).forEach((key) => {
    localStorage.setItem(
      `admin${key.charAt(0).toUpperCase() + key.slice(1)}`,
      updates[key],
    )
  })

  return { success: true }
}

// ==============================
// Create Sub-Admin (Only Superadmin)
// ==============================
export const createSubAdmin = async ({
  email,
  password,
  firstName,
  lastName,
  role = "admin",
  username,
}: AdminInput) => {
  const currentAdmin = await getCurrentAdminProfile()
  if (currentAdmin.role !== "superadmin") {
    throw new Error("Only Super Admin can create sub-admins")
  }

  // Create new user without losing current session
  const secondaryApp = (await import("firebase/app")).initializeApp(auth.app.options, "Secondary")
  const secondaryAuth = (await import("firebase/auth")).getAuth(secondaryApp)

  const userCredential = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password,
  )
  const uid = userCredential.user.uid

  await setDoc(doc(db, "staging_admins", uid), {
    uid,
    email,
    firstName,
    lastName,
    username,
    role,
    createdAt: serverTimestamp(),
  })

  await (await import("firebase/auth")).signOut(secondaryAuth)

  return {
    uid,
    email,
    firstName,
    lastName,
    username,
    role,
    createdAt: new Date().toISOString(),
  }
}

// ==============================
// Get All Admins
// ==============================
export const getAllAdmins = async () => {
  const snapshot = await getDocs(collection(db, "staging_admins"))
  return snapshot.docs.map((doc) => ({
    uid: doc.id,
    ...doc.data(),
  }))
}

// ==============================
// Update Sub-Admin Role
// ==============================
export const updateSubAdminRole = async (
  uid: string,
  newRole: "admin" | "superadmin",
) => {
  const currentAdmin = await getCurrentAdminProfile()
  if (currentAdmin.role !== "superadmin") {
    throw new Error("Only Super Admin can update roles")
  }
  await updateDoc(doc(db, "staging_admins", uid), { role: newRole })
  return { success: true }
}

// ==============================
// Delete Admin
// ==============================
export const deleteAdmin = async (uid: string) => {
  const currentAdmin = await getCurrentAdminProfile()
  if (currentAdmin.role !== "superadmin") {
    throw new Error("Only Super Admin can delete admins")
  }
  await deleteDoc(doc(db, "staging_admins", uid))
  return { success: true }
}
