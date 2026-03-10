'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { PromotionalUser, PromotionalRole, PromotionalRolePermissions, PROMOTIONAL_ROLE_PERMISSIONS } from '@/types/promotionals';
import { toast } from 'sonner';

/**
 * Promotional Authentication Context Type
 * Manages authentication state and operations for Promotional users
 */
interface PromotionalsAuthContextType
{
    /** Firebase Auth user object */
    user: User | null;

    /** Firestore Promotional user document */
    promotionalUser: PromotionalUser | null;

    /** Loading state during authentication operations */
    loading: boolean;

    /** Error message if authentication fails */
    error: string | null;

    /** Login an existing Promotional user */
    login: (email: string, password: string) => Promise<void>;

    /** Register a new Promotional user */
    register: (email: string, password: string, fullName: string) => Promise<void>;

    /** Logout the current Promotional user */
    logout: () => Promise<void>;

    /** Clear error state */
    clearError: () => void;

    /** Check if user has a specific permission */
    hasPermission: (permission: keyof PromotionalRolePermissions) => boolean;

    /** Check if user can access a specific feature */
    canAccessFeature: (feature: string) => boolean;
}

/**
 * Promotional Authentication Context
 */
const PromotionalsAuthContext = createContext<PromotionalsAuthContextType | undefined>(undefined);

/**
 * Hook to access Promotional authentication context
 * @throws Error if used outside of PromotionalsAuthProvider
 */
export const usePromotionalsAuth = (): PromotionalsAuthContextType =>
{
    const context = useContext(PromotionalsAuthContext);
    if (!context)
    {
        throw new Error('usePromotionalsAuth must be used within a PromotionalsAuthProvider');
    }
    return context;
};

/**
 * Promotional Authentication Provider Component
 * Manages authentication state and provides auth methods to children
 */
