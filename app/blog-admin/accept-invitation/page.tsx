"use client";

import { useState, useEffect } from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
	CheckCircle,
	AlertCircle,
	Eye,
	EyeOff,
	UserCheck,
	Mail,
	LogIn,
	UserPlus,
	Loader2,
} from "lucide-react";

import { useBlogAuth } from "@/contexts/BlogAuthContext";
import { BlogInvitationService } from "@/lib/blog-admin/invitation-service";
import type { BlogInvitation } from "@/types/blog-admin";
import { auth } from "@/firebase";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	fetchSignInMethodsForEmail,
} from "firebase/auth";

function AcceptInvitationContent() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const token = searchParams.get("token");
	const { refreshUser } = useBlogAuth();

	const [invitation, setInvitation] = useState<BlogInvitation | null>(null);
	const [loading, setLoading] = useState(true);
	const [checkingUser, setCheckingUser] = useState(false);
	const [isExistingUser, setIsExistingUser] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Form states
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		if (token) {
			loadInvitationAndCheckUser();
		} else {
			setError("Invalid invitation link");
			setLoading(false);
		}
	}, [token]);

	const loadInvitationAndCheckUser = async () => {
		if (!token) return;

		try {
			setLoading(true);
			const invitationData = await BlogInvitationService.getInvitation(token);

			if (invitationData) {
				setInvitation(invitationData);

				// Check if user exists
				setCheckingUser(true);
				try {
					const methods = await fetchSignInMethodsForEmail(
						auth,
						invitationData.email
					);
					if (methods && methods.length > 0) {
						setIsExistingUser(true);
					}
				} catch (authErr) {
					console.error("Error checking if user exists:", authErr);
					// Default to new user flow if check fails, though this might error later
				} finally {
					setCheckingUser(false);
				}
			} else {
				setError("Invalid or expired invitation");
			}
		} catch (err: any) {
			console.error("Error loading invitation:", err);
			setError("Failed to load invitation");
		} finally {
			setLoading(false);
		}
	};

	const handleAcceptInvitation = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!token || !invitation) return;

		// Validation
		if (!password) {
			setError("Password is required");
			return;
		}

		if (!isExistingUser) {
			if (password.length < 8) {
				setError("Password must be at least 8 characters long");
				return;
			}
			if (password !== confirmPassword) {
				setError("Passwords do not match");
				return;
			}
		}

		setSubmitting(true);
		setError(null);

		try {
			// 1. Authenticate (Login or Signup)
			let userCredential;
			if (isExistingUser) {
				userCredential = await signInWithEmailAndPassword(
					auth,
					invitation.email,
					password
				);
			} else {
				userCredential = await createUserWithEmailAndPassword(
					auth,
					invitation.email,
					password
				);
			}

			// 2. Get ID Token
			const idToken = await userCredential.user.getIdToken();

			// 3. Call Accept API via Service
			const result = await BlogInvitationService.acceptInvitation(
				token,
				idToken
			);

			if (result.success) {
				setSuccess(true);

				// Refresh user context to ensure the new role is loaded before redirecting
				try {
					await refreshUser();
				} catch (refreshErr) {
					console.error("Failed to refresh user context:", refreshErr);
				}

				setTimeout(() => {
					router.push("/blog-admin/dashboard");
				}, 1000);
			} else {
				setError(result.message || "Failed to accept invitation");
			}
		} catch (err: any) {
			console.error("Error accepting invitation:", err);

			if (err.code === "auth/wrong-password") {
				setError("Incorrect password. Please try again.");
			} else if (err.code === "auth/email-already-in-use") {
				setError(
					"This email is already associated with an account. Please log in."
				);
				setIsExistingUser(true); // Switch mode if we somehow missed it
			} else {
				setError(err.message || "Failed to process request");
			}
		} finally {
			setSubmitting(false);
		}
	};

	const getRoleColor = (role: string) => {
		switch (role) {
			case "admin":
				return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
			case "editor":
				return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
			case "author":
				return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
			default:
				return "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400";
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="p-6">
						<div className="flex flex-col items-center justify-center space-y-4">
							<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
							<p className="text-gray-500">Loading invitation...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<CheckCircle className="h-8 w-8 text-green-600" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
							Welcome to the Team!
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mb-4">
							Your invitation has been accepted successfully. You'll be
							redirected to the dashboard shortly.
						</p>
						<Button
							onClick={() => router.push("/blog-admin")}
							className="bg-black hover:bg-gray-800 text-white"
						>
							Go to Dashboard
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error && !invitation) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
				<Card className="w-full max-w-md">
					<CardContent className="p-6 text-center">
						<div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertCircle className="h-8 w-8 text-red-600" />
						</div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
							Invalid Invitation
						</h1>
						<p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
						<Button
							onClick={() => router.push("/blog-admin/login")}
							variant="outline"
						>
							Go to Login
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
						{isExistingUser ? (
							<LogIn className="h-8 w-8 text-purple-600" />
						) : (
							<UserPlus className="h-8 w-8 text-purple-600" />
						)}
					</div>
					<CardTitle className="text-2xl">
						{isExistingUser ? "Confirm Identity" : "Create Account"}
					</CardTitle>
					<CardDescription>
						{isExistingUser
							? "Please sign in to accept this invitation"
							: "Complete your account setup to join the blog team"}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					{invitation && (
						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
							<div className="flex items-center gap-2">
								<Mail className="h-4 w-4 text-gray-500" />
								<span className="text-sm text-gray-600 dark:text-gray-400">
									Invitation Details
								</span>
							</div>
							<div className="space-y-2">
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Name:
									</span>
									<span className="font-medium">
										{invitation.firstName} {invitation.lastName}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Email:
									</span>
									<span className="font-medium">
										{invitation.email} {isExistingUser && "(Found)"}
									</span>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Role:
									</span>
									<Badge className={getRoleColor(invitation.role)}>
										{invitation.role}
									</Badge>
								</div>
								<div className="flex justify-between items-center">
									<span className="text-sm text-gray-600 dark:text-gray-400">
										Invited by:
									</span>
									<span className="font-medium">
										{invitation.invitedByName}
									</span>
								</div>
							</div>
						</div>
					)}

					<form onSubmit={handleAcceptInvitation} className="space-y-4">
						{isExistingUser && (
							<Alert className="bg-blue-50 border-blue-200">
								<CheckCircle className="h-4 w-4 text-blue-600" />
								<AlertDescription className="text-blue-700">
									We found an existing account for this email. Please enter your
									password to sign in and accept the invitation.
								</AlertDescription>
							</Alert>
						)}

						<div>
							<Label htmlFor="password">
								{isExistingUser ? "Password" : "Create Password"}
							</Label>
							<div className="relative">
								<Input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder={
										isExistingUser
											? "Enter your password"
											: "Enter a secure password"
									}
									required
									minLength={isExistingUser ? 1 : 8}
								/>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
									onClick={() => setShowPassword(!showPassword)}
								>
									{showPassword ? (
										<EyeOff className="h-4 w-4 text-gray-400" />
									) : (
										<Eye className="h-4 w-4 text-gray-400" />
									)}
								</Button>
							</div>
							{!isExistingUser && (
								<p className="text-xs text-gray-500 mt-1">
									Password must be at least 8 characters long
								</p>
							)}
						</div>

						{!isExistingUser && (
							<div>
								<Label htmlFor="confirmPassword">Confirm Password</Label>
								<Input
									id="confirmPassword"
									type="password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder="Confirm your password"
									required
									minLength={8}
								/>
							</div>
						)}

						{error && (
							<Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
								<AlertCircle className="h-4 w-4 text-red-600" />
								<AlertDescription className="text-red-700 dark:text-red-300">
									{error}
								</AlertDescription>
							</Alert>
						)}

						<div className="flex flex-col gap-3">
							<Button
								type="submit"
								disabled={
									submitting ||
									!password ||
									(!isExistingUser && !confirmPassword)
								}
								className="w-full bg-black hover:bg-gray-800 text-white"
							>
								{submitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{isExistingUser ? "Signing in..." : "Creating Account..."}
									</>
								) : isExistingUser ? (
									"Sign In & Accept Invitation"
								) : (
									"Create Account & Accept"
								)}
							</Button>

							{/* Fallback to toggle modes manually if detection fails */}
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									setIsExistingUser(!isExistingUser);
									setError(null);
									setPassword("");
									setConfirmPassword("");
								}}
								className="text-sm text-gray-500"
							>
								{isExistingUser
									? "Don't have an account? Create one"
									: "Already have an account? Sign in"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}

export default function AcceptInvitationPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
					<Card className="w-full max-w-md">
						<CardContent className="p-6">
							<div className="flex flex-col items-center justify-center space-y-4">
								<Loader2 className="h-8 w-8 animate-spin text-purple-600" />
								<p className="text-gray-500">Loading invitation...</p>
							</div>
						</CardContent>
					</Card>
				</div>
			}
		>
			<AcceptInvitationContent />
		</Suspense>
	);
}
