/**
 * Environment variable validation utility
 * Ensures all required environment variables are present
 */

interface EnvConfig {
  // Firebase Configuration
  NEXT_PUBLIC_FIREBASE_API_KEY: string;
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: string;
  NEXT_PUBLIC_FIREBASE_APP_ID: string;

  // Payment Configuration
  NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: string;
  NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

  // API Configuration
  NEXT_PUBLIC_DHL_API_BASE: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY',
  'NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_DHL_API_BASE',
];

/**
 * Validates that all required environment variables are present
 * @returns Object with validation results
 */
export function validateEnvironmentVariables(): {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
} {
  const missingVars: string[] = [];
  const errors: string[] = [];

  // Check for missing environment variables
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (!value || value.trim() === '') {
      missingVars.push(envVar);
    }
  }

  // Validate specific environment variable formats
  const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (firebaseApiKey && !firebaseApiKey.startsWith('AIza')) {
    errors.push('NEXT_PUBLIC_FIREBASE_API_KEY appears to be invalid (should start with "AIza")');
  }

  const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (stripeKey && !stripeKey.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY appears to be invalid (should start with "pk_")');
  }

  const flutterwaveKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  if (flutterwaveKey && !flutterwaveKey.startsWith('FLWPUBK-')) {
    errors.push('NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY appears to be invalid (should start with "FLWPUBK-")');
  }

  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY;
  if (paystackKey && !paystackKey.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY appears to be invalid (should start with "pk_")');
  }

  return {
    isValid: missingVars.length === 0 && errors.length === 0,
    missingVars,
    errors,
  };
}

/**
 * Gets environment configuration with validation
 * @returns Validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid) {
    const errorMessage = [
      'Environment validation failed:',
      ...validation.missingVars.map(v => `  - Missing: ${v}`),
      ...validation.errors.map(e => `  - Error: ${e}`),
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
    NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY!,
    NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY: process.env.NEXT_PUBLIC_PAYSTACK_LIVE_PUBLIC_KEY!,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    NEXT_PUBLIC_DHL_API_BASE: process.env.NEXT_PUBLIC_DHL_API_BASE!,
  };
}

/**
 * Logs environment validation results (for development)
 */
export function logEnvironmentValidation(): void {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateEnvironmentVariables();
    
    if (validation.isValid) {
      console.log('✅ All environment variables are valid');
    } else {
      console.warn('⚠️ Environment validation issues:');
      validation.missingVars.forEach(v => console.warn(`  - Missing: ${v}`));
      validation.errors.forEach(e => console.warn(`  - Error: ${e}`));
    }
  }
}