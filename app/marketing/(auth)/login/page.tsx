"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FormData {
	email: string;
	password: string;
}

interface FormErrors {
	email?: string;
	password?: string;
	general?: string;
}

export default function MarketingAuthPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [formData, setFormData] = useState<FormData>({
		email: "",
		password: "",
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(true);
	const [showPassword, setShowPassword] = useState(false);
	const [setupRequired, setSetupRequired] = useState(false);

	// Check if setup is required
	useEffect(() => {
		const checkSetupStatus = async () => {
			try {
				const response = await fetch("/api/marketing/setup/super-admin");
				const data = await response.json();

				if (response.ok && data.success) {
					setSetupRequired(data.data.requiresSetup);
				}
			} catch (error) {
				console.error("Failed to check setup status:", error);
			} finally {
				setLoading(false);
			}
		};

		checkSetupStatus();
	}, []);

	// Handle invitation or setup mode from URL parameters
	useEffect(() => {
		const token = searchParams.get("token");
		const mode = searchParams.get("mode");

		// Handle invitation flow if needed
		if (token) {
			// For now, we'll just show the regular login form
			// In a real implementation, you might want to pre-fill the email
			// or show a different form based on the invitation
		}

		// Redirect to setup if setup is required
		if (setupRequired && mode !== "setup") {
			router.push("/marketing/auth/setup");
		}
	}, [searchParams, setupRequired, router]);

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		// Validate email
		if (!formData.email.trim()) {
			newErrors.email = "Email address is required";
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Please enter a valid email address";
		}

		// Validate password
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleInputChange = (field: keyof FormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear field-specific error when user starts typing
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: undefined }));
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);
		setErrors({});

		try {
			// Import Firebase auth functions dynamically
			const { signInWithEmailAndPassword } = await import("firebase/auth");
			const { auth } = await import("@/firebase");

			// Sign in with Firebase
			const userCredential = await signInWithEmailAndPassword(
				auth,
				formData.email.trim(),
				formData.password
			);

			// Get ID token to verify user in marketing_users collection
			const idToken = await userCredential.user.getIdToken();

			// Verify user exists in marketing_users collection and get role
			const userResponse = await fetch("/api/marketing/users/me", {
				headers: {
					Authorization: `Bearer ${idToken}`,
				},
			});

			if (!userResponse.ok) {
				if (userResponse.status === 404) {
					// User not in marketing system
					setErrors({
						general:
							"You are not authorized to access the marketing dashboard. Please contact your administrator for an invitation.",
					});
					// Sign out the user
					const { signOut: firebaseSignOut } = await import("firebase/auth");
					await firebaseSignOut(auth);
					return;
				}
				throw new Error("Failed to verify user profile");
			}

			const userData = await userResponse.json();

			// Redirect to dashboard - the MarketingAuthContext will handle role-based routing
			// Redirect to dashboard or original destination
			const redirectUrl = searchParams.get("redirect");
			if (redirectUrl) {
				router.push(redirectUrl);
			} else {
				router.push("/marketing");
			}
		} catch (error: any) {
			console.error("Login error:", error);

			let errorMessage = "Failed to sign in. Please try again.";

			if (error.code) {
				switch (error.code) {
					case "auth/user-not-found":
						errorMessage = "No account found with this email.";
						break;
					case "auth/wrong-password":
						errorMessage = "Incorrect password. Please try again.";
						break;
					case "auth/invalid-email":
						errorMessage = "Invalid email address format.";
						break;
					case "auth/user-disabled":
						errorMessage = "This account has been disabled.";
						break;
					case "auth/too-many-requests":
						errorMessage = "Too many failed attempts. Please try again later.";
						break;
					case "auth/network-request-failed":
						errorMessage = "Network error. Please check your connection.";
						break;
					default:
						errorMessage = error.message || errorMessage;
				}
			}

			setErrors({ general: errorMessage });
		} finally {
			setLoading(false);
		}
	};

	const handleForgotPassword = async () => {
		if (!formData.email.trim()) {
			setErrors({ email: "Please enter your email address first" });
			return;
		}

		try {
			const { sendPasswordResetEmail } = await import("firebase/auth");
			const { auth } = await import("@/firebase");

			await sendPasswordResetEmail(auth, formData.email.trim());

			setErrors({
				general: `Password reset email sent to ${formData.email.trim()}. Please check your inbox.`,
			});
		} catch (error: any) {
			console.error("Password reset error:", error);
			let errorMessage =
				"Failed to send password reset email. Please try again.";

			if (error.code === "auth/user-not-found") {
				errorMessage = "No account found with this email address.";
			}

			setErrors({ general: errorMessage });
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="text-center">
					<Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
					<p className="text-gray-600">Loading...</p>
				</div>
			</div>
		);
	}

	if (setupRequired) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="max-w-md w-full space-y-8 p-8">
					<div className="text-center">
						<h2 className="text-3xl font-bold text-gray-900">
							Marketing Dashboard Setup Required
						</h2>
						<p className="mt-2 text-gray-600">
							No Super Admin account found. Create the first account to get
							started.
						</p>
					</div>

					<Alert>
						<Info className="h-4 w-4" />
						<AlertDescription>
							This is the first-time setup for the Marketing Dashboard. As the
							first user, you will be granted Super Admin privileges with full
							access to all features.
						</AlertDescription>
					</Alert>

					<Button
						onClick={() => router.push("/marketing/auth/setup")}
						className="w-full"
					>
						Set Up Super Admin Account
					</Button>

					<div className="text-center">
						<Button
							variant="link"
							onClick={() => router.push("/")}
							className="p-0 h-auto"
						>
							Back to Home
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-white">
			<div className="max-w-md w-full space-y-8 p-8">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-900">
						Marketing Dashboard
					</h2>
					<p className="mt-2 text-gray-600">Sign in to your account</p>
				</div>

				{errors.general && (
					<Alert
						variant={
							errors.general.includes("Password reset email sent")
								? "default"
								: "destructive"
						}
					>
						{errors.general.includes("Password reset email sent") ? (
							<Info className="h-4 w-4" />
						) : (
							<AlertCircle className="h-4 w-4" />
						)}
						<AlertDescription>{errors.general}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Email Field */}
					<div className="space-y-2">
						<Label htmlFor="email">Email Address</Label>
						<Input
							id="email"
							type="email"
							value={formData.email}
							onChange={(e) => handleInputChange("email", e.target.value)}
							placeholder="Enter your email"
							disabled={loading}
							className={errors.email ? "border-red-500" : ""}
							autoFocus
						/>
						{errors.email && (
							<p className="text-sm text-red-600">{errors.email}</p>
						)}
					</div>

					{/* Password Field */}
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<div className="relative">
							<Input
								id="password"
								type={showPassword ? "text" : "password"}
								value={formData.password}
								onChange={(e) => handleInputChange("password", e.target.value)}
								placeholder="Enter your password"
								disabled={loading}
								className={errors.password ? "border-red-500 pr-10" : "pr-10"}
							/>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
								onClick={() => setShowPassword(!showPassword)}
								disabled={loading}
							>
								{showPassword ? (
									<EyeOff className="h-4 w-4 text-gray-400" />
								) : (
									<Eye className="h-4 w-4 text-gray-400" />
								)}
							</Button>
						</div>
						{errors.password && (
							<p className="text-sm text-red-600">{errors.password}</p>
						)}
					</div>

					{/* Forgot Password Link */}
					<div className="text-right">
						<Button
							type="button"
							variant="link"
							size="sm"
							onClick={handleForgotPassword}
							disabled={loading}
							className="p-0 h-auto text-sm"
						>
							Forgot your password?
						</Button>
					</div>

					{/* Submit Button */}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Signing In...
							</>
						) : (
							"Sign In"
						)}
					</Button>
				</form>

				{/* Help Text */}
				<div className="text-center text-xs text-gray-500">
					<p>
						By signing in, you agree to the STITCHES Africa Terms of Service and
						Privacy Policy.
					</p>
				</div>
			</div>
		</div>
	);
}
