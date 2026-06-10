/**
 * Central environment helpers for local, staging, and production.
 * Prefer APP_ENV over hostname guessing.
 */

export type AppEnv = 'local' | 'staging' | 'production';

const PROD_FIREBASE_PROJECT_IDS = new Set(['stitches-africa']);

export function getAppEnv(): AppEnv {
  const raw = (
    process.env.APP_ENV?.trim() ||
    process.env.NEXT_PUBLIC_APP_ENV?.trim()
  )?.toLowerCase();
  if (raw === 'staging') return 'staging';
  if (raw === 'production' || raw === 'prod') return 'production';
  return 'local';
}

/** Show the staging badge in headers when APP_ENV (or NEXT_PUBLIC_APP_ENV) is staging. */
export function shouldShowStagingBadge(): boolean {
  return isStagingEnv();
}

export function isProductionEnv(): boolean {
  return getAppEnv() === 'production';
}

/** True when the client Firebase project is the live production project. */
export function isProductionFirebaseProject(): boolean {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
  return !!projectId && PROD_FIREBASE_PROJECT_IDS.has(projectId);
}

export function isStagingEnv(): boolean {
  return getAppEnv() === 'staging';
}

export function isLocalEnv(): boolean {
  return getAppEnv() === 'local';
}

/** Canonical app origin for links, webhooks, and redirects. */
export function getAppBaseUrl(): string {
  const explicit =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');

  if (isLocalEnv()) return 'http://localhost:3000';
  if (isStagingEnv()) return 'https://staging.stitchesafrica.com';
  return 'https://www.stitchesafrica.com';
}

export function getFirebaseClientConfig() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim(),
  };

  const missing = Object.entries(config)
    .filter(([key, value]) => key !== 'measurementId' && !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `[env] Missing Firebase client config: ${missing.join(', ')}. ` +
        'Add values to .env.local (npm run dev) or copy .env.staging.example → .env.staging (npm run dev:staging).',
    );
  }

  assertNonProductionFirebaseProject(config.projectId!);
  return config;
}

/**
 * Block prod Firebase on deployed staging only.
 * `npm run dev` with APP_ENV=local + .env.local is unrestricted (use prod or staging as you choose).
 */
export function assertNonProductionFirebaseProject(projectId: string): void {
  if (isProductionEnv()) return;
  if (isLocalEnv()) return;
  if (process.env.ALLOW_PROD_FIREBASE === 'true') return;

  assertBlockedProductionProject(projectId, getAppEnv());
}

/** Hard block for staging seed/sanitize scripts — never writes to prod, no override. */
export function assertSeedSafeProject(projectId: string): void {
  assertBlockedProductionProject(
    projectId,
    'seed-script (production project never allowed)',
  );
}

function assertBlockedProductionProject(
  projectId: string,
  context: string,
): void {
  if (PROD_FIREBASE_PROJECT_IDS.has(projectId)) {
    throw new Error(
      `[env] Refusing to use production Firebase project "${projectId}" (${context}). ` +
        'Use your staging project (e.g. stitches-africa-dev-4c390) in .env.staging only.',
    );
  }
}

const LIVE_KEY_PATTERNS: Array<{ name: string; value: string | undefined; pattern: RegExp }> = [
  { name: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY, pattern: /^sk_live_/ },
  {
    name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    pattern: /^pk_live_/,
  },
  {
    name: 'NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY',
    value: process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY,
    pattern: /^pk_live_/,
  },
  { name: 'PAYSTACK_SECRET_KEY', value: process.env.PAYSTACK_SECRET_KEY, pattern: /^sk_live_/ },
  {
    name: 'FLW_SECRET_KEY',
    value: process.env.FLW_SECRET_KEY,
    pattern: /^FLWSECK-(?!TEST)/,
  },
];

/** Call from scripts or API routes that must not hit live payment providers. */
export function assertStagingSafePaymentKeys(): void {
  if (process.env.STAGING_SCRIPT === '1') return;
  if (isProductionEnv()) return;
  // Local dev (npm run dev + .env.local) — no key restrictions
  if (isLocalEnv()) return;
  if (!isStagingEnv()) return;
  if (process.env.ALLOW_LIVE_PAYMENT_KEYS === 'true') return;

  for (const { name, value, pattern } of LIVE_KEY_PATTERNS) {
    if (value && pattern.test(value.trim())) {
      throw new Error(
        `[env] Live payment key detected (${name}) while APP_ENV=${getAppEnv()}. Use sandbox/test keys.`,
      );
    }
  }
}

export function isRealPayoutDisabled(): boolean {
  return process.env.DISABLE_REAL_PAYOUTS === 'true' || !isProductionEnv();
}
