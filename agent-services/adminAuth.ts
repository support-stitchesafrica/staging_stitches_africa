// services/adminAuth.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { addActivityLog } from "./activitylog";

interface AgentData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  language_preference?: string;
}

// Register Agent
export const registerAgent = async (agent: AgentData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, agent.email, agent.password);
    const user = userCredential.user;

    await updateProfile(user, {
      displayName: `${agent.first_name} ${agent.last_name}`,
    });

    await setDoc(doc(db, "staging_onboarding", user.uid), {
      email: agent.email,
      first_name: agent.first_name,
      last_name: agent.last_name,
      language_preference: agent.language_preference || "en",
      is_agent: true,
      is_tailor: false,
      is_general_admin: false,
      created_at: serverTimestamp(),
    });

    // ✅ Log activity
    await addActivityLog({
      user_id: user.uid,
      name: `${agent.first_name} ${agent.last_name}`,
      message: "Agent registered successfully",
      value: "", // Add an appropriate value if needed
    });

    return {
      success: true,
      message: "Agent registered successfully",
      uid: user.uid,
    };
  } catch (error: any) {
    console.error("Error registering agent:", error);
    return {
      success: false,
      message: error.message || "Failed to register agent",
    };
  }
};

// Login Agent
export const loginAgent = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const uid = user.uid;

    const agentRef = doc(db, "staging_onboarding", uid);
    const agentSnap = await getDoc(agentRef);

    if (!agentSnap.exists()) {
      throw new Error("Not authorized as agent.");
    }

    const idToken = await user.getIdToken();
    const refreshToken = user.refreshToken;

    localStorage.setItem("agentToken", idToken);
    localStorage.setItem("agentUID", uid);
    localStorage.setItem("agentEmail", user.email || "");
    localStorage.setItem("agentName", user.displayName || "Agent");
    localStorage.setItem("agentRefreshToken", refreshToken);

    // ✅ Log activity
    await addActivityLog({
      user_id: uid,
      name: user.displayName || "Agent",
      message: "Agent logged in",
      value: "", // Add an appropriate value if needed
    });

    return {
      success: true,
      data: {
        ...agentSnap.data(),
        uid,
        email: user.email,
        displayName: user.displayName,
        idToken,
        refreshToken,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Login failed",
    };
  }
};

// Logout Agent
export const logoutAdmin = async () => {
  try {
    await signOut(auth);

    localStorage.removeItem("agentToken");
    localStorage.removeItem("agentUID");
    localStorage.removeItem("agentEmail");
    localStorage.removeItem("agentName");
    localStorage.removeItem("agentRefreshToken");

    window.location.href = "/";
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

export const getAgentProfile = async (uid: string) => {
  try {
    const agentRef = doc(db, "staging_onboarding", uid)
    const agentSnap = await getDoc(agentRef)

    if (!agentSnap.exists()) {
      return {
        success: false,
        message: "Agent profile not found",
      }
    }

    return {
      success: true,
      data: {
        uid,
        ...agentSnap.data(),
      },
    }
  } catch (error: any) {
    console.error("Error fetching agent profile:", error)
    return {
      success: false,
      message: error.message || "Failed to fetch agent profile",
    }
  }
}

export const updateAgentProfile = async (uid: string, data: Partial<any>) => {
  try {
    const agentRef = doc(db, "staging_onboarding", uid)
    await updateDoc(agentRef, data)
    return { success: true, message: "Profile updated successfully" }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}