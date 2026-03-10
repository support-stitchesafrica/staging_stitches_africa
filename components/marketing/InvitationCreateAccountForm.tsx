/**
 * Marketing Dashboard - Invitation Account Creation Form
 * Handles new user account creation from invitation
 * Requirements: 3.1, 3.2, 5.1, 5.2
 */

"use client";

import React, {  useState , memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Invitation } from "@/lib/marketing";

interface InvitationCreateAccountFormProps {
	invitation: Invitation;
	token: string;
	onSuccess: () => void;
	onSwitchToLogin?: () => void;
}

interface FormData {
	name: string;
	password: string;
	confirmPassword: string;
}

interface FormErrors {
	name?: string;
	password?: string;
	confirmPassword?: string;
	general?: string;
}

function InvitationCreateAccountForm({
	invitation,
	token,
	onSuccess,
	onSwitchToLogin,
}: InvitationCreateAccountFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<FormData>({
		name: invitation.name || "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		// Validate name
		if (!formData.name.trim()) {
			newErrors.name = "Full name is required";
		} else if (formData.name.trim().length < 2) {
			newErrors.name = "Name must be at least 2 characters";
		}

		// Validate password
		if (!formData.password) {
			newErrors.password = "Password is required";
		} else if (formData.password.length < 6) {
			newErrors.password = "Password must be at least 6 characters";
		} else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password)) {
			newErrors.password =
				"Password must contain both uppercase and lowercase letters";
		}

		// Validate confirm password
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your password";
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match";
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
			// Create Firebase account
			const { createUserWithEmailAndPassword, updateProfile } = await import(
				"firebase/auth"
			);
			const { auth } = await import("@/firebase");

			const userCredential = await createUserWithEmailAndPassword(
				auth,
				invitation.email,
				formData.password
			);

			// Update user profile with name
			await updateProfile(userCredential.user, {
				displayName: formData.name.trim(),
			});

			// Accept the invitation and create marketing user profile
			const idToken = await userCredential.user.getIdToken();
			const acceptResponse = await fetch(
				`/api/marketing/invites/accept/${token}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${idToken}`,
					},
					body: JSON.stringify({
						name: formData.name.trim(),
					}),
				}
			);

			if (!acceptResponse.ok) {
				const errorData = await acceptResponse.json();
				throw new Error(errorData.error || "Failed to accept invitation");
			}

			// Success - call onSuccess callback
			onSuccess();
		} catch (error) {
			console.error("Account creation error:", error);

			let errorMessage = "Failed to create account";
			let isEmailExists = false;

			if (error instanceof Error) {
				// Handle specific Firebase auth errors
				if (error.message.includes("email-already-in-use")) {
					errorMessage =
						"An account with this email already exists. Please sign in instead.";
					isEmailExists = true;
				} else if (error.message.includes("weak-password")) {
					errorMessage =
						"Password is too weak. Please choose a stronger password.";
				} else if (error.message.includes("invalid-email")) {
					errorMessage = "Invalid email address format.";
				} else if (error.message.includes("network-request-failed")) {
					errorMessage =
						"Network error. Please check your connection and try again.";
				} else {
					errorMessage = error.message;
				}
			}

			setErrors({ general: errorMessage });
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			{errors.general && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<div>
						<AlertDescription>{errors.general}</AlertDescription>
						{errors.general.includes("already exists") && onSwitchToLogin && (
							<Button
								variant="link"
								className="p-0 h-auto text-white underline mt-1 font-bold"
								onClick={onSwitchToLogin}
								type="button"
							>
								Sign in to existing account
							</Button>
						)}
					</div>
				</Alert>
			)}

			{/* Email (read-only) */}
			<div className="space-y-2">
				<Label htmlFor="email">Email Address</Label>
				<Input
					id="email"
					type="email"
					value={invitation.email}
					disabled
					className="bg-gray-50"
				/>
				<p className="text-xs text-gray-500">
					This email is pre-filled from your invitation
				</p>
			</div>

			{/* Full Name */}
			<div className="space-y-2">
				<Label htmlFor="name">Full Name</Label>
				<Input
					id="name"
					type="text"
					value={formData.name}
					onChange={(e) => handleInputChange("name", e.target.value)}
					placeholder="Enter your full name"
					disabled={loading}
					className={errors.name ? "border-red-500" : ""}
				/>
				{errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
			</div>

			{/* Password */}
			<div className="space-y-2">
				<Label htmlFor="password">Password</Label>
				<div className="relative">
					<Input
						id="password"
						type={showPassword ? "text" : "password"}
						value={formData.password}
						onChange={(e) => handleInputChange("password", e.target.value)}
						placeholder="Create a strong password"
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
				<p className="text-xs text-gray-500">
					Must be at least 6 characters with uppercase and lowercase letters
				</p>
			</div>

			{/* Confirm Password */}
			<div className="space-y-2">
				<Label htmlFor="confirmPassword">Confirm Password</Label>
				<div className="relative">
					<Input
						id="confirmPassword"
						type={showConfirmPassword ? "text" : "password"}
						value={formData.confirmPassword}
						onChange={(e) =>
							handleInputChange("confirmPassword", e.target.value)
						}
						placeholder="Confirm your password"
						disabled={loading}
						className={
							errors.confirmPassword ? "border-red-500 pr-10" : "pr-10"
						}
					/>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
						onClick={() => setShowConfirmPassword(!showConfirmPassword)}
						disabled={loading}
					>
						{showConfirmPassword ? (
							<EyeOff className="h-4 w-4 text-gray-400" />
						) : (
							<Eye className="h-4 w-4 text-gray-400" />
						)}
					</Button>
				</div>
				{errors.confirmPassword && (
					<p className="text-sm text-red-600">{errors.confirmPassword}</p>
				)}
			</div>

			{/* Role Information */}
			<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
				<p className="text-sm text-blue-900">
					<span className="font-medium">Your Role:</span>{" "}
					{invitation.role.replace("_", " ").toUpperCase()}
				</p>
				<p className="text-xs text-blue-700 mt-1">
					This role determines your permissions in the marketing dashboard
				</p>
			</div>

			{/* Submit Button */}
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Creating Account...
					</>
				) : (
					"Create Account & Join Team"
				)}
			</Button>

			{/* Help Text */}
			<div className="text-center">
				<p className="text-xs text-gray-500">
					By creating an account, you agree to join the STITCHES Africa
					marketing team with the role specified in your invitation.
				</p>
			</div>

			{/* Already have an account link */}
			<div className="text-center pt-4 border-t">
				<p className="text-sm text-gray-600">
					Already have an account?{" "}
					<Button
						type="button"
						variant="link"
						size="sm"
						onClick={onSwitchToLogin}
						disabled={loading}
						className="p-0 h-auto"
					>
						Sign in instead
					</Button>
				</p>
			</div>
		</form>
	);
}


export default memo(InvitationCreateAccountForm);