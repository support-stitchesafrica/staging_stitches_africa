/**
 * Referral Program Authentication Context
 * Provides authentication state and user management for referral program
 * Requirements: 2.1, 2.2, 2.3, 2.4
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
import { User, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, db } from "@/lib/firebase-client";
import { ReferralUser } from "@/lib/referral/types";
import { toast } from "sonner";

/**
 * Referral Authentication Context Type
 * Manages authentication state and operations for referral users
 */
interface ReferralAuthContextType {
	/** Firebase Auth user object */
	user: User | null;

	/** Firestore referral user document */
	referralUser: ReferralUser | null;

	/** Loading state during authentication operations */
	loading: boolean;

	/** Error message if authentication fails */
	error: string | null;

	/** Register a new referrer */
	register: (
		email: string,
		password: string,
		fullName: string
	) => Promise<void>;

	/** Login an existing referrer */
	login: (email: string, password: string) => Promise<void>;

	/** Logout the current referrer */
	logout: () => Promise<void>;

	/** Clear error state */
	clearError: () => void;

	/** Check if user is authenticated */
	isAuthenticated: boolean;

	/** Check if user is admin */
	isAdmin: boolean;

	/** Check if user is a legacy Auth user without referral profile */
	isLegacyUser: boolean;

	/** Complete profile for keyacy user */
	completeProfile: (fullName: string) => Promise<void>;
}

/**
 * Referral Authentication Context
 */
const ReferralAuthContext = createContext<ReferralAuthContextType | undefined>(
	undefined
);

/**
 * Hook to access Referral authentication context
 * @throws Error if used outside of ReferralAuthProvider
 */
export const useReferralAuth = (): ReferralAuthContextType => {
	const context = useContext(ReferralAuthContext);
	if (!context) {
		throw new Error(
			"useReferralAuth must be used within a ReferralAuthProvider"
		);
	}
	return context;
};

/**
 * Referral Authentication Provider Component
 * Manages authentication state and provides auth methods to children
 */
