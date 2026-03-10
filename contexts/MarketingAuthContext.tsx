/**
 * Marketing Dashboard Authentication Context
 * Provides authentication state and user management for marketing dashboard
 * Requirements: 3.3, 6.1, 7.1, 8.1, 9.1
 */

"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
	AuthenticatedUser,
	UserPermissions,
} from "@/lib/marketing/auth-middleware";

interface MarketingAuthContextType {
	// Authentication state
	firebaseUser: User | null;
	marketingUser: AuthenticatedUser | null;
	permissions: UserPermissions | null;
	loading: boolean;
	error: string | null;

	// Authentication status
	isAuthenticated: boolean;
	isAuthorized: boolean; // Has marketing dashboard access

	// User actions
	signOut: () => Promise<void>;
	refreshUser: () => Promise<void>;
	clearError: () => void;

	// Role checking utilities
	hasRole: (role: string | string[]) => boolean;
	hasPermission: (permission: keyof UserPermissions) => boolean;
	canAccess: (
		requiredRole?: string,
		requiredPermissions?: (keyof UserPermissions)[]
	) => boolean;
}

const MarketingAuthContext = createContext<MarketingAuthContextType>({
	firebaseUser: null,
	marketingUser: null,
	permissions: null,
	loading: true,
	error: null,
	isAuthenticated: false,
	isAuthorized: false,
	signOut: async () => {},
	refreshUser: async () => {},
	clearError: () => {},
	hasRole: () => false,
	hasPermission: () => false,
	canAccess: () => false,
});

export const useMarketingAuth = () => {
	const context = useContext(MarketingAuthContext);
	if (!context) {
		throw new Error(
			"useMarketingAuth must be used within a MarketingAuthProvider"
		);
	}
	return context;
};

interface MarketingAuthProviderProps {
	children: React.ReactNode;
}

