// lib/presence.ts
import { getDatabase, ref, onDisconnect, set, serverTimestamp } from "firebase/database";
import { getAuth } from "firebase/auth";

export async function initPresence() {
  const db = getDatabase();
  const auth = getAuth();

  auth.onAuthStateChanged(async (user) => {
    if (!user) return;

    const userStatusRef = ref(db, `/status/${user.uid}`);

    const isOnline = {
      state: "online",
      last_changed: serverTimestamp(),
    };
    const isOffline = {
      state: "offline",
      last_changed: serverTimestamp(),
    };

    const connectedRef = ref(db, ".info/connected");
    import("firebase/database").then(({ onValue }) => {
      onValue(connectedRef, (snapshot) => {
        if (snapshot.val() === false) return;
        onDisconnect(userStatusRef).set(isOffline).then(() => {
          set(userStatusRef, isOnline);
        });
      });
    });
  });
}
