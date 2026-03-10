/**
 * Authentication Guard Utilities
 * 
 * Provides utility functions for programmatic authentication checks,
 * route protection, and access control throughout the application.
 */

import { 
    RouteProtectionConfig, 
    UserAccessContext, 
    determineRouteAccess,
    createRedirectUrl,
    validateRedirectUrl 
} from './route-protection-utils';

/**
 * Authentication check result
 */
export interface AuthCheckResult {
    isAllowed: boolean;
    shouldRedirect: boolean;
    redirectUrl?: string;
    reason?: string;
    message?: string;
}

/**
 * Performs a comprehensive authentication check for a given route
 */
export function performAuthCheck(
    config: RouteProtectionConfig,
    userContext: UserAccessContext,
    currentPath: string,
    searchParams?: URLSearchParams
): AuthCheckResult {
    const accessResult = determineRouteAccess(config, userContext);
    
    if (accessResult.allowed) {
        return {
            isAllowed: true,
            shouldRedirect: false
        };
    }

    if (accessResult.redirectTo) {
        const redirectUrl = createRedirectUrl(accessResult.redirectTo, currentPath, searchParams);
        
        return {
            isAllowed: false,
            shouldRedirect: true,
            redirectUrl,
            reason: accessResult.reason,
            message: accessResult.message
        };
    }

    return {
        isAllowed: false,
        shouldRedirect: false,
        reason: accessResult.reason,
        message: accessResult.message
    };
}

/**
 * Checks if a user can access a specific route without redirecting
 */
export function canAccessRoute(
    config: RouteProtectionConfig,
    userContext: UserAccessContext
): boolean {
    const accessResult = determineRouteAccess(config, userContext);
    return accessResult.allowed;
}

/**
 * Gets the appropriate redirect URL for an unauthenticated user
 */
export function getAuthRedirectUrl(
    currentPath: string,
    searchParams?: URLSearchParams,
    authPath = '/auth'
): string {
    return createRedirectUrl(authPath, currentPath, searchParams);
}

/**
 * Validates and extracts return URL from authentication flow
 */
export function getReturnUrl(searchParams: URLSearchParams, fallback = '/'): string {
    const redirect = searchParams.get('redirect') || searchParams.get('returnTo');
    
    if (redirect && validateRedirectUrl(redirect)) {
        return redirect;
    }
    
    return fallback;
}

/**
 * Creates a middleware function for Next.js API routes
 */
export function createAuthMiddleware(config: RouteProtectionConfig = { requireAuth: true }) {
    return (userContext: UserAccessContext) => {
        const accessResult = determineRouteAccess(config, userContext);
        
        return {
            allowed: accessResult.allowed,
            status: accessResult.allowed ? 200 : 401,
            error: accessResult.allowed ? null : {
                code: accessResult.reason || 'access_denied',
                message: accessResult.message || 'Access denied'
            }
        };
    };
}

/**
 * Route protection presets for common authentication patterns
 */
export const AuthGuardPresets = {
    /**
     * Public route - no authentication required
     */
    public: {
        requireAuth: false,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig,

    /**
     * Standard protected route - requires auth, allows first-time users
     */
    protected: {
        requireAuth: true,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig,

    /**
     * Onboarding required - for routes that need completed setup
     */
    onboardingRequired: {
        requireAuth: true,
        allowFirstTime: false,
        requireOnboarding: true
    } as RouteProtectionConfig,

    /**
     * First-time users only - for onboarding flows
     */
    firstTimeOnly: {
        requireAuth: true,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig,

    /**
     * Existing users only - skip onboarding screens
     */
    existingUsersOnly: {
        requireAuth: true,
        allowFirstTime: false,
        requireOnboarding: false
    } as RouteProtectionConfig,

    /**
     * Admin only - requires specific role
     */
    adminOnly: {
        requireAuth: true,
        allowFirstTime: false,
        requireOnboarding: true,
        allowedRoles: ['admin']
    } as RouteProtectionConfig
};

/**
 * Helper function to create user context from auth state
 */
export function createUserContext(authState: {
    user: any;
    isFirstTimeUser: boolean;
    hasCompletedOnboarding: boolean;
    userRoles?: string[];
}): UserAccessContext {
    return {
        isAuthenticated: !!authState.user,
        isFirstTimeUser: authState.isFirstTimeUser,
        hasCompletedOnboarding: authState.hasCompletedOnboarding,
        userRoles: authState.userRoles || []
    };
}

/**
 * Debugging helper to log authentication decisions
 */
export function logAuthDecision(
    path: string,
    config: RouteProtectionConfig,
    userContext: UserAccessContext,
    result: AuthCheckResult
): void {
    if (process.env.NODE_ENV === 'development') {
        console.group(`🔐 Auth Guard Decision: ${path}`);
        console.log('Config:', config);
        console.log('User Context:', userContext);
        console.log('Result:', result);
        console.groupEnd();
    }
}