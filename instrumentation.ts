/**
 * Next.js Instrumentation Hook
 * 
 * This file is automatically loaded by Next.js when the server starts.
 * It's the proper place to run initialization code like environment validation.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeServer } = await import('./lib/config/init-server');
    initializeServer();
  }
}
