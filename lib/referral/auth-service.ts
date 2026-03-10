import jwt from 'jsonwebtoken';
import { ReferralUser } from './types';

export interface ReferralJWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token for a referral user
 * Token expires in 7 days
 */
export async function generateToken(user: ReferralUser): Promise<string> {
  const payload: Omit<ReferralJWTPayload, 'iat' | 'exp'> = {
    userId: user.userId,
    email: user.email,
    isAdmin: user.isAdmin,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
  });

  return token;
}

/**
 * Validate a JWT token and return the decoded payload
 * Returns null if token is invalid or expired
 */
export async function validateToken(
  token: string
): Promise<ReferralJWTPayload | null> {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as ReferralJWTPayload;
    return decoded;
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

/**
 * Refresh a token by generating a new one with the same payload
 * Used to extend session before expiration
 */
export async function refreshToken(
  currentToken: string
): Promise<string | null> {
  const payload = await validateToken(currentToken);
  
  if (!payload) {
    return null;
  }

  // Generate new token with same user data
  const newToken = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      isAdmin: payload.isAdmin,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '7d',
    }
  );

  return newToken;
}
