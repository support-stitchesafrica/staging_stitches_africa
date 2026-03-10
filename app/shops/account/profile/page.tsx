"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { StandardProtectedRoute } from "@/components/shops/auth/RouteProtectionComponents";
import { ArrowLeft, User, Mail, Calendar, Heart } from "lucide-react";

export default function ProfilePage() {
	return (
		<StandardProtectedRoute>
			<ProfileContent />
		</StandardProtectedRoute>
	);
}

function ProfileContent() {
	const { user, userProfile } = useAuth();

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
						My Profile
					</h1>
					<p className="text-gray-600 mt-1">View your profile information</p>
				</div>

				{/* Profile Card */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
					{/* Avatar Section */}
					<div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 flex items-center">
						<div className="w-20 h-20 rounded-full bg-white flex items-center justify-center overflow-hidden">
							{user?.photoURL ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={user.photoURL}
									alt="Profile"
									className="w-full h-full object-cover"
								/>
							) : (
								<User className="text-gray-400" size={40} />
							)}
						</div>
						<div className="ml-4">
							<h2 className="text-xl font-semibold text-white">
								{user?.displayName || user?.email?.split("@")[0] || "User"}
							</h2>
							<p className="text-white/80 text-sm">{user?.email}</p>
						</div>
					</div>

					{/* Profile Details */}
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

						{/* Display Name */}
						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<User className="text-purple-600" size={20} />
							</div>
							<div>
								<p className="text-sm text-gray-500">Display Name</p>
								<p className="font-medium text-gray-900">
									{user?.displayName || "Not set"}
								</p>
							</div>
						</div>

						{/* Member Since */}
						<div className="flex items-start space-x-4">
							<div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
								<Calendar className="text-green-600" size={20} />
							</div>
							<div>
								<p className="text-sm text-gray-500">Member Since</p>
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

						{/* Preferences */}
						{userProfile?.preferences && (
							<div className="flex items-start space-x-4">
								<div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
									<Heart className="text-red-600" size={20} />
								</div>
								<div>
									<p className="text-sm text-gray-500">Preferences</p>
									<div className="mt-1 space-y-1">
										{userProfile.preferences.gender && (
											<p className="text-sm text-gray-700">
												<span className="font-medium">Gender:</span>{" "}
												{userProfile.preferences.gender === "man"
													? "Men"
													: "Women"}
											</p>
										)}
										{userProfile.preferences.productType && (
											<p className="text-sm text-gray-700">
												<span className="font-medium">Product Type:</span>{" "}
												{userProfile.preferences.productType === "bespoke"
													? "Bespoke"
													: userProfile.preferences.productType ===
													  "ready-to-wear"
													? "Ready to Wear"
													: "Both"}
											</p>
										)}
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
