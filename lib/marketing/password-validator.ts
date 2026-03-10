/**
 * Password Validation and Security Service for Marketing Dashboard
 * Implements password strength requirements and secure token generation
 * Requirements: 5.1, 5.2, 14.1
 */

import { randomBytes, createHash } from 'crypto';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong' | 'very_strong';
  score: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  maxLength: number;
}

/**
 * Password Validator Class
 * Validates password strength and enforces security requirements
 */
export class PasswordValidator {
  private static readonly DEFAULT_REQUIREMENTS: PasswordRequirements = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128
  };

  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'monkey', '1234567', 'letmein', 'trustno1', 'dragon',
    'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
    'bailey', 'passw0rd', 'shadow', '123123', '654321',
    'superman', 'qazwsx', 'michael', 'football'
  ];

  /**
   * Validate password against requirements
   */
  static validatePassword(
    password: string,
    requirements: Partial<PasswordRequirements> = {}
  ): PasswordValidationResult {
    const reqs = { ...this.DEFAULT_REQUIREMENTS, ...requirements };
    const errors: string[] = [];
    let score = 0;

    // Check if password exists
    if (!password || typeof password !== 'string') {
      return {
        isValid: false,
        errors: ['Password is required'],
        strength: 'weak',
        score: 0
      };
    }

    // Length validation
    if (password.length < reqs.minLength) {
      errors.push(`Password must be at least ${reqs.minLength} characters long`);
    } else {
      score += 1;
      if (password.length >= 12) score += 1;
      if (password.length >= 16) score += 1;
    }

    if (password.length > reqs.maxLength) {
      errors.push(`Password must be less than ${reqs.maxLength} characters`);
    }

    // Uppercase validation
    if (reqs.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Lowercase validation
    if (reqs.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      score += 1;
    }

    // Number validation
    if (reqs.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      score += 1;
    }

    // Special character validation
    if (reqs.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    }

    // Check for common passwords
    if (this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more unique password');
      score = Math.max(0, score - 2);
    }

    // Check for sequential characters
    if (this.hasSequentialCharacters(password)) {
      errors.push('Password contains sequential characters. Please choose a more complex password');
      score = Math.max(0, score - 1);
    }

    // Check for repeated characters
    if (this.hasRepeatedCharacters(password)) {
      score = Math.max(0, score - 1);
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong' | 'very_strong';
    if (score <= 2) {
      strength = 'weak';
    } else if (score <= 4) {
      strength = 'medium';
    } else if (score <= 6) {
      strength = 'strong';
    } else {
      strength = 'very_strong';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
      score
    };
  }

  /**
   * Check if password is in common passwords list
   */
  private static isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return this.COMMON_PASSWORDS.some(common => 
      lowerPassword.includes(common) || common.includes(lowerPassword)
    );
  }

  /**
   * Check for sequential characters (abc, 123, etc.)
   */
  private static hasSequentialCharacters(password: string): boolean {
    const sequences = [
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
      'qwertyuiop',
      'asdfghjkl',
      'zxcvbnm'
    ];

    const lowerPassword = password.toLowerCase();
    
    for (const sequence of sequences) {
      for (let i = 0; i < sequence.length - 2; i++) {
        const subseq = sequence.substring(i, i + 3);
        if (lowerPassword.includes(subseq)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check for repeated characters (aaa, 111, etc.)
   */
  private static hasRepeatedCharacters(password: string): boolean {
    return /(.)\1{2,}/.test(password);
  }

  /**
   * Generate password strength message
   */
  static getStrengthMessage(result: PasswordValidationResult): string {
    switch (result.strength) {
      case 'weak':
        return 'Weak password. Please choose a stronger password.';
      case 'medium':
        return 'Medium strength password. Consider making it stronger.';
      case 'strong':
        return 'Strong password.';
      case 'very_strong':
        return 'Very strong password!';
    }
  }

  /**
   * Get password requirements as human-readable text
   */
  static getRequirementsText(requirements: Partial<PasswordRequirements> = {}): string[] {
    const reqs = { ...this.DEFAULT_REQUIREMENTS, ...requirements };
    const text: string[] = [];

    text.push(`At least ${reqs.minLength} characters long`);
    
    if (reqs.requireUppercase) {
      text.push('At least one uppercase letter');
    }
    
    if (reqs.requireLowercase) {
      text.push('At least one lowercase letter');
    }
    
    if (reqs.requireNumbers) {
      text.push('At least one number');
    }
    
    if (reqs.requireSpecialChars) {
      text.push('At least one special character (!@#$%^&*...)');
    }

    return text;
  }
}

/**
 * Secure Token Generator
 * Generates cryptographically secure tokens for various purposes
 */
export class SecureTokenGenerator {
  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure session token
   */
  static generateSessionToken(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = this.generateToken(24);
    return `sess_${timestamp}_${randomPart}`;
  }

  /**
   * Generate a secure invitation token
   */
  static generateInvitationToken(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = this.generateToken(32);
    return `inv_${timestamp}_${randomPart}`;
  }

  /**
   * Generate a secure reset token
   */
  static generateResetToken(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = this.generateToken(32);
    return `rst_${timestamp}_${randomPart}`;
  }

  /**
   * Generate a secure API key
   */
  static generateApiKey(): string {
    const prefix = 'mk'; // marketing key
    const randomPart = this.generateToken(32);
    return `${prefix}_${randomPart}`;
  }

  /**
   * Generate a secure verification code (numeric)
   */
  static generateVerificationCode(length: number = 6): string {
    const bytes = randomBytes(length);
    let code = '';
    
    for (let i = 0; i < length; i++) {
      code += (bytes[i] % 10).toString();
    }
    
    return code;
  }

  /**
   * Hash a token for storage
   */
  static hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Verify a token against its hash
   */
  static verifyToken(token: string, hash: string): boolean {
    const tokenHash = this.hashToken(token);
    return tokenHash === hash;
  }

  /**
   * Generate a time-based one-time token
   */
  static generateTOTP(secret: string, timeStep: number = 30): string {
    const time = Math.floor(Date.now() / 1000 / timeStep);
    const hash = createHash('sha256')
      .update(`${secret}${time}`)
      .digest('hex');
    
    // Take first 6 digits
    const code = parseInt(hash.substring(0, 8), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  /**
   * Verify a TOTP code
   */
  static verifyTOTP(
    code: string,
    secret: string,
    timeStep: number = 30,
    window: number = 1
  ): boolean {
    // Check current time and adjacent time windows
    for (let i = -window; i <= window; i++) {
      const time = Math.floor(Date.now() / 1000 / timeStep) + i;
      const hash = createHash('sha256')
        .update(`${secret}${time}`)
        .digest('hex');
      
      const expectedCode = (parseInt(hash.substring(0, 8), 16) % 1000000)
        .toString()
        .padStart(6, '0');
      
      if (code === expectedCode) {
        return true;
      }
    }
    
    return false;
  }
}

/**
 * Session Timeout Manager
 * Manages session timeouts and idle detection
 */
export class SessionTimeoutManager {
  private static readonly DEFAULT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly WARNING_BEFORE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  /**
   * Calculate session expiration time
   */
  static calculateExpirationTime(
    createdAt: Date,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Date {
    return new Date(createdAt.getTime() + timeout);
  }

  /**
   * Check if session is expired
   */
  static isSessionExpired(expiresAt: Date): boolean {
    return expiresAt.getTime() < Date.now();
  }

  /**
   * Check if session is about to expire
   */
  static isSessionAboutToExpire(expiresAt: Date): boolean {
    const timeUntilExpiry = expiresAt.getTime() - Date.now();
    return timeUntilExpiry > 0 && timeUntilExpiry <= this.WARNING_BEFORE_TIMEOUT;
  }

  /**
   * Calculate idle time
   */
  static calculateIdleTime(lastAccessAt: Date): number {
    return Date.now() - lastAccessAt.getTime();
  }

  /**
   * Check if session is idle
   */
  static isSessionIdle(lastAccessAt: Date): boolean {
    return this.calculateIdleTime(lastAccessAt) >= this.IDLE_TIMEOUT;
  }

  /**
   * Extend session expiration
   */
  static extendSession(
    currentExpiresAt: Date,
    extensionTime: number = this.DEFAULT_TIMEOUT
  ): Date {
    return new Date(Date.now() + extensionTime);
  }

  /**
   * Get remaining session time in milliseconds
   */
  static getRemainingTime(expiresAt: Date): number {
    return Math.max(0, expiresAt.getTime() - Date.now());
  }

  /**
   * Get remaining session time in human-readable format
   */
  static getRemainingTimeFormatted(expiresAt: Date): string {
    const remaining = this.getRemainingTime(expiresAt);
    
    if (remaining === 0) {
      return 'Expired';
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    
    return `${minutes}m`;
  }

  /**
   * Get session timeout configuration
   */
  static getTimeoutConfig() {
    return {
      sessionTimeout: this.DEFAULT_TIMEOUT,
      idleTimeout: this.IDLE_TIMEOUT,
      warningBeforeTimeout: this.WARNING_BEFORE_TIMEOUT
    };
  }
}

// Export utility functions
export const passwordUtils = {
  validatePassword: PasswordValidator.validatePassword,
  getStrengthMessage: PasswordValidator.getStrengthMessage,
  getRequirementsText: PasswordValidator.getRequirementsText
};

export const tokenUtils = {
  generateToken: SecureTokenGenerator.generateToken,
  generateSessionToken: SecureTokenGenerator.generateSessionToken,
  generateInvitationToken: SecureTokenGenerator.generateInvitationToken,
  generateResetToken: SecureTokenGenerator.generateResetToken,
  generateApiKey: SecureTokenGenerator.generateApiKey,
  generateVerificationCode: SecureTokenGenerator.generateVerificationCode,
  hashToken: SecureTokenGenerator.hashToken,
  verifyToken: SecureTokenGenerator.verifyToken
};

export const sessionTimeoutUtils = {
  calculateExpirationTime: SessionTimeoutManager.calculateExpirationTime,
  isSessionExpired: SessionTimeoutManager.isSessionExpired,
  isSessionAboutToExpire: SessionTimeoutManager.isSessionAboutToExpire,
  isSessionIdle: SessionTimeoutManager.isSessionIdle,
  extendSession: SessionTimeoutManager.extendSession,
  getRemainingTime: SessionTimeoutManager.getRemainingTime,
  getRemainingTimeFormatted: SessionTimeoutManager.getRemainingTimeFormatted
};
