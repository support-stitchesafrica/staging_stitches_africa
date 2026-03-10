/**
 * Domain Validation Error Handling for Marketing Dashboard
 * Centralized error handling for invalid domain attempts
 * Requirements: 4.1, 4.2
 */

export enum DomainErrorCode {
  INVALID_DOMAIN = 'INVALID_DOMAIN',
  MISSING_EMAIL = 'MISSING_EMAIL',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  UNAUTHORIZED_DOMAIN = 'UNAUTHORIZED_DOMAIN',
  FIREBASE_DOMAIN_ERROR = 'FIREBASE_DOMAIN_ERROR'
}

export interface DomainError {
  code: DomainErrorCode;
  message: string;
  allowedDomains?: string[];
  timestamp: string;
  email?: string;
}

export class DomainValidationError extends Error {
  public readonly code: DomainErrorCode;
  public readonly allowedDomains: string[];
  public readonly timestamp: string;
  public readonly email?: string;

  constructor(
    code: DomainErrorCode,
    message: string,
    email?: string,
    allowedDomains: string[] = ['@stitchesafrica.com', '@stitchesafrica.pro']
  ) {
    super(message);
    this.name = 'DomainValidationError';
    this.code = code;
    this.allowedDomains = allowedDomains;
    this.timestamp = new Date().toISOString();
    this.email = email;
  }

  toJSON(): DomainError {
    return {
      code: this.code,
      message: this.message,
      allowedDomains: this.allowedDomains,
      timestamp: this.timestamp,
      email: this.email
    };
  }
}

/**
 * Factory functions for creating specific domain validation errors
 */
export class DomainErrorFactory {
  static invalidDomain(email: string): DomainValidationError {
    return new DomainValidationError(
      DomainErrorCode.INVALID_DOMAIN,
      'Only company emails are allowed. Contact an administrator.',
      email
    );
  }

  static missingEmail(): DomainValidationError {
    return new DomainValidationError(
      DomainErrorCode.MISSING_EMAIL,
      'Email is required'
    );
  }

  static invalidEmailFormat(email: string): DomainValidationError {
    return new DomainValidationError(
      DomainErrorCode.INVALID_EMAIL_FORMAT,
      'Invalid email format',
      email
    );
  }

  static unauthorizedDomain(email: string): DomainValidationError {
    return new DomainValidationError(
      DomainErrorCode.UNAUTHORIZED_DOMAIN,
      'You are not authorized to access this workspace. Contact the Super Admin for an invitation.',
      email
    );
  }

  static firebaseDomainError(email: string, originalError?: string): DomainValidationError {
    return new DomainValidationError(
      DomainErrorCode.FIREBASE_DOMAIN_ERROR,
      `Firebase operation failed due to domain restriction: ${originalError || 'Unknown error'}`,
      email
    );
  }
}

/**
 * Error handler for domain validation in API routes
 * @param error - The error to handle
 * @returns Formatted error response object
 */
export function handleDomainError(error: unknown): {
  error: string;
  code: string;
  allowedDomains?: string[];
  timestamp: string;
} {
  if (error instanceof DomainValidationError) {
    return {
      error: error.message,
      code: error.code,
      allowedDomains: error.allowedDomains,
      timestamp: error.timestamp
    };
  }

  // Handle generic errors
  return {
    error: error instanceof Error ? error.message : 'Unknown domain validation error',
    code: DomainErrorCode.INVALID_DOMAIN,
    timestamp: new Date().toISOString()
  };
}

/**
 * Logs domain validation errors for monitoring and debugging
 * @param error - The domain validation error
 * @param context - Additional context information
 */
export function logDomainError(
  error: DomainValidationError,
  context?: {
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    endpoint?: string;
  }
): void {
  const logEntry = {
    type: 'DOMAIN_VALIDATION_ERROR',
    error: error.toJSON(),
    context,
    severity: 'WARNING'
  };

  // In production, this would integrate with your logging service
  console.warn('Domain Validation Error:', JSON.stringify(logEntry, null, 2));
}

/**
 * Creates user-friendly error messages for different domain validation scenarios
 * @param code - The domain error code
 * @param email - The email that caused the error
 * @returns User-friendly error message
 */
export function getUserFriendlyErrorMessage(code: DomainErrorCode, email?: string): string {
  switch (code) {
    case DomainErrorCode.INVALID_DOMAIN:
      return 'Only company emails (@stitchesafrica.com or @stitchesafrica.pro) are allowed. Please use your company email address.';
    
    case DomainErrorCode.MISSING_EMAIL:
      return 'Please enter your email address to continue.';
    
    case DomainErrorCode.INVALID_EMAIL_FORMAT:
      return 'Please enter a valid email address.';
    
    case DomainErrorCode.UNAUTHORIZED_DOMAIN:
      return 'You are not authorized to access this workspace. Contact the Super Admin for an invitation.';
    
    case DomainErrorCode.FIREBASE_DOMAIN_ERROR:
      return 'Authentication failed due to domain restrictions. Please use your company email address.';
    
    default:
      return 'An error occurred during domain validation. Please try again or contact support.';
  }
}

/**
 * Validates if an error is a domain-related error
 * @param error - The error to check
 * @returns boolean indicating if it's a domain validation error
 */
export function isDomainValidationError(error: unknown): error is DomainValidationError {
  return error instanceof DomainValidationError;
}

/**
 * Extracts domain information from an error for reporting
 * @param error - The error to extract information from
 * @returns Domain error information or null
 */
export function extractDomainErrorInfo(error: unknown): DomainError | null {
  if (isDomainValidationError(error)) {
    return error.toJSON();
  }
  return null;
}