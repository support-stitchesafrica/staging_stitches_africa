import { User } from 'firebase/auth';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Options for authentication-aware navigation
 */
export interface AuthNavigationOptions {
  destination: string;
  user: User | null;
  router: AppRouterInstance;
}

/**
 * Result of authentication navigation attempt
 */
export interface AuthNavigationResult {
  navigated: boolean;
  requiresAuth: boolean;
}

/**
 * Checks if a user is authenticated
 * @param user - Firebase user object or null
 * @returns true if user is authenticated, false otherwise
 */
export function isUserAuthenticated(user: User | null): boolean {
  return user !== null;
}

/**
 * Validates that a URL is relative and safe for redirect
 * Prevents open redirect vulnerabilities by rejecting absolute URLs
 * @param url - URL to validate
 * @returns true if URL is safe for redirect, false otherwise
 */
export function isValidRedirectUrl(url: string): boolean {
  // Must start with / (relative URL)
  if (!url.startsWith('/')) {
    return false;
  }

  // Reject URLs that look like protocol-relative URLs (//example.com)
  if (url.startsWith('//')) {
    return false;
  }

  // Reject URLs with protocols (http://, https://, javascript:, etc.)
  if (url.includes(':')) {
    return false;
  }

  return true;
}

/**
 * Builds authentication URL with encoded redirect parameter
 * @param redirectTo - Destination URL to redirect to after authentication
 * @returns Authentication URL with redirect parameter
 */
export function buildAuthUrl(redirectTo: string): string {
  // Validate redirect URL for security
  if (!isValidRedirectUrl(redirectTo)) {
    console.warn(`Invalid redirect URL rejected: ${redirectTo}`);
    // Return auth URL without redirect parameter if invalid
    return '/shops/auth';
  }

  // Encode the redirect parameter to safely include it in the URL
  const encodedRedirect = encodeURIComponent(redirectTo);
  return `/shops/auth?redirect=${encodedRedirect}`;
}

/**
 * Navigates to a destination with authentication check
 * If user is authenticated, navigates directly to destination
 * If user is not authenticated, redirects to auth page with redirect parameter
 * 
 * @param options - Navigation options including destination, user, and router
 * @returns Result indicating whether navigation occurred and if auth was required
 */
export function navigateWithAuth(options: AuthNavigationOptions): AuthNavigationResult {
  const { destination, user, router } = options;

  try {
    // Check if user is authenticated
    if (isUserAuthenticated(user)) {
      // User is authenticated, navigate directly to destination
      router.push(destination);
      return {
        navigated: true,
        requiresAuth: false,
      };
    } else {
      // User is not authenticated, redirect to auth with redirect parameter
      const authUrl = buildAuthUrl(destination);
      router.push(authUrl);
      return {
        navigated: true,
        requiresAuth: true,
      };
    }
  } catch (error) {
    console.error('Navigation error:', error);
    return {
      navigated: false,
      requiresAuth: !isUserAuthenticated(user),
    };
  }
}
