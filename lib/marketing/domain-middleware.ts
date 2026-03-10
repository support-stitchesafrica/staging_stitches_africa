/**
 * Domain Validation Middleware for Marketing Dashboard
 * Middleware to validate domains before Firebase operations
 * Requirements: 4.1, 4.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { DomainValidator, DomainValidationResult } from './domain-validator';

export interface DomainMiddlewareOptions {
  skipValidation?: boolean;
  customErrorMessage?: string;
}

/**
 * Middleware function to validate email domains in request body
 * @param request - Next.js request object
 * @param options - Optional configuration for middleware
 * @returns NextResponse with error if domain is invalid, null if valid
 */
export async function validateDomainMiddleware(
  request: NextRequest,
  options: DomainMiddlewareOptions = {}
): Promise<NextResponse | null> {
  if (options.skipValidation) {
    return null;
  }

  try {
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json(
        { 
          error: 'Email is required',
          code: 'MISSING_EMAIL'
        },
        { status: 400 }
      );
    }

    const validation = DomainValidator.validateEmailDomain(email);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: options.customErrorMessage || validation.error,
          code: 'INVALID_DOMAIN',
          allowedDomains: DomainValidator.getAllowedDomains()
        },
        { status: 403 }
      );
    }

    return null; // Validation passed
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Invalid request format',
        code: 'INVALID_REQUEST'
      },
      { status: 400 }
    );
  }
}

/**
 * Higher-order function to wrap API route handlers with domain validation
 * @param handler - The original API route handler
 * @param options - Optional configuration for middleware
 * @returns Wrapped handler with domain validation
 */
export function withDomainValidation(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>,
  options: DomainMiddlewareOptions = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    // Only validate for POST, PUT, PATCH requests that might contain email
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const validationError = await validateDomainMiddleware(request, options);
      if (validationError) {
        return validationError;
      }
    }

    return handler(request, context);
  };
}

/**
 * Validates domain for Firebase Auth operations
 * @param email - Email to validate before Firebase operation
 * @returns Promise that resolves if valid, rejects if invalid
 */
export async function validateDomainForFirebase(email: string): Promise<void> {
  const validation = DomainValidator.validateEmailDomain(email);
  
  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid email domain for Firebase operation');
  }
}

/**
 * Express-style middleware for domain validation
 * @param req - Request object with body containing email
 * @param res - Response object
 * @param next - Next function to call if validation passes
 */
export function expressDomainMiddleware(
  req: any,
  res: any,
  next: () => void
): void {
  const email = req.body?.email;

  if (!email) {
    res.status(400).json({
      error: 'Email is required',
      code: 'MISSING_EMAIL'
    });
    return;
  }

  const validation = DomainValidator.validateEmailDomain(email);
  
  if (!validation.isValid) {
    res.status(403).json({
      error: validation.error,
      code: 'INVALID_DOMAIN',
      allowedDomains: DomainValidator.getAllowedDomains()
    });
    return;
  }

  next();
}

/**
 * Utility function to create standardized domain validation error response
 * @param validation - Domain validation result
 * @param customMessage - Optional custom error message
 * @returns NextResponse with error details
 */
export function createDomainErrorResponse(
  validation: DomainValidationResult,
  customMessage?: string
): NextResponse {
  return NextResponse.json(
    {
      error: customMessage || validation.error,
      code: 'INVALID_DOMAIN',
      allowedDomains: DomainValidator.getAllowedDomains()
    },
    { status: 403 }
  );
}

/**
 * Validates domain and returns appropriate response for API routes
 * @param email - Email to validate
 * @param customErrorMessage - Optional custom error message
 * @returns null if valid, NextResponse with error if invalid
 */
export function validateDomainForAPI(
  email: string,
  customErrorMessage?: string
): NextResponse | null {
  if (!email) {
    return NextResponse.json(
      { 
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      },
      { status: 400 }
    );
  }

  const validation = DomainValidator.validateEmailDomain(email);
  
  if (!validation.isValid) {
    return createDomainErrorResponse(validation, customErrorMessage);
  }

  return null;
}