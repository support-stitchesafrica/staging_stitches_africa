/**
 * Load env for staging scripts (.env.staging only — never falls back to .env.local).
 */
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const root = process.cwd();
const envFile = process.env.STAGING_ENV_FILE?.trim() || '.env.staging';
const envPath = path.join(root, envFile);

if (!fs.existsSync(envPath)) {
  console.error(
    `[staging] Missing ${envFile}. Copy .env.staging.example → .env.staging and fill staging Firebase credentials.`,
  );
  process.exit(1);
}

dotenv.config({ path: envPath });

// Staging scripts only need Firestore/Auth — skip live payment key guard
process.env.STAGING_SCRIPT = '1';

console.log(`[staging] Loaded env from ${envFile}`);
