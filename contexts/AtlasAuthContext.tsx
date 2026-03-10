"use client";

import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { AtlasAuthService } from "@/lib/atlas/auth-service";
import { AtlasUser } from "@/lib/atlas/types";
import { toast } from "sonner";

/**
 * Atlas Authentication Context Type
 * Manages authentication state and operations for Atlas users
 */
interface AtlasAuthContextType {
	/** Firebase Auth user object */
	user: User | null;

	/** Firestore Atlas user document */
	atlasUser: AtlasUser | null;

	/** Loading state during authentication operations */
	loading: boolean;

	/** Error message if authentication fails */
	error: string | null;

	/** Register a new Atlas user */
	register: (
		email: string,
		password: string,
		fullName: string
	) => Promise<void>;

	/** Login an existing Atlas user */
	login: (email: string, password: string) => Promise<void>;

	/** Logout the current Atlas user */
	logout: () => Promise<void>;

	/** Clear error state */
	clearError: () => void;
}

/**
 * Atlas Authentication Context
 */
const AtlasAuthContext = createContext<AtlasAuthContextType | undefined>(
	undefined
);

/**
 * Hook to access Atlas authentication context
 * @throws Error if used outside of AtlasAuthProvider
 */
export const useAtlasAuth = (): AtlasAuthContextType => {
	const context = useContext(AtlasAuthContext);
	if (!context) {
		throw new Error("useAtlasAuth must be used within an AtlasAuthProvider");
	}
	return context;
};

/**
 * Atlas Authentication Provider Component
 * Manages authentication state and provides auth methods to children
 */
