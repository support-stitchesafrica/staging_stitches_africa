'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSafeSearchParams } from './useSafeSearchParams';
import { useAuth } from '@/contexts/AuthContext';
import { 
    performAuthCheck, 
    canAccessRoute, 
    getAuthRedirectUrl,
    createUserContext,
    AuthGuardPresets,
    AuthCheckResult 
} from '@/lib/utils/auth-guard-utils';
import { RouteProtectionConfig } from '@/lib/utils/route-protection-utils';

interface UseGlobalAuthGuardReturn {
    // Auth state
    isAuthenticated: boolean;
    isLoading: boolean;
    user: any;
    isFirstTimeUser: boolean;
    hasCompletedOnboarding: boolean;
    
    // Access control functions
    checkAccess: (config?: RouteProtectionConfig) => AuthCheckResult;
    canAccess: (config: RouteProtectionConfig) => boolean;
    requireAuth: (config?: RouteProtectionConfig) => boolean;
    
    // Navigation functions
    redirectToAuth: (returnUrl?: string) => void;
    redirectToOnboarding: () => void;
    redirectToHome: () => void;
    
    // Utility functions
    getReturnUrl: () => string;
    isAuthPage: () => boolean;
    shouldShowHeaderFooter: () => boolean;
}

/**
 * Hook for interacting with the global authentication guard system
 */
export const useGlobalAuthGuard = (): UseGlobalAuthGuardReturn => {
    const { user, loading, isFirstTimeUser, hasCompletedOnboarding } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSafeSearchParams();

    // Memoized user context
    const userContext = useMemo(() => createUserContext({
        user,
        isFirstTimeUser,
        hasCompletedOnboarding,
        userRoles: [] // Can be extended for role-based access
    }), [user, isFirstTimeUser, hasCompletedOnboarding]);

    // Check access for a given configuration
    const checkAccess = useCallback((config: RouteProtectionConfig = AuthGuardPresets.protected): AuthCheckResult => {
        return performAuthCheck(config, userContext, pathname, searchParams);
    }, [userContext, pathname, searchParams]);

    // Simple access check without redirect information
    const canAccess = useCallback((config: RouteProtectionConfig): boolean => {
        return canAccessRoute(config, userContext);
    }, [userContext]);

    // Require authentication with automatic redirect
    const requireAuth = useCallback((config: RouteProtectionConfig = AuthGuardPresets.protected): boolean => {
        const result = checkAccess(config);
        
        if (!result.isAllowed && result.shouldRedirect && result.redirectUrl) {
            router.replace(result.redirectUrl);
            return false;
        }
        
        return result.isAllowed;
    }, [checkAccess, router]);

    // Navigation functions
    const redirectToAuth = useCallback((returnUrl?: string) => {
        const url = returnUrl || getAuthRedirectUrl(pathname, searchParams);
        router.replace(url);
    }, [router, pathname, searchParams]);

    const redirectToOnboarding = useCallback(() => {
        router.replace('/measurements');
    }, [router]);

    const redirectToHome = useCallback(() => {
        router.replace('/');
    }, [router]);

    // Utility functions
    const getReturnUrl = useCallback((): string => {
        const redirect = searchParams.get('redirect') || searchParams.get('returnTo');
        return redirect || '/';
    }, [searchParams]);

    const isAuthPage = useCallback((): boolean => {
        return pathname === '/auth' || pathname.startsWith('/auth/');
    }, [pathname]);

    const shouldShowHeaderFooter = useCallback((): boolean => {
        // Don't show header/footer on auth pages
        if (isAuthPage()) return false;
        
        // Don't show on login/register pages
        if (pathname === '/login' || pathname === '/register') return false;
        
        // Show on all other pages
        return true;
    }, [pathname, isAuthPage]);

    return {
        // Auth state
        isAuthenticated: !!user,
        isLoading: loading,
        user,
        isFirstTimeUser,
        hasCompletedOnboarding,
        
        // Access control functions
        checkAccess,
        canAccess,
        requireAuth,
        
        // Navigation functions
        redirectToAuth,
        redirectToOnboarding,
        redirectToHome,
        
        // Utility functions
        getReturnUrl,
        isAuthPage,
        shouldShowHeaderFooter
    };
};