export const ReferralAuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [referralUser, setReferralUser] = useState<ReferralUser | null>(null);
	const [isLegacyUser, setIsLegacyUser] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	/**
	 * Clear error state
	 */
	const clearError = useCallback(() => {
		setError(null);
	}, []);

	/**
	 * Set up real-time listener for referral user data from Firestore
	 * Handles account deactivation in real-time
	 */
	const setupReferralUserListener = useCallback((uid: string) => {
		const userDocRef = doc(db, "referralUsers", uid);

		const unsubscribe = onSnapshot(
			userDocRef,
			(docSnapshot) => {
				if (docSnapshot.exists()) {
					const userData = docSnapshot.data() as ReferralUser;

					// Check if user account is still active
					if (!userData.isActive) {
						// User has been deactivated - sign them out immediately
						console.log("Referral account deactivated, signing out...");
						toast.error("Account Deactivated", {
							duration: 6000,
							description:
								"Your referral account has been deactivated. You will be signed out.",
						});

						// Sign out the user
						logout().then(() => {
							setUser(null);
							setReferralUser(null);
							setError(
								"Your account has been deactivated. Please contact support."
							);
						});
						return;
					}

					// Update user data
					setReferralUser(userData);
					setIsLegacyUser(false);
				} else {
					// User document doesn't exist - this is a legacy user
					console.log(
						"Referral user document not found - Legacy User detected"
					);
					setReferralUser(null);
					setIsLegacyUser(true);
				}
			},
			(error) => {
				console.error("Error listening to referral user changes:", error);
				const errorMsg = "Failed to sync user data. Please refresh the page.";
				setError(errorMsg);
				toast.error("Sync Error", {
					duration: 5000,
					description: errorMsg,
				});
			}
		);

		return unsubscribe;
	}, []);

	/**
	 * Register a new referrer
	 * Requirements: 2.1
	 * Now includes automatic login after successful registration
	 */
	const register = useCallback(
		async (email: string, password: string, fullName: string) => {
			try {
				setLoading(true);
				setError(null);

				// Call registration API
				const response = await fetch("/api/referral/register", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email, password, fullName }),
				});

				const result = await response.json();

				if (!response.ok || !result.success) {
					const errorMsg =
						result.error?.message || "Registration failed. Please try again.";
					setError(errorMsg);
					toast.error("Registration Failed", {
						duration: 5000,
						description: errorMsg,
					});
					setLoading(false);
					return;
				}

				// Registration successful! Now automatically sign in with Firebase Auth
				console.log("Registration successful, signing in automatically...");

				try {
					// Sign in with Firebase Auth using the same credentials
					const { signInWithEmailAndPassword } = await import("firebase/auth");
					await signInWithEmailAndPassword(auth, email, password);

					console.log("Automatic sign-in successful");

					// Show success toast
					toast.success("Account created successfully!", {
						duration: 3000,
						description: "Welcome to the referral program! Redirecting...",
					});

					// The SignUpForm component will handle the redirect after a short delay
					// This allows the auth state listener to sync the user data
				} catch (signInError: any) {
					console.error("Automatic sign-in failed:", signInError);

					// Registration succeeded but auto-login failed
					// Show a message asking user to login manually
					toast.warning("Account Created", {
						duration: 6000,
						description:
							"Your account was created successfully. Please login to continue.",
					});

					setLoading(false);
				}
			} catch (err) {
				console.error("Registration error:", err);
				const errorMsg = "An unexpected error occurred during registration";
				setError(errorMsg);
				toast.error("Registration Error", {
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
	 * Login an existing referrer
	 * Requirements: 2.2, 2.3, 11.1, 12.1
	 */
	const login = useCallback(async (email: string, password: string) => {
		try {
			setLoading(true);
			setError(null);

			console.log("Attempting login for:", email);

			// Step 1: Use Firebase Auth for authentication
			const { signInWithEmailAndPassword } = await import("firebase/auth");
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);

			// Step 2: Get Firebase ID token
			const idToken = await userCredential.user.getIdToken();

			// Step 3: Call login API to set JWT cookie
			const response = await fetch("/api/referral/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ idToken }),
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				// SPECIAL CASE: Profile required (Legacy User)
				if (result.error?.code === "PROFILE_REQUIRED") {
					console.log("Profile setup required for user");
					setIsLegacyUser(true);
					setLoading(false);
					return;
				}

				// Login failed, sign out from Firebase
				await auth.signOut();
				const errorMsg =
					result.error?.message || "Login failed. Please try again.";
				setError(errorMsg);
				toast.error("Login Failed", {
					duration: 5000,
					description: errorMsg,
				});
				setLoading(false);
				return;
			}

			console.log("Login successful, JWT cookie set");

			// Show success toast
			toast.success("Login successful!", {
				duration: 3000,
				description: "Welcome back to the referral program.",
			});

			// Don't set loading to false here - let the auth state listener handle it
			// This prevents race conditions between login success and auth state change
		} catch (err: any) {
			console.error("Login error:", err);

			let errorMsg = "An unexpected error occurred during login";

			// Handle specific Firebase auth errors
			if (
				err.code === "auth/user-not-found" ||
				err.code === "auth/wrong-password"
			) {
				errorMsg = "Invalid email or password";
			} else if (err.code === "auth/too-many-requests") {
				errorMsg = "Too many failed login attempts. Please try again later.";
			} else if (err.code === "auth/user-disabled") {
				errorMsg = "This account has been disabled";
			}

			setError(errorMsg);
			toast.error("Login Failed", {
				duration: 5000,
				description: errorMsg,
			});
			setLoading(false);
		}
	}, []);

	/**
	 * Complete profile for legacy user
	 * Requirements: Legacy User Support
	 */
	const completeProfile = useCallback(
		async (fullName: string) => {
			try {
				if (!user) throw new Error("No authenticated user");

				setLoading(true);
				const idToken = await user.getIdToken();

				const response = await fetch("/api/referral/complete-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ idToken, fullName }),
				});

				const result = await response.json();

				if (!response.ok || !result.success) {
					throw new Error(
						result.error?.message || "Failed to complete profile"
					);
				}

				toast.success("Profile Completed!", {
					description: "Your referral account has been set up successfully.",
				});

				// isLegacyUser will be updated automatically by the listener
			} catch (err: any) {
				console.error("Profile completion error:", err);
				toast.error("Setup Failed", {
					description: err.message || "Please try again.",
				});
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[user]
	);

	/**
	 * Logout the current referrer
	 * Requirements: 2.4, 11.1, 12.1
	 */
	const logout = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Step 1: Call logout API to clear JWT cookie
			await fetch("/api/referral/logout", {
				method: "POST",
			});

			// Step 2: Sign out from Firebase
			await auth.signOut();

			// Show success toast
			toast.success("Logged out successfully", {
				duration: 3000,
				description: "You have been signed out of the referral program.",
			});

			// Auth state listener will handle clearing user data
			setUser(null);
			setReferralUser(null);
		} catch (err) {
			console.error("Logout error:", err);
			const errorMsg = "An unexpected error occurred during logout";
			setError(errorMsg);
			toast.error("Logout Error", {
				duration: 4000,
				description: errorMsg,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Set up Firebase auth state listener
	 * Automatically sets up real-time referral user data listener when auth state changes
	 * Requirements: 11.5, 12.5
	 */
	useEffect(() => {
		let isMounted = true;
		let referralUserUnsubscribe: Unsubscribe | null = null;
		let tokenRefreshInterval: NodeJS.Timeout | null = null;
		let initialAuthCheckComplete = false;

		// Check if we have a JWT cookie on mount to determine if we should wait for Firebase Auth
		let hasJWTCookie = false;
		if (typeof document !== "undefined") {
			hasJWTCookie = document.cookie.includes("referral_token=");
		}

		console.log(
			"Setting up auth state listener. Has JWT cookie:",
			hasJWTCookie
		);

		// Add a minimum delay to ensure Firebase Auth has time to restore persisted session
		// This prevents premature "not authenticated" states on page reload
		const minLoadingTime = hasJWTCookie ? 500 : 300;
		const startTime = Date.now();

		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			if (!isMounted) return;

			console.log(
				"Auth state changed:",
				firebaseUser
					? `User logged in (${firebaseUser.email})`
					: "User logged out",
				"Has JWT cookie:",
				hasJWTCookie
			);

			// Mark that initial auth check is complete
			if (!initialAuthCheckComplete) {
				initialAuthCheckComplete = true;
				console.log("Initial auth check complete");
			}

			if (firebaseUser) {
				// User is authenticated, set up real-time listener for referral user data
				setUser(firebaseUser);

				// Clean up previous listener if exists
				if (referralUserUnsubscribe) {
					referralUserUnsubscribe();
				}

				// Set up new listener
				referralUserUnsubscribe = setupReferralUserListener(firebaseUser.uid);

				// Set up token refresh interval (refresh every 6 days, token expires in 7 days)
				if (tokenRefreshInterval) {
					clearInterval(tokenRefreshInterval);
				}

				tokenRefreshInterval = setInterval(async () => {
					try {
						console.log("Refreshing JWT token...");
						const response = await fetch("/api/referral/refresh-token", {
							method: "POST",
						});

						if (response.ok) {
							console.log("JWT token refreshed successfully");
						} else {
							console.error("Failed to refresh JWT token");
						}
					} catch (error) {
						console.error("Error refreshing JWT token:", error);
					}
				}, 6 * 24 * 60 * 60 * 1000); // Refresh every 6 days

				// Ensure minimum loading time has passed before setting loading to false
				const elapsedTime = Date.now() - startTime;
				const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

				setTimeout(() => {
					if (isMounted) {
						setLoading(false);
					}
				}, remainingTime);
			} else {
				// User is not authenticated, clean up listener and clear state
				if (referralUserUnsubscribe) {
					referralUserUnsubscribe();
					referralUserUnsubscribe = null;
				}

				if (tokenRefreshInterval) {
					clearInterval(tokenRefreshInterval);
					tokenRefreshInterval = null;
				}

				setUser(null);
				setReferralUser(null);
				setIsLegacyUser(false);
				setError(null); // Clear any previous errors

				// Ensure minimum loading time has passed before setting loading to false
				// This prevents flickering on page reload when session is being restored
				const elapsedTime = Date.now() - startTime;
				const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

				setTimeout(() => {
					if (isMounted) {
						setLoading(false);
					}
				}, remainingTime);
			}
		});

		return () => {
			isMounted = false;
			unsubscribe();
			// Clean up user document listener on unmount
			if (referralUserUnsubscribe) {
				referralUserUnsubscribe();
			}
			// Clean up token refresh interval
			if (tokenRefreshInterval) {
				clearInterval(tokenRefreshInterval);
			}
		};
	}, [setupReferralUserListener]);

	// Computed authentication status
	const isAuthenticated = useMemo(
		() => !!user && !!referralUser,
		[user, referralUser]
	);
	const isAdmin = useMemo(() => referralUser?.isAdmin ?? false, [referralUser]);

	/**
	 * Memoize context value to prevent unnecessary re-renders
	 */
	const contextValue = useMemo(
		() => ({
			user,
			referralUser,
			loading,
			error,
			register,
			login,
			logout,
			clearError,
			isAuthenticated,
			isAdmin,
			isLegacyUser,
			completeProfile,
		}),
		[
			user,
			referralUser,
			isLegacyUser,
			loading,
			error,
			register,
			login,
			logout,
			completeProfile,
			clearError,
			isAuthenticated,
			isAdmin,
		]
	);

	return (
		<ReferralAuthContext.Provider value={contextValue}>
			{children}
		</ReferralAuthContext.Provider>
	);
};
