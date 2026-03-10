// services/adminAuth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { auth, db } from "../firebase";

export const loginTailor = async (email: string, password: string) => {
  try {
    // 1. Sign in using Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;

    // 2. Check if user exists in `users` collection
    const userRef = doc(db, "staging_users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User not found.");
    }

    const userData = userSnap.data();

    // ✅ 3. Allow if either tailor or sub_tailor
    const isTailor = userData.is_tailor === true;
    const isSubTailor = userData.is_sub_tailor === true;

    if (!isTailor && !isSubTailor) {
      throw new Error("Access denied. You are not authorized to log in.");
    }

    // 4. Get ID token and refresh token
    const idToken = await user.getIdToken();
    const refreshToken = user.refreshToken;

    // 5. Prepare full session user object
    const sessionUser = {
      uid,
      email: user.email,
      displayName: user.displayName,
      idToken,
      refreshToken,
      ...userData,
    };

    // 6. Store in localStorage
    localStorage.setItem("tailorToken", idToken);
    localStorage.setItem("tailorUID", uid);
    localStorage.setItem("tailorEmail", user.email || "");
    localStorage.setItem("tailorName", user.displayName || "Tailor");
    localStorage.setItem("tailorRefreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(sessionUser)); // Save complete user data

    // 7. Return structured response
    return {
      success: true,
      data: sessionUser,
    };

  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Login failed",
    };
  }
};



/**
 * Adds a sub-tailor under the given parent tailor.
 */
export const addSubTailor = async (
  parentTailorUID: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  role: string
) => {
  try {
    // 1. Check if the parent is a valid tailor
    const parentRef = doc(db, "staging_users", parentTailorUID)
    const parentSnap = await getDoc(parentRef)

    if (!parentSnap.exists()) {
      throw new Error("Parent tailor not found.")
    }

    const parentData = parentSnap.data()
    if (!parentData.is_tailor) {
      throw new Error("Only tailors can add sub-tailors.")
    }

    // 2. Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const subTailor = userCredential.user

    // 3. Save sub-tailor in Firestore
    const subTailorRef = doc(db, "staging_users", subTailor.uid)
    await setDoc(subTailorRef, {
      first_name: firstName,
      last_name: lastName,
      email,
      is_tailor: false,
      is_sub_tailor: true,
      role,
      tailorId: parentTailorUID,
      createdAt: new Date().toISOString(),
    })

    return {
      success: true,
      message: "Sub-tailor created successfully.",
      uid: subTailor.uid,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to add sub-tailor.",
    }
  }
}

/**
 * Fetches both tailors and sub-tailors under a specific tailorId.
 */
export const getTailorsUnderTailorId = async (userId: string) => {
  try {
    const usersRef = collection(db, "staging_users")

    // First, get the requesting user's document
    const currentUserDoc = await getDoc(doc(usersRef, userId))

    if (!currentUserDoc.exists()) {
      return {
        success: false,
        message: "User not found.",
      }
    }

    const currentUser = currentUserDoc.data()

    // Determine the main tailorId:
    // - If the user is a tailor, their own id is the main tailorId
    // - If the user is a sub-tailor, use their tailorId field
    const mainTailorId = currentUser.is_tailor ? userId : currentUser.tailorId

    if (!mainTailorId) {
      return {
        success: false,
        message: "Tailor ID not found for user.",
      }
    }

    // Fetch all sub-tailors under the main tailor
    const subTailorsQuery = query(usersRef, where("tailorId", "==", mainTailorId))
    const subTailorsSnapshot = await getDocs(subTailorsQuery)

    const subTailors = subTailorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))

    // Fetch the main tailor's document
    const mainTailorDoc = await getDoc(doc(usersRef, mainTailorId))
    const mainTailor = mainTailorDoc.exists()
      ? { id: mainTailorDoc.id, ...mainTailorDoc.data() }
      : null

    const allTailors = mainTailor ? [mainTailor, ...subTailors] : [...subTailors]

    return {
      success: true,
      data: allTailors,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to fetch tailor and sub-tailors.",
    }
  }
}

/**
 * Logs out the current tailor or sub-tailor and clears session data.
 */
export const logoutTailor = async () => {
  try {
    // 1. Sign out from Firebase Auth
    await signOut(auth)

    // 2. Clear relevant session data from localStorage
    localStorage.removeItem("tailorToken")
    localStorage.removeItem("tailorUID")
    localStorage.removeItem("tailorEmail")
    localStorage.removeItem("tailorName")
    localStorage.removeItem("tailorRefreshToken")
    localStorage.removeItem("user")

    return {
      success: true,
      message: "Successfully logged out.",
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Logout failed.",
    }
  }
}
export const updateTailorRole = async (userId: string, newRole: string) => {
  try {
    // get currently logged in tailor UID
    const currentUID = localStorage.getItem("tailorUID")
    if (!currentUID) throw new Error("Not authorized.")

    // check if current user is a tailor
    const currentUserRef = doc(db, "staging_users", currentUID)
    const currentUserSnap = await getDoc(currentUserRef)

    if (!currentUserSnap.exists()) {
      throw new Error("Current user not found.")
    }

    const currentUser = currentUserSnap.data()

    if (!currentUser.is_tailor) {
      throw new Error("Only main tailors can update roles.")
    }

    // get the target user
    const userRef = doc(db, "staging_users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      throw new Error("User not found.")
    }

    const targetUser = userSnap.data()

    // ✅ make sure target user is under this tailor’s group
    if (targetUser.tailorId !== currentUID) {
      throw new Error("You can only update users under your tailorId.")
    }

    // perform the update
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
    })

    return {
      success: true,
      message: `Role updated to ${newRole}`,
    }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Failed to update role.",
    }
  }
}

