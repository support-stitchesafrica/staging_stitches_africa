/**
 * Marketing Dashboard - Invitation Login Form
 * Handles existing user login from invitation
 * Requirements: 3.1, 3.2, 5.1, 5.2
 */

"use client";

import React, {  useState , memo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { Invitation } from "@/lib/marketing";

interface InvitationLoginFormProps {
	invitation: Invitation;
	token: string;
	onSuccess: () => void;
	onSwitchToCreate?: () => void;
}

interface FormData {
	password: string;
}

interface FormErrors {
	password?: string;
	general?: string;
}

function InvitationLoginForm({
	invitation,
	token,
	onSuccess,
	onSwitchToCreate,
}: InvitationLoginFormProps) {
	const router = useRouter();
	const [formData, setFormData] = useState<FormData>({
		password: "",
	});
	const [errors, setErrors] = useState<FormErrors>({});
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {};

		if (!formData.password) {
			newErrors.password = "Password is required";
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
			// Sign in with Firebase
			const { signInWithEmailAndPassword } = await import("firebase/auth");
			const { auth } = await import("@/firebase");

			const userCredential = await signInWithEmailAndPassword(
				auth,
				invitation.email,
				formData.password
			);

			// Accept the invitation and assign role
			const idToken = await userCredential.user.getIdToken();
			const acceptResponse = await fetch(
				`/api/marketing/invites/accept/${token}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${idToken}`,
					},
				}
			);

			if (!acceptResponse.ok) {
				const errorData = await acceptResponse.json();
				throw new Error(errorData.error || "Failed to accept invitation");
			}

			// Success - call onSuccess callback
			onSuccess();
		} catch (error) {
			console.error("Login error:", error);

			let errorMessage = "Failed to sign in";

			if (error instanceof Error) {
				// Handle specific Firebase auth errors
				if (error.message.includes("user-not-found")) {
					errorMessage =
						"No account found with this email. Please contact your administrator.";
				} else if (error.message.includes("wrong-password")) {
					errorMessage = "Incorrect password. Please try again.";
				} else if (error.message.includes("invalid-email")) {
					errorMessage = "Invalid email address format.";
				} else if (error.message.includes("user-disabled")) {
					errorMessage =
						"This account has been disabled. Please contact your administrator.";
				} else if (error.message.includes("too-many-requests")) {
					errorMessage = "Too many failed attempts. Please try again later.";
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

	const handleForgotPassword = async () => {
		try {
			const { sendPasswordResetEmail } = await import("firebase/auth");
			const { auth } = await import("@/firebase");

			await sendPasswordResetEmail(auth, invitation.email);

			setErrors({
				general: `Password reset email sent to ${invitation.email}. Please check your inbox.`,
			});
		} catch (error) {
			console.error("Password reset error:", error);
			setErrors({
				general: "Failed to send password reset email. Please try again.",
			});
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
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

			{/* Account Found Notice */}
			<Alert>
				<Info className="h-4 w-4" />
				<AlertDescription>
					We found an existing account for <strong>{invitation.email}</strong>.
					Please sign in to accept your invitation.
				</AlertDescription>
			</Alert>

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
						placeholder="Enter your password"
						disabled={loading}
						className={errors.password ? "border-red-500 pr-10" : "pr-10"}
						autoFocus
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

			{/* Role Information */}
			<div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
				<p className="text-sm text-blue-900">
					<span className="font-medium">Invitation Role:</span>{" "}
					{invitation.role.replace("_", " ").toUpperCase()}
				</p>
				<p className="text-xs text-blue-700 mt-1">
					After signing in, you'll be granted this role in the marketing
					dashboard
				</p>
			</div>

			{/* Submit Button */}
			<Button type="submit" className="w-full" disabled={loading}>
				{loading ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Signing In...
					</>
				) : (
					"Sign In & Accept Invitation"
				)}
			</Button>

			{/* Help Text */}
			<div className="text-center">
				<p className="text-xs text-gray-500">
					By signing in, you accept the invitation to join the STITCHES Africa
					marketing team with the specified role.
				</p>
			</div>

			{/* Alternative Action */}
			<div className="text-center pt-4 border-t">
				<p className="text-sm text-gray-600">
					Don't have an account with this email?{" "}
					<Button
						type="button"
						variant="link"
						size="sm"
						onClick={() => {
							if (onSwitchToCreate) {
								onSwitchToCreate();
							} else {
								router.push(`/marketing/invite/${token}?force_create=true`);
							}
						}}
						disabled={loading}
						className="p-0 h-auto"
					>
						Create new account instead
					</Button>
				</p>
			</div>
		</form>
	);
}


export default memo(InvitationLoginForm);