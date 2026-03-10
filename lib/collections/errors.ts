/**
 * Collections Error Handling Utilities
 * 
 * This module provides error classification, formatting, and logging
 * utilities for the Collections team management system.
 */

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = "VALIDATION",
  PERMISSION = "PERMISSION",
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  UNKNOWN = "UNKNOWN",
}

/**
 * Error codes for specific error types
 */
export enum ErrorCode {
  // Validation errors
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_ROLE = "INVALID_ROLE",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  
  // Permission errors
  PERMISSION_DENIED = "PERMISSION_DENIED",
  INSUFFICIENT_ROLE = "INSUFFICIENT_ROLE",
  LAST_SUPERADMIN = "LAST_SUPERADMIN",
  SELF_DEACTIVATION = "SELF_DEACTIVATION",
  
  // Network errors
  NETWORK_ERROR = "NETWORK_ERROR",
  REQUEST_TIMEOUT = "REQUEST_TIMEOUT",
  SERVER_ERROR = "SERVER_ERROR",
  
  // Authentication errors
  INVALID_TOKEN = "INVALID_TOKEN",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  UNAUTHORIZED = "UNAUTHORIZED",
  
  // Resource errors
  USER_NOT_FOUND = "USER_NOT_FOUND",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",
  INVITATION_NOT_FOUND = "INVITATION_NOT_FOUND",
  INVITATION_EXPIRED = "INVITATION_EXPIRED",
  
  // Generic
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Structured error interface
 */
export interface CollectionsError {
  category: ErrorCategory;
  code: ErrorCode;
  message: string;
  details?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Error code to category mapping
 */
const ERROR_CODE_CATEGORY_MAP: Record<ErrorCode, ErrorCategory> = {
  [ErrorCode.INVALID_EMAIL]: ErrorCategory.VALIDATION,
  [ErrorCode.INVALID_ROLE]: ErrorCategory.VALIDATION,
  [ErrorCode.MISSING_REQUIRED_FIELD]: ErrorCategory.VALIDATION,
  
  [ErrorCode.PERMISSION_DENIED]: ErrorCategory.PERMISSION,
  [ErrorCode.INSUFFICIENT_ROLE]: ErrorCategory.PERMISSION,
  [ErrorCode.LAST_SUPERADMIN]: ErrorCategory.PERMISSION,
  [ErrorCode.SELF_DEACTIVATION]: ErrorCategory.PERMISSION,
  
  [ErrorCode.NETWORK_ERROR]: ErrorCategory.NETWORK,
  [ErrorCode.REQUEST_TIMEOUT]: ErrorCategory.NETWORK,
  [ErrorCode.SERVER_ERROR]: ErrorCategory.NETWORK,
  
  [ErrorCode.INVALID_TOKEN]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.TOKEN_EXPIRED]: ErrorCategory.AUTHENTICATION,
  [ErrorCode.UNAUTHORIZED]: ErrorCategory.AUTHENTICATION,
  
  [ErrorCode.USER_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [ErrorCode.USER_ALREADY_EXISTS]: ErrorCategory.CONFLICT,
  [ErrorCode.INVITATION_NOT_FOUND]: ErrorCategory.NOT_FOUND,
  [ErrorCode.INVITATION_EXPIRED]: ErrorCategory.VALIDATION,
  
  [ErrorCode.UNKNOWN_ERROR]: ErrorCategory.UNKNOWN,
};

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_EMAIL]: "Please enter a valid email address",
  [ErrorCode.INVALID_ROLE]: "The selected role is not valid",
  [ErrorCode.MISSING_REQUIRED_FIELD]: "Please fill in all required fields",
  
  [ErrorCode.PERMISSION_DENIED]: "You don't have permission to perform this action",
  [ErrorCode.INSUFFICIENT_ROLE]: "Your role doesn't have access to this feature",
  [ErrorCode.LAST_SUPERADMIN]: "Cannot modify the last Super Admin",
  [ErrorCode.SELF_DEACTIVATION]: "You cannot deactivate your own account",
  
  [ErrorCode.NETWORK_ERROR]: "Network error. Please check your connection and try again",
  [ErrorCode.REQUEST_TIMEOUT]: "Request timed out. Please try again",
  [ErrorCode.SERVER_ERROR]: "Server error. Please try again later",
  
  [ErrorCode.INVALID_TOKEN]: "Invalid authentication token",
  [ErrorCode.TOKEN_EXPIRED]: "Your session has expired. Please sign in again",
  [ErrorCode.UNAUTHORIZED]: "You must be signed in to perform this action",
  
  [ErrorCode.USER_NOT_FOUND]: "User not found",
  [ErrorCode.USER_ALREADY_EXISTS]: "A user with this email already exists",
  [ErrorCode.INVITATION_NOT_FOUND]: "Invitation not found or has been used",
  [ErrorCode.INVITATION_EXPIRED]: "This invitation has expired. Please request a new one",
  
