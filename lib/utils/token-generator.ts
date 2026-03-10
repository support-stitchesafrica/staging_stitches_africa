/**
 * Token Generator Utility
 * 
 * Centralized token generation for invitation systems
 * Ensures consistent JWT token creation across Collections, Atlas, and Marketing
 */

import { sign } from 'jsonwebtoken';
import { getJWTSecret, JWT_CONFIG } from '@/lib/config/jwt-config';

/**
 * Payload structure for invitation tokens
 */
export interface InvitationTokenPayload {
  inviteId: string;
  email: string;
  role: string;
  system: 'atlas' | 'collections' | 'marketing';
  expiresAt: number; // milliseconds
}

/**
 * Generates a unique identifier for JWT jti field
 * Uses crypto.getRandomValues for secure random generation
 * 
 * @returns {string} A unique 32-character hexadecimal string
 */
export function generateUniqueId(): string {
  // Generate 16 random bytes (128 bits)
  const randomBytes = crypto.getRandomValues(new Uint8Array(16));
  
  // Convert to hexadecimal string
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generates a JWT invitation token with consistent configuration
 * 
 * @param {InvitationTokenPayload} payload - The invitation data to encode
 * @returns {string} A signed JWT token
 * @throws {Error} If JWT_SECRET is not configured
 * 
 * @example
 * const token = generateInvitationToken({
 *   inviteId: 'inv_123',
 *   email: 'user@example.com',
 *   role: 'member',
 *   system: 'collections',
 *   expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
 * });
 */
export function generateInvitationToken(payload: InvitationTokenPayload): string {
  console.log('[Token Generation] Starting token generation', {
    inviteId: payload.inviteId,
    email: payload.email,
    role: payload.role,
    system: payload.system,
    expiresAt: new Date(payload.expiresAt).toISOString(),
    timestamp: new Date().toISOString()
  });

  // Get JWT secret with error handling
  const secret = getJWTSecret();

  // Create JWT payload with standard claims
  const jwtPayload = {
    inviteId: payload.inviteId,
    email: payload.email,
    role: payload.role,
    system: payload.system,
    exp: Math.floor(payload.expiresAt / 1000), // JWT expects seconds, not milliseconds
    iat: Math.floor(Date.now() / 1000), // Issued at (seconds)
    jti: generateUniqueId() // JWT ID for uniqueness
  };

  console.log('[Token Generation] JWT payload prepared', {
    hasInviteId: !!jwtPayload.inviteId,
    hasEmail: !!jwtPayload.email,
    hasRole: !!jwtPayload.role,
    hasSystem: !!jwtPayload.system,
    expiresInSeconds: jwtPayload.exp,
    issuedAtSeconds: jwtPayload.iat,
    jtiLength: jwtPayload.jti.length
  });

  try {
    // Sign the token using HS256 algorithm
    const token = sign(jwtPayload, secret, { 
      algorithm: JWT_CONFIG.algorithm 
    });

    console.log('[Token Generation] Token created successfully', {
      tokenLength: token.length,
      tokenPrefix: token.substring(0, 20) + '...',
      algorithm: JWT_CONFIG.algorithm,
      inviteId: payload.inviteId,
      system: payload.system
    });

    return token;
  } catch (error) {
    console.error('[Token Generation] Failed to generate token', {
      error: error instanceof Error ? error.message : 'Unknown error',
      inviteId: payload.inviteId,
      system: payload.system
    });
    throw error;
  }
}
