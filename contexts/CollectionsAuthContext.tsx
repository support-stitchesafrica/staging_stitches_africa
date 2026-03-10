'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { CollectionsAuthService } from '@/lib/collections/auth-service';
import { CollectionsUser, CollectionsRole, RolePermissions, COLLECTIONS_ROLE_PERMISSIONS } from '@/lib/collections/types';
import { toast } from 'sonner';

/**
 * Collections Authentication Context Type
 * Manages authentication state and operations for Collections users
 */
interface CollectionsAuthContextType
{
    /** Firebase Auth user object */
    user: User | null;

    /** Firestore Collections user document */
    collectionsUser: CollectionsUser | null;

    /** Loading state during authentication operations */
    loading: boolean;

    /** Error message if authentication fails */
    error: string | null;

    /** Login an existing Collections user */
    login: (email: string, password: string) => Promise<void>;

    /** Register a new Collections user */
    register: (email: string, password: string, fullName: string) => Promise<void>;

    /** Logout the current Collections user */
    logout: () => Promise<void>;

    /** Clear error state */
    clearError: () => void;

    /** Check if user has a specific permission */
    hasPermission: (permission: keyof RolePermissions) => boolean;

    /** Check if user can access a specific feature */
    canAccessFeature: (feature: string) => boolean;
}

/**
 * Collections Authentication Context
 */
const CollectionsAuthContext = createContext<CollectionsAuthContextType | undefined>(undefined);

/**
 * Hook to access Collections authentication context
 * @throws Error if used outside of CollectionsAuthProvider
 */
export const useCollectionsAuth = (): CollectionsAuthContextType =>
{
    const context = useContext(CollectionsAuthContext);
    if (!context)
    {
        throw new Error('useCollectionsAuth must be used within a CollectionsAuthProvider');
    }
    return context;
};

/**
 * Collections Authentication Provider Component
 * Manages authentication state and provides auth methods to children
 */
