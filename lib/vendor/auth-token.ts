/**
 * Fresh Firebase ID tokens for vendor API routes (Bearer auth).
 */
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";

function normalizeBearer(token: string): string {
  const trimmed = token.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("Bearer ") ? trimmed : `Bearer ${trimmed}`;
}

/** Wait briefly for Firebase to restore the vendor session on page load. */
async function waitForAuthUser(timeoutMs = 4000): Promise<typeof auth.currentUser> {
  if (auth.currentUser) return auth.currentUser;

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsub();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        clearTimeout(timer);
        unsub();
        resolve(user);
      }
    });
  });
}

/**
 * Returns a valid Firebase ID token, refreshing from the current session when possible.
 */
export async function getVendorIdToken(forceRefresh = false): Promise<string> {
  if (typeof window === "undefined") return "";

  const user = forceRefresh ? auth.currentUser : await waitForAuthUser();
  if (user) {
    try {
      const token = await user.getIdToken(forceRefresh);
      localStorage.setItem("tailorToken", token);
      return token;
    } catch (error) {
      console.warn("[vendor-auth] getIdToken failed:", error);
    }
  }

  const stored = localStorage.getItem("tailorToken") ?? "";
  if (stored.startsWith("Bearer ")) {
    return stored.slice(7).trim();
  }
  return stored.trim();
}

/** Headers for vendor-protected API routes. */
export async function vendorAuthHeaders(
  forceRefresh = false
): Promise<HeadersInit> {
  const token = await getVendorIdToken(forceRefresh);
  const authorization = token ? normalizeBearer(token) : "";
  return {
    "Content-Type": "application/json",
    ...(authorization ? { Authorization: authorization } : {}),
  };
}
