/**
 * JWT Configuration Module
 * 
 * Centralized configuration for JWT token generation and validation
 * across all invitation systems (Collections, Atlas, Marketing)
 */

export const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256' as const,
  expirationDays: 7
};

/**
 * Validates JWT configuration on application startup
 * Checks if JWT_SECRET exists and meets security requirements
 * 
 * @throws {Error} If JWT_SECRET is not configured or too weak
 */
export function validateJWTConfig(): void {
  console.log('[JWT Config] Validating JWT configuration...');
  
  // Check if JWT_SECRET exists
  if (!JWT_CONFIG.secret) {
    console.error('[JWT Config] CRITICAL: JWT_SECRET is not configured in environment variables');
    console.error('[JWT Config] Token generation and validation will fail');
    console.error('[JWT Config] Please set JWT_SECRET in your .env file with a secure random string');
    throw new Error('JWT_SECRET must be configured in environment variables. Set JWT_SECRET in .env file.');
  }
  
  // Validate minimum length for security
  const MIN_SECRET_LENGTH = 32;
  if (JWT_CONFIG.secret.length < MIN_SECRET_LENGTH) {
    console.error('[JWT Config] CRITICAL: JWT_SECRET is too weak');
    console.error('[JWT Config] Current length:', JWT_CONFIG.secret.length);
    console.error('[JWT Config] Required minimum length:', MIN_SECRET_LENGTH);
    console.error('[JWT Config] Please generate a stronger secret using: openssl rand -base64 32');
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long. Current length: ${JWT_CONFIG.secret.length}`);
  }
  
  console.log('[JWT Config] ✓ JWT configuration validated successfully', {
    secretLength: JWT_CONFIG.secret.length,
    algorithm: JWT_CONFIG.algorithm,
    expirationDays: JWT_CONFIG.expirationDays,
    timestamp: new Date().toISOString()
  });
}

/**
 * Gets the JWT secret with error handling
 * 
 * @returns {string} The JWT secret from environment variables
 * @throws {Error} If JWT_SECRET is not configured
 */
export function getJWTSecret(): string {
  if (!JWT_CONFIG.secret) {
    console.error('[JWT Config] Attempted to get JWT_SECRET but it is not configured');
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET environment variable.');
  }
  
  return JWT_CONFIG.secret;
}