  [ErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again",
};

/**
 * Classify an error by its code
 */
export function classifyError(code: ErrorCode): ErrorCategory {
  return ERROR_CODE_CATEGORY_MAP[code] || ErrorCategory.UNKNOWN;
}

/**
 * Create a structured error object
 */
export function createError(
  code: ErrorCode,
  details?: string,
  context?: Record<string, any>
): CollectionsError {
  return {
    category: classifyError(code),
    code,
    message: ERROR_MESSAGES[code],
    details,
    timestamp: new Date(),
    context,
  };
}

/**
 * Format error for display to users
 */
export function formatErrorMessage(error: CollectionsError | Error | unknown): string {
  if (isCollectionsError(error)) {
    return error.details ? `${error.message}: ${error.details}` : error.message;
  }
  
  if (error instanceof Error) {
    return error.message || ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
  }
  
  if (typeof error === "string") {
    return error;
  }
  
  return ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}

/**
 * Type guard to check if error is a CollectionsError
 */
export function isCollectionsError(error: any): error is CollectionsError {
  return (
    error &&
    typeof error === "object" &&
    "category" in error &&
    "code" in error &&
    "message" in error &&
    "timestamp" in error
  );
}

/**
 * Parse API error response
 */
export function parseApiError(response: any): CollectionsError {
  if (response?.error) {
    const errorCode = response.code as ErrorCode;
    if (errorCode && ERROR_MESSAGES[errorCode]) {
      return createError(errorCode, response.error);
    }
    return createError(ErrorCode.UNKNOWN_ERROR, response.error);
  }
  
  return createError(ErrorCode.UNKNOWN_ERROR);
}

/**
 * Parse Firebase error
 */
export function parseFirebaseError(error: any): CollectionsError {
  const code = error?.code || "";
  
  // Authentication errors
  if (code.includes("auth/")) {
    if (code.includes("expired")) {
      return createError(ErrorCode.TOKEN_EXPIRED);
    }
    if (code.includes("invalid")) {
      return createError(ErrorCode.INVALID_TOKEN);
    }
    if (code.includes("unauthorized")) {
      return createError(ErrorCode.UNAUTHORIZED);
    }
  }
  
  // Firestore errors
  if (code.includes("permission-denied")) {
    return createError(ErrorCode.PERMISSION_DENIED);
  }
  
  if (code.includes("not-found")) {
    return createError(ErrorCode.USER_NOT_FOUND);
  }
  
  if (code.includes("already-exists")) {
    return createError(ErrorCode.USER_ALREADY_EXISTS);
  }
  
  // Network errors
  if (code.includes("network") || code.includes("unavailable")) {
    return createError(ErrorCode.NETWORK_ERROR);
  }
  
  return createError(ErrorCode.UNKNOWN_ERROR, error?.message);
}

/**
 * Log error to console with structured format
 */
export function logError(
  error: CollectionsError | Error | unknown,
  context?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  
  if (isCollectionsError(error)) {
    console.error(`[Collections Error] ${timestamp}`, {
      category: error.category,
      code: error.code,
      message: error.message,
      details: error.details,
      context: { ...error.context, ...context },
    });
  } else if (error instanceof Error) {
    console.error(`[Collections Error] ${timestamp}`, {
      category: ErrorCategory.UNKNOWN,
      message: error.message,
      stack: error.stack,
      context,
    });
  } else {
    console.error(`[Collections Error] ${timestamp}`, {
      category: ErrorCategory.UNKNOWN,
      error,
      context,
    });
  }
}

/**
 * Log error and return formatted message
 */
export function handleError(
  error: CollectionsError | Error | unknown,
  context?: Record<string, any>
): string {
  logError(error, context);
  return formatErrorMessage(error);
}

/**
 * Validate email format
 */
export function validateEmail(email: string): CollectionsError | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return createError(ErrorCode.INVALID_EMAIL);
  }
  return null;
}

/**
 * Validate role
 */
export function validateRole(role: string): CollectionsError | null {
  const validRoles = ["superadmin", "editor", "viewer"];
  if (!role || !validRoles.includes(role)) {
    return createError(ErrorCode.INVALID_ROLE);
  }
  return null;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  fields: Record<string, any>,
  requiredFields: string[]
): CollectionsError | null {
  const missingFields = requiredFields.filter(
    (field) => !fields[field] || fields[field].toString().trim() === ""
  );
  
  if (missingFields.length > 0) {
    return createError(
      ErrorCode.MISSING_REQUIRED_FIELD,
      `Missing: ${missingFields.join(", ")}`
    );
  }
  
  return null;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: CollectionsError | Error | unknown): boolean {
  if (isCollectionsError(error)) {
    return (
      error.category === ErrorCategory.NETWORK ||
      error.code === ErrorCode.REQUEST_TIMEOUT ||
      error.code === ErrorCode.SERVER_ERROR
    );
  }
  return false;
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 */
export function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 10000);
}