export const AtlasAuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [atlasUser, setAtlasUser] = useState<AtlasUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Clear error state
	 */
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	/**
	 * Set up real-time listener for Atlas user data from Firestore
	 * Optimized for faster loading
	 */
	const setupAtlasUserListener = useCallback((uid: string) => {
		const userDocRef = doc(db, "atlasUsers", uid);

		const unsubscribe = onSnapshot(
			userDocRef,
			async (docSnapshot) => {
				if (docSnapshot.exists()) {
					const userData = docSnapshot.data() as AtlasUser;

					console.log("[Atlas Auth Context] User document found", {
						uid: userData.uid,
						email: userData.email,
						role: userData.role,
						isAtlasUser: userData.isAtlasUser,
						timestamp: new Date().toISOString(),
					});

					// Check if user still has Atlas access
					if (!userData.isAtlasUser) {
						// User has been deactivated - sign them out immediately
						console.log(
							"[Atlas Auth Context] User deactivated, signing out..."
						);

						// Sign out the user
						AtlasAuthService.logoutAtlasUser().then(() => {
							setUser(null);
							setAtlasUser(null);
							setError(
								"Your access has been revoked. Please contact your administrator."
							);
						});
						return;
					}

					// Update user data
					setAtlasUser(userData);
				} else {
					// User document doesn't exist - try to create it if user is authenticated
					console.log(
						"[Atlas Auth Context] User document not found, attempting to create...",
						{
							uid,
							timestamp: new Date().toISOString(),
						}
					);

					// Try to create the Atlas user document automatically
					if (user?.email && user?.displayName) {
						try {
							await AtlasAuthService.createAtlasUserDocument(
								uid,
								user.email,
								user.displayName
							);
							console.log(
								"[Atlas Auth Context] Atlas user document created successfully"
							);
							// The listener will pick up the new document
							return;
						} catch (createError) {
							console.error(
								"[Atlas Auth Context] Failed to create Atlas user document:",
								createError
							);
						}
					}

					// If creation failed or user info is missing, sign them out
					AtlasAuthService.logoutAtlasUser().then(() => {
						setUser(null);
						setAtlasUser(null);
						setError(
							"Account setup incomplete. Please contact your administrator."
						);
					});
				}
			},
			(error) => {
				console.error(
					"[Atlas Auth Context] Error listening to Atlas user changes",
					{
						uid: uid, // Explicitly reference the uid parameter
						error: error instanceof Error ? error.message : "Unknown error",
						errorCode: (error as any)?.code,
						timestamp: new Date().toISOString(),
					}
				);

				// If it's a permission error, don't sign out immediately
				if ((error as any)?.code === "permission-denied") {
					console.warn(
						"[Atlas Auth Context] Permission denied - user document may not be accessible yet",
						{
							uid: uid, // Explicitly reference the uid parameter
							timestamp: new Date().toISOString(),
						}
					);
					return;
				}

				const errorMsg = "Failed to sync user data. Please refresh the page.";
				setError(errorMsg);
			}
		);

		return unsubscribe;
	}, [user]); // Add user as dependency since it's used in the callback

	/**
	 * Register a new Atlas user
	 */
	const register = useCallback(
		async (email: string, password: string, fullName: string) => {
			try {
				setLoading(true);
				setError(null);

				const result = await AtlasAuthService.registerAtlasUser(
					email,
					password,
					fullName
				);

				if (!result.success) {
					const errorMsg =
						result.error || "Registration failed. Please try again.";
					setError(errorMsg);
					toast.error(errorMsg, {
						duration: 5000,
						description: "Please check your information and try again.",
					});
					setLoading(false);
					return;
				}

				// Show success toast
				toast.success("Account created successfully!", {
					duration: 4000,
					description: "Welcome to Atlas. Redirecting to dashboard...",
				});

				// Auth state listener will handle fetching user data
				// No need to manually set user here
			} catch (err) {
				console.error("Registration error:", err);
				const errorMsg = "An unexpected error occurred during registration";
				setError(errorMsg);
				toast.error(errorMsg, {
					duration: 5000,
					description:
						"Please try again or contact support if the issue persists.",
				});
				setLoading(false);
			}
		},
		[]
	);

	/**
	 * Login an existing Atlas user
	 */
	const login = useCallback(async (email: string, password: string) => {
		try {
			setLoading(true);
			setError(null);

			console.log("Attempting login for:", email);

			const result = await AtlasAuthService.loginAtlasUser(email, password);

			if (!result.success) {
				const errorMsg = result.error || "Login failed. Please try again.";
				setError(errorMsg);
				toast.error(errorMsg, {
					duration: 5000,
					description: "Please check your credentials and try again.",
				});
				setLoading(false);
				return;
			}

			console.log("Login successful, waiting for auth state change...");

			// Show success toast
			toast.success("Login successful!", {
				duration: 3000,
				description: "Welcome back to Atlas.",
			});

			// Set a timeout to prevent infinite loading - use a shorter timeout
			const timeoutId = setTimeout(() => {
				console.warn('[Atlas Auth Context] Login timeout - forcing loading to false after 5 seconds');
				setLoading(false);
			}, 5000); // 5 second timeout (reduced from 8)

			// Store timeout ID to clear it if auth state changes quickly
			(window as any).__atlasLoginTimeout = timeoutId;

			// Don't set loading to false here - let the auth state listener handle it
			// This prevents race conditions between login success and auth state change
		} catch (err) {
			console.error('[Atlas Auth Context] Login error:', err);
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
	 * Logout the current Atlas user
	 */
	const logout = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const result = await AtlasAuthService.logoutAtlasUser();

			if (!result.success) {
				const errorMsg = result.error || "Logout failed. Please try again.";
				setError(errorMsg);
				toast.error(errorMsg, {
					duration: 4000,
				});
				setLoading(false);
				return;
			}

			// Show success toast
			toast.success("Logged out successfully", {
				duration: 3000,
				description: "You have been signed out of Atlas.",
			});

			// Auth state listener will handle clearing user data
			setUser(null);
			setAtlasUser(null);
		} catch (err) {
			console.error("Logout error:", err);
			const errorMsg = "An unexpected error occurred during logout";
			setError(errorMsg);
			toast.error(errorMsg, {
				duration: 4000,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Set up Firebase auth state listener
	 * Automatically sets up real-time Atlas user data listener when auth state changes
	 */
	useEffect(() => {
		let isMounted = true;
		let atlasUserUnsubscribe: Unsubscribe | null = null;

		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (!isMounted) return;

			console.log(
				"Auth state changed:",
				firebaseUser ? "User logged in" : "User logged out"
			);

			if (firebaseUser) {
				// User is authenticated, set up real-time listener for Atlas user data
				setUser(firebaseUser);

				// Clean up previous listener if exists
				if (atlasUserUnsubscribe) {
					atlasUserUnsubscribe();
				}

				// Clear any pending login timeout since auth state changed successfully
				if ((window as any).__atlasLoginTimeout) {
					clearTimeout((window as any).__atlasLoginTimeout);
					(window as any).__atlasLoginTimeout = null;
				}

				// Set up Atlas user document listener
				atlasUserUnsubscribe = setupAtlasUserListener(firebaseUser.uid);
			} else {
				// User is not authenticated, clear all data
				setUser(null);
				setAtlasUser(null);

				// Clean up Atlas user listener
				if (atlasUserUnsubscribe) {
					atlasUserUnsubscribe();
					atlasUserUnsubscribe = null;
				}
			}

			// Always set loading to false after auth state is determined
			if (isMounted) {
				setLoading(false);
			}
		});

		return () => {
			isMounted = false;
			unsubscribe();
			// Clean up user document listener on unmount
			if (atlasUserUnsubscribe) {
				atlasUserUnsubscribe();
			}
		};
	}, [setupAtlasUserListener]);

	/**
	 * Memoize context value to prevent unnecessary re-renders
	 */
	const contextValue = useMemo(
		() => ({
			user,
			atlasUser,
			loading,
			error,
			register,
			login,
			logout,
			clearError,
		}),
		[user, atlasUser, loading, error, register, login, logout, clearError]
	);

	return (
		<AtlasAuthContext.Provider value={contextValue}>
			{children}
		</AtlasAuthContext.Provider>
	);
};
