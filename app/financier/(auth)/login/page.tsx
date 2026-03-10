"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
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

export default function FinancierLoginPage() {
	const router = useRouter();

	const [formData, setFormData] = useState<FormData>({
		email: "",
		password: "",
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

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

			// TODO: Verify user exists in financiers collection
			// For now, just redirect to dashboard
			router.push("/financier/dashboard");
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

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-100">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg border border-gray-200">
				<div className="text-center">
					<div className="mb-6 flex justify-center">
						<img
							src="/Stitches-Africa-Logo-06.png"
							alt="Stitches Africa Logo"
							className="h-16 w-auto object-contain"
						/>
					</div>
					<h2 className="text-2xl font-bold text-gray-900">
						Financier Portal
					</h2>
					<p className="mt-2 text-gray-600">Sign in to manage your financing programs</p>
				</div>

				{errors.general && (
					<Alert
						variant={
							errors.general.includes("Password reset email sent")
								? "default"
								: "destructive"
						}
					>
						<AlertCircle className="h-4 w-4" />
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
					<Button
						type="submit"
						className="w-full bg-blue-600 hover:bg-blue-700"
						disabled={loading}
					>
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
						By signing in, you agree to the Stitches Africa Terms of Service and
						Privacy Policy.
					</p>
				</div>
			</div>
		</div>
	);
}
