"use client";

import { useEffect, useState } from "react";
import VendorWishlist from "@/components/VendorWishlist";
import { ModernNavbar } from "@/components/vendor/modern-navbar";

export default function VendorWishlistPage() {
	const [tailorUID, setTailorUID] = useState<string>("");

	useEffect(() => {
		if (typeof window !== "undefined") {
			setTailorUID(localStorage.getItem("tailorUID") ?? "");
		}
	}, []);

	if (!tailorUID) {
		return (
			<main className="min-h-screen bg-gray-50 p-6 sm:p-10">
				<div className="flex justify-center items-center h-64">
					<p className="text-gray-500">Checking authorization...</p>
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-gray-50 p-6 sm:p-10">
			<ModernNavbar />
			<section className="max-w-6xl mx-auto space-y-10">
				<VendorWishlist tailorId={tailorUID} />
			</section>
		</main>
	);
}
