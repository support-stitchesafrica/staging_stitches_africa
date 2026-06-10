"use client";

import React, { useState, useEffect } from "react";
import { BOGOPromotionBanner } from "@/components/home/BOGOPromotionBanner";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";

import { LanguageProvider } from "@/lib/i18n/LanguageContext";

export default function DebugBogoPage() {
	const [showBogo, setShowBogo] = useState(true);
	const [showFeatured, setShowFeatured] = useState(true);

	return (
		<LanguageProvider>
			<div className="min-h-screen bg-gray-50 p-8">
				<div className="max-w-4xl mx-auto">
					<h1 className="text-3xl font-bold mb-8">
						BOGO & Featured Products Debug
					</h1>

					<div className="mb-8 space-x-4">
						<button
							onClick={() => setShowBogo(!showBogo)}
							className={`px-4 py-2 rounded ${showBogo ? "bg-green-500 text-white" : "bg-gray-200"}`}
						>
							{showBogo ? "Hide" : "Show"} BOGO Banner
						</button>
						<button
							onClick={() => setShowFeatured(!showFeatured)}
							className={`px-4 py-2 rounded ${showFeatured ? "bg-green-500 text-white" : "bg-gray-200"}`}
						>
							{showFeatured ? "Hide" : "Show"} Featured Products
						</button>
					</div>

					{showBogo && (
						<div className="mb-12">
							<h2 className="text-2xl font-semibold mb-4">
								BOGO Promotion Banner
							</h2>
							<div className="border border-gray-300 rounded-lg overflow-hidden">
								<BOGOPromotionBanner />
							</div>
						</div>
					)}

					{showFeatured && (
						<div className="mb-12">
							<h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
							<div className="border border-gray-300 rounded-lg overflow-hidden">
								<FeaturedProducts />
							</div>
						</div>
					)}

					<div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
						<h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
						<ul className="text-sm text-yellow-700 space-y-1">
							<li>• Check browser console for any JavaScript errors</li>
							<li>• Check network tab for failed API requests</li>
							<li>• BOGO mappings are configured for December 2025</li>
							<li>• Featured products filter by specific vendor names</li>
						</ul>
					</div>
				</div>
			</div>
		</LanguageProvider>
	);
}
