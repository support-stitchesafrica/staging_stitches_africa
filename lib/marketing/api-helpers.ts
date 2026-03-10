/**
 * API Route Helpers for Marketing Dashboard
 * Combines authentication, domain validation, and role-based access control
 * Requirements: 6.1, 7.1, 8.1, 9.1, 4.1, 4.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  authenticateRequest, 
  AuthContext, 
  AuthMiddlewareOptions,
  UserPermissions 
} from './auth-middleware';
import { validateDomainForAPI } from './domain-middleware';

export interface ApiRouteOptions extends AuthMiddlewareOptions {
  validateDomain?: boolean;
  customDomainError?: string;
}

export interface ApiHandler {
  (request: NextRequest, context: AuthContext, params?: any): Promise<NextResponse>;
}

export interface PublicApiHandler {
  (request: NextRequest, params?: any): Promise<NextResponse>;
}

/**
 * Creates a protected API route with authentication and domain validation
 * @param handler - The API route handler
 * @param options - Configuration options
 * @returns Protected API route handler
 */
export function createProtectedRoute(
  handler: ApiHandler,
  options: ApiRouteOptions = {}
): (request: NextRequest, params?: any) => Promise<NextResponse> {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    try {
      // Domain validation for POST/PUT/PATCH requests
      if (options.validateDomain && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const body = await request.clone().json().catch(() => ({}));
        if (body.email) {
          const domainError = validateDomainForAPI(body.email, options.customDomainError);
          if (domainError) {
            return domainError;
          }
        }
      }

      // Authentication
      const authResult = await authenticateRequest(request, options);
      if (authResult instanceof NextResponse) {
        return authResult;
      }

      // Call the handler with authenticated context
      return await handler(request, authResult, params);

    } catch (error) {
      console.error('API route error:', error);
      return NextResponse.json(
        { 
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Creates a public API route (no authentication required)
 * @param handler - The API route handler
 * @param options - Configuration options
 * @returns Public API route handler
 */
export function createPublicRoute(
  handler: PublicApiHandler,
  options: { validateDomain?: boolean; customDomainError?: string } = {}
): (request: NextRequest, params?: any) => Promise<NextResponse> {
  return async (request: NextRequest, params?: any): Promise<NextResponse> => {
    try {
      // Domain validation for POST/PUT/PATCH requests
      if (options.validateDomain && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const body = await request.clone().json().catch(() => ({}));
        if (body.email) {
          const domainError = validateDomainForAPI(body.email, options.customDomainError);
          if (domainError) {
            return domainError;
          }
        }
      }

      return await handler(request, params);

    } catch (error) {
      console.error('Public API route error:', error);
      return NextResponse.json(
        { 
          error: 'Internal server error',
          code: 'INTERNAL_ERROR'
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Role-based route protection helpers
 */
export const ProtectedRoutes = {
  /**
   * Super Admin only routes
   */
  superAdminOnly: (handler: ApiHandler) => 
    createProtectedRoute(handler, { requiredRole: 'super_admin' }),

  /**
   * Team Lead and above routes
   */
  teamLeadAndAbove: (handler: ApiHandler) => 
    createProtectedRoute(handler, { 
      requiredPermissions: ['canManageTeams'] 
    }),

  /**
   * BDM and above routes
   */
  bdmAndAbove: (handler: ApiHandler) => 
    createProtectedRoute(handler, { 
      requiredPermissions: ['canAssignVendors'] 
    }),

  /**
   * Any authenticated user routes
   */
  authenticated: (handler: ApiHandler) => 
    createProtectedRoute(handler),

  /**
   * Custom permission-based routes
   */
  withPermissions: (permissions: (keyof UserPermissions)[], handler: ApiHandler) =>
    createProtectedRoute(handler, { requiredPermissions: permissions }),

  /**
   * Custom role-based routes
   */
  withRole: (role: 'super_admin' | 'team_lead' | 'bdm' | 'team_member', handler: ApiHandler) =>
    createProtectedRoute(handler, { requiredRole: role })
};

/**
 * Utility functions for common API operations
 */
export const ApiUtils = {
  /**
   * Creates a success response
   */
  success: (data: any, status = 200) => 
    NextResponse.json({ success: true, data }, { status }),

  /**
   * Creates an error response
   */
  error: (message: string, code: string, status = 400) => 
    NextResponse.json({ 
      success: false, 
      error: message, 
      code 
    }, { status }),

  /**
   * Creates a validation error response
   */
  validationError: (errors: Record<string, string>) => 
    NextResponse.json({ 
      success: false, 
      error: 'Validation failed', 
      code: 'VALIDATION_ERROR',
      errors 
    }, { status: 400 }),

  /**
   * Creates an unauthorized response
   */
  unauthorized: (message = 'Unauthorized') => 
    NextResponse.json({ 
      success: false, 
      error: message, 
      code: 'UNAUTHORIZED' 
    }, { status: 401 }),

  /**
   * Creates a forbidden response
   */
  forbidden: (message = 'Forbidden') => 
    NextResponse.json({ 
      success: false, 
      error: message, 
      code: 'FORBIDDEN' 
    }, { status: 403 }),

  /**
   * Creates a not found response
   */
  notFound: (message = 'Not found') => 
    NextResponse.json({ 
      success: false, 
      error: message, 
      code: 'NOT_FOUND' 
    }, { status: 404 }),

  /**
   * Parses and validates JSON body
   */
  parseBody: async <T = any>(request: NextRequest): Promise<T> => {
    try {
      return await request.json();
    } catch (error) {
      throw new Error('Invalid JSON body');
    }
  },

  /**
   * Validates required fields in request body
   */
  validateRequired: (body: any, fields: string[]): string[] => {
    const missing: string[] = [];
    for (const field of fields) {
      if (!body[field]) {
        missing.push(field);
      }
    }
    return missing;
  }
};

/**
 * CORS helper for API routes
 */
export function withCors(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID');
  return response;
}

/**
 * Handles OPTIONS requests for CORS
 */
export function handleOptions(): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  return withCors(response);
}

/**
 * Example usage patterns for different types of routes
 */
export const RouteExamples = {
  // Super Admin only route
  superAdminRoute: ProtectedRoutes.superAdminOnly(async (request, context) => {
    // Only super admins can access this
    return ApiUtils.success({ message: 'Super admin access granted' });
  }),

  // Team Lead route with domain validation
  teamLeadRoute: createProtectedRoute(
    async (request, context) => {
      // Team leads and above can access this
      return ApiUtils.success({ user: context.user });
    },
    { 
      requiredPermissions: ['canManageTeams'],
      validateDomain: true 
    }
  ),

  // Public route with domain validation
  publicRoute: createPublicRoute(
    async (request) => {
      const body = await ApiUtils.parseBody(request);
      return ApiUtils.success({ received: body });
    },
    { validateDomain: true }
  ),

  // BDM vendor assignment route
  vendorAssignmentRoute: ProtectedRoutes.withPermissions(
    ['canAssignVendors'],
    async (request, context) => {
      const body = await ApiUtils.parseBody(request);
      const missing = ApiUtils.validateRequired(body, ['vendorId', 'assignedToUserId']);
      
      if (missing.length > 0) {
        return ApiUtils.validationError({ 
          missing: `Required fields: ${missing.join(', ')}` 
        });
      }

      // Process vendor assignment
      return ApiUtils.success({ assigned: true });
    }
  )
};