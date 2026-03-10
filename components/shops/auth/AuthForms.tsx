"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
	signInWithEmail,
	signUpWithEmail,
	signInWithGoogle,
} from "@/lib/auth-simple";
import { Eye, EyeOff } from "lucide-react";
import { LoadingSkeleton } from "@/components/shops/ui/LoadingSkeleton";
import {
	MultiStepRegistration,
	RegistrationData,
} from "./MultiStepRegistration";
import { userProfileRepository } from "@/lib/firestore";
import { EmailNotificationService } from "@/lib/services/emailNotificationService";
import { GeolocationService } from "@/lib/services/geolocationService";
import { SignupCounterService } from "@/lib/services/signupCounterService";
import { createUserDocument } from "@/lib/services/userCollectionService";
import { trackReferralSignup } from "@/lib/referral/track-signup-helper";
import { FirstSignupService } from "@/lib/services/firstSignupService";
import { ShopRegistrationService } from "@/lib/shops";

interface AuthFormsProps {
	onSuccess?: () => void;
}

export const AuthForms: React.FC<AuthFormsProps> = ({ onSuccess }) => {
	const searchParams = useSearchParams();
	const [isLogin, setIsLogin] = useState(true);
	const [showMultiStepRegistration, setShowMultiStepRegistration] =
		useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [referralCode, setReferralCode] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [registrationAllowed, setRegistrationAllowed] = useState<
		boolean | null
	>(null);

	// Extract referral code from URL on mount and allow registration for all users
	useEffect(() => {
		const refCode = searchParams.get("ref");
		if (refCode) {
			setReferralCode(refCode.trim().toUpperCase());
		}

		// Allow registration for all users (open signup)
		setRegistrationAllowed(true);
	}, [searchParams]);

	const handleEmailAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);

		try {
			if (!isLogin) {
				if (password !== confirmPassword) {
					throw new Error("Passwords do not match");
				}
			}

			const result = isLogin
				? await signInWithEmail(email, password)
				: await signUpWithEmail(email, password);

			if (result.error) {
				setError(result.error);
			} else {
				// For new signups, get geolocation and record signup
				if (!isLogin && result.user) {
					try {
						// Get user's location (non-blocking)
						const locationData = await GeolocationService.getUserLocation();

						// Create user profile with location data (web format)
						await userProfileRepository.createProfile(
							result.user.uid,
							result.user.email || email,
							result.user.displayName,
							result.user.photoURL,
							locationData.country,
							locationData.state,
						);

						// Create user document in users collection (mobile app format)
						await createUserDocument(result.user.uid, {
							email: result.user.email || email,
							displayName: result.user.displayName,
							shoppingPreference: [],
							registrationCountry: locationData.country,
							registrationState: locationData.state,
						});

						// Record signup in web_signUp collection
						SignupCounterService.recordSignup({
							userId: result.user.uid,
							email: result.user.email || email,
							registration_country: locationData.country,
							registration_state: locationData.state,
							registration_city: locationData.city,
							registration_ip: locationData.ip,
							timezone: GeolocationService.getUserTimezone(),
							language: GeolocationService.getUserLanguage(),
							registration_method: "email",
						});

						// Requirement 2.1, 2.2: Create referral user document for shop registration
						try {
							await ShopRegistrationService.createReferralUser(
								result.user.uid,
								result.user.email || email,
								result.user.displayName,
								referralCode,
							);
						} catch (referralError) {
							// Requirement 2.5: Log error but don't block registration
							console.error("Failed to create referral user:", referralError);
						}

						// Track referral if referral code exists
						if (referralCode) {
							await trackReferralSignup({
								referralCode,
								userId: result.user.uid,
								email: result.user.email || email,
								name: result.user.displayName || email.split("@")[0],
							});
						}
					} catch (geoError) {
						console.error("Error getting geolocation:", geoError);
						// Continue even if geolocation fails
					}
				}

				// Send email notifications (non-blocking)
				if (result.user && result.user.email) {
					const customerName = EmailNotificationService.getCustomerName(
						result.user,
					);

					if (isLogin) {
						EmailNotificationService.sendLoginNotification({
							email: result.user.email,
							customerName,
							device: EmailNotificationService.getDeviceInfo(),
						});
					} else {
						EmailNotificationService.sendWelcomeEmail({
							email: result.user.email,
							customerName,
						});
					}
				}

				onSuccess?.();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Authentication failed");
		} finally {
			setLoading(false);
		}
	};

	const handleMultiStepRegistration = async (
		registrationData: RegistrationData,
	) => {
		setError(null);
		setLoading(true);

		try {
			// Create the user account
			const result = await signUpWithEmail(
				registrationData.email,
				registrationData.password,
			);

			if (result.error) {
				setError(result.error);
				return;
			}

			// If account creation was successful, save user preferences
			if (result.user) {
				try {
					// Get user's location
					const locationData = await GeolocationService.getUserLocation();

					// Create user profile with location data (web format)
					await userProfileRepository.createProfile(
						result.user.uid,
						registrationData.email,
						result.user.displayName,
						result.user.photoURL,
						locationData.country,
						locationData.state,
					);

					// Update user profile with preferences
					await userProfileRepository.updatePreferences(result.user.uid, {
						gender:
							registrationData.shoppingPreference.find(
								(p) => p === "men" || p === "women",
							) || "",
						preferredType:
							registrationData.shoppingPreference.find(
								(p) => p === "bespoke" || p === "ready-to-wear",
							) || "",
					});

					// Mark as first-time user to show measurements screen
					await userProfileRepository.markAsFirstTimeUser(result.user.uid);

					// Create user document in users collection (mobile app format)
					await createUserDocument(result.user.uid, {
						email: registrationData.email,
						displayName: result.user.displayName,
						shoppingPreference: registrationData.shoppingPreference,
						registrationCountry: locationData.country,
						registrationState: locationData.state,
					});

					// Record signup in web_signUp collection
					SignupCounterService.recordSignup({
						userId: result.user.uid,
						email: registrationData.email,
						registration_country: locationData.country,
						registration_state: locationData.state,
						registration_city: locationData.city,
						registration_ip: locationData.ip,
						timezone: GeolocationService.getUserTimezone(),
						language: GeolocationService.getUserLanguage(),
						registration_method: "email",
					});

					// Requirement 2.3: Create referral user document for multi-step registration
					try {
						await ShopRegistrationService.createReferralUser(
							result.user.uid,
							registrationData.email,
							result.user.displayName,
							referralCode,
						);
					} catch (referralError) {
						// Requirement 2.5: Log error but don't block registration
						console.error("Failed to create referral user:", referralError);
					}

					// Track referral if referral code exists
					if (referralCode) {
						await trackReferralSignup({
							referralCode,
							userId: result.user.uid,
							email: registrationData.email,
							name:
								result.user.displayName || registrationData.email.split("@")[0],
						});
					}

					// Send welcome email (non-blocking)
					EmailNotificationService.sendWelcomeEmail({
						email: registrationData.email,
						customerName:
							result.user.displayName || registrationData.email.split("@")[0],
					});

					onSuccess?.();
				} catch (profileError) {
					console.error("Error saving user preferences:", profileError);
					// Account was created successfully, but preferences failed to save
					// Still proceed to success to avoid user confusion
					onSuccess?.();
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Registration failed");
		} finally {
			setLoading(false);
		}
	};

	const handleCreateAccountClick = () => {
		setShowMultiStepRegistration(true);
	};

	const handleBackToLogin = () => {
		setShowMultiStepRegistration(false);
		setIsLogin(true);
		setError(null);
	};

	const handleGoogleAuth = async () => {
		setError(null);
		setLoading(true);

		try {
			const result = await signInWithGoogle();
			if (result.error) {
				setError(result.error);
			} else {
				// Check if this is a new user (first time Google sign-in)
				if (result.user) {
					try {
						// Check if profile exists
						const existingProfile = await userProfileRepository.getProfile(
							result.user.uid,
						);

						if (!existingProfile) {
							// New user - get location and create profile
							const locationData = await GeolocationService.getUserLocation();

							// Create user profile (web format)
							await userProfileRepository.createProfile(
								result.user.uid,
								result.user.email || "",
								result.user.displayName,
								result.user.photoURL,
								locationData.country,
								locationData.state,
							);

							// Create user document in users collection (mobile app format)
							await createUserDocument(result.user.uid, {
								email: result.user.email || "",
								displayName: result.user.displayName,
								shoppingPreference: [],
								registrationCountry: locationData.country,
								registrationState: locationData.state,
							});

							// Record signup in web_signUp collection
							SignupCounterService.recordSignup({
								userId: result.user.uid,
								email: result.user.email || "",
								registration_country: locationData.country,
								registration_state: locationData.state,
								registration_city: locationData.city,
								registration_ip: locationData.ip,
								timezone: GeolocationService.getUserTimezone(),
								language: GeolocationService.getUserLanguage(),
								registration_method: "google",
							});

							// Requirement 2.2: Create referral user document for Google sign-in
							try {
								await ShopRegistrationService.createReferralUser(
									result.user.uid,
									result.user.email || "",
									result.user.displayName,
									referralCode,
								);
							} catch (referralError) {
								// Requirement 2.5: Log error but don't block registration
								console.error("Failed to create referral user:", referralError);
							}

							// Track referral if referral code exists
							if (referralCode) {
								await trackReferralSignup({
									referralCode,
									userId: result.user.uid,
									email: result.user.email || "",
									name:
										result.user.displayName ||
										result.user.email?.split("@")[0] ||
										"User",
								});
							}

							// Send welcome email for new users
							EmailNotificationService.sendWelcomeEmail({
								email: result.user.email || "",
								customerName: EmailNotificationService.getCustomerName(
									result.user,
								),
							});
						} else {
							// Existing user - send login notification
							EmailNotificationService.sendLoginNotification({
								email: result.user.email || "",
								customerName: EmailNotificationService.getCustomerName(
									result.user,
								),
								device: EmailNotificationService.getDeviceInfo(),
							});
						}
					} catch (profileError) {
						console.error("Error handling Google auth profile:", profileError);
						// Continue even if profile operations fail
					}
				}

				onSuccess?.();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Google sign-in failed");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <LoadingSkeleton />;
	}

	// Show multi-step registration if user clicked "Create Account"
	if (showMultiStepRegistration) {
		return (
			<MultiStepRegistration
				onComplete={handleMultiStepRegistration}
				onBack={handleBackToLogin}
				loading={loading}
				error={error}
			/>
		);
	}

	return (
		<div className="w-full max-w-md mx-auto px-4 sm:px-0">
			<div className="text-center mb-6 sm:mb-8">
				<h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
					{isLogin ? "Sign In" : "Create Account"}
				</h2>
				<p className="mt-2 text-sm sm:text-base text-gray-600">
					{isLogin
						? "Welcome back! Please sign in to your account"
						: "Join us today and start your journey"}
				</p>
			</div>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
					<p className="text-sm text-red-600">{error}</p>
				</div>
			)}

			<form onSubmit={handleEmailAuth} className="space-y-4">
				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700"
					>
						Email Address
					</label>
					<input
						id="email"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
						placeholder="Enter your email"
					/>
				</div>

				<div>
					<div className="flex justify-between items-center">
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						{isLogin && (
							<a
								href="/shops/forgot-password"
								className="text-sm text-blue-600 hover:text-blue-500"
							>
								Forgot password?
							</a>
						)}
					</div>
					<div className="relative mt-1">
						<input
							id="password"
							type={showPassword ? "text" : "password"}
							required
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
							placeholder="Enter your password"
							minLength={6}
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute inset-y-0 !bg-transparent !text-black !border-none right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
						>
							{showPassword ? (
								<EyeOff className="h-5 w-5" />
							) : (
								<Eye className="h-5 w-5" />
							)}
						</button>
					</div>
				</div>

				{!isLogin && (
					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-gray-700"
						>
							Confirm Password
						</label>
						<div className="relative mt-1">
							<input
								id="confirmPassword"
								type={showConfirmPassword ? "text" : "password"}
								required
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 pr-10"
								placeholder="Confirm your password"
								minLength={6}
							/>
							<button
								type="button"
								onClick={() => setShowConfirmPassword(!showConfirmPassword)}
								className="absolute !bg-transparent !text-black !border-none inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
							>
								{showConfirmPassword ? (
									<EyeOff className="h-5 w-5" />
								) : (
									<Eye className="h-5 w-5" />
								)}
							</button>
						</div>
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
				</button>
			</form>

			<div className="mt-6">
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-gray-300" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="px-2 bg-gray-50 text-gray-500">
							Or continue with
						</span>
					</div>
				</div>

				<button
					onClick={handleGoogleAuth}
					disabled={loading}
					className="mt-3 w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
						<path
							fill="#4285F4"
							d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
						/>
						<path
							fill="#34A853"
							d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
						/>
						<path
							fill="#FBBC05"
							d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
						/>
						<path
							fill="#EA4335"
							d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
						/>
					</svg>
					{isLogin ? "Continue with Google" : "Sign up with Google"}
				</button>
			</div>

			<div className="mt-6 text-center">
				{isLogin ? (
					<span
						onClick={handleCreateAccountClick}
						className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer"
					>
						Don't have an account? Create Account
					</span>
				) : (
					<span
						onClick={() => {
							// Switch back to login
							setIsLogin(true);
							setError(null);
							setEmail("");
							setPassword("");
							setConfirmPassword("");
						}}
						className="text-sm text-blue-600 hover:text-blue-500 cursor-pointer"
					>
						Already have an account? Sign in
					</span>
				)}
			</div>
		</div>
	);
};
