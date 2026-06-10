/**
 * Separate Firebase Admin apps for prod (read) and staging (write).
 * Used by staging:clone-user — does not import @/lib/firebase-admin.
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { assertSeedSafeProject } from '@/lib/env';

const PROD_APP_NAME = 'staging-clone-prod-read';
const STAGING_APP_NAME = 'staging-clone-staging-write';

function loadServiceAccount(opts: {
  prefix: 'PROD_' | '';
  expectedProjectId?: string;
}): Record<string, unknown> {
  const p = opts.prefix;

  const fromBase64 = process.env[`${p}FIREBASE_SERVICE_ACCOUNT_KEY_BASE64` as keyof NodeJS.ProcessEnv]?.trim();
  if (fromBase64) {
    const parsed = JSON.parse(Buffer.from(fromBase64, 'base64').toString('utf-8')) as Record<
      string,
      unknown
    >;
    const saProject = typeof parsed.project_id === 'string' ? parsed.project_id.trim() : '';
    if (opts.expectedProjectId && saProject && saProject !== opts.expectedProjectId) {
      throw new Error(
        `[clone] ${p}FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is for "${saProject}" but expected "${opts.expectedProjectId}".`,
      );
    }
    return parsed;
  }

  const projectId = process.env[`${p}FIREBASE_PROJECT_ID` as keyof NodeJS.ProcessEnv]?.trim();
  const clientEmail = process.env[`${p}FIREBASE_CLIENT_EMAIL` as keyof NodeJS.ProcessEnv]?.trim();
  const privateKey = process.env[`${p}FIREBASE_PRIVATE_KEY` as keyof NodeJS.ProcessEnv]?.replace(
    /\\n/g,
    '\n',
  );

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  throw new Error(
    `[clone] Missing ${p || 'staging '}Firebase credentials. Set ${p}FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 ` +
      `or ${p}FIREBASE_PROJECT_ID + ${p}FIREBASE_CLIENT_EMAIL + ${p}FIREBASE_PRIVATE_KEY in .env.staging.`,
  );
}

function initNamedApp(name: string, serviceAccount: Record<string, unknown>, projectId: string): App {
  const existing = getApps().find((a) => a.name === name);
  if (existing) return existing;

  return initializeApp(
    {
      credential: cert(serviceAccount as Parameters<typeof cert>[0]),
      projectId,
    },
    name,
  );
}

export interface DualFirebase {
  prodProjectId: string;
  stagingProjectId: string;
  prodDb: Firestore;
  prodAuth: Auth;
  stagingDb: Firestore;
  stagingAuth: Auth;
}

export function initDualFirebase(): DualFirebase {
  const prodProjectId =
    process.env.PROD_FIREBASE_PROJECT_ID?.trim() ||
    process.env.STAGING_PROD_PROJECT_ID?.trim() ||
    'stitches-africa';

  const stagingProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  if (!stagingProjectId) {
    throw new Error('[clone] NEXT_PUBLIC_FIREBASE_PROJECT_ID is required (staging target).');
  }

  assertSeedSafeProject(stagingProjectId);

  if (prodProjectId === stagingProjectId) {
    throw new Error(
      `[clone] Prod and staging project IDs are the same ("${prodProjectId}"). Refusing to clone.`,
    );
  }

  const prodSa = loadServiceAccount({ prefix: 'PROD_', expectedProjectId: prodProjectId });
  const stagingSa = loadServiceAccount({ prefix: '', expectedProjectId: stagingProjectId });

  const prodApp = initNamedApp(PROD_APP_NAME, prodSa, prodProjectId);
  const stagingApp = initNamedApp(STAGING_APP_NAME, stagingSa, stagingProjectId);

  const stagingDb = getFirestore(stagingApp);
  try {
    stagingDb.settings({ ignoreUndefinedProperties: true });
  } catch {
    // already configured
  }

  return {
    prodProjectId,
    stagingProjectId,
    prodDb: getFirestore(prodApp),
    prodAuth: getAuth(prodApp),
    stagingDb,
    stagingAuth: getAuth(stagingApp),
  };
}

export function assertProdReadOnlyProject(prodProjectId: string): void {
  const allowed = process.env.STAGING_PROD_PROJECT_ID?.trim() || 'stitches-africa';
  if (prodProjectId !== allowed) {
    throw new Error(
      `[clone] Unexpected prod project "${prodProjectId}". Expected "${allowed}". ` +
        'Set PROD_FIREBASE_PROJECT_ID or STAGING_PROD_PROJECT_ID in .env.staging.',
    );
  }
}
