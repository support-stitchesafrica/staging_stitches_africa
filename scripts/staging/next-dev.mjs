/**
 * Load .env.staging then start `next dev` (Windows-safe; avoids dotenv CLI arg issues).
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const envFile = process.env.STAGING_ENV_FILE?.trim() || '.env.staging';

dotenv.config({ path: path.join(root, envFile) });

// Expose APP_ENV to client bundles (Next.js only inlines NEXT_PUBLIC_*).
if (!process.env.NEXT_PUBLIC_APP_ENV?.trim()) {
  process.env.NEXT_PUBLIC_APP_ENV = process.env.APP_ENV?.trim() || 'staging';
}

console.log(`[dev:staging] Loaded ${envFile} (APP_ENV=${process.env.APP_ENV}, NEXT_PUBLIC_APP_ENV=${process.env.NEXT_PUBLIC_APP_ENV})`);

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, 'dev', ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
