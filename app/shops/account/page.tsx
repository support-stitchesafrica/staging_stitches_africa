"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { StandardProtectedRoute } from "@/components/shops/auth/RouteProtectionComponents";
import { User, Ruler, Package, Heart, Settings } from "lucide-react";

export default function AccountPage() {
	return (
		<StandardProtectedRoute>
			<AccountContent />
		</StandardProtectedRoute>
	);
}

function AccountContent() {
	const { user } = useAuth();

	return (
		<div className="min-h-screen bg-white py-6 sm:py-8">
			<div className="container-responsive">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">My Account</h1>
					<p className="text-gray-600">
						Welcome back, {user?.displayName || user?.email?.split("@")[0]}
					</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Measurements */}
					<Link href="/shops/measurements?from=account">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
									<Ruler className="text-purple-600" size={24} />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										Measurements
									</h3>
									<p className="text-gray-600 text-sm">
										Manage your body measurements
									</p>
								</div>
							</div>
						</div>
					</Link>

					{/* Orders */}
					<Link href="/shops/account/orders">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
									<Package className="text-blue-600" size={24} />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										My Orders
									</h3>
									<p className="text-gray-600 text-sm">
										Track your order history
									</p>
								</div>
							</div>
						</div>
					</Link>

					{/* Wishlist */}
					<Link href="/shops/wishlist">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
									<Heart className="text-red-600" size={24} />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										Wishlist
									</h3>
									<p className="text-gray-600 text-sm">Your saved items</p>
								</div>
							</div>
						</div>
					</Link>

					{/* Profile Settings */}
					<Link href="/shops/account/profile">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
									<User className="text-gray-600" size={24} />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										Profile
									</h3>
									<p className="text-gray-600 text-sm">
										Update your information
									</p>
								</div>
							</div>
						</div>
					</Link>

					{/* Account Settings */}
					<Link href="/shops/account/settings">
						<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
									<Settings className="text-green-600" size={24} />
								</div>
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										Settings
									</h3>
									<p className="text-gray-600 text-sm">Account preferences</p>
								</div>
							</div>
						</div>
					</Link>

					{/* Account Info */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
						<h3 className="text-lg font-semibold text-gray-900 mb-4">
							Account Information
						</h3>
						<div className="space-y-2">
							<div>
								<span className="text-sm text-gray-600">Email:</span>
								<p className="font-medium">{user?.email}</p>
							</div>
							{user?.displayName && (
								<div>
									<span className="text-sm text-gray-600">Name:</span>
									<p className="font-medium">{user.displayName}</p>
								</div>
							)}
							<div>
								<span className="text-sm text-gray-600">Member since:</span>
								<p className="font-medium">
									{user?.metadata?.creationTime
										? new Date(user.metadata.creationTime).toLocaleDateString()
										: "N/A"}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
