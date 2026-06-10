// lib/firebase-admin.ts
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import {
  assertNonProductionFirebaseProject,
  assertStagingSafePaymentKeys,
} from "@/lib/env";

function loadServiceAccount(): Record<string, unknown> {
  const expectedProject = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

  const fromSplitFields = (): Record<string, unknown> | null => {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
    if (projectId && clientEmail && privateKey) {
      return {
        project_id: projectId,
        client_email: clientEmail,
        private_key: privateKey,
      };
    }
    return null;
  };

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    const decoded = Buffer.from(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
      "base64",
    ).toString("utf-8");
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    const saProject =
      typeof parsed.project_id === "string" ? parsed.project_id.trim() : "";

    if (expectedProject && saProject && saProject !== expectedProject) {
      const split = fromSplitFields();
      if (split) {
        console.warn(
          `[firebase-admin] Ignoring FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 for "${saProject}" ` +
            `(NEXT_PUBLIC_FIREBASE_PROJECT_ID is "${expectedProject}"). Using split env credentials.`,
        );
        return split;
      }
      throw new Error(
        `[firebase-admin] FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is for "${saProject}" but ` +
          `NEXT_PUBLIC_FIREBASE_PROJECT_ID is "${expectedProject}". ` +
          "Align credentials with NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local or .env.staging.",
      );
    }
    return parsed;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as Record<
      string,
      unknown
    >;
  }

  const split = fromSplitFields();
  if (split) return split;

  throw new Error(
    "[firebase-admin] Missing credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 " +
      "(recommended) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.",
  );
}

const serviceAccount = loadServiceAccount();
const projectId =
  (serviceAccount.project_id as string | undefined) ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

if (!projectId) {
  throw new Error("[firebase-admin] Could not resolve Firebase project ID.");
}

assertNonProductionFirebaseProject(projectId);
assertStagingSafePaymentKeys();

const storageBucket =
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ||
  `${projectId}.firebasestorage.app`;

const adminApp: App =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
        projectId,
        storageBucket,
      })
    : getApps()[0];

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

export const verifyIdToken = async (idToken: string) => {
  try {
    return await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new Error("Invalid ID token");
  }
};

export { adminAuth as auth };
export { adminDb as db };
export { adminStorage as storage };

try {
  if (getApps().length === 1) {
    adminDb.settings({ ignoreUndefinedProperties: true });
  }
} catch {
  // Settings already configured
}
