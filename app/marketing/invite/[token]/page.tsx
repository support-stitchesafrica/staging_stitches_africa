/**
 * Marketing Dashboard - Invitation Acceptance Page
 * Handles invitation validation and user account creation/login flow
 * Requirements: 3.1, 3.2, 5.1, 5.2
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { InvitationValidationResult } from "@/lib/marketing";
import InvitationCreateAccountForm from "@/components/marketing/InvitationCreateAccountForm";
import InvitationLoginForm from "@/components/marketing/InvitationLoginForm";

interface InvitationPageState {
	loading: boolean;
	validation: InvitationValidationResult | null;
	step: "validating" | "create_account" | "login" | "error" | "success";
	error: string | null;
}

export default function InvitationAcceptancePage() {
	const params = useParams();
	const router = useRouter();
	const token = params.token as string;

	const [state, setState] = useState<InvitationPageState>({
		loading: true,
		validation: null,
		step: "validating",
		error: null,
	});

	// Validate invitation token on page load
	useEffect(() => {
		if (!token) {
			setState((prev) => ({
				...prev,
				loading: false,
				step: "error",
				error: "Invalid invitation link",
			}));
			return;
		}

		validateInvitation();
	}, [token]);

	const validateInvitation = async () => {
		try {
			setState((prev) => ({ ...prev, loading: true, error: null }));

			const response = await fetch(`/api/marketing/invites/validate/${token}`);
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to validate invitation");
			}

			if (!data.valid) {
				setState((prev) => ({
					...prev,
					loading: false,
					step: "error",
					error: data.error || "Invalid invitation",
					validation: data,
				}));
				return;
			}

			// Check if user already exists in Firebase
			const userExists = await checkUserExists(data.invitation.email);

			setState((prev) => ({
				...prev,
				loading: false,
				validation: data,
				step: userExists ? "login" : "create_account",
			}));
		} catch (error) {
			console.error("Invitation validation error:", error);
			setState((prev) => ({
				...prev,
				loading: false,
				step: "error",
				error:
					error instanceof Error
						? error.message
						: "Failed to validate invitation",
			}));
		}
	};

	const checkUserExists = async (email: string): Promise<boolean> => {
		try {
			// Import Firebase auth functions dynamically
			const { getAuth, fetchSignInMethodsForEmail } = await import(
				"firebase/auth"
			);
			const { auth } = await import("@/firebase");

			const signInMethods = await fetchSignInMethodsForEmail(auth, email);
			return signInMethods.length > 0;
		} catch (error) {
			console.error("Error checking user existence:", error);
			// If we can't check, default to create account flow
			return false;
		}
	};

	const handleAccountCreated = () => {
		setState((prev) => ({ ...prev, step: "success" }));
	};

	const handleLoginSuccess = () => {
		setState((prev) => ({ ...prev, step: "success" }));
	};

	const handleRetry = () => {
		setState((prev) => ({
			...prev,
			loading: true,
			step: "validating",
			error: null,
		}));
		validateInvitation();
	};

	const getErrorIcon = () => {
		if (!state.validation?.errorCode)
			return <XCircle className="h-12 w-12 text-red-500" />;

		switch (state.validation.errorCode) {
			case "EXPIRED":
				return <AlertTriangle className="h-12 w-12 text-orange-500" />;
			case "ALREADY_USED":
				return <CheckCircle className="h-12 w-12 text-blue-500" />;
			default:
				return <XCircle className="h-12 w-12 text-red-500" />;
		}
	};

	const getErrorTitle = () => {
		if (!state.validation?.errorCode) return "Invalid Invitation";

		switch (state.validation.errorCode) {
			case "EXPIRED":
				return "Invitation Expired";
			case "ALREADY_USED":
				return "Invitation Already Used";
			case "NOT_FOUND":
				return "Invitation Not Found";
			case "INVALID_DOMAIN":
				return "Invalid Email Domain";
			default:
				return "Invalid Invitation";
		}
	};

	const getErrorDescription = () => {
		if (!state.validation?.errorCode) return state.error;

		switch (state.validation.errorCode) {
			case "EXPIRED":
				return "This invitation has expired. Please contact your administrator for a new invitation.";
			case "ALREADY_USED":
				return "This invitation has already been used. If you already have an account, please sign in directly.";
			case "NOT_FOUND":
				return "This invitation link is invalid or has been removed. Please contact your administrator.";
			case "INVALID_DOMAIN":
				return "Your email domain is not authorized for this workspace. Please contact your administrator.";
			default:
				return state.error;
		}
	};

	if (state.loading || state.step === "validating") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center space-y-4">
							<Loader2 className="h-12 w-12 animate-spin text-blue-600" />
							<div className="text-center">
								<h3 className="text-lg font-semibold">Validating Invitation</h3>
								<p className="text-sm text-gray-600 mt-1">
									Please wait while we verify your invitation...
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (state.step === "error") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center space-y-4">
							{getErrorIcon()}
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900">
									{getErrorTitle()}
								</h3>
								<p className="text-sm text-gray-600 mt-2">
									{getErrorDescription()}
								</p>
							</div>

							{state.validation?.errorCode === "EXPIRED" && (
								<Alert>
									<AlertTriangle className="h-4 w-4" />
									<AlertDescription>
										Contact your administrator to request a new invitation link.
									</AlertDescription>
								</Alert>
							)}

							{state.validation?.errorCode === "ALREADY_USED" && (
								<div className="w-full space-y-2">
									<Button
										onClick={() => router.push("/marketing/auth/login")}
										className="w-full"
									>
										Go to Login
									</Button>
								</div>
							)}

							{!state.validation?.errorCode && (
								<Button
									onClick={handleRetry}
									variant="outline"
									className="w-full"
								>
									Try Again
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (state.step === "success") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<Card className="w-full max-w-md">
					<CardContent className="pt-6">
						<div className="flex flex-col items-center space-y-4">
							<CheckCircle className="h-12 w-12 text-green-500" />
							<div className="text-center">
								<h3 className="text-lg font-semibold text-gray-900">
									Welcome to the Team!
								</h3>
								<p className="text-sm text-gray-600 mt-2">
									Your account has been successfully set up. You'll be
									redirected to your dashboard shortly.
								</p>
							</div>
							<Button
								onClick={() => router.push("/marketing")}
								className="w-full"
							>
								Go to Dashboard
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CardTitle>Join STITCHES Africa Marketing</CardTitle>
					<CardDescription>
						{state.step === "create_account"
							? "Create your account to get started"
							: "Sign in to continue"}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{state.validation && (
						<div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
							<div className="text-sm">
								<p className="font-medium text-blue-900">
									Invitation for: {state.validation.invitation?.name}
								</p>
								<p className="text-blue-700">
									Role:{" "}
									{state.validation.invitation?.role
										.replace("_", " ")
										.toUpperCase()}
								</p>
								<p className="text-blue-700">
									Email: {state.validation.invitation?.email}
								</p>
							</div>
						</div>
					)}

					{state.step === "create_account" && state.validation?.invitation && (
						<InvitationCreateAccountForm
							invitation={state.validation.invitation}
							token={token}
							onSuccess={handleAccountCreated}
							onSwitchToLogin={() =>
								setState((prev) => ({ ...prev, step: "login" }))
							}
						/>
					)}

					{state.step === "login" && state.validation?.invitation && (
						<InvitationLoginForm
							invitation={state.validation.invitation}
							token={token}
							onSuccess={handleLoginSuccess}
							onSwitchToCreate={() =>
								setState((prev) => ({ ...prev, step: "create_account" }))
							}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
