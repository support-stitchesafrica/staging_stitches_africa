"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { auth } from "@/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
	requestEmailChange,
	reauthWithPassword,
	reauthWithProvider,
	checkAndUpdateEmailIfChanged,
	isValidEmail,
	hasPasswordCredential,
	getFederatedProviders,
	type ReauthResult,
} from "@/vendor-services/emailChangeService";
import { AlertCircle, Loader2 } from "lucide-react";

interface EmailChangeDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export function EmailChangeDialog({
	open,
	onClose,
	onSuccess,
}: EmailChangeDialogProps) {
	const [user, setUser] = useState<User | null>(null);
	const [newEmail, setNewEmail] = useState("");
	const [emailLoading, setEmailLoading] = useState(false);
	const [emailError, setEmailError] = useState("");

	// Reauth modal states
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [showProviderModal, setShowProviderModal] = useState(false);
	const [reauthLoading, setReauthLoading] = useState(false);
	const [pendingEmail, setPendingEmail] = useState("");
	const [password, setPassword] = useState("");

	// Listen to auth state changes
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
		});

		return () => unsubscribe();
	}, []);

	// Check for email changes when dialog opens
	useEffect(() => {
		const checkEmailChange = async () => {
			if (!user || !open) return;

			try {
				const result = await checkAndUpdateEmailIfChanged(
					user,
					user.uid
				);

				if (result.emailChanged) {
					toast.success(
						`Email updated successfully in ${result.updatedCollections?.length || 0} collection(s)!`
					);
					onSuccess?.();
					onClose();
				}
			} catch (error) {
				// Silently fail - this is just a check
				console.log("Email check:", error);
			}
		};

		checkEmailChange();
	}, [open, user, onSuccess, onClose]);

	const handleEmailChange = async () => {
		if (!user) {
			toast.error("User not authenticated");
			return;
		}

		// 1. Validate input
		if (!newEmail.trim()) {
			setEmailError("Email address is required");
			return;
		}

		if (!isValidEmail(newEmail)) {
			setEmailError("Please enter a valid email address");
			return;
		}

		setEmailLoading(true);
		setEmailError("");

		// 2. Attempt email change
		const result = await requestEmailChange({
			auth,
			user,
			newEmail: newEmail.trim(),
		});

		// 3. Handle success
		if (result.success) {
			toast.success("Verification link sent! 📧", {
				description: `Verification link sent to ${newEmail}. Click the link to confirm your new email.`,
				duration: 8000,
			});
			setNewEmail("");
			onClose();
		}
		// 4. Handle requires-recent-login error (triggers reauth)
		else if (result.requiresReauth) {
			setPendingEmail(newEmail.trim()); // Save email for retry after reauth

			// Check auth method and show appropriate modal
			if (hasPasswordCredential(user)) {
				setShowPasswordModal(true);
			} else {
				const providers = getFederatedProviders(user);
				if (providers.length > 0) {
					setShowProviderModal(true);
				} else {
					setEmailError(
						"Unable to verify identity. Please contact support."
					);
				}
			}
		}
		// 5. Handle other errors
		else {
			const errorMessage =
				result.error || "Failed to send verification link";
			setEmailError(errorMessage);
			toast.error("Failed to send verification link", {
				description: errorMessage,
				duration: 6000,
			});
		}

		setEmailLoading(false);
	};

	// Password reauthentication flow
	const handlePasswordReauth = async () => {
		if (!user || !password) {
			toast.error("Password is required");
			return;
		}

		setReauthLoading(true);

		// 1. Reauthenticate with password
		const result = await reauthWithPassword({
			user,
			currentPassword: password,
		});

		if (result.success) {
			setShowPasswordModal(false);
			setPassword("");

			// 2. Retry email change with pending email
			const emailResult = await requestEmailChange({
				auth,
				user,
				newEmail: pendingEmail,
			});

			if (emailResult.success) {
				toast.success("Verification link sent! 📧", {
					description: `Verification link sent to ${pendingEmail}.`,
					duration: 8000,
				});
				setNewEmail("");
				setPendingEmail("");
				onClose();
			} else {
				setEmailError(
					emailResult.error || "Failed to send verification link"
				);
				toast.error("Failed to send verification link", {
					description: emailResult.error,
					duration: 6000,
				});
			}
		} else {
			toast.error("Authentication failed", {
				description: result.error || "Please try again",
			});
		}

		setReauthLoading(false);
	};

	// Provider reauthentication flow
	const handleProviderReauth = async (
		providerId: "google.com" | "apple.com"
	) => {
		if (!user) return;

		setReauthLoading(true);

		// 1. Reauthenticate with provider
		const result = await reauthWithProvider({ auth, providerId });

		if (result.success) {
			setShowProviderModal(false);

			// 2. Retry email change with pending email
			const emailResult = await requestEmailChange({
				auth,
				user: result.user || user,
				newEmail: pendingEmail,
			});

			if (emailResult.success) {
				toast.success("Verification link sent! 📧", {
					description: `Verification link sent to ${pendingEmail}.`,
					duration: 8000,
				});
				setNewEmail("");
				setPendingEmail("");
				onClose();
			} else {
				setEmailError(
					emailResult.error || "Failed to send verification link"
				);
				toast.error("Failed to send verification link", {
					description: emailResult.error,
					duration: 6000,
				});
			}
		} else {
			toast.error("Authentication failed", {
				description: result.error || "Please try again",
			});
		}

		setReauthLoading(false);
	};

	const handleClose = () => {
		setNewEmail("");
		setEmailError("");
		setPassword("");
		setPendingEmail("");
		setShowPasswordModal(false);
		setShowProviderModal(false);
		onClose();
	};

	return (
		<>
			{/* Main Email Change Dialog */}
			<Dialog open={open && !showPasswordModal && !showProviderModal} onOpenChange={handleClose}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Change Email Address</DialogTitle>
						<DialogDescription>
							Enter your new email address. A verification link will be sent to confirm the change.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="current-email">Current Email</Label>
							<Input
								id="current-email"
								value={user?.email || ""}
								disabled
								className="bg-gray-50"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="new-email">New Email</Label>
							<Input
								id="new-email"
								type="email"
								placeholder="newemail@example.com"
								value={newEmail}
								onChange={(e) => {
									setNewEmail(e.target.value);
									setEmailError("");
								}}
								disabled={emailLoading}
							/>
							{emailError && (
								<p className="text-sm text-red-600 flex items-center gap-1">
									<AlertCircle className="h-4 w-4" />
									{emailError}
								</p>
							)}
						</div>

						<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
							<p className="font-semibold mb-1">What happens next?</p>
							<ul className="list-disc list-inside space-y-1 text-xs">
								<li>We'll send a verification link to your new email</li>
								<li>Click the link to confirm the change</li>
								<li>Your email will be updated across all your accounts</li>
							</ul>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={handleClose}
							disabled={emailLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEmailChange}
							disabled={emailLoading || !newEmail.trim()}
							className="bg-black hover:bg-black/90 text-white"
						>
							{emailLoading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Sending...
								</>
							) : (
								"Send Verification Link"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Password Reauth Dialog */}
			<Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirm Your Identity</DialogTitle>
						<DialogDescription>
							For security, please enter your current password to continue.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="password">Current Password</Label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								disabled={reauthLoading}
								onKeyDown={(e) => {
									if (e.key === "Enter" && password) {
										handlePasswordReauth();
									}
								}}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowPasswordModal(false);
								setPassword("");
							}}
							disabled={reauthLoading}
						>
							Cancel
						</Button>
						<Button
							onClick={handlePasswordReauth}
							disabled={reauthLoading || !password}
							className="bg-black hover:bg-black/90 text-white"
						>
							{reauthLoading ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Verifying...
								</>
							) : (
								"Verify"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Provider Reauth Dialog */}
			<Dialog open={showProviderModal} onOpenChange={setShowProviderModal}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirm Your Identity</DialogTitle>
						<DialogDescription>
							For security, please sign in again with your provider to continue.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{user &&
							getFederatedProviders(user).map((providerId) => (
								<Button
									key={providerId}
									onClick={() =>
										handleProviderReauth(
											providerId as "google.com" | "apple.com"
										)
									}
									disabled={reauthLoading}
									className="w-full bg-black hover:bg-black/90 text-white"
									variant="outline"
								>
									{reauthLoading ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Signing in...
										</>
									) : (
										`Sign in with ${providerId === "google.com" ? "Google" : "Apple"}`
									)}
								</Button>
							))}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowProviderModal(false)}
							disabled={reauthLoading}
						>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

