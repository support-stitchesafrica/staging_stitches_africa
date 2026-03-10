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
import { onAuthStateChange } from "@/lib/auth-simple";
import { userProfileRepository } from "@/lib/firestore";
import { UserProfile } from "@/types";
import { trackAuthStateChange } from "@/lib/utils/performance-utils";
import { analytics } from "@/lib/analytics";

interface AuthContextType {
	user: User | null;
	userProfile: UserProfile | null;
	loading: boolean;
	isFirstTimeUser: boolean;
	hasCompletedOnboarding: boolean;
	error: string | null;
	isRetryable: boolean;
	moduleLoadError: boolean;
	moduleLoadingState: "idle" | "loading" | "loaded" | "error";
	retryCount: number;
	checkUserStatus: () => Promise<void>;
	clearError: () => void;
	retryLastOperation: () => Promise<void>;
	retryModuleLoading: () => Promise<void>;
	// Enhanced properties for navigation integration
	navigationAuthState: {
		user: User | null;
		loading: boolean;
		error: string | null;
		moduleLoadError: boolean;
	};
	isAuthenticated: boolean;
	isServiceAvailable: boolean;
	// VVIP properties
	isVvip: boolean;
}

const AuthContext = createContext<AuthContextType>({
	user: null,
	userProfile: null,
	loading: true,
	isFirstTimeUser: false,
	hasCompletedOnboarding: false,
	error: null,
	isRetryable: false,
	moduleLoadError: false,
	moduleLoadingState: "idle",
	retryCount: 0,
	checkUserStatus: async () => {},
	clearError: () => {},
	retryLastOperation: async () => {},
	retryModuleLoading: async () => {},
	// Enhanced properties for navigation integration
	navigationAuthState: {
		user: null,
		loading: true,
		error: null,
		moduleLoadError: false,
	},
	isAuthenticated: false,
	isServiceAvailable: false,
	// VVIP properties
	isVvip: false,
});

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(true);
	const [profileLoading, setProfileLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isRetryable, setIsRetryable] = useState(false);
	const [moduleLoadError, setModuleLoadError] = useState(false);
	const [moduleLoadingState, setModuleLoadingState] = useState<
		"idle" | "loading" | "loaded" | "error"
	>("idle");
	const [retryCount, setRetryCount] = useState(0);
	const [lastFailedOperation, setLastFailedOperation] = useState<
		(() => Promise<void>) | null
	>(null);

	// Memoized user status values to prevent unnecessary re-renders
	const isFirstTimeUser = useMemo(() => {
		return userProfile?.metadata.isFirstTimeUser ?? false;
	}, [userProfile?.metadata.isFirstTimeUser]);

	const hasCompletedOnboarding = useMemo(() => {
		return userProfile?.metadata.hasCompletedOnboarding ?? false;
	}, [userProfile?.metadata.hasCompletedOnboarding]);

	// Memoized VVIP status to prevent unnecessary re-renders
	const isVvip = useMemo(() => {
		return userProfile?.isVvip ?? false;
	}, [userProfile?.isVvip]);

	// Clear error state
	const clearError = useCallback(() => {
		setError(null);
		setIsRetryable(false);
		setModuleLoadError(false);
		setLastFailedOperation(null);
		setRetryCount(0);
	}, []);

	// Function to check and update user status with enhanced error handling
	const checkUserStatus = useCallback(async () => {
		if (!user?.uid) return;

		// Skip if we already have a profile for the same user (simple caching)
		if (userProfile && userProfile.uid === user.uid) {
			return;
		}

		// Check if user is an admin - skip profile operations for admins
		// This prevents permission errors when admins try to access main app resources
		try {
			const { doc, getDoc } = await import("firebase/firestore");
			const { db } = await import("@/firebase");
			const adminDoc = await getDoc(doc(db, "admins", user.uid));
			if (adminDoc.exists()) {
				const adminData = adminDoc.data();
				if (adminData?.role === "admin" || adminData?.role === "superadmin") {
					console.log(
						"[AuthContext] User is an admin, skipping profile operations"
					);
					setUserProfile(null);
					setProfileLoading(false);
					setError(null);
					return;
				}
			}
		} catch (error) {
			// If check fails (e.g., permission error), assume user is not an admin
			// and continue with normal flow - errors will be handled by the main operation
			console.log(
				"[AuthContext] Admin check failed (non-critical), continuing with normal flow"
			);
		}

		// Check if user is a Collections user - skip profile operations for Collections users
		// This prevents permission errors when Collections users try to access main app resources
		try {
			const { CollectionsAuthService } = await import(
				"@/lib/collections/auth-service"
			);
			const isCollectionsUser =
				await CollectionsAuthService.validateCollectionsAccess(user.uid);
			if (isCollectionsUser) {
				console.log(
					"[AuthContext] User is a Collections user, skipping profile operations"
				);
				setUserProfile(null);
				setProfileLoading(false);
				setError(null);
				return;
			}
		} catch (error) {
			// If check fails (e.g., permission error), assume user is not a Collections user
			// and continue with normal flow - errors will be handled by the main operation
			console.log(
				"[AuthContext] Collections user check failed (non-critical), continuing with normal flow"
			);
		}

		const trackPerformance = trackAuthStateChange();

		const operation = async () => {
			setProfileLoading(true);
			setError(null);

			try {
				let profile = await userProfileRepository.getProfile(user.uid);

				// Create profile if it doesn't exist (new user)
				if (!profile) {
					profile = await userProfileRepository.createProfile(
						user.uid,
						user.email || "",
						user.displayName || null,
						user.photoURL || null
					);
				} else {
					// Update last login for existing users (non-blocking)
					userProfileRepository
						.updateLastLogin(
							user.uid,
							user.email || undefined,
							user.displayName || null,
							user.photoURL || null
						)
						.catch((error) => {
							console.warn("Failed to update last login:", error);
						});

					// Auto-mark existing users as having completed onboarding if they haven't been marked yet
					if (
						!profile.metadata.hasCompletedOnboarding &&
						!profile.metadata.isFirstTimeUser
					) {
						userProfileRepository
							.markOnboardingCompleted(user.uid)
							.catch((error) => {
								console.warn(
									"Failed to auto-mark onboarding completed for existing user:",
									error
								);
							});
						// Update the profile object to reflect the change
						profile.metadata.hasCompletedOnboarding = true;
					}
				}

				setUserProfile(profile);
				setError(null);
				setIsRetryable(false);
				trackPerformance(true);
			} catch (error) {
				console.error("Error checking user status:", error);

				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to load user profile";
				const isNetworkError = detectNetworkFailure(error);

				// Check if this is a module loading error
				const isModuleError =
					errorMessage.toLowerCase().includes("module") ||
					errorMessage.toLowerCase().includes("import") ||
					errorMessage.toLowerCase().includes("factory not available");

				if (isModuleError) {
					setModuleLoadError(true);
					setModuleLoadingState("error");
					setError(
						"Authentication system temporarily unavailable. Please try again."
					);
				} else if (isNetworkError) {
					setError(
						"Network connection failed. Please check your internet connection and try again."
					);
				} else {
					setError(`Profile loading failed: ${errorMessage}`);
				}

				setIsRetryable(true);
				setLastFailedOperation(() => operation);

				// Set default values on error to prevent blocking
				setUserProfile(null);
				trackPerformance(false);
			} finally {
				setProfileLoading(false);
			}
		};

		await operation();
	}, [user?.uid, user?.email, user?.displayName, user?.photoURL, userProfile]);

	// Retry last failed operation
	const retryLastOperation = useCallback(async () => {
		if (lastFailedOperation) {
			setRetryCount((prev) => prev + 1);
			await lastFailedOperation();
		}
	}, [lastFailedOperation]);

	// Enhanced network failure detection and recovery
	const detectNetworkFailure = useCallback((error: any): boolean => {
		const errorMessage = error?.message?.toLowerCase() || "";
		return (
			errorMessage.includes("network") ||
			errorMessage.includes("offline") ||
			errorMessage.includes("connection") ||
			errorMessage.includes("timeout") ||
			error?.code === "unavailable"
		);
	}, []);

	// Retry module loading specifically with enhanced error handling
	const retryModuleLoading = useCallback(async () => {
		if (moduleLoadError) {
			setModuleLoadingState("loading");
			setRetryCount((prev) => prev + 1);

			try {
				// Clear module cache and retry auth state listener setup
				const { clearModuleCache } = await import("@/lib/firebase-wrapper");
				clearModuleCache();

				// Retry setting up auth listener
				const unsubscribe = await onAuthStateChange(async (firebaseUser) => {
					setUser(firebaseUser);
					if (firebaseUser) {
						await checkUserStatus();
					} else {
						setUserProfile(null);
					}
					setLoading(false);
				});

				setModuleLoadingState("loaded");
				setModuleLoadError(false);
				setError(null);

				// Don't return unsubscribe to match Promise<void> return type
			} catch (error) {
				console.error("Module loading retry failed:", error);

				// Enhanced error classification
				const isNetworkError = detectNetworkFailure(error);
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";

				setModuleLoadingState("error");
				setModuleLoadError(true);

				if (isNetworkError) {
					setError(
						"Network connection failed. Please check your internet connection and try again."
					);
				} else {
					setError(
						"Authentication modules failed to load. Please refresh the page."
					);
				}

				setIsRetryable(true);
			}
		}
	}, [moduleLoadError, checkUserStatus, detectNetworkFailure]);

	// Handle authentication state changes with optimized listener
	useEffect(() => {
		let isMounted = true;
		let unsubscribe: (() => void) | null = null;

		const setupAuthListener = async () => {
			try {
				setModuleLoadingState("loading");

				// Wrap the auth state change listener with additional error handling
				unsubscribe = await onAuthStateChange(async (firebaseUser) => {
					// Only update state if component is still mounted
					if (!isMounted) return;

					const authStartTime = performance.now();

					try {
						setUser(firebaseUser);

						if (firebaseUser) {
							// Set user ID for analytics
							analytics.setUserId(firebaseUser.uid);
							// User is authenticated, check their status
							setLoading(true);

							// Check if user is an admin - skip profile operations for admins
							// This prevents permission errors when admins try to access main app resources
							try {
								const { doc, getDoc } = await import("firebase/firestore");
								const { db } = await import("@/firebase");
								const adminDoc = await getDoc(
									doc(db, "admins", firebaseUser.uid)
								);
								if (adminDoc.exists()) {
									const adminData = adminDoc.data();
									if (
										adminData?.role === "admin" ||
										adminData?.role === "superadmin"
									) {
										console.log(
											"[AuthContext] User is an admin, skipping profile operations in auth listener"
										);
										if (isMounted) {
											setUserProfile(null);
											setLoading(false);
											setError(null);
										}
										return;
									}
								}
							} catch (error: any) {
								// If check fails with permission error, user might be admin but rules not deployed
								// Skip collections and users checks to avoid multiple permission errors
								if (
									error?.code === "permission-denied" ||
									error?.message?.includes("permission") ||
									error?.message?.includes("insufficient permissions")
								) {
									console.log(
										"[AuthContext] Admin check permission denied - user may be admin, skipping further checks"
									);
									if (isMounted) {
										setUserProfile(null);
										setLoading(false);
										setError(null);
									}
									return;
								}
								// For other errors, continue with normal flow
								console.log(
									"[AuthContext] Admin check failed (non-critical), continuing with normal flow"
								);
							}

							// Check if user is a Collections user - skip profile operations for Collections users
							// This prevents permission errors when Collections users try to access main app resources
							try {
								const { CollectionsAuthService } = await import(
									"@/lib/collections/auth-service"
								);
								const isCollectionsUser =
									await CollectionsAuthService.validateCollectionsAccess(
										firebaseUser.uid
									);
								if (isCollectionsUser) {
									console.log(
										"[AuthContext] User is a Collections user, skipping profile operations in auth listener"
									);
									if (isMounted) {
										setUserProfile(null);
										setLoading(false);
										setError(null);
									}
									return;
								}
							} catch (error) {
								// If check fails (e.g., permission error), assume user is not a Collections user
								// and continue with normal flow - errors will be handled by the try/catch below
								console.log(
									"[AuthContext] Collections user check failed (non-critical), continuing with normal flow"
								);
							}

							try {
								let profile: UserProfile | null = null;

								try {
									profile = await userProfileRepository.getProfile(
										firebaseUser.uid
									);
								} catch (profileError: any) {
									// If we get a permission error, check if user is an admin or Collections user
									if (
										profileError?.code === "permission-denied" ||
										profileError?.message?.includes("permission") ||
										profileError?.message?.includes("insufficient permissions")
									) {
										console.log(
											"[AuthContext] Permission error getting profile, checking if admin or Collections user"
										);

										// First check if user is an admin
										try {
											const { doc, getDoc } = await import(
												"firebase/firestore"
											);
											const { db } = await import("@/firebase");
											const adminDoc = await getDoc(
												doc(db, "admins", firebaseUser.uid)
											);
											if (adminDoc.exists()) {
												const adminData = adminDoc.data();
												if (
													adminData?.role === "admin" ||
													adminData?.role === "superadmin"
												) {
													console.log(
														"[AuthContext] User is an admin (detected via permission error), skipping profile operations"
													);
													if (isMounted) {
														setUserProfile(null);
														setLoading(false);
														setError(null);
													}
													return;
												}
											}
										} catch (adminCheckError) {
											// If admin check fails, continue to Collections check
											console.log(
												"[AuthContext] Admin check failed after permission error"
											);
										}

										// Then check if user is a Collections user
										try {
											const { CollectionsAuthService } = await import(
												"@/lib/collections/auth-service"
											);
											const isCollectionsUser =
												await CollectionsAuthService.validateCollectionsAccess(
													firebaseUser.uid
												);
											if (isCollectionsUser) {
												console.log(
													"[AuthContext] User is a Collections user (detected via permission error), skipping profile operations"
												);
												if (isMounted) {
													setUserProfile(null);
													setLoading(false);
													setError(null);
												}
												return;
											}
										} catch (checkError) {
											// If check fails, continue with normal error handling
											console.log(
												"[AuthContext] Collections check failed after permission error"
											);
										}
									}
									// Re-throw if not a permission error or admin/Collections user check failed
									throw profileError;
								}

								// Only proceed if component is still mounted
								if (!isMounted) return;

								// Create profile if it doesn't exist (new user)
								if (!profile) {
									// Double-check it's not an admin before creating
									try {
										const { doc, getDoc } = await import("firebase/firestore");
										const { db } = await import("@/firebase");
										const adminDoc = await getDoc(
											doc(db, "admins", firebaseUser.uid)
										);
										if (adminDoc.exists()) {
											const adminData = adminDoc.data();
											if (
												adminData?.role === "admin" ||
												adminData?.role === "superadmin"
											) {
												console.log(
													"[AuthContext] User is an admin, skipping profile creation"
												);
												if (isMounted) {
													setUserProfile(null);
													setLoading(false);
													setError(null);
												}
												return;
											}
										}
									} catch (adminCheckError) {
										// If check fails, continue with Collections check
										console.log(
											"[AuthContext] Admin check failed before profile creation, continuing"
										);
									}

									// Double-check it's not a Collections user before creating
									try {
										const { CollectionsAuthService } = await import(
											"@/lib/collections/auth-service"
										);
										const isCollectionsUser =
											await CollectionsAuthService.validateCollectionsAccess(
												firebaseUser.uid
											);
										if (isCollectionsUser) {
											console.log(
												"[AuthContext] User is a Collections user, skipping profile creation"
											);
											if (isMounted) {
												setUserProfile(null);
												setLoading(false);
												setError(null);
											}
											return;
										}
									} catch (checkError) {
										// If check fails, continue with profile creation
										console.log(
											"[AuthContext] Collections check failed before profile creation, continuing"
										);
									}

									profile = await userProfileRepository.createProfile(
										firebaseUser.uid,
										firebaseUser.email || "",
										firebaseUser.displayName || null,
										firebaseUser.photoURL || null
									);
								} else {
									// Update last login for existing users (non-blocking)
									// Wrap in try/catch to prevent Collections user errors from bubbling
									userProfileRepository
										.updateLastLogin(
											firebaseUser.uid,
											firebaseUser.email || undefined,
											firebaseUser.displayName || null,
											firebaseUser.photoURL || null
										)
										.catch((error) => {
											// Silently ignore errors - might be Collections user
											console.warn("Failed to update last login:", error);
										});

									// Auto-mark existing users as having completed onboarding if they haven't been marked yet
									// This helps with users who had accounts before the onboarding system was implemented
									if (
										!profile.metadata.hasCompletedOnboarding &&
										!profile.metadata.isFirstTimeUser
									) {
										userProfileRepository
											.markOnboardingCompleted(firebaseUser.uid)
											.catch((error) => {
												console.warn(
													"Failed to auto-mark onboarding completed for existing user:",
													error
												);
											});
										// Update the profile object to reflect the change
										profile.metadata.hasCompletedOnboarding = true;
									}
								}

								if (isMounted) {
									setUserProfile(profile);

									// Track successful authentication
									const authDuration = performance.now() - authStartTime;
									analytics.trackAuth({
										action: "login_success",
										duration: authDuration,
										timestamp: new Date().toISOString(),
										userId: firebaseUser.uid,
										isFirstTime: profile?.metadata.isFirstTimeUser,
									});
								}
							} catch (error) {
								console.error("Error loading user profile:", error);
								if (isMounted) {
									const errorMessage =
										error instanceof Error
											? error.message
											: "profile_load_error";
									const isNetworkError = detectNetworkFailure(error);

									// Check if this is a module loading error
									const isModuleError =
										errorMessage.toLowerCase().includes("module") ||
										errorMessage.toLowerCase().includes("import") ||
										errorMessage
											.toLowerCase()
											.includes("factory not available");

									if (isModuleError) {
										setModuleLoadError(true);
										setModuleLoadingState("error");
										setError(
											"Authentication system temporarily unavailable. Please try again."
										);
									} else if (isNetworkError) {
										setError(
											"Network connection failed. Please check your internet connection and try again."
										);
									} else {
										setError(`Profile loading failed: ${errorMessage}`);
									}

									setUserProfile(null);

									// Track authentication failure with enhanced error classification
									const authDuration = performance.now() - authStartTime;
									analytics.trackAuth({
										action: "login_failure",
										duration: authDuration,
										errorType: isNetworkError
											? "network_error"
											: isModuleError
											? "module_error"
											: "profile_error",
										timestamp: new Date().toISOString(),
									});
								}
							}
						} else {
							// User is not authenticated, clear profile
							if (isMounted) {
								setUserProfile(null);
								analytics.clearUserId();

								// Track logout if there was a previous user
								if (user) {
									analytics.trackAuth({
										action: "logout",
										timestamp: new Date().toISOString(),
									});
								}
							}
						}

						if (isMounted) {
							setLoading(false);
						}
					} catch (authError) {
						console.error("Error in auth state change handler:", authError);
						if (isMounted) {
							setError("Authentication state change failed");
							setLoading(false);
						}
					}
				});

				// Successfully set up auth listener
				if (isMounted) {
					setModuleLoadingState("loaded");
				}
			} catch (error) {
				console.error("Failed to setup auth listener:", error);
				if (isMounted) {
					const errorMessage =
						error instanceof Error ? error.message : "Unknown error";

					// Check if this is a module loading error
					const isModuleError =
						errorMessage.toLowerCase().includes("module") ||
						errorMessage.toLowerCase().includes("import") ||
						errorMessage.toLowerCase().includes("factory not available");

					if (isModuleError) {
						setModuleLoadError(true);
						setModuleLoadingState("error");
						setError(
							"Authentication system failed to initialize. Please refresh the page."
						);
						setIsRetryable(true);
					} else {
						setError(`Authentication setup failed: ${errorMessage}`);
						setIsRetryable(true);
					}

					setLoading(false);
				}
			}
		};

		setupAuthListener();

		return () => {
			isMounted = false;
			if (unsubscribe) {
				unsubscribe();
			}
		};
	}, []);

	// Enhanced memoization for navigation-specific auth state
	const navigationAuthState = useMemo(
		() => ({
			user,
			loading: loading || profileLoading,
			error,
			moduleLoadError,
		}),
		[user, loading, profileLoading, error, moduleLoadError]
	);

	// Memoized authentication status to prevent navigation re-renders
	const isAuthenticated = useMemo(() => !!user, [user]);

	// Memoized service availability status
	const isServiceAvailable = useMemo(() => {
		return !moduleLoadError || moduleLoadingState === "loaded";
	}, [moduleLoadError, moduleLoadingState]);

	// Memoize context value to prevent unnecessary re-renders
	const contextValue = useMemo(
		() => ({
			user,
			userProfile,
			loading: loading || profileLoading,
			isFirstTimeUser,
			hasCompletedOnboarding,
			error,
			isRetryable,
			moduleLoadError,
			moduleLoadingState,
			retryCount,
			checkUserStatus,
			clearError,
			retryLastOperation,
			retryModuleLoading,
			// Enhanced properties for navigation integration
			navigationAuthState,
			isAuthenticated,
			isServiceAvailable,
			// VVIP properties
			isVvip,
		}),
		[
			user,
			userProfile,
			loading,
			profileLoading,
			isFirstTimeUser,
			hasCompletedOnboarding,
			error,
			isRetryable,
			moduleLoadError,
			moduleLoadingState,
			retryCount,
			checkUserStatus,
			clearError,
			retryLastOperation,
			retryModuleLoading,
			navigationAuthState,
			isAuthenticated,
			isServiceAvailable,
			isVvip,
		]
	);

	return (
		<AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
	);
};