export const MarketingAuthProvider: React.FC<MarketingAuthProviderProps> = ({
	children,
}) => {
	const router = useRouter();

	const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
	const [marketingUser, setMarketingUser] = useState<AuthenticatedUser | null>(
		null
	);
	const [permissions, setPermissions] = useState<UserPermissions | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Clear error state
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	// Fetch marketing user profile
	const fetchMarketingUser = useCallback(
		async (idToken: string): Promise<void> => {
			try {
				const response = await fetch("/api/marketing/users/me", {
					headers: {
						Authorization: `Bearer ${idToken}`,
					},
				});

				if (!response.ok) {
					if (response.status === 404) {
						// User not found in marketing system - the auth middleware should create it automatically
						// Try again after a short delay
						setTimeout(async () => {
							try {
								const retryResponse = await fetch("/api/marketing/users/me", {
									headers: {
										Authorization: `Bearer ${idToken}`,
									},
								});
								
								if (retryResponse.ok) {
									const data = await retryResponse.json();
									setMarketingUser(data.user);
									setPermissions(data.permissions);
									setError(null);
								} else {
									setMarketingUser(null);
									setPermissions(null);
									setError(
										"Unable to access marketing dashboard. Please contact your administrator."
									);
								}
							} catch (retryError) {
								console.error("Retry failed:", retryError);
								setMarketingUser(null);
								setPermissions(null);
								setError(
									"Unable to access marketing dashboard. Please try refreshing the page."
								);
							}
						}, 2000);
						return;
					}
					throw new Error("Failed to fetch user profile");
				}

				const data = await response.json();
				setMarketingUser(data.user);
				setPermissions(data.permissions);
				setError(null);
			} catch (error) {
				console.error("Failed to fetch marketing user:", error);
				setMarketingUser(null);
				setPermissions(null);
				setError(
					"Unable to load user profile. Please try refreshing the page."
				);
			}
		},
		[]
	);

	// Refresh user data
	const refreshUser = useCallback(async (): Promise<void> => {
		if (!firebaseUser) return;

		try {
			setLoading(true);
			const idToken = await firebaseUser.getIdToken(true); // Force refresh
			await fetchMarketingUser(idToken);
		} catch (error) {
			console.error("Failed to refresh user:", error);
			setError("Failed to refresh user data");
		} finally {
			setLoading(false);
		}
	}, [firebaseUser, fetchMarketingUser]);

	// Sign out user
	const signOut = useCallback(async (): Promise<void> => {
		try {
			const { signOut: firebaseSignOut } = await import("firebase/auth");
			const { auth } = await import("@/firebase");

			await firebaseSignOut(auth);

			// Clear state
			setFirebaseUser(null);
			setMarketingUser(null);
			setPermissions(null);
			setError(null);

			// Redirect to login
			router.push("/marketing/login");
		} catch (error) {
			console.error("Sign out error:", error);
			setError("Failed to sign out");
		}
	}, [router]);

	// Role checking utility
	const hasRole = useCallback(
		(role: string | string[]): boolean => {
			if (!marketingUser) return false;

			if (Array.isArray(role)) {
				return role.includes(marketingUser.role);
			}

			return marketingUser.role === role;
		},
		[marketingUser]
	);

	// Permission checking utility
	const hasPermission = useCallback(
		(permission: keyof UserPermissions): boolean => {
			if (!permissions) return false;
			return permissions[permission];
		},
		[permissions]
	);

	// Access checking utility
	const canAccess = useCallback(
		(
			requiredRole?: string,
			requiredPermissions?: (keyof UserPermissions)[]
		): boolean => {
			if (!marketingUser || !permissions) return false;

			// Check role requirement
			if (requiredRole && !hasRole(requiredRole)) {
				return false;
			}

			// Check permission requirements
			if (requiredPermissions && requiredPermissions.length > 0) {
				return requiredPermissions.every((permission) =>
					hasPermission(permission)
				);
			}

			return true;
		},
		[marketingUser, permissions, hasRole, hasPermission]
	);

	// Set up Firebase auth state listener
	useEffect(() => {
		let unsubscribe: (() => void) | null = null;

		const setupAuthListener = async () => {
			try {
				const { onAuthStateChanged } = await import("firebase/auth");
				const { auth } = await import("@/firebase");

				unsubscribe = onAuthStateChanged(auth, async (user) => {
					setFirebaseUser(user);

					if (user) {
						try {
							// Validate domain
							if (
								!user.email?.endsWith("@stitchesafrica.com") &&
								!user.email?.endsWith("@stitchesafrica.pro")
							) {
								setError(
									"Only company emails are allowed (@stitchesafrica.com or @stitchesafrica.pro)"
								);
								setMarketingUser(null);
								setPermissions(null);
								setLoading(false);
								return;
							}

							const idToken = await user.getIdToken();
							await fetchMarketingUser(idToken);
						} catch (error) {
							console.error("Auth state change error:", error);
							setError("Failed to authenticate user");
							setMarketingUser(null);
							setPermissions(null);
						}
					} else {
						// User signed out
						setMarketingUser(null);
						setPermissions(null);
						setError(null);
					}

					setLoading(false);
				});
			} catch (error) {
				console.error("Failed to setup auth listener:", error);
				setError("Authentication system failed to initialize");
				setLoading(false);
			}
		};

		setupAuthListener();

		return () => {
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, [fetchMarketingUser]);

	// Computed authentication status
	const isAuthenticated = useMemo(() => !!firebaseUser, [firebaseUser]);
	const isAuthorized = useMemo(
		() => !!marketingUser && !!permissions,
		[marketingUser, permissions]
	);

	// Memoize context value to prevent unnecessary re-renders
	const contextValue = useMemo(
		() => ({
			firebaseUser,
			marketingUser,
			permissions,
			loading,
			error,
			isAuthenticated,
			isAuthorized,
			signOut,
			refreshUser,
			clearError,
			hasRole,
			hasPermission,
			canAccess,
		}),
		[
			firebaseUser,
			marketingUser,
			permissions,
			loading,
			error,
			isAuthenticated,
			isAuthorized,
			signOut,
			refreshUser,
			clearError,
			hasRole,
			hasPermission,
			canAccess,
		]
	);

	return (
		<MarketingAuthContext.Provider value={contextValue}>
			{children}
		</MarketingAuthContext.Provider>
	);
};

// Higher-order component for protecting routes
export interface WithMarketingAuthOptions {
	requiredRole?: string | string[];
	requiredPermissions?: (keyof UserPermissions)[];
	redirectTo?: string;
	fallback?: React.ComponentType;
}

export function withMarketingAuth<P extends object>(
	Component: React.ComponentType<P>,
	options: WithMarketingAuthOptions = {}
) {
	const WrappedComponent = (props: P) => {
		const {
			isAuthenticated,
			isAuthorized,
			loading,
			error,
			hasRole,
			hasPermission,
			canAccess,
		} = useMarketingAuth();
		const router = useRouter();

		useEffect(() => {
			if (loading) return;

			if (!isAuthenticated) {
				const currentPath = window.location.pathname + window.location.search;
				const loginUrl = options.redirectTo || "/marketing/login";
				const redirectUrl = `${loginUrl}?redirect=${encodeURIComponent(
					currentPath
				)}`;
				router.push(redirectUrl);
				return;
			}

			if (!isAuthorized) {
				// User is authenticated but not authorized for marketing dashboard
				if (options.fallback) {
					return;
				}
				router.push("/marketing/login");
				return;
			}

			// Check role and permission requirements
			if (
				!canAccess(
					Array.isArray(options.requiredRole)
						? undefined
						: options.requiredRole,
					options.requiredPermissions
				)
			) {
				if (
					Array.isArray(options.requiredRole) &&
					!hasRole(options.requiredRole)
				) {
					router.push("/marketing/login");
					return;
				}
				if (
					options.requiredRole &&
					typeof options.requiredRole === "string" &&
					!hasRole(options.requiredRole)
				) {
					router.push("/marketing/login");
					return;
				}
				if (
					options.requiredPermissions &&
					!options.requiredPermissions.every((p) => hasPermission(p))
				) {
					router.push("/marketing/login");
					return;
				}
			}
		}, [
			loading,
			isAuthenticated,
			isAuthorized,
			hasRole,
			hasPermission,
			canAccess,
			router,
		]);

		if (loading) {
			return (
				<div className="min-h-screen flex items-center justify-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				</div>
			);
		}

		if (!isAuthenticated || !isAuthorized) {
			if (options.fallback) {
				const FallbackComponent = options.fallback;
				return <FallbackComponent />;
			}
			return null;
		}

		if (error) {
			return (
				<div className="min-h-screen flex items-center justify-center">
					<div className="text-center">
						<h2 className="text-xl font-semibold text-red-600 mb-2">
							Authentication Error
						</h2>
						<p className="text-gray-600">{error}</p>
					</div>
				</div>
			);
		}

		return <Component {...props} />;
	};

	WrappedComponent.displayName = `withMarketingAuth(${
		Component.displayName || Component.name
	})`;

	return WrappedComponent;
}