export const CollectionsAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
    const [user, setUser] = useState<User | null>(null);
    const [collectionsUser, setCollectionsUser] = useState<CollectionsUser | null>(null);
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
     * Set up real-time listener for Collections user data from Firestore
     * Handles role changes and user deactivation in real-time
     */
    const setupCollectionsUserListener = useCallback((uid: string) =>
    {
        const userDocRef = doc(db, 'collectionsUsers', uid);

        const unsubscribe = onSnapshot(
            userDocRef,
            (docSnapshot) =>
            {
                if (docSnapshot.exists())
                {
                    const userData = docSnapshot.data() as CollectionsUser;

                    // Check if user still has Collections access
                    if (!userData.isCollectionsUser)
                    {
                        // User has been deactivated - sign them out immediately
                        console.log('User deactivated, signing out...');
                        toast.error('Access Revoked', {
                            duration: 6000,
                            description: 'Your Collections access has been revoked. You will be signed out.'
                        });

                        // Sign out the user
                        CollectionsAuthService.logoutCollectionsUser().then(() =>
                        {
                            setUser(null);
                            setCollectionsUser(null);
                            setError('Your access has been revoked. Please contact your administrator.');
                        });
                        return;
                    }

                    // Update user data
                    setCollectionsUser(userData);
                } else
                {
                    // User document doesn't exist - sign them out
                    console.log('User document not found, signing out...');
                    toast.error('Account Not Found', {
                        duration: 6000,
                        description: 'Your account could not be found. You will be signed out.'
                    });

                    CollectionsAuthService.logoutCollectionsUser().then(() =>
                    {
                        setUser(null);
                        setCollectionsUser(null);
                        setError('Account not found. Please contact your administrator.');
                    });
                }
            },
            (error) =>
            {
                console.error('Error listening to Collections user changes:', error);
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
     * Login an existing Collections user
     */
    const login = useCallback(async (email: string, password: string) =>
    {
        try
        {
            setLoading(true);
            setError(null);

            console.log('Attempting login for:', email);

            const result = await CollectionsAuthService.loginCollectionsUser(email, password);

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
                description: 'Welcome to Collections Designer.'
            });

            // Don't set loading to false here - let the auth state listener handle it
            // This prevents race conditions between login success and auth state change
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
     * Register a new Collections user
     */
    const register = useCallback(async (email: string, password: string, fullName: string) =>
    {
        try
        {
            setLoading(true);
            setError(null);

            console.log('Attempting registration for:', email);

            const result = await CollectionsAuthService.registerCollectionsUser(email, password, fullName);

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
                description: 'Welcome to Collections Designer.'
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
     * Logout the current Collections user
     */
    const logout = useCallback(async () =>
    {
        try
        {
            setLoading(true);
            setError(null);

            const result = await CollectionsAuthService.logoutCollectionsUser();

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
                description: 'You have been signed out of Collections Designer.'
            });

            // Auth state listener will handle clearing user data
            setUser(null);
            setCollectionsUser(null);
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
     * Automatically sets up real-time Collections user data listener when auth state changes
     */
    useEffect(() =>
    {
        let isMounted = true;
        let collectionsUserUnsubscribe: Unsubscribe | null = null;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) =>
        {
            if (!isMounted) return;

            console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');

            if (firebaseUser)
            {
                // User is authenticated, set up real-time listener for Collections user data
                setUser(firebaseUser);

                // Clean up previous listener if exists
                if (collectionsUserUnsubscribe)
                {
                    collectionsUserUnsubscribe();
                }

                // Set up new listener
                collectionsUserUnsubscribe = setupCollectionsUserListener(firebaseUser.uid);
            } else
            {
                // User is not authenticated, clean up listener and clear state
                if (collectionsUserUnsubscribe)
                {
                    collectionsUserUnsubscribe();
                    collectionsUserUnsubscribe = null;
                }
                setUser(null);
                setCollectionsUser(null);
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
            if (collectionsUserUnsubscribe)
            {
                collectionsUserUnsubscribe();
            }
        };
    }, [setupCollectionsUserListener]);

    /**
     * Check if the current user has a specific permission
     * @param permission - The permission key to check
     * @returns true if user has the permission, false otherwise
     */
    const hasPermission = useCallback((permission: keyof RolePermissions): boolean =>
    {
        if (!collectionsUser || !collectionsUser.role)
        {
            return false;
        }

        const rolePermissions = COLLECTIONS_ROLE_PERMISSIONS[collectionsUser.role];

        // Handle the 'role' property specially since it's not a boolean
        if (permission === 'role')
        {
            return true; // All users have a role
        }

        return rolePermissions[permission] === true;
    }, [collectionsUser]);

    /**
     * Check if the current user can access a specific feature
     * Maps feature names to permission checks
     * @param feature - The feature name to check
     * @returns true if user can access the feature, false otherwise
     */
    const canAccessFeature = useCallback((feature: string): boolean =>
    {
        if (!collectionsUser || !collectionsUser.role)
        {
            return false;
        }

        // Map feature names to permission checks
        const featurePermissionMap: Record<string, keyof RolePermissions> = {
            'create-collection': 'canCreateCollections',
            'edit-collection': 'canEditCollections',
            'delete-collection': 'canDeleteCollections',
            'manage-team': 'canManageTeam',
            'publish-collection': 'canPublishCollections',
        };

        const permission = featurePermissionMap[feature];

        if (!permission)
        {
            console.warn(`Unknown feature: ${feature}`);
            return false;
        }

        return hasPermission(permission);
    }, [collectionsUser, hasPermission]);

    /**
     * Memoize context value to prevent unnecessary re-renders
     */
    const contextValue = useMemo(
        () => ({
            user,
            collectionsUser,
            loading,
            error,
            login,
            register,
            logout,
            clearError,
            hasPermission,
            canAccessFeature,
        }),
        [user, collectionsUser, loading, error, login, register, logout, clearError, hasPermission, canAccessFeature]
    );

    return (
        <CollectionsAuthContext.Provider value={contextValue}>
            {children}
        </CollectionsAuthContext.Provider>
    );
};
