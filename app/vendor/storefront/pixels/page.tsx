/**
 * Social Media Pixels Configuration Page
 *
 * Interface for configuring Facebook, TikTok, and Snapchat pixels
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PixelConfiguration from "@/components/vendor/storefront/PixelConfiguration";
import { SocialPixelConfig } from "@/types/storefront";

export default function PixelConfigurationPage() {
	const [vendorId, setVendorId] = useState<string | null>(null);
	const [initialConfig, setInitialConfig] = useState<SocialPixelConfig>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Get vendor ID from localStorage (in a real app, this would come from auth context)
		const storedVendorId = localStorage.getItem("tailorUID");
		setVendorId(storedVendorId);

		if (storedVendorId) {
			fetchPixelConfig(storedVendorId);
		} else {
			setIsLoading(false);
			setError("Vendor ID not found. Please log in again.");
		}
	}, []);

	const fetchPixelConfig = async (vendorId: string) => {
		try {
			setIsLoading(true);
			const response = await fetch(
				`/api/storefront/pixels?vendorId=${vendorId}`
			);

			if (response.ok) {
				const data = await response.json();
				setInitialConfig(data.socialPixels || {});
			} else {
				console.error("Failed to fetch pixel configuration");
				// Don't set error here - it's normal for new vendors to not have pixels configured yet
			}
		} catch (error) {
			console.error("Error fetching pixel configuration:", error);
			setError("Failed to load pixel configuration");
		} finally {
			setIsLoading(false);
		}
	};

	const handleConfigSave = (config: SocialPixelConfig) => {
		setInitialConfig(config);
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-gray-600">Loading pixel configuration...</p>
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
							Error Loading Configuration
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
							Please log in to access pixel configuration.
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
				{/* Navigation breadcrumb */}
				<nav className="mb-8">
					<ol className="flex items-center space-x-2 text-sm text-gray-500">
						<li>
							<a href="/vendor/dashboard" className="hover:text-gray-700">
								Dashboard
							</a>
						</li>
						<li>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</li>
						<li>
							<a
								href="/vendor/storefront/settings"
								className="hover:text-gray-700"
							>
								Storefront
							</a>
						</li>
						<li>
							<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</li>
						<li className="text-gray-900 font-medium">Social Media Pixels</li>
					</ol>
				</nav>

				<PixelConfiguration
					vendorId={vendorId}
					initialConfig={initialConfig}
					onSave={handleConfigSave}
				/>
			</div>
		</div>
	);
}
