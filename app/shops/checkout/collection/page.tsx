"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CollectionCheckoutPage() {
	const router = useRouter();

	useEffect(() => {
		// Redirect to the unified checkout page
		router.replace("/shops/checkout");
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center">
				<div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mx-auto mb-4"></div>
				<p className="text-gray-600">Redirecting to checkout...</p>
			</div>
		</div>
	);
}
