/**
 * Server Initialization Module
 * 
 * This module runs during server startup to validate critical environment
 * variables and ensure the application is properly configured before
 * handling any requests.
 * 
 * Import this module at the top of your root layout or any server-side
 * entry point to ensure validation runs early.
 */

import { validateEnvironmentVariables } from './validate-env';

let isInitialized = false;

/**
 * Initialize server-side configuration and validation
 * This function is idempotent - it will only run once
 */
export function initializeServer(): void {
  // Only run initialization once
  if (isInitialized) {
    return;
  }

  // Skip initialization during build time to avoid duplicate Firebase initialization
  // The validation will run when the server actually starts
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('[Server Init] Skipping initialization during build phase');
    return;
  }

  console.log('[Server Init] Starting server initialization...');
  
  try {
    // Validate environment variables
    validateEnvironmentVariables();
    
    isInitialized = true;
    console.log('[Server Init] Server initialization completed successfully');
  } catch (error) {
    console.error('[Server Init] Server initialization failed:', error);
    
    // In production, we want to fail fast if critical configuration is missing
    if (process.env.NODE_ENV === 'production') {
      console.error('[Server Init] CRITICAL: Application cannot start without required environment variables');
      throw error;
    } else {
      // In development, log the error but allow the app to continue
      // This helps developers identify configuration issues without blocking development
      console.warn('[Server Init] WARNING: Continuing in development mode despite configuration errors');
      console.warn('[Server Init] Please fix the configuration issues before deploying to production');
    }
  }
}

// Note: This module is called from instrumentation.ts
// Do not auto-execute here to avoid issues during build
