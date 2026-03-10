/**
 * Route Protection Utilities
 * 
 * Provides utility functions for enhanced route protection,
 * redirect validation, and access control logic.
 */

export interface RouteProtectionConfig {
    requireAuth?: boolean;
    allowFirstTime?: boolean;
    requireOnboarding?: boolean;
    allowedRoles?: string[];
    redirectTo?: string;
    fallbackRoute?: string;
}

export interface UserAccessContext {
    isAuthenticated: boolean;
    isFirstTimeUser: boolean;
    hasCompletedOnboarding: boolean;
    userRoles?: string[];
}

export interface AccessResult {
    allowed: boolean;
    redirectTo?: string;
    reason?: 'unauthenticated' | 'first-time-user' | 'onboarding-required' | 'insufficient-permissions' | 'access-denied';
    message?: string;
}

/**
 * Validates if a redirect URL is safe to prevent open redirect vulnerabilities
 */
export function validateRedirectUrl(url: string): boolean {
    try {
        // Allow relative paths that start with /
        if (url.startsWith('/')) {
            // Prevent protocol-relative URLs (//example.com)
            if (url.startsWith('//')) {
                return false;
            }
            
            // Define allowed path patterns
            const allowedPaths = [
                '/',
                '/products',
                '/cart',
                '/checkout',
                '/wishlist',
                '/account',
                '/measurements',
                '/auth'
            ];
            
            // Check if URL starts with any allowed path
            const isAllowedPath = allowedPaths.some(path => 
                url === path || url.startsWith(`${path}/`) || url.startsWith(`${path}?`)
            );
            
            return isAllowedPath;
        }
        
        // For absolute URLs, only allow same origin
        const urlObj = new URL(url, window.location.origin);
        return urlObj.origin === window.location.origin;
    } catch {
        return false;
    }
}

/**
 * Extracts and validates redirect parameter from URL search params
 */
export function extractValidRedirectParam(searchParams: URLSearchParams): string | null {
    const redirect = searchParams.get('redirect') || searchParams.get('returnTo');
    
    if (!redirect) {
        return null;
    }
    
    return validateRedirectUrl(redirect) ? redirect : null;
}

/**
 * Determines if a user should have access to a route based on protection config
 */
export function determineRouteAccess(
    config: RouteProtectionConfig,
    userContext: UserAccessContext
): AccessResult {
    const {
        requireAuth = true,
        allowFirstTime = false,
        requireOnboarding = false,
        allowedRoles = [],
        redirectTo = '/auth'
    } = config;

    // If authentication is not required, allow access
    if (!requireAuth) {
        return { allowed: true };
    }

    // Check authentication
    if (!userContext.isAuthenticated) {
        return {
            allowed: false,
            redirectTo,
            reason: 'unauthenticated',
            message: 'Authentication required to access this page'
        };
    }

    // Check role-based access if roles are specified
    if (allowedRoles.length > 0 && userContext.userRoles) {
        const hasRequiredRole = allowedRoles.some(role => 
            userContext.userRoles?.includes(role)
        );
        
        if (!hasRequiredRole) {
            return {
                allowed: false,
                redirectTo: '/account',
                reason: 'insufficient-permissions',
                message: 'Insufficient permissions to access this page'
            };
        }
    }

    // In the new flow, measurements are optional and onboarding checks are removed
    // Only restrict access if explicitly configured to not allow first-time users
    if (userContext.isFirstTimeUser && !allowFirstTime) {
        return {
            allowed: false,
            redirectTo: '/account',
            reason: 'first-time-user',
            message: 'Please access this page from your account'
        };
    }

    // Access allowed
    return { allowed: true };
}

/**
 * Creates a redirect URL with preserved destination
 */
export function createRedirectUrl(
    destination: string,
    currentPath: string,
    searchParams?: URLSearchParams
): string {
    // Don't add redirect parameter for certain destinations
    const noRedirectDestinations = ['/measurements', '/account'];
    if (noRedirectDestinations.includes(destination)) {
        return destination;
    }

    const currentUrl = currentPath + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    const separator = destination.includes('?') ? '&' : '?';
    
    return `${destination}${separator}redirect=${encodeURIComponent(currentUrl)}`;
}

/**
 * Route protection presets for common use cases
 */
export const RouteProtectionPresets = {
    // Standard protected route (requires auth, allows all authenticated users)
    standard: {
        requireAuth: true,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig,

    // Deprecated: Onboarding is no longer required in the new flow
    onboardingRequired: {
        requireAuth: true,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig,

    // First-time user access (measurements and other optional features)
    firstTimeOnly: {
        requireAuth: true,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig,

    // All authenticated users (no restrictions based on onboarding status)
    existingUsersOnly: {
        requireAuth: true,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig,

    // Public route (no authentication required)
    public: {
        requireAuth: false,
        allowFirstTime: true,
        requireOnboarding: false
    } as RouteProtectionConfig
};

/**
 * Error messages for different access denial reasons
 */
export const AccessDenialMessages = {
    unauthenticated: 'Please sign in to access this page',
    'first-time-user': 'Please complete your profile setup to continue',
    'onboarding-required': 'Please complete the onboarding process',
    'insufficient-permissions': 'You don\'t have permission to access this page',
    'access-denied': 'Access to this page is restricted'
};

/**
 * Gets user-friendly error message for access denial reason
 */
export function getAccessDenialMessage(reason?: string): string {
    if (!reason) return 'Access denied';
    return AccessDenialMessages[reason as keyof typeof AccessDenialMessages] || 'Access denied';
}