// hooks/useSessionTracker.ts
import { useEffect } from "react";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase"; // your initialized Firestore instance
import { getAuth } from "firebase/auth";

export function useSessionTracker() {
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    const sessionId = crypto.randomUUID();
    const sessionRef = doc(db, "staging_user_sessions", sessionId);

    // Create new session document
    setDoc(sessionRef, {
      userId: user.uid,
      startTime: serverTimestamp(),
      lastActive: serverTimestamp(),
      endTime: null,
      active: true,
    });

    // Update lastActive every 30 seconds
    const heartbeat = setInterval(async () => {
      await updateDoc(sessionRef, { lastActive: serverTimestamp() });
    }, 30_000);

    // When user leaves
    const handleUnload = async () => {
      await updateDoc(sessionRef, {
        endTime: serverTimestamp(),
        active: false,
      });
    };

    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("visibilitychange", async () => {
      if (document.visibilityState === "hidden") await handleUnload();
    });

    return () => {
      clearInterval(heartbeat);
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);
}
