/**
 * Vendor Storefront Dashboard
 * Main landing page for storefront management
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
	Store,
	Settings,
	Palette,
	Eye,
	BarChart3,
	Globe,
	CheckCircle,
	AlertCircle,
} from "lucide-react";
import { ModernNavbar } from "@/components/vendor/modern-navbar";
import { getStorefrontConfig } from "@/lib/storefront/client-storefront-service";
import { StorefrontConfig } from "@/types/storefront";

interface StorefrontFeature {
	title: string;
	description: string;
	href: string;
	icon: React.ComponentType<any>;
	status: "available" | "coming-soon";
	color: string;
}

const storefrontFeatures: StorefrontFeature[] = [
	{
		title: "Storefront Settings",
		description: "Configure your store URL, visibility, and basic settings",
		href: "/vendor/storefront/settings",
		icon: Settings,
		status: "available",
		color: "bg-blue-500",
	},
	{
		title: "Design & Themes",
		description:
			"Customize your store appearance with themes and media uploads",
		href: "/vendor/storefront/design",
		icon: Palette,
		status: "available",
		color: "bg-purple-500",
	},
	{
		title: "Preview Store",
		description: "See how your storefront looks to customers",
		href: "/demo/storefront-preview",
		icon: Eye,
		status: "coming-soon",
		color: "bg-green-500",
	},
	{
		title: "Store Analytics",
		description: "Track visits, conversions, and customer behavior",
		href: "/vendor/storefront/analytics",
		icon: BarChart3,
		status: "available",
		color: "bg-orange-500",
	},
	{
		title: "SEO & Marketing",
		description: "Configure social media pixels and marketing tracking",
		href: "/vendor/storefront/pixels",
		icon: Globe,
		status: "available",
		color: "bg-teal-500",
	},
];

export default function StorefrontDashboard() {
	const [storeStatus, setStoreStatus] = useState<
		"active" | "private" | "not-setup" | "loading"
	>("loading");
	const [storefrontConfig, setStorefrontConfig] =
		useState<StorefrontConfig | null>(null);

	useEffect(() => {
		const fetchStoreStatus = async () => {
			try {
				const vendorId = localStorage.getItem("tailorUID");
				if (!vendorId) {
					setStoreStatus("not-setup");
					return;
				}

				const response = await getStorefrontConfig(vendorId);
				if (response.success && response.data) {
					setStorefrontConfig(response.data);
					setStoreStatus(response.data.isPublic ? "active" : "private");
				} else {
					setStoreStatus("not-setup");
				}
			} catch (error) {
				console.error("Error fetching store status:", error);
				setStoreStatus("not-setup");
			}
		};

		fetchStoreStatus();
	}, []);

	const getStatusColor = () => {
		switch (storeStatus) {
			case "active":
				return "text-green-600";
			case "private":
				return "text-yellow-600";
			case "not-setup":
				return "text-gray-900"; // Default black for "Not Set Up" text, but badge color handles icon
			default:
				return "text-gray-400";
		}
	};

	const getStatusBadgeColor = () => {
		switch (storeStatus) {
			case "active":
				return "bg-green-100 text-green-600";
			case "private":
				return "bg-yellow-100 text-yellow-600";
			default:
				return "bg-gray-100 text-gray-600";
		}
	};

	const renderStatusIcon = () => {
		switch (storeStatus) {
			case "active":
				return <CheckCircle className="w-6 h-6 text-green-600" />;
			case "private":
				return <Eye className="w-6 h-6 text-yellow-600" />;
			default:
				return <Settings className="w-6 h-6 text-gray-600" />;
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<ModernNavbar />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-4">
						<div className="p-2 bg-blue-100 rounded-lg">
							<Store className="w-6 h-6 text-blue-600" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900">
								Storefront Management
							</h1>
							<p className="text-gray-600">
								Create and customize your online store presence
							</p>
						</div>
					</div>
				</div>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white rounded-lg shadow-sm border p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Store Status
								</p>
								<div className="flex items-center gap-2 mt-1">
									{storeStatus === "loading" ? (
										<div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
									) : (
										<p
											className={`text-2xl font-bold ${
												storeStatus === "active"
													? "text-green-600"
													: storeStatus === "private"
													? "text-yellow-600"
													: "text-gray-900"
											}`}
										>
											{storeStatus === "active"
												? "Active"
												: storeStatus === "private"
												? "Private"
												: "Not Set Up"}
										</p>
									)}
								</div>
							</div>
							<div className={`p-3 rounded-full ${getStatusBadgeColor()}`}>
								{renderStatusIcon()}
							</div>
						</div>
						<p className="text-sm text-gray-500 mt-2">
							{storeStatus === "active"
								? "Your store is live and visible to customers"
								: storeStatus === "private"
								? "Your store is set to private"
								: "Configure your store to get started"}
						</p>
					</div>

					<div className="bg-white rounded-lg shadow-sm border p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Store Visits
								</p>
								<p className="text-2xl font-bold text-gray-900">0</p>
							</div>
							<div className="p-3 bg-blue-100 rounded-full">
								<Eye className="w-6 h-6 text-blue-600" />
							</div>
						</div>
						<p className="text-sm text-gray-500 mt-2">Total storefront views</p>
					</div>

					<div className="bg-white rounded-lg shadow-sm border p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Conversion Rate
								</p>
								<p className="text-2xl font-bold text-gray-900">-</p>
							</div>
							<div className="p-3 bg-green-100 rounded-full">
								<BarChart3 className="w-6 h-6 text-green-600" />
							</div>
						</div>
						<p className="text-sm text-gray-500 mt-2">Visitors to customers</p>
					</div>
				</div>

				{/* Feature Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{storefrontFeatures.map((feature) => {
						const IconComponent = feature.icon;
						const isAvailable = feature.status === "available";

						const CardContent = (
							<div
								className={`bg-white rounded-lg shadow-sm border p-6 transition-all duration-200 ${
									isAvailable
										? "hover:shadow-md hover:border-gray-300 cursor-pointer"
										: "opacity-75 cursor-not-allowed"
								}`}
							>
								<div className="flex items-start justify-between mb-4">
									<div className={`p-3 ${feature.color} rounded-lg`}>
										<IconComponent className="w-6 h-6 text-white" />
									</div>
									{!isAvailable && (
										<span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
											Coming Soon
										</span>
									)}
								</div>

								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									{feature.title}
								</h3>

								<p className="text-gray-600 text-sm mb-4">
									{feature.description}
								</p>

								{isAvailable && (
									<div className="flex items-center text-blue-600 text-sm font-medium">
										Get Started
										<svg
											className="w-4 h-4 ml-1"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M9 5l7 7-7 7"
											/>
										</svg>
									</div>
								)}
							</div>
						);

						return isAvailable ? (
							<Link key={feature.title} href={feature.href}>
								{CardContent}
							</Link>
						) : (
							<div key={feature.title}>{CardContent}</div>
						);
					})}
				</div>

				{/* Getting Started Guide */}
				<div className="mt-12 bg-white rounded-lg shadow-sm border p-8">
					<h2 className="text-2xl font-bold text-gray-900 mb-4">
						Getting Started with Your Storefront
					</h2>
					<p className="text-gray-600 mb-6">
						Follow these steps to set up your online store and start selling
						directly to customers.
					</p>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
								<span className="text-blue-600 font-semibold text-sm">1</span>
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-1">
									Configure Settings
								</h3>
								<p className="text-sm text-gray-600">
									Set up your store URL, visibility, and basic information to
									get started.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
								<span className="text-purple-600 font-semibold text-sm">2</span>
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-1">
									Design Your Store
								</h3>
								<p className="text-sm text-gray-600">
									Choose a template, customize colors, and upload your brand
									assets.
								</p>
							</div>
						</div>

						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
								<span className="text-green-600 font-semibold text-sm">3</span>
							</div>
							<div>
								<h3 className="font-semibold text-gray-900 mb-1">Go Live</h3>
								<p className="text-sm text-gray-600">
									Preview your store, make final adjustments, and publish it for
									customers.
								</p>
							</div>
						</div>
					</div>

					<div className="mt-8 flex gap-4">
						<Link
							href="/vendor/storefront/settings"
							className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
						>
							Start Setup
						</Link>
						<Link
							href="/vendor/storefront/design"
							className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
						>
							Design Store
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
