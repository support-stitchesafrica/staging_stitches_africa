"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { VendorSLAAgreement } from "./VendorSLAAgreement";
import { AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

interface VendorSLAAlertProps {
	userId: string;
	brandName?: string;
	businessAddress?: string;
	hasSLA: boolean;
	onSLAAccepted: () => void;
}

export function VendorSLAAlert({
	userId,
	brandName,
	businessAddress,
	hasSLA,
	onSLAAccepted,
}: VendorSLAAlertProps) {
	const [showAlert, setShowAlert] = useState(false);
	const [showSLAModal, setShowSLAModal] = useState(false);
	const [isAccepting, setIsAccepting] = useState(false);

	useEffect(() => {
		// Only show alert if vendor hasn't accepted SLA
		if (!hasSLA) {
			// Check if alert was dismissed today
			const dismissedDate = localStorage.getItem(
				`sla-alert-dismissed-${userId}`
			);
			const today = new Date().toDateString();

			if (dismissedDate !== today) {
				setShowAlert(true);
			}
		}
	}, [hasSLA, userId]);

	const handleDismiss = () => {
		// Store dismissal date in localStorage
		const today = new Date().toDateString();
		localStorage.setItem(`sla-alert-dismissed-${userId}`, today);
		setShowAlert(false);
		toast.info("You can accept the SLA anytime from your settings");
	};

	const handleAcceptSLA = async () => {
		setIsAccepting(true);
		try {
			// Call API to update tailor's SLA status
			const response = await fetch("/api/vendor/sla/accept", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ userId }),
			});

			if (!response.ok) {
				throw new Error("Failed to accept SLA");
			}

			toast.success("SLA Agreement accepted successfully!");
			setShowSLAModal(false);
			setShowAlert(false);
			
			// Clear localStorage dismissal
			localStorage.removeItem(`sla-alert-dismissed-${userId}`);
			
			// Notify parent component
			onSLAAccepted();
		} catch (error) {
			console.error("Error accepting SLA:", error);
			toast.error("Failed to accept SLA. Please try again.");
		} finally {
			setIsAccepting(false);
		}
	};

	if (!showAlert || hasSLA) {
		return null;
	}

	return (
		<>
			<Alert className="mb-4 border-blue-200 bg-blue-50">
				<div className="flex items-start gap-3">
					<AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
					<div className="flex-1">
						<AlertDescription className="text-sm text-blue-900">
							<p className="font-semibold mb-1">
								Action Required: Sign Vendor Platform Agreement
							</p>
							<p className="mb-3">
								To continue using the platform, you need to review and accept
								our updated Vendor Platform Agreement. This is a one-time
								requirement.
							</p>
							<div className="flex flex-wrap gap-2">
								<Button
									size="sm"
									onClick={() => setShowSLAModal(true)}
									className="bg-blue-600 hover:bg-blue-700 text-white"
								>
									Review & Sign Agreement
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={handleDismiss}
									className="border-blue-300 text-blue-900 hover:bg-blue-100"
								>
									Remind Me Tomorrow
								</Button>
							</div>
						</AlertDescription>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleDismiss}
						className="h-6 w-6 p-0 text-blue-600 hover:text-blue-900 hover:bg-blue-100"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</Alert>

			<VendorSLAAgreement
				open={showSLAModal}
				onOpenChange={setShowSLAModal}
				brandName={brandName || "[Your Brand Name]"}
				businessAddress={businessAddress || "[Your Business Address]"}
				onAccept={handleAcceptSLA}
				onDecline={() => {
					setShowSLAModal(false);
					toast.info("You must accept the SLA to continue using the platform");
				}}
			/>
		</>
	);
}
