"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { StandardProtectedRoute } from "@/components/shops/auth/RouteProtectionComponents";
import { Button } from "@/components/shops/ui/Button";
import { toast } from "sonner";
import { ArrowLeft, Mail, Calendar, Key, LogIn } from "lucide-react";

export default function SettingsPage() {
	return (
		<StandardProtectedRoute>
			<SettingsContent />
		</StandardProtectedRoute>
	);
}

function SettingsContent() {
	const { user } = useAuth();
	const router = useRouter();
	const [sendingOtp, setSendingOtp] = useState(false);

	const handleResetPassword = async () => {
		if (!user?.email) {
			toast.error("No email associated with this account");
			return;
		}

		setSendingOtp(true);
		try {
			const res = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: user.email,
					adminName: user.displayName || user.email.split("@")[0],
				}),
			});

			const data = await res.json();

			if (res.ok) {
				toast.success("OTP sent to your email");
				localStorage.setItem("resetEmail", user.email);
				router.push("/shops/reset-password");
			} else {
				toast.error(data.error || "Something went wrong");
			}
		} catch (err) {
			console.error("Reset password error:", err);
			toast.error("Failed to send OTP");
		} finally {
			setSendingOtp(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 py-6 sm:py-8">
			<div className="container-responsive max-w-2xl mx-auto px-4">
				{/* Header */}
				<div className="mb-6">
					<Link
						href="/shops/account"
						className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
					>
						<ArrowLeft size={20} className="mr-2" />
						Back to Account
					</Link>
					<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
						Account Settings
					</h1>
					<p className="text-gray-600 mt-1">
						Manage your account settings and security
					</p>
				</div>

				{/* Account Details Card */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
					<div className="p-6 border-b border-gray-100">
						<h2 className="text-lg font-semibold text-gray-900">
							Account Details
						</h2>
					</div>
					<div className="p-6 space-y-6">
						{/* Email */}
						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<Mail className="text-blue-600" size={20} />
							</div>
							<div>
								<p className="text-sm text-gray-500">Email Address</p>
								<p className="font-medium text-gray-900">
									{user?.email || "Not set"}
								</p>
							</div>
						</div>

						{/* Account Created */}
						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<Calendar className="text-green-600" size={20} />
							</div>
							<div>
								<p className="text-sm text-gray-500">Account Created</p>
								<p className="font-medium text-gray-900">
									{user?.metadata?.creationTime
										? new Date(user.metadata.creationTime).toLocaleDateString(
												"en-US",
												{
													year: "numeric",
													month: "long",
													day: "numeric",
												}
										  )
										: "N/A"}
								</p>
							</div>
						</div>

						{/* Last Sign In */}
						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<LogIn className="text-purple-600" size={20} />
							</div>
							<div>
								<p className="text-sm text-gray-500">Last Sign In</p>
								<p className="font-medium text-gray-900">
									{user?.metadata?.lastSignInTime
										? new Date(user.metadata.lastSignInTime).toLocaleDateString(
												"en-US",
												{
													year: "numeric",
													month: "long",
													day: "numeric",
													hour: "2-digit",
													minute: "2-digit",
												}
										  )
										: "N/A"}
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Security Card */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					<div className="p-6 border-b border-gray-100">
						<h2 className="text-lg font-semibold text-gray-900">Security</h2>
					</div>
					<div className="p-6">
						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<Key className="text-orange-600" size={20} />
							</div>
							<div className="flex-1">
								<p className="font-medium text-gray-900">Password</p>
								<p className="text-sm text-gray-500 mt-1">
									Reset your password by receiving an OTP to your email
								</p>
								<Button
									onClick={handleResetPassword}
									disabled={sendingOtp}
									className="mt-4 bg-blue-600 hover:bg-blue-700"
								>
									{sendingOtp ? "Sending OTP..." : "Reset Password"}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
