/**
 * Environment Variable Validation Utility
 * 
 * Validates that all required environment variables are properly configured
 * for the invitation token system to function correctly.
 */

import { validateJWTConfig } from './jwt-config';

export function validateEnvironmentVariables(): void {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate JWT configuration (includes JWT_SECRET check)
  try {
    validateJWTConfig();
  } catch (error) {
    if (error instanceof Error) {
      errors.push(error.message);
    } else {
      errors.push('JWT configuration validation failed');
    }
  }

  // Check Firebase Admin credentials
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
    errors.push('FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 is not configured');
  }

  // Check base URL
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    warnings.push('NEXT_PUBLIC_BASE_URL is not configured, using default');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('[Environment Validation] Warnings:', warnings);
  }

  // Throw error if critical variables are missing
  if (errors.length > 0) {
    console.error('[Environment Validation] Critical errors:', errors);
    throw new Error(`Missing required environment variables: ${errors.join(', ')}`);
  }

  console.log('[Environment Validation] All required environment variables are configured');
}