export const PromotionalsAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
    const [user, setUser] = useState<User | null>(null);
    const [promotionalUser, setPromotionalUser] = useState<PromotionalUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Clear error state
     */
    const clearError = useCallback(() =>
    {
        setError(null);
    }, []);

    /**
     * Set up real-time listener for Promotional user data from Firestore
     * Handles role changes and user deactivation in real-time
     */
    const setupPromotionalUserListener = useCallback((uid: string) =>
    {
        const userDocRef = doc(db, 'promotionalUsers', uid);

        const unsubscribe = onSnapshot(
            userDocRef,
            (docSnapshot) =>
            {
                if (docSnapshot.exists())
                {
                    const userData = docSnapshot.data() as PromotionalUser;

                    // Check if user still has Promotional access
                    if (!userData.isPromotionalUser)
                    {
                        // User has been deactivated - sign them out immediately
                        console.log('User deactivated, signing out...');
                        toast.error('Access Revoked', {
                            duration: 6000,
                            description: 'Your Promotional access has been revoked. You will be signed out.'
                        });

                        // Sign out the user - will be implemented in auth-service
                        import('@/lib/promotionals/auth-service').then(({ PromotionalsAuthService }) =>
                        {
                            PromotionalsAuthService.logoutPromotionalUser().then(() =>
                            {
                                setUser(null);
                                setPromotionalUser(null);
                                setError('Your access has been revoked. Please contact your administrator.');
                            });
                        });
                        return;
                    }

                    // Update user data
                    setPromotionalUser(userData);
                } else
                {
                    // User document doesn't exist - sign them out
                    console.log('User document not found, signing out...');
                    toast.error('Account Not Found', {
                        duration: 6000,
                        description: 'Your account could not be found. You will be signed out.'
                    });

                    import('@/lib/promotionals/auth-service').then(({ PromotionalsAuthService }) =>
                    {
                        PromotionalsAuthService.logoutPromotionalUser().then(() =>
                        {
                            setUser(null);
                            setPromotionalUser(null);
                            setError('Account not found. Please contact your administrator.');
                        });
                    });
                }
            },
            (error) =>
            {
                console.error('Error listening to Promotional user changes:', error);
                const errorMsg = 'Failed to sync user data. Please refresh the page.';
                setError(errorMsg);
                toast.error('Sync Error', {
                    duration: 5000,
                    description: errorMsg
                });
            }
        );

        return unsubscribe;
    }, []);

    /**
     * Login an existing Promotional user
     */
    const login = useCallback(async (email: string, password: string) =>
    {
        try
        {
            setLoading(true);
            setError(null);

            console.log('Attempting login for:', email);

            const { PromotionalsAuthService } = await import('@/lib/promotionals/auth-service');
            const result = await PromotionalsAuthService.loginPromotionalUser(email, password);

            if (!result.success)
            {
                const errorMsg = result.error || 'Login failed. Please try again.';
                setError(errorMsg);
                toast.error(errorMsg, {
                    duration: 5000,
                    description: 'Please check your credentials and try again.'
                });
                setLoading(false);
                return;
            }

            console.log('Login successful, waiting for auth state change...');

            // Show success toast
            toast.success('Login successful!', {
                duration: 3000,
                description: 'Welcome to Promotional Events Manager.'
            });

            // Don't set loading to false here - let the auth state listener handle it
        } catch (err)
        {
            console.error('Login error:', err);
            const errorMsg = 'An unexpected error occurred during login';
            setError(errorMsg);
            toast.error(errorMsg, {
                duration: 5000,
                description: 'Please try again or contact support if the issue persists.'
            });
            setLoading(false);
        }
    }, []);

    /**
     * Register a new Promotional user
     */
    const register = useCallback(async (email: string, password: string, fullName: string) =>
    {
        try
        {
            setLoading(true);
            setError(null);

            console.log('Attempting registration for:', email);

            const { PromotionalsAuthService } = await import('@/lib/promotionals/auth-service');
            const result = await PromotionalsAuthService.registerPromotionalUser(email, password, fullName);

            if (!result.success)
            {
                const errorMsg = result.error || 'Registration failed. Please try again.';
                setError(errorMsg);
                toast.error(errorMsg, {
                    duration: 5000,
                    description: 'Please check your information and try again.'
                });
                setLoading(false);
                return;
            }

            console.log('Registration successful, waiting for auth state change...');

            // Show success toast
            toast.success('Registration successful!', {
                duration: 3000,
                description: 'Welcome to Promotional Events Manager.'
            });

            // Don't set loading to false here - let the auth state listener handle it
        } catch (err)
        {
            console.error('Registration error:', err);
            const errorMsg = 'An unexpected error occurred during registration';
            setError(errorMsg);
            toast.error(errorMsg, {
                duration: 5000,
                description: 'Please try again or contact support if the issue persists.'
            });
            setLoading(false);
        }
    }, []);

    /**
     * Logout the current Promotional user
     */
    const logout = useCallback(async () =>
    {
        try
        {
            setLoading(true);
            setError(null);

            const { PromotionalsAuthService } = await import('@/lib/promotionals/auth-service');
            const result = await PromotionalsAuthService.logoutPromotionalUser();

            if (!result.success)
            {
                const errorMsg = result.error || 'Logout failed. Please try again.';
                setError(errorMsg);
                toast.error(errorMsg, {
                    duration: 4000
                });
                setLoading(false);
                return;
            }

            // Show success toast
            toast.success('Logged out successfully', {
                duration: 3000,
                description: 'You have been signed out of Promotional Events Manager.'
            });

            // Auth state listener will handle clearing user data
            setUser(null);
            setPromotionalUser(null);
        } catch (err)
        {
            console.error('Logout error:', err);
            const errorMsg = 'An unexpected error occurred during logout';
            setError(errorMsg);
            toast.error(errorMsg, {
                duration: 4000
            });
        } finally
        {
            setLoading(false);
        }
    }, []);

    /**
     * Set up Firebase auth state listener
     * Automatically sets up real-time Promotional user data listener when auth state changes
     */
    useEffect(() =>
    {
        let isMounted = true;
        let promotionalUserUnsubscribe: Unsubscribe | null = null;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) =>
        {
            if (!isMounted) return;

            console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');

            if (firebaseUser)
            {
                // User is authenticated, set up real-time listener for Promotional user data
                setUser(firebaseUser);

                // Clean up previous listener if exists
                if (promotionalUserUnsubscribe)
                {
                    promotionalUserUnsubscribe();
                }

                // Set up new listener
                promotionalUserUnsubscribe = setupPromotionalUserListener(firebaseUser.uid);
            } else
            {
                // User is not authenticated, clean up listener and clear state
                if (promotionalUserUnsubscribe)
                {
                    promotionalUserUnsubscribe();
                    promotionalUserUnsubscribe = null;
                }
                setUser(null);
                setPromotionalUser(null);
                setError(null); // Clear any previous errors
            }

            // Always set loading to false after auth state is determined
            if (isMounted)
            {
                setLoading(false);
            }
        });

        return () =>
        {
            isMounted = false;
            unsubscribe();
            // Clean up user document listener on unmount
            if (promotionalUserUnsubscribe)
            {
                promotionalUserUnsubscribe();
            }
        };
    }, [setupPromotionalUserListener]);

    /**
     * Check if the current user has a specific permission
     * @param permission - The permission key to check
     * @returns true if user has the permission, false otherwise
     */
    const hasPermission = useCallback((permission: keyof PromotionalRolePermissions): boolean =>
    {
        if (!promotionalUser || !promotionalUser.role)
        {
            return false;
        }

        const rolePermissions = PROMOTIONAL_ROLE_PERMISSIONS[promotionalUser.role];

        // Handle the 'role' property specially since it's not a boolean
        if (permission === 'role')
        {
            return true; // All users have a role
        }

        return rolePermissions[permission] === true;
    }, [promotionalUser]);

    /**
     * Check if the current user can access a specific feature
     * Maps feature names to permission checks
     * @param feature - The feature name to check
     * @returns true if user can access the feature, false otherwise
     */
    const canAccessFeature = useCallback((feature: string): boolean =>
    {
        if (!promotionalUser || !promotionalUser.role)
        {
            return false;
        }

        // Map feature names to permission checks
        const featurePermissionMap: Record<string, keyof PromotionalRolePermissions> = {
            'create-event': 'canCreateEvents',
            'edit-event': 'canEditEvents',
            'delete-event': 'canDeleteEvents',
            'publish-event': 'canPublishEvents',
            'manage-team': 'canManageTeam',
        };

        const permission = featurePermissionMap[feature];

        if (!permission)
        {
            console.warn(`Unknown feature: ${feature}`);
            return false;
        }

        return hasPermission(permission);
    }, [promotionalUser, hasPermission]);

    /**
     * Memoize context value to prevent unnecessary re-renders
     */
    const contextValue = useMemo(
        () => ({
            user,
            promotionalUser,
            loading,
            error,
            login,
            register,
            logout,
            clearError,
            hasPermission,
            canAccessFeature,
        }),
        [user, promotionalUser, loading, error, login, register, logout, clearError, hasPermission, canAccessFeature]
    );

    return (
        <PromotionalsAuthContext.Provider value={contextValue}>
            {children}
        </PromotionalsAuthContext.Provider>
    );
};
