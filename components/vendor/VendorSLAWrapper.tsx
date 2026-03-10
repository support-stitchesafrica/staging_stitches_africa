"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { VendorSLAAlert } from "./VendorSLAAlert";
import { useVendorSLA } from "@/hooks/useVendorSLA";

interface VendorSLAWrapperProps {
	children: React.ReactNode;
}

export function VendorSLAWrapper({ children }: VendorSLAWrapperProps) {
	const pathname = usePathname();
	const [userId, setUserId] = useState<string | null>(null);
	const [brandName, setBrandName] = useState<string | null>(null);
	const [businessAddress, setBusinessAddress] = useState<string | null>(null);
	const slaStatus = useVendorSLA(userId);

	// Pages where SLA alert should NOT be shown
	const excludedPaths = [
		"/vendor", // Login page
		"/vendor/signup",
		"/vendor/pre-register",
	];

	// Check if current path should show the alert
	const shouldShowAlert = !excludedPaths.includes(pathname);

	useEffect(() => {
		// Get user ID directly from localStorage
		const uid = localStorage.getItem("tailorUID");
		if (uid) {
			setUserId(uid);
		}

		// Get brand name from localStorage if available
		const storedBrandName = localStorage.getItem("brandName");
		if (storedBrandName) {
			setBrandName(storedBrandName);
		}
	}, []);

	// Update brand name when SLA status is loaded
	useEffect(() => {
		if (slaStatus.brandName && !brandName) {
			setBrandName(slaStatus.brandName);
		}
		if (slaStatus.businessAddress && !businessAddress) {
			setBusinessAddress(slaStatus.businessAddress);
		}
	}, [slaStatus, brandName, businessAddress]);

	const handleSLAAccepted = () => {
		// Refresh the page to update the SLA status
		window.location.reload();
	};

	// Debug logging
	useEffect(() => {
		console.log("VendorSLAWrapper Debug:", {
			userId,
			pathname,
			shouldShowAlert,
			hasSLA: slaStatus.hasSLA,
			loading: slaStatus.loading,
			willShowAlert: userId && !slaStatus.loading && shouldShowAlert && !slaStatus.hasSLA,
		});
	}, [userId, pathname, shouldShowAlert, slaStatus]);

	return (
		<>
			{userId && !slaStatus.loading && shouldShowAlert && !slaStatus.hasSLA && (
				<div className="sticky top-0 z-50">
					<VendorSLAAlert
						userId={userId}
						brandName={brandName || slaStatus.brandName || undefined}
						businessAddress={
							businessAddress || slaStatus.businessAddress || undefined
						}
						hasSLA={slaStatus.hasSLA}
						onSLAAccepted={handleSLAAccepted}
					/>
				</div>
			)}
			{children}
		</>
	);
}
