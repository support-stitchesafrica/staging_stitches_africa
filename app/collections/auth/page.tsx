"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useCollectionsAuth } from "@/contexts/CollectionsAuthContext";
import { CollectionsAuthForms } from "@/components/collections/auth/CollectionsAuthForms";
import InvitationLoginForm from "@/components/collections/InvitationLoginForm";

interface InvitationData {
	id: string;
	email: string;
	name: string;
	role: string;
	status: string;
	expiresAt: any;
	createdAt: any;
}

interface InvitationValidationResult {
	valid: boolean;
	invitation?: InvitationData;
	error?: string;
	code?: "NOT_FOUND" | "EXPIRED" | "ALREADY_USED" | "INVALID_TOKEN";
}

function CollectionsAuthPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { collectionsUser, loading } = useCollectionsAuth();
	const invitationToken = searchParams.get("invite");
	const [invitationValidation, setInvitationValidation] =
		useState<InvitationValidationResult | null>(null);
	const [validatingInvitation, setValidatingInvitation] = useState(false);

	// Validate invitation token if present
	useEffect(() => {
		const validateInvitation = async () => {
			if (!invitationToken) {
				setInvitationValidation(null);
				return;
			}

			setValidatingInvitation(true);
			try {
				console.log("[Collections Auth] Validating invitation token", {
					token: invitationToken.substring(0, 20) + "...",
				});

				const response = await fetch(
					`/api/collections/invites/validate/${invitationToken}`
				);
				const data = await response.json();

				if (!response.ok || !data.valid) {
					console.error("[Collections Auth] Invitation validation failed", {
						error: data.error,
						code: data.code,
					});
					setInvitationValidation({
						valid: false,
						error: data.error || "Invalid invitation",
						code: data.code,
					});
				} else {
					console.log("[Collections Auth] Invitation validated successfully", {
						email: data.invitation.email,
						role: data.invitation.role,
					});
					setInvitationValidation({
						valid: true,
						invitation: data.invitation,
					});
				}
			} catch (error) {
				console.error("[Collections Auth] Error validating invitation", error);
				setInvitationValidation({
					valid: false,
					error: "Failed to validate invitation. Please try again.",
					code: "INVALID_TOKEN",
				});
			} finally {
				setValidatingInvitation(false);
			}
		};

		validateInvitation();
	}, [invitationToken]);

	// Redirect to collections dashboard if already authenticated (and no invitation to accept)
	useEffect(() => {
		if (
			!loading &&
			collectionsUser &&
			collectionsUser.isCollectionsUser &&
			!invitationToken
		) {
			console.log(
				"User already authenticated, redirecting to collections dashboard"
			);
			router.replace("/collections");
		}
	}, [collectionsUser, loading, router, invitationToken]);

	// Handle successful authentication
	const handleAuthSuccess = () => {
		// If there's an invitation token, the InvitationLoginForm will handle acceptance
		// Otherwise, just redirect normally
		if (!invitationToken) {
			toast.success("Welcome to Collections Designer!");
			router.replace("/collections");
		}
	};

	// Handle successful invitation login
	const handleInvitationLoginSuccess = () => {
		console.log(
			"[Collections Auth] Invitation login successful, redirecting to dashboard"
		);
		toast.success("Welcome to Collections! Your invitation has been accepted.");
		router.replace("/collections");
	};

	// Show loading state while checking authentication or validating invitation
	if (loading || validatingInvitation) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">
						{validatingInvitation ? "Validating invitation..." : "Loading..."}
					</p>
				</div>
			</div>
		);
	}

	// If already authenticated, show loading while redirecting
	if (
		collectionsUser &&
		collectionsUser.isCollectionsUser &&
		!invitationToken
	) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Redirecting to dashboard...</p>
				</div>
			</div>
		);
	}

	// Show error if invitation validation failed
	if (invitationToken && invitationValidation && !invitationValidation.valid) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
				<div className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-lg p-6 sm:p-8">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Invalid Invitation
						</h2>
						<p className="text-sm text-gray-600">
							{invitationValidation.error ||
								"This invitation link is invalid or has expired."}
						</p>
					</div>
					<div className="space-y-3">
						<button
							onClick={() => router.push("/collections/auth")}
							className="w-full py-2.5 px-4 bg-black text-white font-medium rounded-lg shadow-sm hover:bg-gray-800 transition-colors"
						>
							Go to Login
						</button>
						<button
							onClick={() => router.push("/collections")}
							className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
						>
							Back to Collections
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
			<div className="w-full max-w-md">
				{/* Logo and Header */}
				<div className="text-center mb-8">
					<Link href="/" className="inline-block mb-6">
						<div className="relative h-16 w-48 mx-auto">
							<Image
								src="/images/Stitches Africa Logo-01.png"
								alt="Stitches Africa"
								fill
								className="object-contain"
								priority
							/>
						</div>
					</Link>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Collections Designer
					</h1>
					<p className="text-sm text-gray-600">
						Create beautiful product collections and promotional designs
					</p>
				</div>

				{/* Auth Card */}
				<div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 sm:p-8">
					{invitationToken &&
					invitationValidation?.valid &&
					invitationValidation.invitation ? (
						// Show invitation login form for existing users with invite
						<InvitationLoginForm
							invitation={invitationValidation.invitation}
							token={invitationToken}
							onSuccess={handleInvitationLoginSuccess}
						/>
					) : (
						// Show regular auth forms for normal login/signup
						<CollectionsAuthForms onSuccess={handleAuthSuccess} />
					)}
				</div>

				{/* Footer */}
				<p className="text-center text-xs text-gray-500 mt-6">
					By signing in, you agree to our{" "}
					<Link href="/terms" className="text-blue-600 hover:underline">
						Terms of Service
					</Link>{" "}
					and{" "}
					<Link href="/privacy" className="text-blue-600 hover:underline">
						Privacy Policy
					</Link>
				</p>
			</div>
		</div>
	);
}

export default function CollectionsAuthPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-gray-50">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading...</p>
					</div>
				</div>
			}
		>
			<CollectionsAuthPageContent />
		</Suspense>
	);
}
