"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useAtlasAuth } from "@/contexts/AtlasAuthContext";
import { AtlasAuthForms } from "@/components/atlas/auth/AtlasAuthForms";

const AuthPageContent = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { atlasUser, loading } = useAtlasAuth();
	const [isAcceptingInvitation, setIsAcceptingInvitation] = useState(false);
	const invitationToken = searchParams.get("invite");

	// Auto-accept invitation after successful authentication
	useEffect(() => {
		const acceptInvitation = async () => {
			if (
				!invitationToken ||
				!atlasUser ||
				!atlasUser.isAtlasUser ||
				isAcceptingInvitation
			) {
				return;
			}

			setIsAcceptingInvitation(true);
			console.log("[Atlas Auth] Auto-accepting invitation after sign in", {
				email: atlasUser.email,
				token: invitationToken.substring(0, 20) + "...",
			});

			try {
				// Get ID token for authentication
				const { auth } = await import("@/firebase");
				const { getIdToken } = await import("firebase/auth");
				const idToken = await getIdToken(auth.currentUser!);

				// Accept the invitation
				const encodedToken = encodeURIComponent(invitationToken);
				const acceptResponse = await fetch(
					`/api/atlas/invites/accept/${encodedToken}`,
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

				console.log("[Atlas Auth] Invitation accepted successfully");
				toast.success("Welcome to Atlas! Your invitation has been accepted.");

				// Redirect to atlas dashboard
				router.replace("/atlas");
			} catch (error) {
				console.error("[Atlas Auth] Failed to accept invitation", error);
				toast.error(
					error instanceof Error ? error.message : "Failed to accept invitation"
				);
				// Still redirect to dashboard even if invitation acceptance fails
				router.replace("/atlas");
			} finally {
				setIsAcceptingInvitation(false);
			}
		};

		acceptInvitation();
	}, [atlasUser, invitationToken, isAcceptingInvitation]);

	// Redirect to dashboard if already authenticated (and no invitation to accept)
	useEffect(() => {
		if (!loading && atlasUser && atlasUser.isAtlasUser && !invitationToken) {
			console.log("User already authenticated, redirecting to dashboard");
			router.replace("/atlas");
		}
	}, [atlasUser, loading, invitationToken]);

	// Handle successful authentication
	const handleAuthSuccess = () => {
		// If there's an invitation token, the useEffect above will handle it
		// Otherwise, just redirect normally
		if (!invitationToken) {
			toast.success("Welcome to STITCHES Africa Atlas!");
			// router.replace("/atlas"); // Removed to prevent race condition with AtlasAuthGuard
			// The useEffect observing [loading, atlasUser] will handle the redirect once state is updated
		}
	};

	// Show loading state while checking authentication or accepting invitation
	if (loading || isAcceptingInvitation) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">
						{isAcceptingInvitation ? "Accepting invitation..." : "Loading..."}
					</p>
				</div>
			</div>
		);
	}

	// If already authenticated and no invitation, show loading while redirecting
	if (atlasUser && atlasUser.isAtlasUser && !invitationToken) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-white">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
					<p className="text-gray-600">Redirecting to dashboard...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-white p-4">
			<div className="w-full max-w-md">
				{/* Logo and Header */}
				<div className="text-center mb-8">
					<Link href="/shops" className="flex items-center justify-center mb-4">
						<Image
							src="/Stitches-Africa-Logo-06.png"
							alt="Stitches Africa"
							width={120}
							height={50}
							priority
						/>
					</Link>
					<h1 className="font-ga text-3xl font-bold text-gray-900 mb-2">
						STITCHES Africa
					</h1>
					<p className="text-sm text-gray-600">Atlas Dashboard</p>
				</div>

				{/* Auth Card */}
				<div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6">
					<Suspense
						fallback={
							<div className="text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<p className="text-gray-600">Loading...</p>
							</div>
						}
					>
						<AtlasAuthForms onSuccess={handleAuthSuccess} />
					</Suspense>
				</div>

				{/* Footer */}
				<p className="text-center text-xs text-gray-600 mt-6">
					By signing in, you agree to our Terms of Service and Privacy Policy
				</p>
			</div>
		</div>
	);
};

const Auth = () => {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-white">
					<div className="text-center">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
						<p className="text-gray-600">Loading...</p>
					</div>
				</div>
			}
		>
			<AuthPageContent />
		</Suspense>
	);
};

export default Auth;
