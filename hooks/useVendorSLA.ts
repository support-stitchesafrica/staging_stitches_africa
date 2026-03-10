"use client";

import { useState, useEffect } from "react";

interface VendorSLAStatus {
	hasSLA: boolean;
	slaAcceptedAt: string | null;
	slaVersion: string | null;
	brandName: string | null;
	businessAddress: string | null;
	loading: boolean;
	error: string | null;
}

export function useVendorSLA(userId: string | null): VendorSLAStatus {
	const [status, setStatus] = useState<VendorSLAStatus>({
		hasSLA: false,
		slaAcceptedAt: null,
		slaVersion: null,
		brandName: null,
		businessAddress: null,
		loading: true,
		error: null,
	});

	useEffect(() => {
		if (!userId) {
			setStatus((prev) => ({ ...prev, loading: false }));
			return;
		}

		const fetchSLAStatus = async () => {
			try {
				console.log(`[useVendorSLA] Fetching SLA status for userId: ${userId}`);
				const response = await fetch(
					`/api/vendor/sla/status?userId=${userId}`
				);
				
				console.log(`[useVendorSLA] Response status: ${response.status}`);
				
				if (!response.ok) {
					const errorText = await response.text();
					console.error(`[useVendorSLA] API Error Response:`, errorText);
					throw new Error(`Failed to fetch SLA status: ${response.status} ${response.statusText}`);
				}

				const data = await response.json();
				console.log(`[useVendorSLA] Successfully fetched SLA data:`, data);

				// Handle quota exceeded case
				if (data.quotaExceeded) {
					console.log(`[useVendorSLA] Quota exceeded - using default values`);
					setStatus({
						hasSLA: false,
						slaAcceptedAt: null,
						slaVersion: null,
						brandName: null,
						businessAddress: null,
						loading: false,
						error: "Service temporarily unavailable due to quota limits",
					});
					return;
				}

				setStatus({
					hasSLA: data.hasSLA,
					slaAcceptedAt: data.slaAcceptedAt,
					slaVersion: data.slaVersion,
					brandName: data.brandName,
					businessAddress: data.businessAddress,
					loading: false,
					error: null,
				});
			} catch (error) {
				console.error("[useVendorSLA] Error fetching SLA status:", error);
				setStatus((prev) => ({
					...prev,
					loading: false,
					error: error instanceof Error ? error.message : "Failed to load SLA status",
				}));
			}
		};

		fetchSLAStatus();
	}, [userId]);

	return status;
}
