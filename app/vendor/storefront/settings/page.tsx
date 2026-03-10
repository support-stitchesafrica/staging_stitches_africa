/**
 * Storefront Settings Page
 *
 * Main interface for configuring storefront handle, visibility, and basic settings
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import StorefrontSettings from "@/components/vendor/storefront/StorefrontSettings";
import { getStorefrontConfig } from "@/lib/storefront/client-storefront-service";
import { StorefrontConfig } from "@/types/storefront";

export default function StorefrontSettingsPage() {
	const [vendorId, setVendorId] = useState<string | null>(null);
	const [existingConfig, setExistingConfig] = useState<StorefrontConfig | null>(
		null
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Get vendor ID from localStorage (in a real app, this would come from auth context)
		const storedVendorId = localStorage.getItem("tailorUID");
		setVendorId(storedVendorId);

		if (storedVendorId) {
			fetchStorefrontConfig(storedVendorId);
		} else {
			setIsLoading(false);
			setError("Vendor ID not found. Please log in again.");
		}
	}, []);

	const fetchStorefrontConfig = async (vendorId: string) => {
		try {
			setIsLoading(true);
			const response = await getStorefrontConfig(vendorId);

			if (response.success) {
				setExistingConfig(response.data || null);
			} else {
				console.error("Failed to fetch storefront config:", response.error);
				// Don't set error here - it's normal for new vendors to not have a storefront yet
			}
		} catch (error) {
			console.error("Error fetching storefront config:", error);
			setError("Failed to load storefront configuration");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading storefront settings...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
						<div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
							<svg
								className="w-6 h-6 text-red-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-red-900 mb-2">
							Error Loading Settings
						</h3>
						<p className="text-red-700">{error}</p>
						<button
							onClick={() => window.location.reload()}
							className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
						>
							Retry
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!vendorId) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
						<div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-yellow-100 rounded-full">
							<svg
								className="w-6 h-6 text-yellow-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h3 className="text-lg font-medium text-yellow-900 mb-2">
							Authentication Required
						</h3>
						<p className="text-yellow-700">
							Please log in to access storefront settings.
						</p>
						<button
							onClick={() => (window.location.href = "/vendor/login")}
							className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
						>
							Go to Login
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="container mx-auto px-4 py-8">
				<div className="mb-6">
					<Link
						href="/vendor/storefront"
						className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Storefront
					</Link>
				</div>
				<StorefrontSettings
					vendorId={vendorId}
					initialConfig={existingConfig}
					onConfigUpdate={(config) => setExistingConfig(config)}
				/>
			</div>
		</div>
	);
}
